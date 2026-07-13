(function initFnolPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const selectorsApi = window.ServproUploadExtension && window.ServproUploadExtension.selectors;
  const catalogApi = window.ServproUploadExtension && window.ServproUploadExtension.fnolFieldCatalog;
  const fnolNotesApi = window.ServproUploadExtension && window.ServproUploadExtension.fnolNotes;
  const plainTextApi = window.ServproUploadExtension && window.ServproUploadExtension.payloadPlainText;
  const googleFormApi =
    window.ServproUploadExtension && window.ServproUploadExtension.googleFormTeamAllen;
  const hintsApi = window.ServproUploadExtension && window.ServproUploadExtension.buttonHints;
  const WORKCENTER_IMPORT =
    (selectorsApi && selectorsApi.WORKCENTER_IMPORT) || {
      storageKey: "servproUploadHelper.workcenterPayload",
      historyKey: "servproUploadHelper.workcenterPayloadHistory",
      fnolRegistryKey: "servproUploadHelper.fnolRegistry",
      fnolRegistryMax: 30,
      maxHistory: 5,
      teamallenssmAddUrl: "https://teamallenssm.com/jobs1_add.php?",
      teamallenssmListUrl: "https://teamallenssm.com/jobs1_list.php?page=listJobs"
    };
  const TEAMALLEN_LOSS_TYPES = (selectorsApi && selectorsApi.TEAMALLEN_LOSS_TYPES) || [];

  const openSettingsLink = document.getElementById("openSettingsLink");
  const lockedSettingsLink = document.getElementById("lockedSettingsLink");
  const fnolFormPanel = document.getElementById("fnolFormPanel");
  const fnolLockedOverlay = document.getElementById("fnolLockedOverlay");
  const fnolLockedMessage = document.getElementById("fnolLockedMessage");
  const fnolTrialUpsell = document.getElementById("fnolTrialUpsell");
  const fnolTrialUpsellEmail = document.getElementById("fnolTrialUpsellEmail");
  const fnolAccessCode = document.getElementById("fnolAccessCode");
  const fnolUnlockBtn = document.getElementById("fnolUnlockBtn");
  const fnolUnlockStatus = document.getElementById("fnolUnlockStatus");
  const fnolForm = document.getElementById("fnolForm");
  const fnolCustomer = document.getElementById("fnolCustomer");
  const fnolSubmitBtn = document.getElementById("fnolSubmitBtn");
  const fnolNewEntryBtn = document.getElementById("fnolNewEntryBtn");
  const fnolClearBtn = document.getElementById("fnolClearBtn");
  const fnolCopyPlainBtn = document.getElementById("fnolCopyPlainBtn");
  const fnolCopyCalendarTitleBtn = document.getElementById("fnolCopyCalendarTitleBtn");
  const fnolCopyJsonBtn = document.getElementById("fnolCopyJsonBtn");
  const fnolLoadFromScrapeBtn = document.getElementById("fnolLoadFromScrapeBtn");
  const fnolLossType = document.getElementById("fnolLossType");
  const fnolJobList = document.getElementById("fnolJobList");
  const fnolJobEmpty = document.getElementById("fnolJobEmpty");
  const fnolStatus = document.getElementById("fnolStatus");
  const fnolNotesInput = document.getElementById("fnolNotes");
  const fnolNotesCounter = document.getElementById("fnolNotesCounter");
  const fnolNotesHint = document.getElementById("fnolNotesHint");
  const fnolOptionalSection = document.getElementById("fnolOptionalSection");
  const fnolOptionalFields = document.getElementById("fnolOptionalFields");
  const fnolCustomSection = document.getElementById("fnolCustomSection");
  const fnolCustomFields = document.getElementById("fnolCustomFields");
  const fnolAdvancedPanel = document.getElementById("fnolAdvancedPanel");
  const fnolAdvancedToggleBtn = document.getElementById("fnolAdvancedToggleBtn");
  const fnolAdvancedBody = document.getElementById("fnolAdvancedBody");
  const fnolPageAdvancedEnabled = document.getElementById("fnolPageAdvancedEnabled");
  const fnolPageAdvancedControls = document.getElementById("fnolPageAdvancedControls");
  const fnolPageNotesMaxLength = document.getElementById("fnolPageNotesMaxLength");
  const fnolPageActivePresetId = document.getElementById("fnolPageActivePresetId");
  const fnolPagePresetName = document.getElementById("fnolPagePresetName");
  const fnolPagePresetDuplicateBtn = document.getElementById("fnolPagePresetDuplicateBtn");
  const fnolPagePresetDeleteBtn = document.getElementById("fnolPagePresetDeleteBtn");
  const fnolPageDefaultsGrid = document.getElementById("fnolPageDefaultsGrid");
  const fnolPageVisibleFields = document.getElementById("fnolPageVisibleFields");
  const fnolPageCustomFieldsEditor = document.getElementById("fnolPageCustomFieldsEditor");
  const fnolPageCustomFieldAddBtn = document.getElementById("fnolPageCustomFieldAddBtn");
  let effectiveNotesMax =
    fnolNotesApi && fnolNotesApi.NOTES_MAX_LENGTH ? fnolNotesApi.NOTES_MAX_LENGTH : 500;
  let advUiReady = false;
  let suppressAdvReload = false;
  let workingPresets = [];
  let workingActivePresetId = "default";
  let workingNotesMax = 500;
  let workingAdvancedEnabled = false;

  const fieldsApi = window.ServproUploadExtension && window.ServproUploadExtension.workcenterFields;
  const fnolAddressLookupPanel = document.getElementById("fnolAddressLookupPanel");
  const fnolAddressLookupPaste = document.getElementById("fnolAddressLookupPaste");
  const fnolAddressLookupPasteClipboardBtn = document.getElementById("fnolAddressLookupPasteClipboardBtn");
  const fnolAddressLookupFillBtn = document.getElementById("fnolAddressLookupFillBtn");

  const initialsDialog = document.getElementById("initialsDialog");
  const initialsInput = document.getElementById("initialsInput");
  const initialsConfirmBtn = document.getElementById("initialsConfirmBtn");
  const initialscancelBtn = document.getElementById("initialscancelBtn");

  let fnolRegistryCache = [];
  let activeJobIndex = -1;

  // ── Intake-initials quick dialog ────────────────────────────────────────────
  function openInitialsDialog(onConfirm) {
    if (!initialsDialog) {
      return;
    }
    initialsDialog.hidden = false;
    if (initialsInput) {
      initialsInput.value = "";
      initialsInput.focus();
    }

    function handleConfirm() {
      const value = initialsInput ? initialsInput.value.trim() : "";
      if (!value) {
        if (initialsInput) {
          initialsInput.focus();
        }
        return;
      }
      closeInitialsDialog();
      settingsApi.getSettings(function onGot(stored) {
        const merged = settingsApi.mergeSettings(stored);
        merged.fnolIntakeInitials = value;
        settingsApi.saveSettings(merged, function onSaved() {
          onConfirm(value);
        });
      });
    }

    function handleCancel() {
      closeInitialsDialog();
    }

    function handleKeydown(e) {
      if (e.key === "Enter") {
        handleConfirm();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    }

    if (initialsConfirmBtn) {
      initialsConfirmBtn.onclick = handleConfirm;
    }
    if (initialscancelBtn) {
      initialscancelBtn.onclick = handleCancel;
    }
    if (initialsInput) {
      initialsInput.onkeydown = handleKeydown;
    }
  }

  function closeInitialsDialog() {
    if (initialsDialog) {
      initialsDialog.hidden = true;
    }
    if (initialsConfirmBtn) {
      initialsConfirmBtn.onclick = null;
    }
    if (initialscancelBtn) {
      initialscancelBtn.onclick = null;
    }
    if (initialsInput) {
      initialsInput.onkeydown = null;
    }
  }

  function optionsUrl() {
    return chrome.runtime.getURL("options.html");
  }

  function openSettings(e) {
    if (e) {
      e.preventDefault();
    }
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: optionsUrl() });
    }
  }

  if (openSettingsLink) {
    openSettingsLink.href = optionsUrl();
    openSettingsLink.addEventListener("click", openSettings);
  }
  if (lockedSettingsLink) {
    lockedSettingsLink.href = optionsUrl();
    lockedSettingsLink.addEventListener("click", openSettings);
  }

  function setStatus(message, kind) {
    if (!fnolStatus) {
      return;
    }
    fnolStatus.textContent = message || "";
    fnolStatus.className = "status" + (kind ? " " + kind : "");
  }

  function setUnlockStatus(message, kind) {
    if (!fnolUnlockStatus) {
      return;
    }
    fnolUnlockStatus.textContent = message || "";
    fnolUnlockStatus.className = "status" + (kind ? " " + kind : "");
  }

  function focusFirstField() {
    if (fnolCustomer && typeof fnolCustomer.focus === "function") {
      try {
        fnolCustomer.focus();
      } catch (e) {
        /* ignore focus errors */
      }
    }
  }

  function updateSubmitButtonLabel(settings) {
    if (!fnolSubmitBtn) {
      return;
    }
    const handler = settingsApi.getSubmitHandler ? settingsApi.getSubmitHandler(settings) : "generic";
    fnolSubmitBtn.textContent = handler === "teamallenssm" ? "Submit" : "Save";
    if (hintsApi && hintsApi.applySubmitHint) {
      hintsApi.applySubmitHint(fnolSubmitBtn, settings, settingsApi);
    }
  }

  function initFnolButtonHints() {
    if (!hintsApi || !hintsApi.applyButtonHint) {
      return;
    }
    const apply = hintsApi.applyButtonHint;
    apply(fnolClearBtn, "fnolClearForm");
    apply(fnolCopyPlainBtn, "fnolCopyPlain");
    apply(fnolCopyJsonBtn, "fnolCopyJson");
    apply(fnolLoadFromScrapeBtn, "fnolLoadFromScrape");
    apply(fnolAddressLookupPasteClipboardBtn, "fnolAddressLookupPasteClipboard");
    apply(fnolAddressLookupFillBtn, "fnolAddressLookupFill");
    apply(fnolNewEntryBtn, "fnolNewJob");
    apply(fnolUnlockBtn, "fnolUnlock");
    apply(openSettingsLink, "fnolOpenSettings");
    apply(lockedSettingsLink, "fnolOpenSettings");
    apply(fnolNotesInput, "fnolNotes");
    settingsApi.getSettings(function onLoaded(settings) {
      if (hintsApi.applySubmitHint) {
        hintsApi.applySubmitHint(fnolSubmitBtn, settings, settingsApi);
      }
    });
  }

  function normalizeLookupQuery(value) {
    return String(value || "").replace(/[\u00a0\s]+/g, " ").trim();
  }

  function updateAddressLookupVisibility(settings) {
    if (!fnolAddressLookupPanel) {
      return;
    }
    const enabled = Boolean(settings && settings.fnolAddressLookupHelper);
    fnolAddressLookupPanel.hidden = !enabled;
  }

  function clearAddressLookupInputs() {
    if (fnolAddressLookupPaste) {
      fnolAddressLookupPaste.value = "";
    }
  }

  function applyParsedAddress(parsed) {
    if (!fnolForm || !parsed) {
      return false;
    }
    const mapping = [
      ["address1", "fnolAddress1"],
      ["city", "fnolCity"],
      ["state", "fnolState"],
      ["zip", "fnolZip"]
    ];
    let filled = 0;
    mapping.forEach(function eachField(key) {
      const fieldKey = key[0];
      const elId = key[1];
      const value = normalizeLookupQuery(parsed[fieldKey]);
      if (!value) {
        return;
      }
      const el = document.getElementById(elId);
      if (el) {
        el.value = value;
        filled += 1;
      }
    });
    return filled > 0;
  }

  function fillAddressFromLookupPaste() {
    const parseAddress = fieldsApi && fieldsApi.parseAddress;
    if (!parseAddress || !fnolAddressLookupPaste) {
      setStatus("Address parser is not available.", "error");
      return;
    }
    const raw = normalizeLookupQuery(fnolAddressLookupPaste.value);
    if (!raw) {
      setStatus("Paste a full address first.", "error");
      return;
    }
    const parsed = parseAddress(raw);
    if (!applyParsedAddress(parsed)) {
      setStatus("Could not parse address. Use format: Street, City, ST 12345", "error");
      return;
    }
    setStatus("Address fields filled. Review and edit if needed.", "ok");
  }

  function initAddressLookup() {
    if (fnolAddressLookupPasteClipboardBtn) {
      fnolAddressLookupPasteClipboardBtn.addEventListener("click", function onPasteClipboard() {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          setStatus("Clipboard read is not available.", "error");
          return;
        }
        navigator.clipboard.readText().then(function onRead(text) {
          if (fnolAddressLookupPaste) {
            fnolAddressLookupPaste.value = normalizeLookupQuery(text);
          }
          setStatus("Pasted from clipboard.", "ok");
        }).catch(function onFail() {
          setStatus("Could not read clipboard. Paste manually (Ctrl+V).", "error");
        });
      });
    }
    if (fnolAddressLookupFillBtn) {
      fnolAddressLookupFillBtn.addEventListener("click", fillAddressFromLookupPaste);
    }

    settingsApi.getSettings(function onLoaded(settings) {
      updateAddressLookupVisibility(settings);
    });
  }

  function updateLockedMessage(settings) {
    if (!fnolLockedMessage || !settings) {
      return;
    }
    const email = settingsApi.CONTACT_EMAIL || "Ceoturobov@gmail.com";
    if (settingsApi.isTrialExpiredTier && settingsApi.isTrialExpiredTier(settings)) {
      fnolLockedMessage.textContent =
        "Your trial has expired. Email " + email + " for full access.";
    } else {
      fnolLockedMessage.textContent = "You require an access code for the intake.";
    }
  }

  function updateTrialUpsell(settings) {
    if (!fnolTrialUpsell) {
      return;
    }
    const showTrial = Boolean(settings && settingsApi.isTrialActivated(settings));
    fnolTrialUpsell.hidden = !showTrial;
    const email = settingsApi.CONTACT_EMAIL || "Ceoturobov@gmail.com";
    if (fnolTrialUpsellEmail) {
      fnolTrialUpsellEmail.href = "mailto:" + email + "?subject=" +
        encodeURIComponent("ServPro Helper — Full access / Google Form setup");
      fnolTrialUpsellEmail.textContent = email;
    }
  }

  function setActivated(activated, options, settings) {
    const wasLocked = fnolFormPanel && fnolFormPanel.classList.contains("is-locked");
    if (fnolFormPanel) {
      fnolFormPanel.classList.toggle("is-locked", !activated);
    }
    if (fnolLockedOverlay) {
      fnolLockedOverlay.classList.toggle("is-active", !activated);
    }
    if (!activated && settings) {
      updateLockedMessage(settings);
    }
    updateTrialUpsell(settings);
    if (activated) {
      if (fnolAccessCode) {
        fnolAccessCode.value = "";
      }
      setUnlockStatus("");
      if ((options && options.focus) || wasLocked) {
        focusFirstField();
      }
    }
    if (settings) {
      updateSubmitButtonLabel(settings);
      updateAddressLookupVisibility(settings);
      updateAdvancedPanelVisibility(settings);
    } else {
      settingsApi.getSettings(function onLoadedForLabel(s) {
        updateSubmitButtonLabel(s);
        updateTrialUpsell(s);
        updateAdvancedPanelVisibility(s);
      });
    }
  }

  function readActivationFromStorage(callback) {
    if (!chrome.storage || !chrome.storage.local) {
      callback(false, settingsApi.mergeSettings(null));
      return;
    }
    chrome.storage.local.get([settingsApi.SETTINGS_KEY], function onLoad(result) {
      const settings = settingsApi.mergeSettings(result && result[settingsApi.SETTINGS_KEY]);
      callback(settingsApi.isFnolAccessible(settings), settings);
    });
  }

  function tryUnlockFromFnol() {
    if (!fnolAccessCode || !fnolUnlockBtn) {
      return;
    }
    const code = fnolAccessCode.value;
    fnolUnlockBtn.disabled = true;
    setUnlockStatus("Checking code…");
    settingsApi.activateWithCode(code, function onDone(ok, settings) {
      fnolUnlockBtn.disabled = false;
      if (ok) {
        setUnlockStatus("Access enabled.", "ok");
        if (fnolAccessCode) {
          fnolAccessCode.value = "";
        }
        setActivated(true, { focus: true }, settings);
        setStatus("");
        return;
      }
      setUnlockStatus("Invalid code. Use the same code as in Settings.", "error");
      setActivated(settingsApi.isFnolAccessible(settings), null, settings);
    });
  }

  function upsertPayloadHistory(payload, callback) {
    chrome.storage.local.get([WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = Array.isArray(result && result[WORKCENTER_IMPORT.historyKey])
        ? result[WORKCENTER_IMPORT.historyKey]
        : [];
      const deduped = history.filter(function keep(item) {
        if (!item || !payload) {
          return Boolean(item);
        }
        if (item.sourceUrl === payload.sourceUrl && item.fnolId && item.fnolId === payload.fnolId) {
          return false;
        }
        return true;
      });
      deduped.unshift(payload);
      chrome.storage.local.set(
        {
          [WORKCENTER_IMPORT.storageKey]: payload,
          [WORKCENTER_IMPORT.historyKey]: deduped.slice(0, WORKCENTER_IMPORT.maxHistory)
        },
        function onSaved() {
          callback(!chrome.runtime.lastError);
        }
      );
    });
  }

  function populateFnolLossTypes() {
    if (!fnolLossType || !TEAMALLEN_LOSS_TYPES.length) {
      return;
    }
    TEAMALLEN_LOSS_TYPES.forEach(function eachType(entry) {
      const opt = document.createElement("option");
      opt.value = entry.value;
      opt.textContent = entry.label;
      fnolLossType.appendChild(opt);
    });
  }

  function setSelectByLabelOrValue(selectEl, label, value) {
    if (!selectEl) {
      return;
    }
    const targetLabel = String(label || "").trim().toUpperCase();
    const targetValue = String(value || "").trim();
    for (let i = 0; i < selectEl.options.length; i += 1) {
      const opt = selectEl.options[i];
      if (targetValue && opt.value === targetValue) {
        selectEl.selectedIndex = i;
        return;
      }
      if (targetLabel && String(opt.textContent || "").trim().toUpperCase() === targetLabel) {
        selectEl.selectedIndex = i;
        return;
      }
    }
  }

  function applyPayloadToFnolForm(payload) {
    if (!payload || !fnolForm) {
      return;
    }
    const fields = [
      "customerName",
      "businessName",
      "primaryPhone",
      "secondaryPhone",
      "email",
      "propertyType",
      "payType",
      "businessUnit",
      "coordinator",
      "jobStatus",
      "address1",
      "address2",
      "city",
      "state",
      "zip",
      "insuranceCarrier",
      "claimNumber",
      "adjusterName",
      "adjusterPhone",
      "adjusterEmail",
      "projectManager",
      "reconManager",
      "yearBuilt",
      "policyNumber",
      "deductible",
      "secondaryEmail",
      "causeOfLoss",
      "dateOfLoss"
    ];
    fields.forEach(function eachName(name) {
      const el = fnolForm.elements.namedItem(name);
      if (!el || payload[name] === undefined || payload[name] === null) {
        return;
      }
      el.value = payload[name];
      if (el.tagName === "SELECT" && el.value !== String(payload[name])) {
        const target = String(payload[name]).toLowerCase().trim();
        const matching = Array.from(el.options).find(function findOpt(opt) {
          return opt.textContent.toLowerCase().trim() === target;
        });
        if (matching) {
          el.value = matching.value;
        }
      }
    });
    if (payload.coordinatorValue) {
      const coordEl = fnolForm.elements.namedItem("coordinator");
      if (coordEl && coordEl.tagName === "SELECT") {
        coordEl.value = payload.coordinatorValue;
      }
    }
    setSelectByLabelOrValue(fnolLossType, payload.lossType, payload.lossTypeValue);
    const notesEl = fnolForm.elements.namedItem("notesUser");
    if (notesEl) {
      notesEl.value = payload.notesUser || payload.notes || "";
    }
    if (Array.isArray(payload.fnolCustomFields)) {
      payload.fnolCustomFields.forEach(function eachCustom(item) {
        if (!item || !item.key) {
          return;
        }
        const el = fnolForm.elements.namedItem(item.key);
        if (el && item.value != null) {
          el.value = item.value;
        }
      });
    } else if (payload.custom && typeof payload.custom === "object") {
      Object.keys(payload.custom).forEach(function eachKey(key) {
        const el = fnolForm.elements.namedItem(key);
        if (el) {
          el.value = payload.custom[key];
        }
      });
    }
    updateFnolNotesCounter();
  }

  function readFnolFormAdjuster() {
    const data = new FormData(fnolForm);
    return {
      adjusterName: String(data.get("adjusterName") || "").trim(),
      adjusterPhone: String(data.get("adjusterPhone") || "").trim(),
      adjusterEmail: String(data.get("adjusterEmail") || "").trim()
    };
  }

  function readSelectLabelAndValue(name) {
    const el = fnolForm && fnolForm.elements.namedItem(name);
    if (!el || el.tagName !== "SELECT") {
      return { label: "", value: "" };
    }
    const opt = el.options[el.selectedIndex];
    return {
      value: String(el.value || "").trim(),
      label: opt ? String(opt.textContent || "").trim() : ""
    };
  }

  function buildFnolPayload(options) {
    const opts = options || {};
    const data = new FormData(fnolForm);
    const loss = readSelectLabelAndValue("lossType");
    const coordinator = readSelectLabelAndValue("coordinator");
    const notesUser = String(data.get("notesUser") || "").trim();
    const adjuster = readFnolFormAdjuster();
    const mergedNotes = fnolNotesApi
      ? fnolNotesApi.buildFnolNotes(notesUser, adjuster)
      : notesUser;

    const payload = {
      customerName: String(data.get("customerName") || "").trim(),
      businessName: String(data.get("businessName") || "").trim(),
      primaryPhone: String(data.get("primaryPhone") || "").trim(),
      secondaryPhone: String(data.get("secondaryPhone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      claimNumber: String(data.get("claimNumber") || "").trim(),
      propertyType: String(data.get("propertyType") || "").trim(),
      payType: String(data.get("payType") || "").trim(),
      lossType: loss.label || loss.value,
      lossTypeValue: loss.value,
      businessUnit: String(data.get("businessUnit") || "").trim(),
      address1: String(data.get("address1") || "").trim(),
      address2: String(data.get("address2") || "").trim(),
      city: String(data.get("city") || "").trim(),
      state: String(data.get("state") || "").trim(),
      zip: String(data.get("zip") || "").trim(),
      insuranceCarrier: String(data.get("insuranceCarrier") || "").trim(),
      jobStatus: String(data.get("jobStatus") || "").trim(),
      coordinator: coordinator.label || coordinator.value,
      coordinatorValue: coordinator.value,
      adjusterName: adjuster.adjusterName,
      adjusterPhone: adjuster.adjusterPhone,
      adjusterEmail: adjuster.adjusterEmail,
      notesUser: notesUser,
      notes: mergedNotes,
      billAddress: true,
      source: "fnol",
      fnolId: opts.fnolId || "fnol-" + Date.now(),
      sourceUrl: "fnol://local",
      scrapedAt: new Date().toISOString()
    };

    const optionalKeys = [
      "projectManager",
      "reconManager",
      "yearBuilt",
      "policyNumber",
      "deductible",
      "secondaryEmail",
      "causeOfLoss",
      "dateOfLoss"
    ];
    optionalKeys.forEach(function eachOptional(key) {
      const el = fnolForm.elements.namedItem(key);
      if (!el) {
        return;
      }
      const value = String(data.get(key) || "").trim();
      if (value) {
        payload[key] = value;
      }
    });

    const customMeta = [];
    const customMap = {};
    if (fnolCustomFields) {
      Array.prototype.forEach.call(
        fnolCustomFields.querySelectorAll("[data-custom-key]"),
        function eachCustom(input) {
          const key = input.getAttribute("data-custom-key");
          const label = input.getAttribute("data-custom-label") || key;
          if (!key) {
            return;
          }
          const value = String(input.value || "").trim();
          if (!value) {
            return;
          }
          customMap[key] = value;
          payload[key] = value;
          customMeta.push({ key: key, label: label, value: value });
        }
      );
    }
    if (customMeta.length) {
      payload.custom = customMap;
      payload.fnolCustomFields = customMeta;
    }

    if (payload.propertyType) {
      const isCommercial = payload.propertyType.indexOf("Commercial") !== -1;
      payload.addLocation = isCommercial ? "Commercial" : "Residence";
      payload.addLocationValue = isCommercial ? "2" : "1";
    }
    return payload;
  }

  function buildPendingNotesContext(payload) {
    const source = payload || {};
    return {
      fnolId: String(source.fnolId || "").trim(),
      claimNumber: String(source.claimNumber || "").replace(/\s+/g, "").toLowerCase(),
      customerName: String(source.customerName || "").replace(/\s+/g, " ").trim().toLowerCase(),
      address1: String(source.address1 || "").replace(/\s+/g, " ").trim().toLowerCase(),
      sourceUrl: String(source.sourceUrl || "").trim(),
      scrapedAt: String(source.scrapedAt || "")
    };
  }

  function formatEnteredTime(savedAt) {
    if (!savedAt) {
      return "";
    }
    try {
      return new Date(savedAt).toLocaleString();
    } catch (error) {
      return String(savedAt);
    }
  }

  function jobMetaLine(payload) {
    const parts = [];
    if (payload && payload.lossType) {
      parts.push(payload.lossType);
    }
    if (payload && payload.claimNumber) {
      parts.push("Claim " + payload.claimNumber);
    }
    return parts.join(" · ");
  }

  function setActiveJobIndex(index) {
    activeJobIndex = index;
    if (!fnolJobList) {
      return;
    }
    Array.from(fnolJobList.querySelectorAll(".fnol-job-item")).forEach(function eachItem(el) {
      const idx = Number(el.getAttribute("data-index"));
      el.classList.toggle("is-active", idx === activeJobIndex);
    });
  }

  function renderJobList(registry, highlightIndex) {
    fnolRegistryCache = Array.isArray(registry) ? registry : [];
    if (!fnolJobList || !fnolJobEmpty) {
      return;
    }

    fnolJobList.innerHTML = "";

    if (!fnolRegistryCache.length) {
      fnolJobEmpty.hidden = false;
      fnolJobList.hidden = true;
      activeJobIndex = -1;
      return;
    }

    fnolJobEmpty.hidden = true;
    fnolJobList.hidden = false;

    fnolRegistryCache.forEach(function eachEntry(entry, index) {
      const payload = entry.payload || {};
      const li = document.createElement("li");
      li.className = "fnol-job-item";
      li.setAttribute("data-index", String(index));
      if (index === highlightIndex || (highlightIndex === undefined && index === activeJobIndex)) {
        li.classList.add("is-active");
      }

      const body = document.createElement("div");
      body.className = "fnol-job-body";

      const name = document.createElement("p");
      name.className = "fnol-job-name";
      name.textContent = payload.customerName || entry.label || "FNOL entry";

      const time = document.createElement("p");
      time.className = "fnol-job-time";
      time.textContent = "Entered: " + formatEnteredTime(entry.savedAt);

      const meta = document.createElement("p");
      meta.className = "fnol-job-meta";
      const metaText = jobMetaLine(payload);
      meta.textContent = metaText;
      meta.hidden = !metaText;

      body.appendChild(name);
      body.appendChild(time);
      if (metaText) {
        body.appendChild(meta);
      }

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "fnol-job-delete";
      delBtn.textContent = "Delete";
      delBtn.setAttribute("aria-label", "Delete entry");
      if (hintsApi && hintsApi.applyButtonHint) {
        hintsApi.applyButtonHint(delBtn, "fnolDeleteJob");
      }
      delBtn.addEventListener("click", function onDelete(e) {
        e.stopPropagation();
        const next = fnolRegistryCache.filter(function keep(_, i) {
          return i !== index;
        });
        saveFnolRegistry(next, function onSaved(ok) {
          if (ok && activeJobIndex === index) {
            activeJobIndex = -1;
            fnolForm.reset();
          }
          setStatus(ok ? "Entry deleted." : "Failed to delete entry.", ok ? "ok" : "error");
        });
      });

      li.addEventListener("click", function onSelect() {
        if (fnolFormPanel && fnolFormPanel.classList.contains("is-locked")) {
          setStatus("You require an access code for the intake.", "error");
          if (fnolAccessCode) {
            fnolAccessCode.focus();
          }
          return;
        }
        setActiveJobIndex(index);
        applyPayloadToFnolForm(fnolRegistryCache[index].payload);
        setStatus("Loaded into form.", "ok");
      });

      li.appendChild(body);
      li.appendChild(delBtn);
      fnolJobList.appendChild(li);
    });

    if (typeof highlightIndex === "number" && highlightIndex >= 0) {
      setActiveJobIndex(highlightIndex);
    }
  }

  function loadFnolRegistry(callback) {
    chrome.storage.local.get([WORKCENTER_IMPORT.fnolRegistryKey], function onLoad(result) {
      const registry = result && result[WORKCENTER_IMPORT.fnolRegistryKey];
      renderJobList(Array.isArray(registry) ? registry : []);
      if (typeof callback === "function") {
        callback(fnolRegistryCache);
      }
    });
  }

  function saveFnolRegistry(registry, callback) {
    const max = WORKCENTER_IMPORT.fnolRegistryMax || 30;
    const trimmed = registry.slice(0, max);
    chrome.storage.local.set({ [WORKCENTER_IMPORT.fnolRegistryKey]: trimmed }, function onSaved() {
      renderJobList(trimmed, activeJobIndex >= 0 ? activeJobIndex : undefined);
      if (typeof callback === "function") {
        callback(!chrome.runtime.lastError);
      }
    });
  }

  function upsertFnolRegistry(importPayload, callback) {
    const entry = {
      fnolId: importPayload.fnolId,
      savedAt: new Date().toISOString(),
      label: importPayload.customerName || "FNOL entry",
      payload: {
        customerName: importPayload.customerName,
        businessName: importPayload.businessName,
        primaryPhone: importPayload.primaryPhone,
        secondaryPhone: importPayload.secondaryPhone,
        email: importPayload.email,
        claimNumber: importPayload.claimNumber,
        propertyType: importPayload.propertyType,
        payType: importPayload.payType,
        lossType: importPayload.lossType,
        lossTypeValue: importPayload.lossTypeValue,
        businessUnit: importPayload.businessUnit,
        address1: importPayload.address1,
        address2: importPayload.address2,
        city: importPayload.city,
        state: importPayload.state,
        zip: importPayload.zip,
        insuranceCarrier: importPayload.insuranceCarrier,
        jobStatus: importPayload.jobStatus,
        coordinator: importPayload.coordinator,
        coordinatorValue: importPayload.coordinatorValue,
        projectManager: importPayload.projectManager,
        reconManager: importPayload.reconManager,
        yearBuilt: importPayload.yearBuilt,
        policyNumber: importPayload.policyNumber,
        deductible: importPayload.deductible,
        secondaryEmail: importPayload.secondaryEmail,
        causeOfLoss: importPayload.causeOfLoss,
        dateOfLoss: importPayload.dateOfLoss,
        adjusterName: importPayload.adjusterName,
        adjusterPhone: importPayload.adjusterPhone,
        adjusterEmail: importPayload.adjusterEmail,
        notesUser: importPayload.notesUser,
        custom: importPayload.custom,
        fnolCustomFields: importPayload.fnolCustomFields
      }
    };
    chrome.storage.local.get([WORKCENTER_IMPORT.fnolRegistryKey], function onLoad(result) {
      const existing = Array.isArray(result && result[WORKCENTER_IMPORT.fnolRegistryKey])
        ? result[WORKCENTER_IMPORT.fnolRegistryKey]
        : [];
      const deduped = existing.filter(function keep(item) {
        return item && item.fnolId !== entry.fnolId;
      });
      deduped.unshift(entry);
      chrome.storage.local.set(
        { [WORKCENTER_IMPORT.fnolRegistryKey]: deduped.slice(0, WORKCENTER_IMPORT.fnolRegistryMax || 30) },
        function onSaved() {
          renderJobList(deduped.slice(0, WORKCENTER_IMPORT.fnolRegistryMax || 30), 0);
          if (typeof callback === "function") {
            callback(!chrome.runtime.lastError);
          }
        }
      );
    });
  }

  function copyPlainTextFromPayload(payload, done) {
    const text = plainTextApi ? plainTextApi.formatPayloadAsPlainText(payload) : "";
    if (!text) {
      done(false, "Nothing to copy.");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function ok() {
        done(true, "Copied as normal text.");
      }).catch(function fail() {
        done(false, "Clipboard copy failed.");
      });
      return;
    }
    done(false, "Clipboard not available.");
  }

  function formatPhoneForCalendar(value) {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D+/g, "");
    if (digits.length === 10) {
      return "+1 (" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
    }
    if (digits.length === 11 && digits.charAt(0) === "1") {
      return "+1 (" + digits.slice(1, 4) + ") " + digits.slice(4, 7) + "-" + digits.slice(7);
    }
    return raw;
  }

  function buildCalendarTitleFromPayload(payload, settings) {
    const source = payload || {};
    const lossType = String(source.lossType || "").trim();
    const addressParts = [
      String(source.address1 || "").trim(),
      String(source.address2 || "").trim(),
      String(source.city || "").trim(),
      String(source.state || "").trim(),
      String(source.zip || "").trim()
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ").replace(/\s+,/g, ",");

    const parts = [
      lossType ? lossType + " - " + fullAddress : fullAddress,
      String(source.insuranceCarrier || "").trim(),
      String(source.claimNumber || "").trim(),
      String(source.customerName || source.businessName || "").trim(),
      formatPhoneForCalendar(source.primaryPhone),
      String(source.email || "").trim(),
      formatPhoneForCalendar(source.secondaryPhone),
      String((settings && settings.fnolIntakeInitials) || "").trim().toUpperCase()
    ].filter(function keep(value) {
      return Boolean(String(value || "").trim());
    });

    return parts.join(" / ");
  }

  function teamAllenTargetUrl(openVia) {
    return openVia === "modal"
      ? WORKCENTER_IMPORT.teamallenssmListUrl
      : WORKCENTER_IMPORT.teamallenssmAddUrl;
  }

  // Maps settings keys to the form field name used in fnolForm.elements
  const FNOL_DEFAULT_FIELD_MAP = {
    fnolDefaultPropertyType: "propertyType",
    fnolDefaultPayType: "payType",
    fnolDefaultBusinessUnit: "businessUnit",
    fnolDefaultJobStatus: "jobStatus"
  };

  function setFieldBlankOnly(fieldName, value) {
    if (!fnolForm || !value) {
      return;
    }
    const el = fnolForm.elements.namedItem(fieldName);
    if (!el) {
      return;
    }
    if (String(el.value || "").trim()) {
      return;
    }
    if (fieldName === "lossType") {
      setSelectByLabelOrValue(el, null, value);
      if (!el.value) {
        setSelectByLabelOrValue(el, value, null);
      }
      return;
    }
    el.value = value;
    if (el.tagName === "SELECT" && el.value !== String(value)) {
      setSelectByLabelOrValue(el, value, value);
    }
  }

  function mountAdvancedFnolFields(settings) {
    const advanced = settingsApi.canUseAdvancedFnol
      ? settingsApi.canUseAdvancedFnol(settings)
      : false;
    if (!advanced || !catalogApi) {
      if (fnolOptionalSection) {
        fnolOptionalSection.hidden = true;
      }
      if (fnolCustomSection) {
        fnolCustomSection.hidden = true;
      }
      if (fnolOptionalFields) {
        fnolOptionalFields.innerHTML = "";
      }
      if (fnolCustomFields) {
        fnolCustomFields.innerHTML = "";
      }
      return;
    }

    const preset = settingsApi.getActiveFnolPreset
      ? settingsApi.getActiveFnolPreset(settings)
      : catalogApi.getActivePreset(settings);
    const visible = {};
    ((preset && preset.visibleFields) || []).forEach(function mark(key) {
      visible[key] = true;
    });

    if (fnolOptionalFields) {
      const previousValues = {};
      Array.prototype.forEach.call(
        fnolOptionalFields.querySelectorAll("[name]"),
        function eachExisting(el) {
          previousValues[el.name] = el.value;
        }
      );
      fnolOptionalFields.innerHTML = "";
      let optionalCount = 0;
      catalogApi.getOptionalFields().forEach(function eachField(field) {
        if (!visible[field.key]) {
          return;
        }
        optionalCount += 1;
        const wrap = document.createElement("div");
        wrap.className = "field";
        const label = document.createElement("label");
        const inputId = "fnolDyn_" + field.key;
        label.setAttribute("for", inputId);
        label.textContent = field.label;
        const input = document.createElement("input");
        input.id = inputId;
        input.name = field.key;
        input.type = field.control === "email" ? "email" : "text";
        input.value = previousValues[field.key] || "";
        wrap.appendChild(label);
        wrap.appendChild(input);
        fnolOptionalFields.appendChild(wrap);
      });
      if (fnolOptionalSection) {
        fnolOptionalSection.hidden = optionalCount === 0;
      }
    }

    if (fnolCustomFields) {
      const previousCustom = {};
      Array.prototype.forEach.call(
        fnolCustomFields.querySelectorAll("[data-custom-key]"),
        function eachExisting(el) {
          previousCustom[el.getAttribute("data-custom-key")] = el.value;
        }
      );
      fnolCustomFields.innerHTML = "";
      const customs = (preset && preset.customFields) || [];
      customs.forEach(function eachCustom(field) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const label = document.createElement("label");
        const inputId = "fnolCustom_" + field.id;
        label.setAttribute("for", inputId);
        label.textContent = field.label || field.key;
        const input = document.createElement("input");
        input.id = inputId;
        input.name = field.key;
        input.type = "text";
        input.setAttribute("data-custom-key", field.key);
        input.setAttribute("data-custom-label", field.label || field.key);
        input.value =
          previousCustom[field.key] != null && previousCustom[field.key] !== ""
            ? previousCustom[field.key]
            : field.defaultValue || "";
        wrap.appendChild(label);
        wrap.appendChild(input);
        fnolCustomFields.appendChild(wrap);
      });
      if (fnolCustomSection) {
        fnolCustomSection.hidden = customs.length === 0;
      }
    }
  }

  function applyNotesMaxFromSettings(settings) {
    effectiveNotesMax = settingsApi.getEffectiveFnolNotesMaxLength
      ? settingsApi.getEffectiveFnolNotesMaxLength(settings)
      : 500;
    if (fnolNotesInput) {
      fnolNotesInput.maxLength = effectiveNotesMax;
    }
    if (fnolNotesHint) {
      fnolNotesHint.textContent =
        "Adjuster details are appended to notes on submit (" +
        effectiveNotesMax +
        " character limit).";
    }
    updateFnolNotesCounter();
  }

  function applyActiveFnolPreset(settings) {
    if (!fnolForm || !settings) {
      return;
    }
    applyNotesMaxFromSettings(settings);
    mountAdvancedFnolFields(settings);

    const advanced = settingsApi.canUseAdvancedFnol
      ? settingsApi.canUseAdvancedFnol(settings)
      : false;

    if (advanced && catalogApi) {
      const preset = settingsApi.getActiveFnolPreset
        ? settingsApi.getActiveFnolPreset(settings)
        : catalogApi.getActivePreset(settings);
      const defaults = (preset && preset.defaults) || {};
      catalogApi.getDefaultableFields().forEach(function eachField(field) {
        setFieldBlankOnly(field.key, defaults[field.key]);
      });
      catalogApi.getOptionalFields().forEach(function eachOptional(field) {
        const defVal = defaults[field.key];
        if (defVal) {
          setFieldBlankOnly(field.key, defVal);
        }
      });
      ((preset && preset.customFields) || []).forEach(function eachCustom(field) {
        if (!field.defaultValue) {
          return;
        }
        const el = fnolForm.elements.namedItem(field.key);
        if (el && !String(el.value || "").trim()) {
          el.value = field.defaultValue;
        }
      });
      return;
    }

    Object.keys(FNOL_DEFAULT_FIELD_MAP).forEach(function applyField(settingKey) {
      const defaultValue = settings[settingKey];
      if (!defaultValue) {
        return;
      }
      setFieldBlankOnly(FNOL_DEFAULT_FIELD_MAP[settingKey], defaultValue);
    });
  }

  function applyFnolDefaults(settings) {
    applyActiveFnolPreset(settings);
  }

  function refreshActivationState() {
    readActivationFromStorage(function onRead(activated, settings) {
      setActivated(activated, null, settings);
      if (activated) {
        applyFnolDefaults(settings);
      }
    });
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function onStorageChanged(changes, areaName) {
      if (areaName !== "local" || !changes[settingsApi.SETTINGS_KEY]) {
        return;
      }
      const settings = settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue);
      setActivated(settingsApi.isFnolAccessible(settings), null, settings);
      if (settingsApi.isFnolAccessible(settings)) {
        applyFnolDefaults(settings);
      }
      updateAddressLookupVisibility(settings);
      if (!suppressAdvReload) {
        updateAdvancedPanelVisibility(settings);
      }
    });
  }

  document.addEventListener("visibilitychange", function onVisible() {
    if (!document.hidden) {
      refreshActivationState();
    }
  });

  window.addEventListener("focus", refreshActivationState);

  if (fnolUnlockBtn) {
    fnolUnlockBtn.addEventListener("click", tryUnlockFromFnol);
  }
  if (fnolAccessCode) {
    fnolAccessCode.addEventListener("keydown", function onUnlockKey(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        tryUnlockFromFnol();
      }
    });
  }

  function updateFnolNotesCounter() {
    if (!fnolNotesCounter) {
      return;
    }
    const userLen = fnolNotesInput ? String(fnolNotesInput.value || "").length : 0;
    const previewPayload = buildFnolPayload({ previewNotes: true });
    const mergedLen = String((previewPayload && previewPayload.notes) || "").length;
    const over = mergedLen > effectiveNotesMax;
    fnolNotesCounter.textContent =
      mergedLen + " / " + effectiveNotesMax + (userLen !== mergedLen ? " (with adjuster backup)" : "");
    fnolNotesCounter.classList.toggle("is-over", over);
  }

  if (fnolNotesInput) {
    fnolNotesInput.addEventListener("input", updateFnolNotesCounter);
    const adjusterIds = ["fnolAdjusterName", "fnolAdjusterPhone", "fnolAdjusterEmail"];
    adjusterIds.forEach(function eachAdjusterId(id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateFnolNotesCounter);
      }
    });
    updateFnolNotesCounter();
  }

  populateFnolLossTypes();
  loadFnolRegistry();
  refreshActivationState();
  initFnolButtonHints();
  initAddressLookup();

  function startNewEntry() {
    fnolForm.reset();
    setActiveJobIndex(-1);
    clearAddressLookupInputs();
    setStatus("");
    updateFnolNotesCounter();
    settingsApi.getSettings(function onLoaded(settings) {
      applyFnolDefaults(settings);
    });
    try {
      const firstField = fnolForm.elements.namedItem("customerName");
      if (firstField) {
        firstField.focus();
      }
    } catch (e) {
      /* ignore focus errors */
    }
  }

  if (fnolNewEntryBtn) {
    fnolNewEntryBtn.addEventListener("click", startNewEntry);
  }

  fnolClearBtn.addEventListener("click", startNewEntry);

  if (fnolCopyPlainBtn) {
    fnolCopyPlainBtn.addEventListener("click", function onCopyPlain() {
      const payload = buildFnolPayload();
      copyPlainTextFromPayload(payload, function onDone(ok, message) {
        setStatus(message, ok ? "ok" : "error");
      });
    });
  }

  if (fnolCopyCalendarTitleBtn) {
    fnolCopyCalendarTitleBtn.addEventListener("click", function onCopyCalendarTitle() {
      const payload = buildFnolPayload();
      settingsApi.getSettings(function onLoaded(settings) {
        const title = buildCalendarTitleFromPayload(payload, settings);
        if (!title) {
          setStatus("Nothing to copy.", "error");
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(title).then(function ok() {
            setStatus("Copied calendar title.", "ok");
          }).catch(function fail() {
            setStatus("Clipboard copy failed.", "error");
          });
        } else {
          setStatus("Clipboard not available.", "error");
        }
      });
    });
  }

  if (fnolCopyJsonBtn) {
    fnolCopyJsonBtn.addEventListener("click", function onCopyJson() {
      const payload = buildFnolPayload();
      let json;
      try {
        json = JSON.stringify(payload, null, 2);
      } catch (e) {
        setStatus("Could not serialize payload.", "error");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(function ok() {
          setStatus("Copied as JSON.", "ok");
        }).catch(function fail() {
          setStatus("Clipboard copy failed.", "error");
        });
      } else {
        setStatus("Clipboard not available.", "error");
      }
    });
  }

  function describeScrapeSource(payload) {
    if (!payload || !payload.source) {
      return payload && payload.projectName ? "WorkCenter" : "saved";
    }
    if (payload.source === "alacrity") {
      return "Alacrity";
    }
    if (payload.source === "fnol") {
      return "FNOL";
    }
    return String(payload.source);
  }

  if (fnolLoadFromScrapeBtn) {
    fnolLoadFromScrapeBtn.addEventListener("click", function onLoadFromScrape() {
      chrome.storage.local.get([WORKCENTER_IMPORT.storageKey], function onLoad(result) {
        const payload = result && result[WORKCENTER_IMPORT.storageKey];
        if (!payload || typeof payload !== "object") {
          setStatus("No saved scrape found. Scrape on WorkCenter or Alacrity first.", "error");
          return;
        }
        const hasFields =
          payload.customerName ||
          payload.claimNumber ||
          payload.address1 ||
          payload.primaryPhone;
        if (!hasFields) {
          setStatus("Saved payload has no recognizable job fields.", "error");
          return;
        }
        applyPayloadToFnolForm(payload);
        const sourceLabel = describeScrapeSource(payload);
        let message = "Loaded from last " + sourceLabel + " scrape.";
        if (payload.scrapedAt) {
          const staleMs = (WORKCENTER_IMPORT.staleHours || 24) * 60 * 60 * 1000;
          const age = Date.now() - new Date(payload.scrapedAt).getTime();
          if (age > staleMs) {
            message += " Warning: payload older than " + (WORKCENTER_IMPORT.staleHours || 24) + "h.";
          }
        }
        setStatus(message, "ok");
      });
    });
  }

  fnolForm.addEventListener("submit", function onSubmit(e) {
    e.preventDefault();
    settingsApi.getSettings(function onLoaded(settings) {
      if (!settingsApi.isFnolAccessible(settings)) {
        setStatus("You require an access code for the intake.", "error");
        setActivated(false, null, settings);
        if (fnolAccessCode) {
          fnolAccessCode.focus();
        }
        return;
      }
      const payload = buildFnolPayload();
      if (!payload.customerName) {
        setStatus("Customer name is required.", "error");
        if (fnolCustomer) {
          fnolCustomer.focus();
        }
        return;
      }
      if (!payload.primaryPhone) {
        setStatus("Phone 1 is required.", "error");
        if (fnolForm && fnolForm.elements.namedItem("primaryPhone")) {
          fnolForm.elements.namedItem("primaryPhone").focus();
        }
        return;
      }
      if (!payload.address1) {
        setStatus("Address 1 is required.", "error");
        if (fnolForm && fnolForm.elements.namedItem("address1")) {
          fnolForm.elements.namedItem("address1").focus();
        }
        return;
      }

      const submitHandler = settingsApi.getSubmitHandler
        ? settingsApi.getSubmitHandler(settings)
        : "generic";

      if (
        googleFormApi &&
        googleFormApi.needsIntakeInitials &&
        googleFormApi.needsIntakeInitials(settings, submitHandler)
      ) {
        openInitialsDialog(function onInitialsSaved(savedValue) {
          // Patch in-memory settings so the re-triggered submit sees the new value.
          settings.fnolIntakeInitials = savedValue;
          if (fnolForm) {
            fnolForm.requestSubmit
              ? fnolForm.requestSubmit(fnolSubmitBtn)
              : fnolForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }
        });
        return;
      }

      const notesLen = String(payload.notes || "").length;
      if (notesLen > effectiveNotesMax) {
        setStatus(
          "Notes are " + notesLen + " characters (max " + effectiveNotesMax + "). Shorten notes before submitting.",
          "error"
        );
        updateFnolNotesCounter();
        return;
      }

      const noteText = String(payload.notes || "").trim();

      const sendGoogleBackup =
        googleFormApi &&
        googleFormApi.shouldSubmitBackup &&
        googleFormApi.shouldSubmitBackup(settings, submitHandler);

      // --- TeamAllen-specific submit path ---
      function queuePendingNotesPaste(done) {
        if (settings.fnolPasteNotesAfterSave !== false && noteText) {
          settingsApi.setPendingNotesPaste(noteText, buildPendingNotesContext(payload), done);
          return;
        }
        settingsApi.clearPendingNotesPaste(done);
      }

      function openTeamAllenTab() {
        const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
        const shouldAutoSave = settings.fnolAutoSave !== false;
        const targetUrl = teamAllenTargetUrl(openVia);
        if (openVia === "modal" || shouldAutoSave) {
          settingsApi.setPendingAutoSubmit(
            { autoSave: shouldAutoSave, openVia: openVia, consumedListClick: false },
            function onPending() {
              chrome.tabs.create({ url: targetUrl }, function onTab() {
                const notesHint =
                  noteText && settings.fnolPasteNotesAfterSave !== false
                    ? " Notes will be added after save when the Notes section is ready."
                    : "";
                setStatus(
                  (openVia === "modal"
                    ? shouldAutoSave
                      ? "Saved. Jobs list opened — popup will fill and save."
                      : "Saved. Jobs list opened — popup will fill."
                    : "Saved. Add job page opened — will fill and save.") +
                    notesHint +
                    (sendGoogleBackup ? " Google Form backup sent." : ""),
                  "ok"
                );
              });
            }
          );
        } else {
          settingsApi.clearPendingAutoSubmit();
          chrome.tabs.create({ url: targetUrl }, function onTab() {
            setStatus(
              "Saved. Add job page opened — fill manually on that tab." +
                (sendGoogleBackup ? " Google Form backup sent." : ""),
              "ok"
            );
          });
        }
      }

      // --- Generic submit path (trial + future tiers) ---
      function genericSubmitFinish() {
        if (plainTextApi && plainTextApi.formatPayloadAsPlainText) {
          const plainText = plainTextApi.formatPayloadAsPlainText(payload);
          if (plainText && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(plainText).then(function ok() {
              setStatus("Saved. Copied as plain text \u2014 paste into your job system.", "ok");
            }).catch(function fail() {
              setStatus("Saved. Could not copy to clipboard.", "ok");
            });
            return;
          }
        }
        setStatus("Saved.", "ok");
      }

      setStatus("Saving…");

      if (sendGoogleBackup && googleFormApi.submitGoogleFormBackup) {
        const activeProfile = settingsApi.getTenantProfile
          ? settingsApi.getTenantProfile(submitHandler)
          : null;
        const formConfig = activeProfile && activeProfile.googleForm
          ? activeProfile.googleForm
          : null;
        if (formConfig) {
          googleFormApi.submitGoogleFormBackup(payload, settings, formConfig);
        }
      }

      if (submitHandler === "teamallenssm") {
        setStatus(
          settingsApi.resolveTeamAllenOpenVia(settings) === "modal"
            ? "Saving and opening jobs list (Add Job popup)…"
            : "Saving and opening add job page…"
        );
      }

      upsertPayloadHistory(payload, function onSaved(ok) {
        if (!ok) {
          setStatus("Failed to save payload.", "error");
          return;
        }
        upsertFnolRegistry(payload, function onRegistrySaved() {
          /* list refreshed in upsert */
        });

        // fnolCopyOnSubmit setting applies to TeamAllen path only (user opt-in)
        if (submitHandler === "teamallenssm" && settings.fnolCopyOnSubmit && plainTextApi) {
          const plainText = plainTextApi.formatPayloadAsPlainText
            ? plainTextApi.formatPayloadAsPlainText(payload)
            : null;
          if (plainText && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(plainText).catch(function noop() {});
          }
        }

        if (submitHandler === "teamallenssm") {
          queuePendingNotesPaste(function onNotesQueued() {
            openTeamAllenTab();
            if (settings.fnolClearAfterSubmit) {
              fnolForm.reset();
              setActiveJobIndex(-1);
              updateFnolNotesCounter();
              applyFnolDefaults(settings);
            }
          });
        } else {
          // Generic: save + copy, no redirect
          genericSubmitFinish();
          if (settings.fnolClearAfterSubmit) {
            fnolForm.reset();
            setActiveJobIndex(-1);
            updateFnolNotesCounter();
            applyFnolDefaults(settings);
          }
        }
      });
    });
  });

  // ── Advanced FNOL live customize (TeamAllen) ───────────────────────────────
  function updateAdvancedPanelVisibility(settings) {
    const isTeamAllen = settingsApi.isTeamAllenActivated
      ? settingsApi.isTeamAllenActivated(settings)
      : false;
    if (fnolAdvancedPanel) {
      fnolAdvancedPanel.hidden = !isTeamAllen;
    }
    if (!isTeamAllen) {
      return;
    }
    if (!advUiReady) {
      initAdvancedCustomizeUi();
    }
    syncAdvancedPanelFromSettings(settings || settingsApi.mergeSettings(null));
  }

  function getWorkingActivePreset() {
    for (let i = 0; i < workingPresets.length; i += 1) {
      if (workingPresets[i].id === workingActivePresetId) {
        return workingPresets[i];
      }
    }
    return workingPresets[0] || null;
  }

  function buildAdvancedSettingsPatch(baseSettings) {
    const base = settingsApi.mergeSettings(baseSettings || null);
    if (!catalogApi) {
      return {
        fnolAdvancedEnabled: workingAdvancedEnabled,
        fnolNotesMaxLength: workingNotesMax,
        fnolPresets: workingPresets,
        fnolActivePresetId: workingActivePresetId
      };
    }
    const presets = catalogApi.normalizePresets(workingPresets, base);
    const active = presets.some(function has(p) {
      return p.id === workingActivePresetId;
    })
      ? workingActivePresetId
      : (presets[0] && presets[0].id) || "default";
    const activePreset = presets.filter(function find(p) {
      return p.id === active;
    })[0];
    const legacy = activePreset ? catalogApi.syncLegacyDefaultsFromPreset(activePreset) : {};
    return Object.assign(
      {
        fnolAdvancedEnabled: workingAdvancedEnabled,
        fnolNotesMaxLength: catalogApi.normalizeNotesMaxLength(workingNotesMax),
        fnolPresets: presets,
        fnolActivePresetId: active
      },
      legacy
    );
  }

  function saveAdvancedAndPreview() {
    if (!catalogApi) {
      return;
    }
    settingsApi.getSettings(function onLoaded(current) {
      if (!settingsApi.isTeamAllenActivated(current)) {
        return;
      }
      const patch = buildAdvancedSettingsPatch(current);
      const preview = settingsApi.mergeSettings(Object.assign({}, current, patch));
      suppressAdvReload = true;
      applyActiveFnolPreset(preview);
      refreshAdvancedControls();
      settingsApi.saveSettings(patch, function onSaved() {
        setTimeout(function release() {
          suppressAdvReload = false;
        }, 150);
      });
    });
  }

  function ensureAdvancedBuilders() {
    if (advUiReady || !catalogApi) {
      return;
    }
    advUiReady = true;

    if (fnolPageDefaultsGrid) {
      fnolPageDefaultsGrid.innerHTML = "";
      catalogApi.getDefaultableFields().forEach(function eachField(field) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const label = document.createElement("label");
        const selectId = "fnolPageAdvDefault_" + field.key;
        label.setAttribute("for", selectId);
        label.textContent = field.label;
        const select = document.createElement("select");
        select.id = selectId;
        select.setAttribute("data-adv-default-key", field.key);
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "—";
        select.appendChild(empty);
        (field.options || []).forEach(function eachOpt(opt) {
          const option = document.createElement("option");
          option.value = opt.value;
          option.textContent = opt.label;
          select.appendChild(option);
        });
        select.addEventListener("change", function onDefaultChange() {
          const preset = getWorkingActivePreset();
          if (!preset) {
            return;
          }
          preset.defaults[field.key] = select.value || "";
          saveAdvancedAndPreview();
        });
        wrap.appendChild(label);
        wrap.appendChild(select);
        fnolPageDefaultsGrid.appendChild(wrap);
      });
    }

    if (fnolPageVisibleFields) {
      fnolPageVisibleFields.innerHTML = "";
      catalogApi.getOptionalFields().forEach(function eachField(field) {
        const row = document.createElement("div");
        row.className = "field field-check";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "fnolPageAdvVisible_" + field.key;
        checkbox.setAttribute("data-adv-visible-key", field.key);
        const label = document.createElement("label");
        label.setAttribute("for", checkbox.id);
        label.textContent = field.label;
        checkbox.addEventListener("change", function onVisibleChange() {
          const preset = getWorkingActivePreset();
          if (!preset) {
            return;
          }
          const key = field.key;
          const next = (preset.visibleFields || []).filter(function keep(k) {
            return k !== key;
          });
          if (checkbox.checked) {
            next.push(key);
          }
          preset.visibleFields = next;
          saveAdvancedAndPreview();
        });
        row.appendChild(checkbox);
        row.appendChild(label);
        fnolPageVisibleFields.appendChild(row);
      });
    }
  }

  function renderPageCustomFieldsEditor() {
    if (!fnolPageCustomFieldsEditor || !catalogApi) {
      return;
    }
    const preset = getWorkingActivePreset();
    fnolPageCustomFieldsEditor.innerHTML = "";
    if (!preset) {
      return;
    }
    (preset.customFields || []).forEach(function eachCustom(field) {
      const row = document.createElement("div");
      row.className = "fnol-custom-field-row";

      function makeField(idSuffix, labelText, value, onChange) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const label = document.createElement("label");
        const id = "fnolPageCustom_" + field.id + "_" + idSuffix;
        label.setAttribute("for", id);
        label.textContent = labelText;
        const input = document.createElement("input");
        input.id = id;
        input.type = "text";
        input.value = value || "";
        input.addEventListener("change", onChange);
        input.addEventListener("blur", onChange);
        wrap.appendChild(label);
        wrap.appendChild(input);
        return wrap;
      }

      row.appendChild(
        makeField("label", "Label", field.label, function onLabel(e) {
          field.label = String(e.target.value || "").trim() || field.label;
          if (!field.key || String(field.key).indexOf("custom_field_") === 0) {
            field.key = catalogApi.sanitizeCustomFieldKey(field.label) || field.key;
            const keyInput = row.querySelector('input[id$="_key"]');
            if (keyInput) {
              keyInput.value = field.key;
            }
          }
          saveAdvancedAndPreview();
        })
      );
      row.appendChild(
        makeField("key", "Key", field.key, function onKey(e) {
          field.key =
            catalogApi.sanitizeCustomFieldKey(e.target.value) ||
            catalogApi.sanitizeCustomFieldKey(field.label) ||
            field.key;
          e.target.value = field.key;
          saveAdvancedAndPreview();
        })
      );
      row.appendChild(
        makeField("default", "Default", field.defaultValue, function onDefault(e) {
          field.defaultValue = String(e.target.value || "");
          saveAdvancedAndPreview();
        })
      );

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn secondary sm";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function onRemove() {
        preset.customFields = (preset.customFields || []).filter(function keep(item) {
          return item.id !== field.id;
        });
        renderPageCustomFieldsEditor();
        saveAdvancedAndPreview();
      });
      row.appendChild(removeBtn);
      fnolPageCustomFieldsEditor.appendChild(row);
    });
  }

  function refreshAdvancedControls() {
    ensureAdvancedBuilders();
    if (!catalogApi) {
      return;
    }

    if (fnolPageAdvancedEnabled) {
      fnolPageAdvancedEnabled.checked = workingAdvancedEnabled;
    }
    if (fnolPageAdvancedControls) {
      fnolPageAdvancedControls.hidden = !workingAdvancedEnabled;
    }
    if (fnolPageNotesMaxLength) {
      fnolPageNotesMaxLength.value = String(
        catalogApi.normalizeNotesMaxLength(workingNotesMax)
      );
    }
    if (fnolPageActivePresetId) {
      fnolPageActivePresetId.innerHTML = "";
      workingPresets.forEach(function eachPreset(preset) {
        const opt = document.createElement("option");
        opt.value = preset.id;
        opt.textContent = preset.name || preset.id;
        fnolPageActivePresetId.appendChild(opt);
      });
      const stillThere = workingPresets.some(function has(p) {
        return p.id === workingActivePresetId;
      });
      workingActivePresetId = stillThere
        ? workingActivePresetId
        : (workingPresets[0] && workingPresets[0].id) || "default";
      fnolPageActivePresetId.value = workingActivePresetId;
    }

    const active = getWorkingActivePreset();
    if (fnolPagePresetName) {
      fnolPagePresetName.value = (active && active.name) || "";
    }
    if (fnolPageDefaultsGrid && active) {
      Array.prototype.forEach.call(
        fnolPageDefaultsGrid.querySelectorAll("[data-adv-default-key]"),
        function eachSelect(select) {
          const key = select.getAttribute("data-adv-default-key");
          select.value = (active.defaults && active.defaults[key]) || "";
        }
      );
    }
    if (fnolPageVisibleFields && active) {
      const visible = {};
      (active.visibleFields || []).forEach(function mark(k) {
        visible[k] = true;
      });
      Array.prototype.forEach.call(
        fnolPageVisibleFields.querySelectorAll("[data-adv-visible-key]"),
        function eachCheck(checkbox) {
          const key = checkbox.getAttribute("data-adv-visible-key");
          checkbox.checked = Boolean(visible[key]);
        }
      );
    }
    if (fnolPagePresetDeleteBtn) {
      fnolPagePresetDeleteBtn.disabled = workingPresets.length <= 1;
    }
    renderPageCustomFieldsEditor();
  }

  function syncAdvancedPanelFromSettings(settings) {
    if (!catalogApi || suppressAdvReload) {
      return;
    }
    const migrated = catalogApi.migrateLegacyIntoActivePreset(settings);
    workingPresets = catalogApi.normalizePresets(migrated.fnolPresets, migrated);
    workingActivePresetId =
      migrated.fnolActivePresetId || (workingPresets[0] && workingPresets[0].id) || "default";
    workingNotesMax = catalogApi.normalizeNotesMaxLength(migrated.fnolNotesMaxLength);
    workingAdvancedEnabled = Boolean(migrated.fnolAdvancedEnabled);
    refreshAdvancedControls();
  }

  function initAdvancedCustomizeUi() {
    if (!catalogApi || !fnolAdvancedPanel) {
      return;
    }
    ensureAdvancedBuilders();

    if (fnolAdvancedToggleBtn && fnolAdvancedBody) {
      fnolAdvancedToggleBtn.addEventListener("click", function onToggle() {
        const open = fnolAdvancedBody.hidden;
        fnolAdvancedBody.hidden = !open;
        fnolAdvancedToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
        fnolAdvancedPanel.classList.toggle("is-open", open);
      });
    }

    if (fnolPageAdvancedEnabled) {
      fnolPageAdvancedEnabled.addEventListener("change", function onEnable() {
        workingAdvancedEnabled = fnolPageAdvancedEnabled.checked;
        if (workingAdvancedEnabled && catalogApi) {
          settingsApi.getSettings(function onLoaded(current) {
            const withLegacy = catalogApi.migrateLegacyIntoActivePreset(
              Object.assign({}, current, {
                fnolPresets: workingPresets,
                fnolActivePresetId: workingActivePresetId
              })
            );
            workingPresets = catalogApi.normalizePresets(withLegacy.fnolPresets, withLegacy);
            workingActivePresetId = withLegacy.fnolActivePresetId;
            saveAdvancedAndPreview();
          });
          return;
        }
        saveAdvancedAndPreview();
      });
    }

    if (fnolPageNotesMaxLength) {
      fnolPageNotesMaxLength.addEventListener("change", function onNotesMax() {
        workingNotesMax = catalogApi.normalizeNotesMaxLength(fnolPageNotesMaxLength.value);
        saveAdvancedAndPreview();
      });
    }

    if (fnolPageActivePresetId) {
      fnolPageActivePresetId.addEventListener("change", function onPreset() {
        workingActivePresetId = fnolPageActivePresetId.value;
        saveAdvancedAndPreview();
      });
    }

    if (fnolPagePresetName) {
      function commitName() {
        const preset = getWorkingActivePreset();
        if (!preset) {
          return;
        }
        preset.name = String(fnolPagePresetName.value || "").trim() || preset.name;
        saveAdvancedAndPreview();
      }
      fnolPagePresetName.addEventListener("change", commitName);
      fnolPagePresetName.addEventListener("blur", commitName);
    }

    if (fnolPagePresetDuplicateBtn) {
      fnolPagePresetDuplicateBtn.addEventListener("click", function onDup() {
        const active = getWorkingActivePreset();
        if (!active) {
          return;
        }
        const copy = catalogApi.normalizePreset(
          Object.assign({}, active, {
            id: "preset-" + Date.now(),
            name: (active.name || "Preset") + " copy"
          }),
          workingPresets.length
        );
        workingPresets.push(copy);
        workingActivePresetId = copy.id;
        saveAdvancedAndPreview();
      });
    }

    if (fnolPagePresetDeleteBtn) {
      fnolPagePresetDeleteBtn.addEventListener("click", function onDel() {
        if (workingPresets.length <= 1) {
          return;
        }
        workingPresets = workingPresets.filter(function keep(p) {
          return p.id !== workingActivePresetId;
        });
        workingActivePresetId = workingPresets[0].id;
        saveAdvancedAndPreview();
      });
    }

    if (fnolPageCustomFieldAddBtn) {
      fnolPageCustomFieldAddBtn.addEventListener("click", function onAdd() {
        const preset = getWorkingActivePreset();
        if (!preset) {
          return;
        }
        const index = (preset.customFields || []).length;
        preset.customFields = (preset.customFields || []).concat([
          catalogApi.normalizeCustomField(
            {
              label: "Custom field " + (index + 1),
              key: "custom_field_" + (index + 1),
              defaultValue: ""
            },
            index
          )
        ]);
        renderPageCustomFieldsEditor();
        saveAdvancedAndPreview();
      });
    }

    if (window.location.hash === "#advanced" && fnolAdvancedBody && fnolAdvancedToggleBtn) {
      fnolAdvancedBody.hidden = false;
      fnolAdvancedToggleBtn.setAttribute("aria-expanded", "true");
      fnolAdvancedPanel.classList.add("is-open");
      try {
        fnolAdvancedPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {
        /* ignore */
      }
    }
  }

})();
