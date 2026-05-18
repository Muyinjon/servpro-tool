(function initTeamallenssmFill(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const fieldsApi = root.workcenterFields || {};
  const settingsApi = root.settings;

  if (!selectorsApi) {
    return;
  }

  let cachedSettings = settingsApi
    ? settingsApi.mergeSettings(null)
    : { teamAllenActivated: true };

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

  function isTeamAllenFeatureEnabled() {
    if (!settingsApi) {
      return true;
    }
    return settingsApi.isTeamAllenActivated(cachedSettings);
  }

  function loadSettings(callback) {
    if (!settingsApi) {
      cachedSettings = { teamAllenActivated: true };
      callback(cachedSettings);
      return;
    }
    settingsApi.getSettings(function onLoaded(settings) {
      cachedSettings = settings;
      callback(settings);
    });
  }

  function getInputValueById(id) {
    const el = document.getElementById(id);
    if (!el) {
      return "";
    }
    if (el.tagName === "SELECT") {
      const opt = el.options[el.selectedIndex];
      return normalizeText(opt ? opt.textContent : "");
    }
    if (el.type === "checkbox") {
      return el.checked ? "1" : "";
    }
    return normalizeText(el.value || el.textContent);
  }

  function getAddressFieldFromGrid(fieldName) {
    const rows = orderAddressGridRows(
      Array.from(document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]'))
    );
    const row = rows.find(function match(rowEl) {
      return /^\d+$/.test(rowEl.getAttribute("data-record-id") || "");
    });
    if (!row) {
      return "";
    }
    const input = row.querySelector(
      'input[id^="value_' + fieldName + '_"], select[id^="value_' + fieldName + '_"]'
    );
    if (input) {
      if (input.tagName === "SELECT") {
        const opt = input.options[input.selectedIndex];
        return normalizeText(opt ? opt.textContent : "");
      }
      return normalizeText(input.value);
    }
    const display = row.querySelector('[data-field="' + fieldName + '"] span[id$="_' + fieldName + '"]');
    if (display) {
      const valAttr = display.getAttribute("val");
      if (valAttr) {
        return normalizeText(valAttr);
      }
      const lookup = display.querySelector(".r-lookup-value");
      if (lookup) {
        return normalizeText(lookup.textContent);
      }
      return normalizeText(display.textContent);
    }
    return "";
  }

  function scrapePayloadFromPage() {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const editId = getEditJobIdFromSearch();
    const pkJobs = getInputValueById("value_pkJobsId_1") || editId;
    const propertyType = getInputValueById(map.propertyType);
    const payload = {
      customerName: getInputValueById(map.customerName),
      businessName: getInputValueById(map.businessName),
      primaryPhone: getInputValueById(map.primaryPhone).replace(/\D+/g, ""),
      secondaryPhone: getInputValueById(map.secondaryPhone).replace(/\D+/g, ""),
      email: getInputValueById(map.email),
      payType: getInputValueById(map.payType),
      businessUnit: getInputValueById(map.businessUnit),
      claimNumber: getInputValueById(map.claimNumber).replace(/\s+/g, ""),
      propertyType: propertyType,
      insuranceCarrier: getInputValueById(map.insuranceCarrier),
      lossType: getInputValueById(map.lossType),
      coordinator: getInputValueById(map.coordinator),
      address1: getAddressFieldFromGrid("Address1"),
      address2: getAddressFieldFromGrid("Address2"),
      city: getAddressFieldFromGrid("City"),
      state: getAddressFieldFromGrid("State"),
      zip: getAddressFieldFromGrid("Zip"),
      yearBuilt: getAddressFieldFromGrid("YearBuilt"),
      addLocation: getAddressFieldFromGrid("AddLocation") || (mapAddLocationForTeamAllen ? mapAddLocationForTeamAllen(propertyType) : ""),
      billAddress: true,
      teamAllenJobId: pkJobs,
      source: "teamallen-edit",
      sourceUrl: global.location.href,
      scrapedAt: new Date().toISOString()
    };
    return payload;
  }

  function copyTextToClipboard(text, callback) {
    const nav = global.navigator;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      nav.clipboard.writeText(text).then(function ok() {
        callback(true);
      }).catch(function fail() {
        callback(false);
      });
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    area.remove();
    callback(copied);
  }

  function clickTeamAllenSaveButton() {
    const candidates = [
      "#saveButton1",
      'a[id^="saveButton"]',
      'button[id^="saveButton"]',
      '[data-itemtype="edit_save"] a',
      'a[type="button"]#saveButton1'
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const btn = document.querySelector(candidates[i]);
      if (btn && typeof btn.click === "function") {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function tryPendingFnolAutoSubmit(setStatus) {
    if (!isOnAddJobPage() || !isTeamAllenFeatureEnabled() || !settingsApi) {
      return;
    }
    settingsApi.getPendingAutoSubmit(function onPending(pending) {
      if (!pending || !pending.autoSave) {
        return;
      }
      if (cachedSettings.fnolAutoSave === false) {
        settingsApi.clearPendingAutoSubmit();
        return;
      }
      loadPayloads(function onLoaded(latest, history, storedJobDefaultMode) {
        const payload = latest || (history.length ? history[0] : null);
        if (!payload) {
          settingsApi.clearPendingAutoSubmit();
          if (setStatus) {
            setStatus("FNOL auto-submit: no payload found.");
          }
          return;
        }
        const defaultMode = normalizeJobDefaultMode(
          storedJobDefaultMode || cachedSettings.defaultJobModeOnFill
        );
        if (setStatus) {
          setStatus("FNOL: filling form…");
        }
        const fillResult = fillFromPayload(payload, defaultMode);
        global.setTimeout(function afterFill() {
          const saved = clickTeamAllenSaveButton();
          settingsApi.clearPendingAutoSubmit();
          const msg =
            "FNOL: filled " + fillResult.filled + " fields." +
            (saved ? " Save clicked." : " Save button not found — click Save manually.") +
            (fillResult.missing.length ? " Missing: " + fillResult.missing.join(", ") + "." : "");
          if (setStatus) {
            setStatus(msg);
          }
        }, 450);
      });
    });
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

  function orderAddressGridRows(rows) {
    if (!isOnEditJobPage()) {
      return rows;
    }
    const numeric = [];
    const add = [];
    const rest = [];
    rows.forEach(function eachRow(row) {
      const rid = row.getAttribute("data-record-id") || "";
      if (/^\d+$/.test(rid)) {
        numeric.push(row);
      } else if (rid === "add") {
        add.push(row);
      } else {
        rest.push(row);
      }
    });
    return numeric.concat(add).concat(rest);
  }

  function resolveAddressGridElement(prefix) {
    const rows = orderAddressGridRows(
      Array.from(document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]'))
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

  function setSelectByValue(select, value) {
    if (!select || value === undefined || value === null || value === "") {
      return false;
    }
    const target = String(value);
    const option = Array.from(select.options).find(function match(entry) {
      return String(entry.value) === target;
    });
    if (!option) {
      return false;
    }
    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setSelectField(select, textValue, optionValue) {
    if (!select) {
      return false;
    }
    if (optionValue && setSelectByValue(select, optionValue)) {
      return true;
    }
    if (textValue) {
      return setSelectByText(select, textValue);
    }
    return false;
  }

  function isOnAddJobPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_add\.php/i.test(global.location.pathname + global.location.search);
  }

  function isOnEditJobPage() {
    if (!/teamallenssm\.com$/i.test(global.location.hostname)) {
      return false;
    }
    if (!/jobs1_edit\.php/i.test(global.location.pathname)) {
      return false;
    }
    const search = global.location.search || "";
    return /(?:^|[?&])editid1=\d+/i.test(search) || /page=editjob/i.test(search);
  }

  function getEditJobIdFromSearch() {
    const m = String(global.location.search || "").match(/(?:^|[?&])editid1=(\d+)/i);
    return m ? m[1] : "";
  }

  function isOnListPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_list\.php/i.test(global.location.pathname + global.location.search);
  }

  const JOB_DEFAULT_MODES = ["none", "recon", "mitigation"];

  function normalizeJobDefaultMode(value) {
    const key = normalizeKey(value);
    if (key === "recon" || key.indexOf("recon") !== -1) {
      return "recon";
    }
    if (key === "mitigation" || key.indexOf("mitig") !== -1) {
      return "mitigation";
    }
    return "none";
  }

  function applyJobDefaultModeToSelects(selectFieldValues, defaultMode) {
    const wi = selectorsApi.WORKCENTER_IMPORT;
    if (defaultMode === "recon" && wi.reconDefaults) {
      selectFieldValues.coordinator = wi.reconDefaults.coordinator;
      selectFieldValues.coordinatorValue = wi.reconDefaults.coordinatorValue;
      selectFieldValues.reconManager = wi.reconDefaults.reconManager;
      selectFieldValues.reconManagerValue = wi.reconDefaults.reconManagerValue;
    } else if (defaultMode === "mitigation" && wi.mitigationDefaults) {
      selectFieldValues.coordinator = wi.mitigationDefaults.coordinator;
      selectFieldValues.coordinatorValue = wi.mitigationDefaults.coordinatorValue;
      delete selectFieldValues.reconManager;
      delete selectFieldValues.reconManagerValue;
    }
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

  function hasRecognizableJobField(payload) {
    const fieldGroups = [
      ["customerName", "customer", "Customer"],
      ["businessName", "business", "Business"],
      ["primaryPhone", "phone1", "phone", "PhonePrimary"],
      ["claimNumber", "claim", "claimNo", "InsClaimNo"],
      ["address1", "Address1", "address", "fullAddress"],
      ["propertyType", "PropertyType", "type"],
      ["lossType", "LossType"],
      ["email", "EMail", "Email"],
      ["businessUnit", "busUnit", "BusinessUnit"],
      ["insuranceCarrier", "InsuranceCompany", "insurance"],
      ["coordinator", "Coordinator"]
    ];
    return fieldGroups.some(function eachGroup(keys) {
      return Boolean(firstNonEmpty(keys.map(function fieldKey(key) {
        return payload[key];
      })));
    });
  }

  function analyzeImportPayload(payload) {
    const errors = [];
    const warnings = [];

    if (payload.steps && Array.isArray(payload.steps)) {
      errors.push("This looks like a browser recording (has a \"steps\" list), not job data.");
    }
    if (
      normalizeText(payload.title).indexOf("recording") !== -1 &&
      !hasRecognizableJobField(payload)
    ) {
      errors.push("This looks like a recording export, not a WorkCenter job payload.");
    }

    if (!hasRecognizableJobField(payload)) {
      errors.push("No recognizable job fields. Add customer, address, claim #, phone, or similar.");
    }

    const source = buildSource(payload);
    const rawClaim = firstNonEmpty([payload.claimNumber, payload.claim, payload.claimNo, payload.InsClaimNo]);
    if (normalizeText(rawClaim) && !source.claimNumber) {
      warnings.push("Claim # looks invalid (not a real claim number).");
    }
    const rawBusiness = firstNonEmpty([payload.businessName, payload.business, payload.Business]);
    if (normalizeText(rawBusiness) && !source.businessName) {
      warnings.push("Business name looks like a label or placeholder.");
    }
    if (source.email && source.email.indexOf("@") === -1) {
      warnings.push("Email does not look valid.");
    }
    if (source.primaryPhone && source.primaryPhone.replace(/\D/g, "").length > 0 && source.primaryPhone.replace(/\D/g, "").length < 7) {
      warnings.push("Primary phone looks too short.");
    }
    if (!source.customerName && !source.businessName) {
      warnings.push("No customer or business name to fill.");
    }
    if (!source.address1 && !normalizeText(payload.fullAddress)) {
      warnings.push("No address found.");
    }

    return {
      ok: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  function formatImportAnalysisMessage(analysis) {
    const parts = [];
    if (analysis.errors.length) {
      parts.push(analysis.errors.join(" "));
    }
    if (analysis.warnings.length) {
      parts.push(analysis.warnings.join(" "));
    }
    return parts.join(" ");
  }

  function fillFromPayload(payload, defaultMode) {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const source = buildSource(payload);
    const mode = normalizeJobDefaultMode(defaultMode);
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

    applyJobDefaultModeToSelects(selectFieldValues, mode);

    const selectOptionValues = {
      coordinator: selectFieldValues.coordinatorValue,
      reconManager: selectFieldValues.reconManagerValue
    };

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
      const ok = setSelectField(select, value, selectOptionValues[key]);
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

  function payloadTouchesAddressGrid(payload) {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const source = buildSource(payload);
    const wantBill = source.billAddress !== false && map && map.billAddress;
    return Boolean(
      source.address1 ||
        source.address2 ||
        source.city ||
        source.state ||
        source.zip ||
        source.yearBuilt ||
        source.addLocation ||
        wantBill
    );
  }

  function prepareAddressGridForEditFill(payload, done) {
    if (!isOnEditJobPage() || !payloadTouchesAddressGrid(payload)) {
      done();
      return;
    }
    const rows = orderAddressGridRows(
      Array.from(document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]'))
    );
    const visibleRow = rows.find(function isVisible(row) {
      if (row.getAttribute("data-hidden") !== null && row.getAttribute("data-hidden") !== "") {
        return false;
      }
      const style = global.getComputedStyle(row);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    if (!visibleRow) {
      done();
      return;
    }
    const rid = visibleRow.getAttribute("data-record-id") || "";
    if (!/^\d+$/.test(rid)) {
      done();
      return;
    }
    if (
      visibleRow.querySelector(
        'input[id^="value_Address1_"], input[id^="value_City_"], input[id^="value_State_"], input[id^="value_Zip_"], select[id^="value_AddLocation_"]'
      )
    ) {
      done();
      return;
    }
    const editLink = visibleRow.querySelector('a[id^="iEditLink"]');
    if (!editLink || typeof editLink.click !== "function") {
      done();
      return;
    }
    editLink.click();
    global.setTimeout(done, 220);
  }

  function loadPayloads(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null, []);
      return;
    }
    const modeKey = selectorsApi.WORKCENTER_IMPORT.jobDefaultModeKey;
    storage.get([
      selectorsApi.WORKCENTER_IMPORT.storageKey,
      selectorsApi.WORKCENTER_IMPORT.historyKey,
      modeKey,
      selectorsApi.WORKCENTER_IMPORT.reconToggleKey
    ], function onLoad(result) {
      const latest = result && result[selectorsApi.WORKCENTER_IMPORT.storageKey];
      const history = result && result[selectorsApi.WORKCENTER_IMPORT.historyKey];
      let jobDefaultMode = result && result[modeKey];
      if (!jobDefaultMode && result && result[selectorsApi.WORKCENTER_IMPORT.reconToggleKey]) {
        jobDefaultMode = "recon";
      }
      callback(
        latest || null,
        Array.isArray(history) ? history : [],
        normalizeJobDefaultMode(jobDefaultMode)
      );
    });
  }

  function saveJobDefaultMode(mode, callback) {
    const storage = getStorage();
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const normalized = normalizeJobDefaultMode(mode);
    storage.set({ [selectorsApi.WORKCENTER_IMPORT.jobDefaultModeKey]: normalized }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError, normalized);
      }
    });
  }

  function createJobDefaultModeControl(initialMode, onModeChanged) {
    const wrap = document.createElement("div");
    wrap.className = "servpro-job-default-mode";
    wrap.style.cssText = "margin-top:8px;";

    const label = document.createElement("div");
    label.textContent = "Coordinator defaults";
    label.style.cssText = "font-size:12px;color:#627d98;margin-bottom:4px;";

    const group = document.createElement("div");
    group.style.cssText =
      "display:flex;border:1px solid #c7d2da;border-radius:6px;overflow:hidden;width:100%;";

    let currentMode = normalizeJobDefaultMode(initialMode);
    const buttons = [];

    function styleBtn(btn, active) {
      btn.style.cssText = [
        "flex:1",
        "border:none",
        "padding:6px 4px",
        "font:12px/1.3 Arial,sans-serif",
        "cursor:pointer",
        active ? "background:#1976d2;color:#fff;" : "background:#f8fafc;color:#334e68;"
      ].join("");
    }

    function setMode(mode) {
      currentMode = normalizeJobDefaultMode(mode);
      buttons.forEach(function each(entry) {
        styleBtn(entry.btn, entry.mode === currentMode);
      });
      if (typeof onModeChanged === "function") {
        onModeChanged(currentMode);
      }
    }

    [
      { mode: "none", label: "Non-default" },
      { mode: "recon", label: "Default recon" },
      { mode: "mitigation", label: "Default mitigation" }
    ].forEach(function eachDef(def) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = def.label;
      btn.addEventListener("click", function onClick() {
        setMode(def.mode);
        saveJobDefaultMode(def.mode);
      });
      buttons.push({ mode: def.mode, btn: btn });
      group.appendChild(btn);
    });

    setMode(currentMode);
    wrap.appendChild(label);
    wrap.appendChild(group);

    return {
      element: wrap,
      getMode: function getMode() {
        return currentMode;
      },
      setMode: setMode
    };
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
    if (cachedSettings.hideListPanel) {
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
    if (cachedSettings.autoCollapsePanels !== false) {
      collapseControl.collapse();
    }

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

  function createPanel(isEditJob) {
    if (document.getElementById("servpro-teamallenssm-helper-panel")) {
      return;
    }
    if (cachedSettings.hideAddEditHelperPanel) {
      return;
    }

    const editJobMode = Boolean(isEditJob);
    const editJobId = editJobMode ? getEditJobIdFromSearch() : "";

    const payloadPanelApi = root.importPayloadPanel;
    let jsonEditor = null;
    let latestStoredPayload = null;

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
    titleEl.textContent = editJobMode
      ? "Import Helper — Job" + (editJobId ? " #" + editJobId : "")
      : "Import Helper";
    titleEl.style.fontWeight = "700";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "\u00d7";
    closeBtn.title = "Hide panel";
    closeBtn.style.cssText = "background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#627d98;padding:0 2px;";

    const actionRow = document.createElement("div");
    actionRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;";

    const fillButton = document.createElement("button");
    fillButton.type = "button";
    fillButton.textContent = editJobMode ? "Update from payload" : "Fill from WorkCenter payload";
    fillButton.style.cssText =
      "flex:1;min-width:140px;border:1px solid #1976d2;background:#1976d2;color:#fff;border-radius:6px;padding:6px 8px;cursor:pointer;";

    const pasteJsonButton = document.createElement("button");
    pasteJsonButton.type = "button";
    pasteJsonButton.textContent = "Paste JSON";
    pasteJsonButton.style.cssText =
      "flex:1;min-width:100px;border:1px solid #c7d2da;background:#fff;color:#334e68;border-radius:6px;padding:6px 8px;cursor:pointer;";

    const copyJobButton = document.createElement("button");
    copyJobButton.type = "button";
    copyJobButton.textContent = "Copy current job to payload";
    copyJobButton.style.cssText =
      "border:1px solid #c7d2da;background:#fff;color:#334e68;border-radius:6px;padding:6px 8px;cursor:pointer;margin-top:6px;width:100%;";
    if (!editJobMode || cachedSettings.showEditCopyButton === false) {
      copyJobButton.style.display = "none";
    }

    const historyLabel = document.createElement("div");
    historyLabel.textContent = "Choose scraped record:";
    historyLabel.style.marginTop = "8px";

    const historySelect = document.createElement("select");
    historySelect.style.cssText = "width:100%;margin-top:4px;padding:6px;border:1px solid #c7d2da;border-radius:6px;background:#fff;";

    let jobDefaultModeControl = null;

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

    copyJobButton.addEventListener("click", function onCopyJob() {
      const scraped = scrapePayloadFromPage();
      const json = JSON.stringify(scraped, null, 2);
      savePayload(scraped, function onSaved(ok) {
        if (jsonEditor) {
          jsonEditor.setPayload(scraped, { expand: true });
        }
        latestStoredPayload = scraped;
        loadPayloads(function onReload(latest, history) {
          populateHistory(history, latest);
        });
        copyTextToClipboard(json, function onCopied(copied) {
          setStatus(
            (ok ? "Job saved to payload history." : "Failed to save to history.") +
              (copied ? " JSON copied to clipboard." : " Could not copy JSON to clipboard.")
          );
        });
      });
    });

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
        enablePaste: true,
        pastePlacement: "inline",
        analyzePayload: analyzeImportPayload,
        getBaselinePayload: function getBaseline() {
          return latestStoredPayload;
        },
        onStatus: setStatus,
        onSave: function onSavePayload(payload, done) {
          savePayload(payload, function onSaved(ok) {
            if (ok) {
              latestStoredPayload = payload;
            }
            done(ok, ok ? "Payload saved." : "Failed to save payload.");
          });
        }
      });
    }

    pasteJsonButton.addEventListener("click", function onPasteJson() {
      if (jsonEditor && jsonEditor.pasteFromClipboard) {
        jsonEditor.pasteFromClipboard();
      }
    });

    fillButton.addEventListener("click", function onFill() {
      loadPayloads(function onLoaded(latest, history, storedJobDefaultMode) {
        populateHistory(history, latest);
        if (latest) {
          latestStoredPayload = latest;
        }

        let payload = null;
        const editorHasText = jsonEditor && payloadPanelApi && normalizeText(jsonEditor.getText());
        const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };

        if (editorHasText) {
          if (!editorParsed.ok) {
            jsonEditor.setJsonError(editorParsed.error);
            setStatus(editorParsed.error);
            return;
          }
          const analysis = analyzeImportPayload(editorParsed.payload);
          if (!analysis.ok) {
            const msg = formatImportAnalysisMessage(analysis);
            jsonEditor.setJsonError(analysis.errors.join(" "));
            setStatus(msg);
            return;
          }
          if (analysis.warnings.length) {
            jsonEditor.setJsonError(analysis.warnings.join(" "), true);
          } else if (jsonEditor.setJsonError) {
            jsonEditor.setJsonError("");
          }
          payload = editorParsed.payload;
        } else if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
          payload = history[selectedHistoryIndex];
        } else if (latest) {
          payload = latest;
        } else if (history.length) {
          payload = history[0];
        }

        const defaultMode = jobDefaultModeControl
          ? jobDefaultModeControl.getMode()
          : normalizeJobDefaultMode(storedJobDefaultMode || cachedSettings.defaultJobModeOnFill);
        if (!payload) {
          setStatus("No payload to fill. Paste JSON, save a payload, or scrape on WorkCenter first.");
          return;
        }

        prepareAddressGridForEditFill(payload, function afterAddressPrepare() {
          const fillResult = fillFromPayload(payload, defaultMode);
          const staleMessage = getStalenessMessage(payload);
          const missingText = fillResult.missing.length ? " Missing: " + fillResult.missing.join(", ") + "." : "";
          const addressText = fillResult.addressSummary ? " Address: " + fillResult.addressSummary + "." : "";
          setStatus(
            "Filled " + fillResult.filled + " fields." +
            addressText +
            staleMessage +
            " History: " + history.length + "/5." +
            missingText +
            (editJobMode ? " Use Save or Save & Exit on this page when done." : "")
          );
        });
      });
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    actionRow.appendChild(fillButton);
    actionRow.appendChild(pasteJsonButton);

    panel.appendChild(header);
    panel.appendChild(actionRow);
    panel.appendChild(copyJobButton);
    panel.appendChild(historyLabel);
    panel.appendChild(historySelect);
    panel.appendChild(status);
    if (jsonEditor) {
      panel.appendChild(jsonEditor.element);
    }
    document.body.appendChild(panel);

    const collapseControl = makeCollapsible(panel, "SP Helper \u25b2");
    closeBtn.addEventListener("click", function onClose() {
      collapseControl.collapse();
    });
    if (cachedSettings.autoCollapsePanels !== false) {
      collapseControl.collapse();
    }

    loadPayloads(function initHistory(latest, history, storedJobDefaultMode) {
      latestStoredPayload = latest || null;
      populateHistory(history, latest);
      loadPayloadForEditor(latest, history);
      const initialMode = normalizeJobDefaultMode(
        storedJobDefaultMode || cachedSettings.defaultJobModeOnFill
      );
      jobDefaultModeControl = createJobDefaultModeControl(initialMode);
      panel.insertBefore(jobDefaultModeControl.element, status);
      if (history.length || latest) {
        setStatus(editJobMode ? "Ready. Paste JSON or click Update." : "Ready. Paste JSON or click Fill.");
      } else {
        setStatus(
          editJobMode
            ? "Ready. Paste JSON from WorkCenter or scrape there first, then click Update."
            : "Ready. Paste JSON from WorkCenter or scrape there first."
        );
      }
      if (!editJobMode) {
        tryPendingFnolAutoSubmit(setStatus);
      }
    });
  }

  function boot() {
    if (isOnAddJobPage()) {
      if (!cachedSettings.hideAddEditHelperPanel) {
        createPanel(false);
      } else {
        tryPendingFnolAutoSubmit(null);
      }
    } else if (isOnEditJobPage()) {
      if (!cachedSettings.hideAddEditHelperPanel) {
        createPanel(true);
      }
    } else if (isOnListPage()) {
      createListPagePanel();
    }
  }

  function registerStorageListener() {
    if (!getStorage() || !settingsApi) {
      return;
    }
    chrome.storage.onChanged.addListener(function onStorageChanged(changes, areaName) {
      if (areaName !== "local") {
        return;
      }
      if (changes[settingsApi.SETTINGS_KEY]) {
        cachedSettings = settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue);
        const listPanel = document.getElementById("servpro-teamallenssm-list-panel");
        const helperPanel = document.getElementById("servpro-teamallenssm-helper-panel");
        if (!isTeamAllenFeatureEnabled()) {
          if (listPanel) {
            listPanel.remove();
          }
          if (helperPanel) {
            helperPanel.remove();
          }
          return;
        }
        if (cachedSettings.hideListPanel && listPanel) {
          listPanel.remove();
        }
        if (cachedSettings.hideAddEditHelperPanel && helperPanel) {
          helperPanel.remove();
        }
      }
    });
  }

  function start() {
    loadSettings(function onSettings() {
      if (!isTeamAllenFeatureEnabled()) {
        return;
      }
      registerStorageListener();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      } else {
        boot();
      }
    });
  }

  start();
})(window);
