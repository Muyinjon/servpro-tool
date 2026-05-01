(function initTeamallenssmFill(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;

  if (!selectorsApi) {
    return;
  }

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

  function resolveElementByMapValue(mapValue) {
    if (!mapValue) {
      return null;
    }
    if (mapValue.endsWith("_")) {
      return document.querySelector('[id^="' + mapValue + '"]');
    }
    return document.getElementById(mapValue);
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
      return "Warning: scraped payload is older than " + selectorsApi.WORKCENTER_IMPORT.staleHours + "h.";
    }
    return "";
  }

  function setStatus(message) {
    const status = document.querySelector("#servpro-teamallenssm-helper-panel .servpro-teamallenssm-status");
    if (status) {
      status.textContent = message;
    }
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

  function buildSource(payload) {
    return {
      customerName: firstNonEmpty([payload.customerName, payload.customer, payload.Customer]),
      businessName: firstNonEmpty([payload.businessName, payload.business, payload.Business, payload.customerName]),
      primaryPhone: firstNonEmpty([payload.primaryPhone, payload.phone1, payload.phone, payload.PhonePrimary]).replace(/\D+/g, ""),
      secondaryPhone: firstNonEmpty([payload.secondaryPhone, payload.phone2, payload.PhoneAlternate]).replace(/\D+/g, ""),
      email: firstNonEmpty([payload.email, payload.EMail, payload.Email]),
      payType: firstNonEmpty([payload.payType, payload.paytype, payload.fkJobType]),
      businessUnit: firstNonEmpty([payload.businessUnit, payload.busUnit, payload.BusinessUnit]),
      claimNumber: firstNonEmpty([payload.claimNumber, payload.claim, payload.claimNo, payload.InsClaimNo]),
      address1: firstNonEmpty([payload.address1, payload.Address1, payload.address]),
      address2: firstNonEmpty([payload.address2, payload.Address2]),
      city: firstNonEmpty([payload.city, payload.City]),
      state: firstNonEmpty([payload.state, payload.State]),
      zip: firstNonEmpty([payload.zip, payload.Zip, payload.zipCode]),
      yearBuilt: firstNonEmpty([payload.yearBuilt, payload.YearBuilt]),
      propertyType: firstNonEmpty([payload.propertyType, payload.PropertyType, payload.type]),
      insuranceCarrier: firstNonEmpty([payload.insuranceCarrier, payload.InsuranceCompany, payload.insurance]),
      lossType: firstNonEmpty([payload.lossType, payload.LossType])
    };
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
      propertyType: mapPropertyType(source.propertyType),
      payType: source.payType,
      businessUnit: source.businessUnit,
      insuranceCarrier: source.insuranceCarrier,
      lossType: source.lossType
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

    return { filled, missing };
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

  function createPanel() {
    if (document.getElementById("servpro-teamallenssm-helper-panel")) {
      return;
    }

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
      "width:340px",
      "font:13px/1.4 Arial,sans-serif"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "TeamAllenssm Import Helper";
    title.style.fontWeight = "700";
    title.style.marginBottom = "8px";

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
    });

    fillButton.addEventListener("click", function onFill() {
      loadPayloads(function onLoaded(latest, history, applyReconDefaultsStored) {
        populateHistory(history, latest);

        let payload = latest || null;
        if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
          payload = history[selectedHistoryIndex];
        } else if (!payload && history.length) {
          payload = history[0];
        }

        const applyReconDefaults = reconCheckbox.checked || applyReconDefaultsStored;
        if (!payload) {
          setStatus("No saved WorkCenter payload found");
          return;
        }

        const fillResult = fillFromPayload(payload, applyReconDefaults);
        const staleMessage = getStalenessMessage(payload);
        const missingText = fillResult.missing.length ? " Missing: " + fillResult.missing.join(", ") + "." : "";
        setStatus(
          "Filled " + fillResult.filled + " fields." +
          (staleMessage ? " " + staleMessage : "") +
          " History: " + history.length + "/5." +
          missingText
        );
      });
    });

    panel.appendChild(title);
    panel.appendChild(fillButton);
    panel.appendChild(historyLabel);
    panel.appendChild(historySelect);
    panel.appendChild(reconWrap);
    panel.appendChild(status);
    document.body.appendChild(panel);

    loadPayloads(function initHistory(latest, history) {
      populateHistory(history, latest);
      if (history.length) {
        setStatus("Ready. Select a history record or use latest.");
      }
    });
  }

  function boot() {
    if (!isOnAddJobPage()) {
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
