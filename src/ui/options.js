(function initOptionsPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const activationActiveBlock = document.getElementById("activationActiveBlock");
  const activationForm = document.getElementById("activationForm");
  const activationCode = document.getElementById("activationCode");
  const activateBtn = document.getElementById("activateBtn");
  const resetActivationBtn = document.getElementById("resetActivationBtn");
  const activationStatus = document.getElementById("activationStatus");
  const teamToolsSection = document.getElementById("teamToolsSection");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsStatus = document.getElementById("settingsStatus");
  const openFnolLink = document.getElementById("openFnolLink");
  const defaultJobModeOnFill = document.getElementById("defaultJobModeOnFill");
  const teamAllenAddJobUi = document.getElementById("teamAllenAddJobUi");
  const darkModeCheckbox = document.getElementById("darkMode");

  const teamCheckboxIds = [
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
    el.className = "sp-status" + (kind ? " " + kind : "");
  }

  function setTeamToolsVisible(activated) {
    if (!teamToolsSection) {
      return;
    }
    if (activated) {
      teamToolsSection.hidden = false;
      teamToolsSection.classList.remove("sp-hidden");
    } else {
      teamToolsSection.hidden = true;
      teamToolsSection.classList.add("sp-hidden");
    }
    if (activationActiveBlock) {
      if (activated) {
        activationActiveBlock.classList.remove("sp-hidden");
        if (activationForm) {
          activationForm.style.display = "none";
        }
      } else {
        activationActiveBlock.classList.add("sp-hidden");
        if (activationForm) {
          activationForm.style.display = "block";
        }
      }
    }
  }

  function readPublicSettingsFromForm() {
    return {
      darkMode: darkModeCheckbox ? darkModeCheckbox.checked : false
    };
  }

  function readTeamSettingsFromForm() {
    const partial = {};
    teamCheckboxIds.forEach(function eachId(id) {
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
    if (darkModeCheckbox && settings) {
      darkModeCheckbox.checked = Boolean(settings.darkMode);
    }
    teamCheckboxIds.forEach(function eachId(id) {
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
    setTeamToolsVisible(settingsApi.isTeamAllenActivated(settings));
  }

  function savePublicSettings() {
    settingsApi.saveSettings(readPublicSettingsFromForm());
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

  if (darkModeCheckbox) {
    darkModeCheckbox.addEventListener("change", function onDarkModeChange() {
      savePublicSettings();
    });
  }

  activateBtn.addEventListener("click", function onActivate() {
    settingsApi.activateWithCode(activationCode.value, function onDone(ok, settings) {
      if (ok) {
        setStatus(activationStatus, "Team tools unlocked.", "ok");
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
          setStatus(activationStatus, "Access code cleared.", "ok");
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
        setStatus(settingsStatus, "Enter team access code first.", "error");
        return;
      }
      settingsApi.saveSettings(readTeamSettingsFromForm(), function onSaved(ok) {
        setStatus(settingsStatus, ok ? "Import settings saved." : "Failed to save.", ok ? "ok" : "error");
      });
    });
  });

  teamCheckboxIds.forEach(function eachId(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", function onToggle() {
        settingsApi.getSettings(function onLoaded(current) {
          if (!settingsApi.isTeamAllenActivated(current)) {
            return;
          }
          settingsApi.saveSettings(readTeamSettingsFromForm());
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
        settingsApi.saveSettings(readTeamSettingsFromForm());
      });
    });
  }

  if (teamAllenAddJobUi) {
    teamAllenAddJobUi.addEventListener("change", function onAddJobUiChange() {
      settingsApi.getSettings(function onLoaded(current) {
        if (!settingsApi.isTeamAllenActivated(current)) {
          return;
        }
        settingsApi.saveSettings(readTeamSettingsFromForm());
      });
    });
  }
})();
