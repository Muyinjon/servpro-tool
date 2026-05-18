(function initOptionsPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const WORKCENTER_IMPORT = {
    storageKey: "servproUploadHelper.workcenterPayload",
    historyKey: "servproUploadHelper.workcenterPayloadHistory",
    maxHistory: 5,
    teamallenssmAddUrl: "https://teamallenssm.com/jobs1_add.php?"
  };

  const activationCard = document.getElementById("activationCard");
  const activationActive = document.getElementById("activationActive");
  const activationForm = document.getElementById("activationForm");
  const activationCode = document.getElementById("activationCode");
  const activateBtn = document.getElementById("activateBtn");
  const activationStatus = document.getElementById("activationStatus");
  const settingsCard = document.getElementById("settingsCard");
  const fnolCard = document.getElementById("fnolCard");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsStatus = document.getElementById("settingsStatus");
  const fnolForm = document.getElementById("fnolForm");
  const fnolClearBtn = document.getElementById("fnolClearBtn");
  const fnolStatus = document.getElementById("fnolStatus");
  const defaultJobModeOnFill = document.getElementById("defaultJobModeOnFill");

  const checkboxIds = [
    "hideListPanel",
    "hideAddEditHelperPanel",
    "autoCollapsePanels",
    "fnolAutoSave",
    "showEditCopyButton"
  ];

  function setStatus(el, message, kind) {
    if (!el) {
      return;
    }
    el.textContent = message || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  function setUnlocked(activated) {
    if (activated) {
      activationActive.style.display = "block";
      activationForm.style.display = "none";
      settingsCard.classList.remove("locked");
      fnolCard.classList.remove("locked");
    } else {
      activationActive.style.display = "none";
      activationForm.style.display = "block";
      settingsCard.classList.add("locked");
      fnolCard.classList.add("locked");
    }
  }

  function readSettingsFromForm() {
    const partial = {};
    checkboxIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el) {
        partial[id] = el.checked;
      }
    });
    if (defaultJobModeOnFill) {
      partial.defaultJobModeOnFill = defaultJobModeOnFill.value || "none";
    }
    return partial;
  }

  function applySettingsToForm(settings) {
    checkboxIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el && settings) {
        el.checked = Boolean(settings[id]);
      }
    });
    if (defaultJobModeOnFill && settings) {
      const mode = settings.defaultJobModeOnFill || "none";
      defaultJobModeOnFill.value =
        mode === "recon" || mode === "mitigation" ? mode : "none";
    }
    setUnlocked(settingsApi.isTeamAllenActivated(settings));
  }

  function upsertPayloadHistory(payload, callback) {
    const storage = chrome.storage.local;
    storage.get([WORKCENTER_IMPORT.historyKey], function onLoad(result) {
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
      storage.set(
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

  function buildFnolPayload() {
    const data = new FormData(fnolForm);
    const payload = {
      customerName: String(data.get("customerName") || "").trim(),
      businessName: String(data.get("businessName") || "").trim(),
      primaryPhone: String(data.get("primaryPhone") || "").trim(),
      secondaryPhone: String(data.get("secondaryPhone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      claimNumber: String(data.get("claimNumber") || "").trim(),
      propertyType: String(data.get("propertyType") || "").trim(),
      payType: String(data.get("payType") || "").trim(),
      lossType: String(data.get("lossType") || "").trim(),
      businessUnit: String(data.get("businessUnit") || "").trim(),
      address1: String(data.get("address1") || "").trim(),
      city: String(data.get("city") || "").trim(),
      state: String(data.get("state") || "").trim(),
      zip: String(data.get("zip") || "").trim(),
      insuranceCarrier: String(data.get("insuranceCarrier") || "").trim(),
      coordinator: String(data.get("coordinator") || "").trim(),
      notes: String(data.get("notes") || "").trim(),
      billAddress: true,
      source: "fnol",
      fnolId: "fnol-" + Date.now(),
      sourceUrl: "fnol://local",
      scrapedAt: new Date().toISOString()
    };
    if (payload.propertyType) {
      payload.addLocation =
        payload.propertyType.indexOf("Commercial") !== -1 ? "Commercial" : "Residence";
    }
    return payload;
  }

  settingsApi.getSettings(function onLoad(settings) {
    applySettingsToForm(settings);
  });

  activateBtn.addEventListener("click", function onActivate() {
    settingsApi.activateWithCode(activationCode.value, function onDone(ok, settings) {
      if (ok) {
        setStatus(activationStatus, "Access enabled.", "ok");
        applySettingsToForm(settings);
      } else {
        setStatus(activationStatus, "Invalid code.", "error");
      }
    });
  });

  activationCode.addEventListener("keydown", function onKey(e) {
    if (e.key === "Enter") {
      activateBtn.click();
    }
  });

  saveSettingsBtn.addEventListener("click", function onSave() {
    settingsApi.getSettings(function onLoaded(current) {
      if (!settingsApi.isTeamAllenActivated(current)) {
        setStatus(settingsStatus, "Enter access code first.", "error");
        return;
      }
      settingsApi.saveSettings(readSettingsFromForm(), function onSaved(ok) {
        setStatus(settingsStatus, ok ? "Settings saved." : "Failed to save settings.", ok ? "ok" : "error");
      });
    });
  });

  checkboxIds.forEach(function eachId(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", function onToggle() {
        settingsApi.getSettings(function onLoaded(current) {
          if (!settingsApi.isTeamAllenActivated(current)) {
            return;
          }
          settingsApi.saveSettings(readSettingsFromForm());
        });
      });
    }
  });

  if (defaultJobModeOnFill) {
    defaultJobModeOnFill.addEventListener("change", function onModeChange() {
      settingsApi.getSettings(function onLoaded(current) {
        if (!settingsApi.isTeamAllenActivated(current)) {
          return;
        }
        settingsApi.saveSettings(readSettingsFromForm());
      });
    });
  }

  fnolClearBtn.addEventListener("click", function onClear() {
    fnolForm.reset();
    setStatus(fnolStatus, "");
  });

  fnolForm.addEventListener("submit", function onSubmit(e) {
    e.preventDefault();
    settingsApi.getSettings(function onLoaded(settings) {
      if (!settingsApi.isTeamAllenActivated(settings)) {
        setStatus(fnolStatus, "Enter access code before submitting FNOL.", "error");
        return;
      }
      const payload = buildFnolPayload();
      if (!payload.customerName) {
        setStatus(fnolStatus, "Customer name is required.", "error");
        return;
      }

      setStatus(fnolStatus, "Saving payload and opening add job page…");
      upsertPayloadHistory(payload, function onSaved(ok) {
        if (!ok) {
          setStatus(fnolStatus, "Failed to save payload.", "error");
          return;
        }
        const shouldAutoSave = settings.fnolAutoSave !== false;
        if (shouldAutoSave) {
          settingsApi.setPendingAutoSubmit(true, function onPending() {
            chrome.tabs.create({ url: WORKCENTER_IMPORT.teamallenssmAddUrl }, function onTab() {
              setStatus(
                fnolStatus,
                "Opened add job page. The extension will fill and save automatically.",
                "ok"
              );
            });
          });
        } else {
          settingsApi.clearPendingAutoSubmit();
          chrome.tabs.create({ url: WORKCENTER_IMPORT.teamallenssmAddUrl }, function onTab() {
            setStatus(fnolStatus, "Opened add job page. Use the helper to fill manually.", "ok");
          });
        }
      });
    });
  });
})();
