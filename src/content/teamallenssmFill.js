(function initTeamallenssmFill(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const fieldsApi = root.workcenterFields || {};

  if (!selectorsApi) {
    return;
  }

  const ADDRESS_GRID_PAGE = fieldsApi.ADDRESS_GRID_PAGE || "dbo_sp_jobaddresses_listJob";
  const mapLossTypeForTeamAllen = selectorsApi.mapLossTypeForTeamAllen || fieldsApi.mapLossTypeForTeamAllen;
  const mapCoordinatorForTeamAllen = selectorsApi.mapCoordinatorForTeamAllen || fieldsApi.mapCoordinatorForTeamAllen;
  const mapAddLocationForTeamAllen = selectorsApi.mapAddLocationForTeamAllen || fieldsApi.mapAddLocationForTeamAllen;
  const isPlausibleBusinessName = fieldsApi.isPlausibleBusinessName || selectorsApi.isPlausibleBusinessName || function always(value) {
    return Boolean(normalizeText(value));
  };
  const isPlausibleClaimNumber = fieldsApi.isPlausibleClaimNumber || selectorsApi.isPlausibleClaimNumber || function always(value) {
    return Boolean(normalizeText(value));
  };

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function firstNonEmpty(values) {
    return values.find(function hasValue(value) {
      return Boolean(normalizeText(value));
    }) || "";
  }

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function setInputValue(input, value) {
    if (!input) {
      return false;
    }
    input.focus();
    input.value = value || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setCheckboxValue(input, checked) {
    if (!input) {
      return false;
    }
    input.checked = Boolean(checked);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function resolveElementByMapValue(mapValue) {
    if (!mapValue) {
      return null;
    }
    if (mapValue.endsWith("_")) {
      return resolveAddressGridElement(mapValue);
    }
    return document.getElementById(mapValue);
  }

  function resolveAddressGridElement(prefix) {
    const rows = Array.from(
      document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]')
    );
    const activeRow = rows.find(function isVisible(row) {
      if (row.getAttribute("data-hidden") !== null && row.getAttribute("data-hidden") !== "") {
        return false;
      }
      const style = global.getComputedStyle(row);
      return style.display !== "none" && style.visibility !== "hidden";
    }) || rows[0];

    if (activeRow) {
      const inRow = activeRow.querySelector('[id^="' + prefix + '"]');
      if (inRow) {
        return inRow;
      }
    }

    const candidates = Array.from(document.querySelectorAll('[id^="' + prefix + '"]'));
    return candidates.find(function isVisible(el) {
      const style = global.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    }) || candidates[0] || null;
  }

  function setSelectByText(select, value) {
    if (!select || !value) {
      return false;
    }

    const target = normalizeKey(value);
    const option = Array.from(select.options).find(function match(entry) {
      const optionText = normalizeKey(entry.textContent);
      return optionText === target || optionText.indexOf(target) !== -1 || target.indexOf(optionText) !== -1;
    });
    if (!option) {
      return false;
    }

    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function isOnAddJobPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_add\.php/i.test(global.location.pathname + global.location.search);
  }

  function isOnListPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_list\.php/i.test(global.location.pathname + global.location.search);
  }

  function shouldApplyReconDefaults(source, enabled) {
    if (!enabled) {
      return false;
    }
    const combined = normalizeKey([source.lossType, source.propertyType, source.payType].join(" "));
    return combined.indexOf("recon") !== -1 || combined.indexOf("rebuild") !== -1;
  }

  function getStalenessMessage(payload) {
    const scrapedAt = new Date(payload.scrapedAt || 0).getTime();
    if (!scrapedAt) {
      return "";
    }
    const elapsedMs = Date.now() - scrapedAt;
    const staleMs = selectorsApi.WORKCENTER_IMPORT.staleHours * 60 * 60 * 1000;
    if (elapsedMs > staleMs) {
      return " Warning: payload older than " + selectorsApi.WORKCENTER_IMPORT.staleHours + "h.";
    }
    return "";
  }

  function mapPropertyType(sourceValue) {
    const val = normalizeKey(sourceValue);
    if (val.indexOf("residential") !== -1) {
      return "Residential";
    }
    if (val.indexOf("commercial") !== -1) {
      return "Commercial";
    }
    return "";
  }

  function isResidential(payload, propertyTypeMapped) {
    const key = normalizeKey(propertyTypeMapped || payload.propertyType);
    return key.indexOf("residential") !== -1;
  }

  function buildSource(payload) {
    const propertyTypeRaw = firstNonEmpty([payload.propertyType, payload.PropertyType, payload.type]);
    const propertyTypeMapped = mapPropertyType(propertyTypeRaw);
    const residential = isResidential(payload, propertyTypeMapped);

    const rawBusinessName = firstNonEmpty([
      payload.businessName,
      payload.business,
      payload.Business
    ]);
    const businessName = isPlausibleBusinessName(rawBusinessName) ? rawBusinessName : "";

    return {
      customerName: firstNonEmpty([payload.customerName, payload.customer, payload.Customer]),
      businessName: businessName,
      primaryPhone: firstNonEmpty([payload.primaryPhone, payload.phone1, payload.phone, payload.PhonePrimary]).replace(/\D+/g, ""),
      secondaryPhone: firstNonEmpty([payload.secondaryPhone, payload.phone2, payload.PhoneAlternate]).replace(/\D+/g, ""),
      email: firstNonEmpty([payload.email, payload.EMail, payload.Email]),
      payType: firstNonEmpty([payload.payType, payload.paytype, payload.fkJobType]),
      businessUnit: firstNonEmpty([payload.businessUnit, payload.busUnit, payload.BusinessUnit]),
      claimNumber: (function resolveClaim() {
        const raw = firstNonEmpty([payload.claimNumber, payload.claim, payload.claimNo, payload.InsClaimNo]);
        return isPlausibleClaimNumber(raw) ? normalizeText(raw).replace(/\s+/g, "") : "";
      })(),
      address1: firstNonEmpty([payload.address1, payload.Address1, payload.address]),
      address2: firstNonEmpty([payload.address2, payload.Address2]),
      city: firstNonEmpty([payload.city, payload.City]),
      state: firstNonEmpty([payload.state, payload.State]),
      zip: firstNonEmpty([payload.zip, payload.Zip, payload.zipCode]),
      yearBuilt: firstNonEmpty([payload.yearBuilt, payload.YearBuilt]),
      propertyType: propertyTypeMapped,
      insuranceCarrier: firstNonEmpty([payload.insuranceCarrier, payload.InsuranceCompany, payload.insurance]),
      lossType: firstNonEmpty([payload.lossType, payload.LossType]),
      coordinator: firstNonEmpty([payload.coordinator, payload.Coordinator]),
      addLocation: firstNonEmpty([
        payload.addLocation,
        mapAddLocationForTeamAllen ? mapAddLocationForTeamAllen(propertyTypeRaw) : ""
      ]),
      billAddress: payload.billAddress !== false
    };
  }

  function formatAddressSummary(source) {
    const parts = [];
    if (source.address1) {
      parts.push(source.address1);
    }
    const cityLine = [source.city, source.state, source.zip].filter(Boolean).join(", ");
    if (cityLine) {
      parts.push(cityLine);
    }
    return parts.join(" | ");
  }

  function fillFromPayload(payload, applyReconDefaultsEnabled) {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const source = buildSource(payload);
    const textFields = [
      "customerName",
      "businessName",
      "primaryPhone",
      "secondaryPhone",
      "email",
      "claimNumber",
      "address1",
      "address2",
      "city",
      "state",
      "zip",
      "yearBuilt"
    ];

    const selectFieldValues = {
      propertyType: source.propertyType,
      payType: source.payType,
      businessUnit: source.businessUnit,
      insuranceCarrier: source.insuranceCarrier,
      lossType: mapLossTypeForTeamAllen ? mapLossTypeForTeamAllen(source.lossType) : source.lossType,
      coordinator: mapCoordinatorForTeamAllen ? mapCoordinatorForTeamAllen(source.coordinator) : source.coordinator,
      addLocation: source.addLocation
    };

    if (shouldApplyReconDefaults(source, applyReconDefaultsEnabled)) {
      selectFieldValues.coordinator = selectorsApi.WORKCENTER_IMPORT.reconDefaults.coordinator;
      selectFieldValues.reconManager = selectorsApi.WORKCENTER_IMPORT.reconDefaults.reconManager;
    }

    let filled = 0;
    const missing = [];

    textFields.forEach(function eachField(key) {
      const elementId = map[key];
      if (!elementId) {
        return;
      }
      const input = resolveElementByMapValue(elementId);
      const value = source[key];
      if (!value) {
        return;
      }
      const ok = setInputValue(input, value);
      if (ok) {
        filled += 1;
      } else {
        missing.push(key);
      }
    });

    Object.keys(selectFieldValues).forEach(function eachSelect(key) {
      const elementId = map[key];
      if (!elementId) {
        return;
      }
      const select = resolveElementByMapValue(elementId);
      const value = selectFieldValues[key];
      if (!value) {
        return;
      }
      const ok = setSelectByText(select, value);
      if (ok) {
        filled += 1;
      } else {
        missing.push(key);
      }
    });

    if (source.billAddress && map.billAddress) {
      const billCheckbox = resolveElementByMapValue(map.billAddress);
      if (setCheckboxValue(billCheckbox, true)) {
        filled += 1;
      } else {
        missing.push("billAddress");
      }
    }

    return {
      filled,
      missing,
      addressSummary: formatAddressSummary(source)
    };
  }

  function loadPayloads(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null, []);
      return;
    }
    storage.get([
      selectorsApi.WORKCENTER_IMPORT.storageKey,
      selectorsApi.WORKCENTER_IMPORT.historyKey,
      selectorsApi.WORKCENTER_IMPORT.reconToggleKey
    ], function onLoad(result) {
      const latest = result && result[selectorsApi.WORKCENTER_IMPORT.storageKey];
      const history = result && result[selectorsApi.WORKCENTER_IMPORT.historyKey];
      const applyReconDefaults = Boolean(result && result[selectorsApi.WORKCENTER_IMPORT.reconToggleKey]);
      callback(latest || null, Array.isArray(history) ? history : [], applyReconDefaults);
    });
  }

  function savePayload(payload, callback) {
    const storage = getStorage();
    if (!storage) {
      callback(false);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = Array.isArray(result && result[selectorsApi.WORKCENTER_IMPORT.historyKey])
        ? result[selectorsApi.WORKCENTER_IMPORT.historyKey]
        : [];
      const deduped = history.filter(function keep(item) {
        if (!item || !payload) {
          return Boolean(item);
        }
        if (item.sourceUrl === payload.sourceUrl && item.projectId && item.projectId === payload.projectId) {
          return false;
        }
        return true;
      });
      deduped.unshift(payload);
      storage.set({
        [selectorsApi.WORKCENTER_IMPORT.storageKey]: payload,
        [selectorsApi.WORKCENTER_IMPORT.historyKey]: deduped.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5)
      }, function onSaved() {
        callback(!global.chrome.runtime.lastError);
      });
    });
  }

  function makeCollapsible(panel, restoreLabel, onCollapse) {
    var restoreBtn = null;

    function collapse() {
      panel.style.display = "none";
      if (restoreBtn && restoreBtn.parentElement) {
        return;
      }
      restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.textContent = restoreLabel;
      restoreBtn.style.cssText = [
        "position:fixed",
        "right:16px",
        "bottom:16px",
        "z-index:2147483647",
        "background:#1976d2",
        "color:#fff",
        "border:none",
        "border-radius:20px",
        "padding:5px 12px",
        "font:12px/1.4 Arial,sans-serif",
        "cursor:pointer",
        "box-shadow:0 2px 8px rgba(0,0,0,.25)"
      ].join(";");
      restoreBtn.addEventListener("click", function onRestore() {
        panel.style.display = "block";
        if (restoreBtn && restoreBtn.parentElement) {
          restoreBtn.parentElement.removeChild(restoreBtn);
        }
        restoreBtn = null;
      });
      document.body.appendChild(restoreBtn);
      if (typeof onCollapse === "function") {
        onCollapse();
      }
    }

    return { collapse: collapse };
  }

  function createListPagePanel() {
    if (document.getElementById("servpro-teamallenssm-list-panel")) {
      return;
    }

    const payloadPanelApi = root.importPayloadPanel;
    if (!payloadPanelApi) {
      return;
    }

    const panel = document.createElement("div");
    panel.id = "servpro-teamallenssm-list-panel";
    panel.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "background:#fff",
      "border:1px solid #c7d2da",
      "border-radius:8px",
      "padding:10px",
      "box-shadow:0 2px 12px rgba(0,0,0,.2)",
      "width:380px",
      "max-height:80vh",
      "overflow:auto",
      "font:13px/1.4 Arial,sans-serif"
    ].join(";");

    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;";

    const titleEl = document.createElement("span");
    titleEl.textContent = "Add Job \u2014 Paste Payload";
    titleEl.style.fontWeight = "700";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "\u00d7";
    closeBtn.title = "Hide panel";
    closeBtn.style.cssText = "background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#627d98;padding:0 2px;";

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const hint = document.createElement("div");
    hint.textContent = "Paste WorkCenter JSON below, save it, then click \u201cAdd Job\u201d above.";
    hint.style.cssText = "font-size:12px;color:#627d98;margin-bottom:8px;line-height:1.4;";

    const status = document.createElement("div");
    status.style.cssText = "margin-top:8px;color:#334e68;font-size:12px;";
    status.textContent = "Ready";

    function setStatus(message) {
      status.textContent = message;
    }

    const jsonEditor = payloadPanelApi.createImportPayloadPanel({
      getBaselinePayload: function getBaseline() {
        return null;
      },
      onStatus: setStatus,
      onSave: function onSavePayload(payload, done) {
        savePayload(payload, function onSaved(ok) {
          done(ok, ok ? "Payload saved. Now click \u201cAdd Job\u201d to open the form." : "Failed to save payload.");
        });
      }
    });

    jsonEditor.expand();

    panel.appendChild(header);
    panel.appendChild(hint);
    panel.appendChild(jsonEditor.element);
    panel.appendChild(status);
    document.body.appendChild(panel);

    const collapseControl = makeCollapsible(panel, "SP Helper \u25b2");
    closeBtn.addEventListener("click", function onClose() {
      collapseControl.collapse();
    });

    document.addEventListener("click", function onAddJobClick(e) {
      const addJobBtn = e.target && e.target.closest && e.target.closest("#AddJpb_Button_9");
      if (addJobBtn && panel.style.display !== "none") {
        collapseControl.collapse();
      }
    }, true);

    loadPayloads(function initEditor(latest, history) {
      const existing = latest || (history.length ? history[0] : null);
      if (existing) {
        jsonEditor.setPayload(existing, { expand: true });
        setStatus("Existing payload loaded. Edit if needed, then save.");
      }
    });
  }

  function createPanel() {
    if (document.getElementById("servpro-teamallenssm-helper-panel")) {
      return;
    }

    const payloadPanelApi = root.importPayloadPanel;
    let jsonEditor = null;

    const panel = document.createElement("div");
    panel.id = "servpro-teamallenssm-helper-panel";
    panel.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "background:#fff",
      "border:1px solid #c7d2da",
      "border-radius:8px",
      "padding:10px",
      "box-shadow:0 2px 12px rgba(0,0,0,.2)",
      "width:420px",
      "max-height:90vh",
      "overflow:auto",
      "font:13px/1.4 Arial,sans-serif"
    ].join(";");

    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";

    const titleEl = document.createElement("span");
    titleEl.textContent = "TeamAllenssm Import Helper";
    titleEl.style.fontWeight = "700";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "\u00d7";
    closeBtn.title = "Hide panel";
    closeBtn.style.cssText = "background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#627d98;padding:0 2px;";

    const fillButton = document.createElement("button");
    fillButton.type = "button";
    fillButton.textContent = "Fill from WorkCenter payload";
    fillButton.style.cssText = "border:1px solid #1976d2;background:#1976d2;color:#fff;border-radius:6px;padding:6px 8px;cursor:pointer;";

    const historyLabel = document.createElement("div");
    historyLabel.textContent = "Choose scraped record:";
    historyLabel.style.marginTop = "8px";

    const historySelect = document.createElement("select");
    historySelect.style.cssText = "width:100%;margin-top:4px;padding:6px;border:1px solid #c7d2da;border-radius:6px;background:#fff;";

    const reconWrap = document.createElement("label");
    reconWrap.style.display = "block";
    reconWrap.style.marginTop = "8px";
    reconWrap.style.cursor = "pointer";

    const reconCheckbox = document.createElement("input");
    reconCheckbox.type = "checkbox";
    reconCheckbox.style.marginRight = "6px";
    reconWrap.appendChild(reconCheckbox);
    reconWrap.appendChild(document.createTextNode("Apply recon defaults (Coordinator/Recon Mgr)"));

    const status = document.createElement("div");
    status.className = "servpro-teamallenssm-status";
    status.style.marginTop = "8px";
    status.style.color = "#334e68";
    status.textContent = "Ready";

    let selectedHistoryIndex = -1;

    function setStatus(message) {
      status.textContent = message;
    }

    function summarizePayload(payload, index) {
      const when = payload && payload.scrapedAt ? new Date(payload.scrapedAt).toLocaleString() : "Unknown time";
      const primary = firstNonEmpty([payload.projectName, payload.customerName, payload.businessName, payload.claimNumber, "Record"]);
      return "#" + (index + 1) + " - " + primary + " - " + when;
    }

    function populateHistory(history, latest) {
      historySelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "-1";
      defaultOption.textContent = latest ? "Latest saved payload" : "Select history record";
      historySelect.appendChild(defaultOption);

      history.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5).forEach(function eachItem(item, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = summarizePayload(item, index);
        historySelect.appendChild(option);
      });

      historySelect.value = selectedHistoryIndex >= 0 ? String(selectedHistoryIndex) : "-1";
    }

    function loadPayloadForEditor(latest, history) {
      let payload = latest || null;
      if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
        payload = history[selectedHistoryIndex];
      } else if (!payload && history.length) {
        payload = history[0];
      }
      if (jsonEditor && payload) {
        jsonEditor.setPayload(payload, { expand: false });
      }
    }

    const storage = getStorage();
    if (storage) {
      storage.get([selectorsApi.WORKCENTER_IMPORT.reconToggleKey], function onToggleLoad(result) {
        reconCheckbox.checked = Boolean(result && result[selectorsApi.WORKCENTER_IMPORT.reconToggleKey]);
      });
      reconCheckbox.addEventListener("change", function onToggleChanged() {
        storage.set({ [selectorsApi.WORKCENTER_IMPORT.reconToggleKey]: reconCheckbox.checked });
      });
    }

    historySelect.addEventListener("change", function onHistoryChanged() {
      const parsed = Number(historySelect.value);
      selectedHistoryIndex = Number.isNaN(parsed) ? -1 : parsed;
      loadPayloads(function onLoaded(latest, history) {
        populateHistory(history, latest);
        loadPayloadForEditor(latest, history);
      });
    });

    if (payloadPanelApi) {
      jsonEditor = payloadPanelApi.createImportPayloadPanel({
        getBaselinePayload: function getBaseline() {
          return null;
        },
        onStatus: setStatus,
        onSave: function onSavePayload(payload, done) {
          savePayload(payload, function onSaved(ok) {
            done(ok, ok ? "Payload saved." : "Failed to save payload.");
          });
        }
      });
    }

    fillButton.addEventListener("click", function onFill() {
      loadPayloads(function onLoaded(latest, history, applyReconDefaultsStored) {
        populateHistory(history, latest);

        let payload = latest || null;
        const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };
        if (editorParsed.ok) {
          payload = editorParsed.payload;
        } else if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
          payload = history[selectedHistoryIndex];
        } else if (!payload && history.length) {
          payload = history[0];
        }

        const applyReconDefaults = reconCheckbox.checked || applyReconDefaultsStored;
        if (!payload) {
          setStatus("No saved WorkCenter payload found. Scrape on WorkCenter first.");
          return;
        }

        const fillResult = fillFromPayload(payload, applyReconDefaults);
        const staleMessage = getStalenessMessage(payload);
        const missingText = fillResult.missing.length ? " Missing: " + fillResult.missing.join(", ") + "." : "";
        const addressText = fillResult.addressSummary ? " Address: " + fillResult.addressSummary + "." : "";
        setStatus(
          "Filled " + fillResult.filled + " fields." +
          addressText +
          staleMessage +
          " History: " + history.length + "/5." +
          missingText
        );
      });
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    panel.appendChild(header);
    panel.appendChild(fillButton);
    panel.appendChild(historyLabel);
    panel.appendChild(historySelect);
    panel.appendChild(reconWrap);
    panel.appendChild(status);
    if (jsonEditor) {
      panel.appendChild(jsonEditor.element);
    }
    document.body.appendChild(panel);

    const collapseControl = makeCollapsible(panel, "SP Helper \u25b2");
    closeBtn.addEventListener("click", function onClose() {
      collapseControl.collapse();
    });

    loadPayloads(function initHistory(latest, history) {
      populateHistory(history, latest);
      loadPayloadForEditor(latest, history);
      if (history.length) {
        setStatus("Ready. Review JSON, then click Fill.");
      }
    });
  }

  function boot() {
    if (isOnAddJobPage()) {
      createPanel();
    } else if (isOnListPage()) {
      createListPagePanel();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
