(function initOptionsPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const activationActiveBlock = document.getElementById("activationActiveBlock");
  const activationActive = document.getElementById("activationActive");
  const activationForm = document.getElementById("activationForm");
  const activationCode = document.getElementById("activationCode");
  const activateBtn = document.getElementById("activateBtn");
  const resetActivationBtn = document.getElementById("resetActivationBtn");
  const activationStatus = document.getElementById("activationStatus");
  const settingsCard = document.getElementById("settingsCard");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsStatus = document.getElementById("settingsStatus");
  const openFnolLink = document.getElementById("openFnolLink");
  const defaultJobModeOnFill = document.getElementById("defaultJobModeOnFill");
  const teamAllenAddJobUi = document.getElementById("teamAllenAddJobUi");

  const checkboxIds = [
    "hideListPanel",
    "hideAddEditHelperPanel",
    "autoCollapsePanels",
    "fnolAutoSave",
    "fnolPasteNotesAfterSave",
    "showEditCopyButton"
  ];

  function fnolPageUrl() {
    return chrome.runtime.getURL("fnol.html");
  }

  if (openFnolLink) {
    openFnolLink.href = fnolPageUrl();
    openFnolLink.addEventListener("click", function onOpenFnol(e) {
      e.preventDefault();
      chrome.tabs.create({ url: fnolPageUrl() });
    });
  }

  function setStatus(el, message, kind) {
    if (!el) {
      return;
    }
    el.textContent = message || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  function setUnlocked(activated) {
    if (activated) {
      if (activationActiveBlock) {
        activationActiveBlock.style.display = "block";
      }
      if (activationForm) {
        activationForm.style.display = "none";
      }
      settingsCard.classList.remove("locked");
    } else {
      if (activationActiveBlock) {
        activationActiveBlock.style.display = "none";
      }
      if (activationForm) {
        activationForm.style.display = "block";
      }
      settingsCard.classList.add("locked");
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
    if (teamAllenAddJobUi) {
      partial.teamAllenAddJobUi = teamAllenAddJobUi.value === "page" ? "page" : "modal";
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
    if (teamAllenAddJobUi && settings) {
      teamAllenAddJobUi.value = settings.teamAllenAddJobUi === "page" ? "page" : "modal";
    }
    setUnlocked(settingsApi.isTeamAllenActivated(settings));
  }

  settingsApi.getSettings(function onLoad(settings) {
    applySettingsToForm(settings);
  });

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function onStorageChanged(changes, areaName) {
      if (areaName !== "local" || !changes[settingsApi.SETTINGS_KEY]) {
        return;
      }
      applySettingsToForm(
        settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue)
      );
    });
  }

  activateBtn.addEventListener("click", function onActivate() {
    settingsApi.activateWithCode(activationCode.value, function onDone(ok, settings) {
      if (ok) {
        setStatus(activationStatus, "Access enabled.", "ok");
        if (activationCode) {
          activationCode.value = "";
        }
        applySettingsToForm(settings);
      } else {
        setStatus(activationStatus, "Invalid code.", "error");
      }
    });
  });

  if (resetActivationBtn) {
    resetActivationBtn.addEventListener("click", function onReset() {
      settingsApi.resetActivation(function onResetDone(ok, settings) {
        if (ok) {
          setStatus(activationStatus, "Access code cleared. Enter code again to unlock.", "ok");
          if (activationCode) {
            activationCode.value = "";
            activationCode.focus();
          }
          applySettingsToForm(settings);
        } else {
          setStatus(activationStatus, "Failed to reset access code.", "error");
        }
      });
    });
  }

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

  if (teamAllenAddJobUi) {
    teamAllenAddJobUi.addEventListener("change", function onAddJobUiChange() {
      settingsApi.getSettings(function onLoaded(current) {
        if (!settingsApi.isTeamAllenActivated(current)) {
          return;
        }
        settingsApi.saveSettings(readSettingsFromForm());
      });
    });
  }
})();
