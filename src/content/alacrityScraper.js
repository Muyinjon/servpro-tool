(function initAlacrityScraper(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const fieldsApi = root.alacrityFields || {};
  const settingsApi = root.settings;

  if (!selectorsApi || global !== global.top) {
    return;
  }

  const buildImportPayload = fieldsApi.buildImportPayload || function noop() {
    return { source: "alacrity", scrapedAt: new Date().toISOString() };
  };

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function normalizeText(value) {
    return String(value || "").replace(/[\u00a0\s]+/g, " ").trim();
  }

  function isAlacrityClaimPage() {
    const hostOk = /em\.alacrity\.net$/i.test(global.location.hostname);
    if (!hostOk) {
      return false;
    }
    if (document.getElementById(fieldsApi.PREFIX + "ClaimRoundPanel_ClaimNumberLabel")) {
      return true;
    }
    if (document.getElementById("ctl00_bodyContentPlaceHolder_ClaimInfoControl1_ClaimRoundPanel")) {
      return true;
    }
    const bodyText = normalizeText(document.body ? document.body.innerText : "");
    return /claim information/i.test(bodyText) && /loss information/i.test(bodyText);
  }

  function buildPayload() {
    return buildImportPayload(document, global.location);
  }

  function countFilledCoreFields(payload) {
    const fields = [
      "customerName",
      "businessName",
      "primaryPhone",
      "claimNumber",
      "propertyType",
      "address1",
      "city",
      "state",
      "zip"
    ];
    return fields.filter(function isFilled(key) {
      return Boolean(normalizeText(payload[key]));
    }).length;
  }

  function setStatus(message) {
    const status = document.querySelector("#servpro-alacrity-helper-panel .servpro-helper-status");
    if (status) {
      status.textContent = message;
    }
  }

  function upsertHistory(history, payload) {
    const existing = Array.isArray(history) ? history : [];
    const deduped = existing.filter(function keep(item) {
      if (!item) {
        return false;
      }
      if (
        item.sourceUrl === payload.sourceUrl &&
        item.claimNumber &&
        item.claimNumber === payload.claimNumber
      ) {
        return false;
      }
      return true;
    });
    deduped.unshift(payload);
    return deduped.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5);
  }

  function savePayload(payload, callback) {
    const storage = getStorage();
    if (!storage) {
      callback(false, 0);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = upsertHistory(result && result[selectorsApi.WORKCENTER_IMPORT.historyKey], payload);
      storage.set(
        {
          [selectorsApi.WORKCENTER_IMPORT.storageKey]: payload,
          [selectorsApi.WORKCENTER_IMPORT.historyKey]: history
        },
        function onSaved() {
          callback(!global.chrome.runtime.lastError, history.length);
        }
      );
    });
  }

  function getHistoryCount(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(0);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = result && result[selectorsApi.WORKCENTER_IMPORT.historyKey];
      callback(Array.isArray(history) ? history.length : 0);
    });
  }

  function loadLatestPayload(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.storageKey], function onLoad(result) {
      callback((result && result[selectorsApi.WORKCENTER_IMPORT.storageKey]) || null);
    });
  }

  function exportPayloadFromText(text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    let safeName = "alacrity";
    try {
      const parsed = JSON.parse(text);
      safeName = (parsed.claimNumber || parsed.customerName || "alacrity")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    } catch (error) {
      safeName = "alacrity";
    }
    link.href = url;
    link.download = safeName + "-alacrity.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function cleanup() {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function createPanel() {
    if (document.getElementById("servpro-alacrity-helper-panel")) {
      return;
    }

    const helperPanelApi = root.helperPanel;
    const payloadPanelApi = root.importPayloadPanel;
    let latestPayload = null;
    let lastScrapedPayload = null;
    let jsonEditor = null;
    let panelShell = null;

    if (helperPanelApi) {
      helperPanelApi.ensureHelperTheme(document);
    }

    const shell = helperPanelApi
      ? helperPanelApi.createHelperShell({
          id: "servpro-alacrity-helper-panel",
          title: "Alacrity capture",
          variant: "alacrity"
        })
      : null;

    const panel = shell ? shell.panel : document.createElement("div");
    if (!shell) {
      panel.id = "servpro-alacrity-helper-panel";
    }

    const setPanelStatus = shell
      ? shell.setStatus
      : function fallbackStatus(msg) {
          setStatus(msg);
        };

    const hintsApi = root.buttonHints;

    const scrapeButton = document.createElement("button");
    scrapeButton.type = "button";
    scrapeButton.textContent = "Scrape";
    if (hintsApi && hintsApi.applyButtonHint) {
      hintsApi.applyButtonHint(scrapeButton, "alacrityScrape");
    }
    if (helperPanelApi) {
      helperPanelApi.styleButton(scrapeButton, "primary");
    }

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Export JSON";
    if (hintsApi && hintsApi.applyButtonHint) {
      hintsApi.applyButtonHint(exportButton, "alacrityExportJson");
    }
    if (helperPanelApi) {
      helperPanelApi.styleButton(exportButton);
    }

    const copyPlainButton = document.createElement("button");
    copyPlainButton.type = "button";
    copyPlainButton.textContent = "Copy as normal text";
    if (hintsApi && hintsApi.applyButtonHint) {
      hintsApi.applyButtonHint(copyPlainButton, "alacrityCopyPlain");
    }
    if (helperPanelApi) {
      helperPanelApi.styleButton(copyPlainButton);
    }

    const autofillButton = document.createElement("button");
    autofillButton.type = "button";
    autofillButton.textContent = "Open job import";
    autofillButton.className = "servpro-btn";
    autofillButton.style.display = "none";
    if (hintsApi && hintsApi.applyButtonHint) {
      hintsApi.applyButtonHint(autofillButton, "alacrityOpenImport");
    }

    function updateEditor(payload, expand) {
      if (jsonEditor) {
        jsonEditor.setPayload(payload, { expand: Boolean(expand) });
      }
    }

    function scrapeAndStore(callback) {
      latestPayload = buildPayload();
      lastScrapedPayload = latestPayload;
      savePayload(latestPayload, function onSave(ok, historyCount) {
        const count = countFilledCoreFields(latestPayload);
        updateEditor(latestPayload, true);
        setPanelStatus(
          ok
            ? "Scraped and saved (" + count + "/9 key fields). History: " + historyCount + "/5."
            : "Scraped, but failed to save to storage"
        );
        if (callback) {
          callback(ok);
        }
      });
    }

    if (payloadPanelApi) {
      jsonEditor = payloadPanelApi.createImportPayloadPanel({
        getBaselinePayload: function getBaseline() {
          return lastScrapedPayload || latestPayload;
        },
        onStatus: setPanelStatus,
        onSave: function onSavePayload(payload, done) {
          latestPayload = payload;
          savePayload(payload, function onSaved(ok, historyCount) {
            done(ok, ok ? "Payload saved. History: " + historyCount + "/5." : "Failed to save payload.");
          });
        }
      });
    }

    function getActivePayload() {
      const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };
      if (editorParsed.ok) {
        return editorParsed.payload;
      }
      if (latestPayload) {
        return latestPayload;
      }
      return buildPayload();
    }

    copyPlainButton.addEventListener("click", function onCopyPlain() {
      const plainTextApi = root.payloadPlainText;
      const payload = getActivePayload();
      if (!plainTextApi || !plainTextApi.formatPayloadAsPlainText) {
        setPanelStatus("Plain text formatter is not available.");
        return;
      }
      const text = plainTextApi.formatPayloadAsPlainText(payload);
      if (!normalizeText(text)) {
        setPanelStatus("Nothing to copy. Scrape first.");
        return;
      }
      if (!payloadPanelApi || !payloadPanelApi.copyText) {
        setPanelStatus("Clipboard copy is not available.");
        return;
      }
      payloadPanelApi.copyText(text, function onCopied(copied) {
        setPanelStatus(copied ? "Copied as normal text." : "Clipboard copy failed.");
      });
    });

    scrapeButton.addEventListener("click", function onScrape() {
      scrapeAndStore();
    });

    exportButton.addEventListener("click", function onExport() {
      const text = jsonEditor ? jsonEditor.getText() : "";
      if (!normalizeText(text)) {
        if (!latestPayload) {
          latestPayload = buildPayload();
        }
        savePayload(latestPayload, function onSave() {
          exportPayloadFromText(payloadPanelApi.formatPayload(latestPayload));
          setPanelStatus("Exported JSON file.");
        });
        return;
      }
      const parsed = payloadPanelApi ? payloadPanelApi.parsePayloadText(text) : { ok: false };
      if (parsed.ok) {
        savePayload(parsed.payload, function onSave() {
          latestPayload = parsed.payload;
          exportPayloadFromText(text);
          setPanelStatus("Exported JSON file.");
        });
      } else {
        exportPayloadFromText(text);
        setPanelStatus("Exported JSON file (not saved — invalid JSON).");
      }
    });

    autofillButton.addEventListener("click", function onAutofill() {
      function openTeamAllenTarget(settings) {
        const wi = selectorsApi.WORKCENTER_IMPORT;
        const openVia = settingsApi ? settingsApi.resolveTeamAllenOpenVia(settings) : "page";
        const targetUrl = openVia === "modal" ? wi.teamallenssmListUrl : wi.teamallenssmAddUrl;

        function afterSave(ok, historyCount) {
          if (!ok) {
            setPanelStatus("Failed to save payload.");
            return;
          }
          if (openVia === "modal" && settingsApi) {
            settingsApi.setPendingAutoSubmit(
              { autoSave: false, openVia: "modal", consumedListClick: false },
              function onPending() {
                global.open(targetUrl, "_blank");
                setPanelStatus(
                  "Opened jobs list. Add Job popup will fill automatically. History: " +
                    historyCount +
                    "/5."
                );
              }
            );
            return;
          }
          global.open(targetUrl, "_blank");
          setPanelStatus("Opened job import. History: " + historyCount + "/5.");
        }

        const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };
        if (editorParsed.ok) {
          latestPayload = editorParsed.payload;
          savePayload(latestPayload, afterSave);
          return;
        }
        if (!latestPayload) {
          latestPayload = buildPayload();
        }
        savePayload(latestPayload, afterSave);
      }

      if (settingsApi) {
        settingsApi.getSettings(function onSettings(settings) {
          if (!settingsApi.isTeamAllenActivated(settings)) {
            setPanelStatus("Enter team access code in Settings first.");
            return;
          }
          openTeamAllenTarget(settings);
        });
        return;
      }
      openTeamAllenTarget(null);
    });

    const toolbar = shell ? shell.toolbar : panel;
    toolbar.appendChild(scrapeButton);
    toolbar.appendChild(exportButton);
    toolbar.appendChild(copyPlainButton);
    toolbar.appendChild(autofillButton);

    const body = shell ? shell.body : panel;
    if (jsonEditor) {
      body.appendChild(jsonEditor.element);
    }

    document.body.appendChild(panel);
    panelShell = shell;

    if (shell && shell.mountCollapsibleBody) {
      shell.mountCollapsibleBody({
        collapsedLabel: "Show payload editor",
        expandedLabel: "Hide payload editor",
        startExpanded: false
      });
    }

    if (settingsApi) {
      settingsApi.getSettings(function onSettings(settings) {
        if (panelShell && panelShell.syncTheme) {
          panelShell.syncTheme(settings);
        }
        if (settingsApi.isTeamAllenActivated(settings)) {
          autofillButton.style.display = "";
        }
      });
    } else {
      autofillButton.style.display = "";
    }

    if (shell) {
      const collapse = shell.mountCollapse("Alacrity");
      if (settingsApi) {
        settingsApi.getSettings(function onSettings(s) {
          if (s && s.autoCollapsePanels !== false) {
            collapse.collapse();
          }
        });
      }
    }

    loadLatestPayload(function onLoad(payload) {
      if (payload) {
        latestPayload = payload;
        updateEditor(payload, false);
      }
      getHistoryCount(function onCount(historyCount) {
        if (historyCount > 0) {
          setPanelStatus("Ready. History: " + historyCount + "/5.");
        }
      });
    });
  }

  function boot() {
    if (!isAlacrityClaimPage()) {
      return;
    }
    createPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
