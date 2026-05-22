(function initWorkcenterScraper(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const fieldsApi = root.workcenterFields || {};
  const settingsApi = root.settings;

  if (!selectorsApi || global !== global.top) {
    return;
  }

  const parseAddress = fieldsApi.parseAddress || function noop() {
    return { address1: "", city: "", state: "", zip: "", country: "" };
  };
  const isFullAddressLine = fieldsApi.isFullAddressLine || function noop() {
    return false;
  };
  const mapAddLocationForTeamAllen = fieldsApi.mapAddLocationForTeamAllen || function noop() {
    return "";
  };
  const stripParenthetical = fieldsApi.stripParenthetical || function noop(value) {
    return String(value || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  };
  const isPlausibleBusinessName = fieldsApi.isPlausibleBusinessName || selectorsApi.isPlausibleBusinessName || function always(value) {
    return Boolean(normalizeText(value));
  };
  const isPlausibleClaimNumber = fieldsApi.isPlausibleClaimNumber || selectorsApi.isPlausibleClaimNumber || function always(value) {
    return Boolean(normalizeText(value));
  };

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function normalizeText(value) {
    return String(value || "").replace(/[\u00a0\s]+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function firstNonEmpty(values) {
    return values.find(function hasValue(value) {
      return Boolean(normalizeText(value));
    }) || "";
  }

  function byIdText(id) {
    const node = document.getElementById(id);
    return normalizeText(node ? node.textContent : "");
  }

  function byIdValue(id) {
    const node = document.getElementById(id);
    if (!node) {
      return "";
    }
    if (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT") {
      return normalizeText(node.value);
    }
    return normalizeText(node.textContent);
  }

  function selectSelectedText(id) {
    const select = document.getElementById(id);
    if (!select || select.tagName !== "SELECT") {
      return "";
    }
    const option = select.options[select.selectedIndex];
    return normalizeText(option ? option.textContent : "");
  }

  function selectSelectedAbbrev(id) {
    const select = document.getElementById(id);
    if (!select || select.tagName !== "SELECT") {
      return "";
    }
    const option = select.options[select.selectedIndex];
    if (!option) {
      return "";
    }
    const abbrev = normalizeText(option.textContent);
    if (abbrev && abbrev.length <= 4) {
      return abbrev;
    }
    return normalizeText(option.value);
  }

  function extractEmailFromLink(elementId) {
    const link = document.getElementById(elementId);
    if (!link) {
      return "";
    }
    const text = normalizeText(link.textContent);
    if (text) {
      return text;
    }
    const href = String(link.getAttribute("href") || "");
    const match = href.match(/[?&]e=([^&]+)/i);
    if (match && match[1]) {
      try {
        return normalizeText(decodeURIComponent(match[1]).replace(/\+/g, " "));
      } catch (error) {
        return normalizeText(match[1]);
      }
    }
    return "";
  }

  function extractEmail() {
    return extractEmailFromLink("MainContent_JobInfoHeader1_link_emailAddress");
  }

  function extractSecondaryEmail() {
    return extractEmailFromLink("MainContent_JobInfoHeader1_link_SecondaryContactEmail");
  }

  function getBodyLines() {
    return String(document.body ? document.body.innerText : "")
      .split(/\r?\n/)
      .map(function trimLine(line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  function extractByLabel(labels, options) {
    const opts = options || {};
    const lines = getBodyLines();
    const labelList = Array.isArray(labels) ? labels : [labels];
    for (const label of labelList) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const inlineRegex = opts.requireColon
        ? new RegExp("^" + escaped + "\\s*:\\s*(.+)$", "i")
        : new RegExp("^" + escaped + "\\s*:?\\s*(.+)$", "i");
      const soloRegex = new RegExp("^" + escaped + "\\s*:?\\s*$", "i");
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const inlineMatch = line.match(inlineRegex);
        if (inlineMatch && inlineMatch[1]) {
          return normalizeText(inlineMatch[1]);
        }
        if (!opts.inlineOnly && soloRegex.test(line) && lines[index + 1]) {
          const nextValue = normalizeText(lines[index + 1]);
          if (!opts.validateValue || opts.validateValue(nextValue)) {
            return nextValue;
          }
        }
      }
    }
    return "";
  }

  function extractExplicitBusinessName() {
    const labels = ["Business Name", "Company Name"];
    for (let index = 0; index < labels.length; index += 1) {
      const value = extractByLabel(labels[index], {
        requireColon: true,
        inlineOnly: true,
        validateValue: isPlausibleBusinessName
      });
      if (isPlausibleBusinessName(value)) {
        return value;
      }
    }
    return "";
  }

  function pickCommercialBusinessName(explicitBusiness, projectName, primaryContactName) {
    const candidates = [explicitBusiness, primaryContactName, projectName];
    for (let index = 0; index < candidates.length; index += 1) {
      const sanitized = sanitizeBusinessName(candidates[index]);
      if (sanitized) {
        return sanitized;
      }
    }
    return "";
  }

  function sanitizeBusinessName(value) {
    const text = normalizeText(value);
    if (!isPlausibleBusinessName(text)) {
      return "";
    }
    return text;
  }

  function sanitizeClaimNumber(value) {
    const text = normalizeText(value).replace(/\s+/g, "");
    if (!isPlausibleClaimNumber(text)) {
      return "";
    }
    return text;
  }

  function extractClaimNumber() {
    const sources = [
      byIdText("MainContent_JobInfoHeader1_lblJobLotBlock"),
      byIdValue("MainContent_txt_LotBlock"),
      extractByLabel("Claim Number", {
        requireColon: true,
        inlineOnly: true,
        validateValue: isPlausibleClaimNumber
      })
    ];

    for (let index = 0; index < sources.length; index += 1) {
      const sanitized = sanitizeClaimNumber(sources[index]);
      if (sanitized) {
        return sanitized;
      }
    }

    const lines = getBodyLines();
    for (const line of lines) {
      const match = line.match(/claim number\s*:\s*([A-Za-z0-9-]+)/i);
      if (match && match[1]) {
        const sanitized = sanitizeClaimNumber(match[1]);
        if (sanitized) {
          return sanitized;
        }
      }
    }
    return "";
  }

  function extractContactParts(rawContact) {
    const contact = normalizeText(rawContact);
    if (!contact) {
      return {
        customerName: "",
        primaryPhone: "",
        email: "",
        contactRaw: ""
      };
    }

    const phoneMatch = contact.match(/(?:\+?1[\s.-]*)?\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})/);
    const emailMatch = contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    let namePart = contact
      .replace(/,\s*point of contact/gi, "")
      .replace(/\b(mobile|main|home|work|office|other|cell)\b/gi, "");
    if (phoneMatch) {
      namePart = namePart.replace(phoneMatch[0], " ");
    }
    if (emailMatch) {
      namePart = namePart.replace(emailMatch[0], " ");
    }
    namePart = normalizeText(namePart).replace(/,\s*$/, "");

    return {
      customerName: namePart,
      primaryPhone: phoneMatch ? phoneMatch.slice(1).join("") : "",
      email: emailMatch ? normalizeText(emailMatch[0]) : "",
      contactRaw: contact
    };
  }

  function derivePayType(insuranceCarrier, claimNumber) {
    if (normalizeText(insuranceCarrier) || normalizeText(claimNumber)) {
      return "INSURANCE";
    }
    return "";
  }

  function deriveBusinessUnit(franchiseName) {
    const map = selectorsApi.WORKCENTER_IMPORT.franchiseToBusinessUnit || {};
    return map[normalizeKey(franchiseName)] || "";
  }

  function isCommercialProperty(propertyType) {
    const normalized = normalizeKey(propertyType);
    return normalized.indexOf("commercial") !== -1;
  }

  function detectCommercialFromDOM(primaryParsed, secondaryContactRaw) {
    if (secondaryContactRaw && /point of contact/i.test(secondaryContactRaw)) {
      return true;
    }
    if (primaryParsed.contactRaw && !primaryParsed.primaryPhone) {
      return true;
    }
    return false;
  }

  function looksWeakContactName(name) {
    const normalized = normalizeKey(name);
    if (!normalized) {
      return true;
    }
    if (normalized.indexOf("point of contact") !== -1) {
      return true;
    }
    return normalized.length < 3;
  }

  function resolveAddress1(domAddress1, parsedAddress) {
    const dom = normalizeText(domAddress1);
    if (dom && !isFullAddressLine(dom)) {
      return dom;
    }
    return parsedAddress.address1 || dom;
  }

  function isWorkcenterPage() {
    const hostOk = /servpronet\.io$/i.test(global.location.hostname);
    if (!hostOk) {
      return false;
    }
    if (document.getElementById("MainContent_JobInfoHeader1_txt_FullAddress")) {
      return true;
    }
    const bodyText = normalizeText(document.body ? document.body.innerText : "");
    return /project name:/i.test(bodyText) && /project id:/i.test(bodyText);
  }

  function buildPayload() {
    const projectName = firstNonEmpty([
      byIdText("MainContent_JobInfoHeader1_lblJobName"),
      extractByLabel("Project Name")
    ]);
    const primaryContactRaw = byIdText("MainContent_JobInfoHeader1_txt_PrimaryContact");
    const secondaryContactRaw = byIdText("MainContent_JobInfoHeader1_txt_SecondaryContact");
    const primaryParsed = extractContactParts(primaryContactRaw);
    const secondaryParsed = extractContactParts(secondaryContactRaw);

    const propertyType = firstNonEmpty([
      selectSelectedText("MainContent_cmb_JobType"),
      extractByLabel("Property Type")
    ]);

    const fullAddressNode = document.getElementById("MainContent_JobInfoHeader1_txt_FullAddress");
    const fullAddress = normalizeText(fullAddressNode ? fullAddressNode.textContent : extractByLabel("Address"));
    const parsedAddress = parseAddress(fullAddress);

    const domAddress1 = byIdValue("MainContent_txt_Address1");
    const address1 = resolveAddress1(domAddress1, parsedAddress);
    const address2 = firstNonEmpty([
      byIdValue("MainContent_txt_Unit"),
      byIdValue("MainContent_txt_Bldg"),
      extractByLabel(["Unit", "Address 2", "Apartment"])
    ]);
    const city = firstNonEmpty([
      byIdValue("MainContent_txt_City"),
      extractByLabel("City"),
      parsedAddress.city
    ]);
    const state = firstNonEmpty([
      selectSelectedAbbrev("MainContent_cmb_StateCD"),
      extractByLabel("State/Province"),
      parsedAddress.state
    ]);
    const zip = firstNonEmpty([
      byIdValue("MainContent_txt_Zip"),
      extractByLabel(["ZIP/Postal", "Zip/Postal Code", "Zip"]),
      parsedAddress.zip
    ]);

    const insuranceRaw = firstNonEmpty([
      byIdValue("ctl00_MainContent_cmb_Project_Input"),
      extractByLabel("Insurance Carrier"),
      extractByLabel("Insurance Company")
    ]);
    const claimNumber = extractClaimNumber();

    const explicitBusiness = extractExplicitBusinessName();
    const isCommercial = isCommercialProperty(propertyType) ||
      detectCommercialFromDOM(primaryParsed, secondaryContactRaw);

    let customerName = "";
    let businessName = "";
    let primaryPhone = "";
    let secondaryPhone = "";
    let email = "";

    if (isCommercial) {
      businessName = sanitizeBusinessName(firstNonEmpty([
        explicitBusiness,
        primaryParsed.customerName,
        projectName
      ]));
      customerName = secondaryParsed.customerName;
      primaryPhone = secondaryParsed.primaryPhone;
      secondaryPhone = "";
      email = firstNonEmpty([
        extractSecondaryEmail(),
        extractEmail(),
        secondaryParsed.email
      ]);
    } else {
      customerName = looksWeakContactName(primaryParsed.customerName)
        ? firstNonEmpty([projectName, primaryParsed.customerName])
        : primaryParsed.customerName;
      businessName = sanitizeBusinessName(explicitBusiness);
      primaryPhone = primaryParsed.primaryPhone;
      secondaryPhone = "";
      email = firstNonEmpty([
        extractEmail(),
        primaryParsed.email
      ]);
    }

    const coordinatorRaw = byIdValue("ctl00_MainContent_cmb_Staff5_Input");
    const addLocation = mapAddLocationForTeamAllen(propertyType);

    return {
      projectName,
      projectId: extractByLabel("Project ID"),
      projectProgress: extractByLabel("Project Progress"),
      lossType: firstNonEmpty([
        byIdText("MainContent_JobInfoHeader1_snap_ListType"),
        extractByLabel("Loss Type")
      ]),
      causeOfLoss: firstNonEmpty([
        byIdText("MainContent_JobInfoHeader1_snap_CauseOfLoss"),
        extractByLabel(["Cause of Loss", "Cause of Loss Type"])
      ]),
      claimNumber,
      customerName,
      businessName,
      primaryPhone: primaryPhone.replace(/\D+/g, ""),
      secondaryPhone: secondaryPhone.replace(/\D+/g, ""),
      email,
      address1,
      address2,
      city,
      state,
      zip,
      yearBuilt: firstNonEmpty([
        byIdValue("MainContent_txt_YearHouseBuilt"),
        extractByLabel(["Year Built", "YearBuilt"])
      ]),
      propertyType,
      franchiseName: byIdText("MainContent_JobInfoHeader1_lblJobSite"),
      businessUnit: deriveBusinessUnit(byIdText("MainContent_JobInfoHeader1_lblJobSite")),
      country: firstNonEmpty([extractByLabel("Country"), parsedAddress.country]),
      fullAddress,
      insuranceCarrier: stripParenthetical(insuranceRaw),
      payType: derivePayType(insuranceRaw, claimNumber),
      policyNumber: byIdValue("jobCustom1"),
      coordinator: stripParenthetical(coordinatorRaw),
      addLocation,
      billAddress: true,
      contactRaw: secondaryParsed.contactRaw || primaryParsed.contactRaw,
      sourceUrl: global.location.href,
      scrapedAt: new Date().toISOString()
    };
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
    const status = document.querySelector("#servpro-workcenter-helper-panel .servpro-helper-status");
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
      if (item.sourceUrl === payload.sourceUrl && item.projectId && item.projectId === payload.projectId) {
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
      storage.set({
        [selectorsApi.WORKCENTER_IMPORT.storageKey]: payload,
        [selectorsApi.WORKCENTER_IMPORT.historyKey]: history
      }, function onSaved() {
        callback(!global.chrome.runtime.lastError, history.length);
      });
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

  function getBusinessUnitWarning(payload) {
    if (!normalizeText(payload.franchiseName)) {
      return "";
    }
    if (!normalizeText(payload.businessUnit)) {
      return " Franchise not mapped to Bus.Unit.";
    }
    return "";
  }

  function exportPayloadFromText(text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    let safeProject = "workcenter";
    try {
      const parsed = JSON.parse(text);
      safeProject = (parsed.projectId || parsed.projectName || "workcenter")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    } catch (error) {
      safeProject = "workcenter";
    }
    link.href = url;
    link.download = safeProject + "-workcenter.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function cleanup() {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function createPanel() {
    if (document.getElementById("servpro-workcenter-helper-panel")) {
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
          id: "servpro-workcenter-helper-panel",
          title: "WorkCenter capture",
          variant: "workcenter"
        })
      : null;

    const panel = shell ? shell.panel : document.createElement("div");
    if (!shell) {
      panel.id = "servpro-workcenter-helper-panel";
    }

    const setPanelStatus = shell
      ? shell.setStatus
      : function fallbackStatus(msg) {
          setStatus(msg);
        };

    const scrapeButton = document.createElement("button");
    scrapeButton.type = "button";
    scrapeButton.textContent = "Scrape";
    if (helperPanelApi) {
      helperPanelApi.styleButton(scrapeButton, "primary");
    }

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Export JSON";
    if (helperPanelApi) {
      helperPanelApi.styleButton(exportButton);
    }

    const autofillButton = document.createElement("button");
    autofillButton.type = "button";
    autofillButton.textContent = "Open job import";
    autofillButton.className = "servpro-btn";
    autofillButton.style.display = "none";

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
            ? "Scraped and saved (" + count + "/9 key fields). History: " + historyCount + "/5." + getBusinessUnitWarning(latestPayload)
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
          exportPayloadFromText(root.importPayloadPanel.formatPayload(latestPayload));
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
        const openVia = settingsApi
          ? settingsApi.resolveTeamAllenOpenVia(settings)
          : "page";
        const targetUrl =
          openVia === "modal" ? wi.teamallenssmListUrl : wi.teamallenssmAddUrl;

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
            });
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
    toolbar.appendChild(autofillButton);

    const wcBody = shell ? shell.body : panel;
    if (jsonEditor) {
      wcBody.appendChild(jsonEditor.element);
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
      const collapse = shell.mountCollapse("WC capture");
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
    if (!isWorkcenterPage()) {
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
