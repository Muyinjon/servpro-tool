(function initFnolPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const selectorsApi = window.ServproUploadExtension && window.ServproUploadExtension.selectors;
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
  const fnolCopyJsonBtn = document.getElementById("fnolCopyJsonBtn");
  const fnolLossType = document.getElementById("fnolLossType");
  const fnolJobList = document.getElementById("fnolJobList");
  const fnolJobEmpty = document.getElementById("fnolJobEmpty");
  const fnolStatus = document.getElementById("fnolStatus");
  const fnolNotesInput = document.getElementById("fnolNotes");
  const fnolNotesCounter = document.getElementById("fnolNotesCounter");
  const NOTES_MAX_LENGTH = fnolNotesApi ? fnolNotesApi.NOTES_MAX_LENGTH : 500;

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
    fnolSubmitBtn.textContent = handler === "teamallenssm" ? "Submit new job" : "Save & copy";
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
    } else {
      settingsApi.getSettings(function onLoadedForLabel(s) {
        updateSubmitButtonLabel(s);
        updateTrialUpsell(s);
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
      "adjusterEmail"
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
      notesEl.value = payload.notesUser || "";
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

  function buildFnolPayload(options) {
    const opts = options || {};
    const data = new FormData(fnolForm);
    const lossOption = fnolLossType && fnolLossType.options[fnolLossType.selectedIndex];
    const lossTypeValue = lossOption ? String(lossOption.value || "").trim() : "";
    const lossTypeLabel = lossOption ? String(lossOption.textContent || "").trim() : "";
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
      lossType: lossTypeLabel,
      lossTypeValue: lossTypeValue,
      businessUnit: String(data.get("businessUnit") || "").trim(),
      address1: String(data.get("address1") || "").trim(),
      address2: String(data.get("address2") || "").trim(),
      city: String(data.get("city") || "").trim(),
      state: String(data.get("state") || "").trim(),
      zip: String(data.get("zip") || "").trim(),
      insuranceCarrier: String(data.get("insuranceCarrier") || "").trim(),
      jobStatus: String(data.get("jobStatus") || "").trim(),
      coordinator: String(data.get("coordinator") || "").trim(),
      coordinatorValue: (function resolveCoordinatorValue() {
        const el = fnolForm && fnolForm.elements.namedItem("coordinator");
        if (el && el.tagName === "SELECT") {
          return String(el.value || "").trim();
        }
        return "";
      })(),
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
        coordinator: importPayload.coordinator,
        adjusterName: importPayload.adjusterName,
        adjusterPhone: importPayload.adjusterPhone,
        adjusterEmail: importPayload.adjusterEmail,
        notesUser: importPayload.notesUser
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

  function applyFnolDefaults(settings) {
    if (!fnolForm || !settings) {
      return;
    }
    Object.keys(FNOL_DEFAULT_FIELD_MAP).forEach(function applyField(settingKey) {
      const defaultValue = settings[settingKey];
      if (!defaultValue) {
        return;
      }
      const fieldName = FNOL_DEFAULT_FIELD_MAP[settingKey];
      const el = fnolForm.elements.namedItem(fieldName);
      if (!el) {
        return;
      }
      // Only apply if the field is currently blank
      if (!el.value) {
        el.value = defaultValue;
      }
    });
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
    const over = mergedLen > NOTES_MAX_LENGTH;
    fnolNotesCounter.textContent =
      mergedLen + " / " + NOTES_MAX_LENGTH + (userLen !== mergedLen ? " (with adjuster backup)" : "");
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

  function startNewEntry() {
    fnolForm.reset();
    setActiveJobIndex(-1);
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
      if (notesLen > NOTES_MAX_LENGTH) {
        setStatus(
          "Notes are " + notesLen + " characters (max " + NOTES_MAX_LENGTH + "). Shorten notes before submitting.",
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
})();
