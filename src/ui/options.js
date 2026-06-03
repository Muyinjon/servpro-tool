(function initOptionsPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const upsellBlock = document.getElementById("upsellBlock");
  const trialActiveBlock = document.getElementById("trialActiveBlock");
  const trialActiveStatus = document.getElementById("trialActiveStatus");
  const activationActiveBlock = document.getElementById("activationActiveBlock");
  const activationForm = document.getElementById("activationForm");
  const activationCode = document.getElementById("activationCode");
  const activateBtn = document.getElementById("activateBtn");
  const resetActivationBtn = document.getElementById("resetActivationBtn");
  const resetActivationBtn2 = document.getElementById("resetActivationBtn2");
  const activationStatus = document.getElementById("activationStatus");
  const fnolAccessStatus = document.getElementById("fnolAccessStatus");
  const activationCard = document.getElementById("activationCard");
  const teamAllenToolsSection = document.getElementById("teamAllenToolsSection");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsStatus = document.getElementById("settingsStatus");
  const openFnolLink = document.getElementById("openFnolLink");
  const defaultJobModeOnFill = document.getElementById("defaultJobModeOnFill");
  const teamAllenAddJobUi = document.getElementById("teamAllenAddJobUi");
  const darkModeCheckbox = document.getElementById("darkMode");

  // Selects for new FNOL default settings
  const fnolDefaultPropertyType = document.getElementById("fnolDefaultPropertyType");
  const fnolDefaultPayType = document.getElementById("fnolDefaultPayType");
  const fnolDefaultBusinessUnit = document.getElementById("fnolDefaultBusinessUnit");
  const fnolDefaultJobStatus = document.getElementById("fnolDefaultJobStatus");
  const fnolIntakeInitials = document.getElementById("fnolIntakeInitials");
  const googleFormBackupHeading = document.getElementById("googleFormBackupHeading");
  const googleFormBackupHint = document.getElementById("googleFormBackupHint");

  const teamCheckboxIds = [
    "hideListPanel",
    "hideAddEditHelperPanel",
    "autoCollapsePanels",
    "fnolAutoSave",
    "fnolPasteNotesAfterSave",
    "showEditCopyButton",
    "fnolClearAfterSubmit",
    "fnolCopyOnSubmit",
    "fnolGoogleFormBackup"
  ];

  // All team-settings selects (besides the two legacy ones)
  const fnolSelectIds = [
    "fnolDefaultPropertyType",
    "fnolDefaultPayType",
    "fnolDefaultBusinessUnit",
    "fnolDefaultJobStatus"
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

  function showEl(el, visible) {
    if (!el) {
      return;
    }
    if (visible) {
      el.hidden = false;
      el.classList.remove("sp-hidden");
    } else {
      el.hidden = true;
      el.classList.add("sp-hidden");
    }
  }

  function setToolSectionsVisible(tier, settings) {
    const isTeamAllen = tier === "teamallenssm";

    // TeamAllen-only settings section
    showEl(teamAllenToolsSection, isTeamAllen);

    // Activation card state
    const isNone = tier === "none" || tier === "trial-expired";
    showEl(upsellBlock, isNone);
    showEl(activationForm, isNone);
    showEl(trialActiveBlock, tier === "trial-active");
    showEl(activationActiveBlock, isTeamAllen);

    if (tier === "trial-active" && trialActiveStatus && settings) {
      const days = settingsApi.getTrialDaysRemaining(settings);
      trialActiveStatus.textContent =
        days === 1
          ? "Trial active \u2014 1 day remaining."
          : days > 0
            ? "Trial active \u2014 " + days + " days remaining."
            : "Trial active \u2014 expiring today.";
    }

    if (tier === "trial-expired" && activationStatus) {
      setStatus(
        activationStatus,
        "Your trial has expired. Email " + (settingsApi.CONTACT_EMAIL || "Ceoturobov@gmail.com") +
          " to get a full access code.",
        "error"
      );
    }

    // Clear the FNOL access status message when tier is now active
    if (tier !== "none" && tier !== "trial-expired" && fnolAccessStatus) {
      setStatus(fnolAccessStatus, "", "");
    }

    // Dynamic Google Form backup heading and hint from tenant registry
    const activeTier = settings ? settingsApi.getActivationTier(settings) : tier;
    const profile = settingsApi.getTenantProfile && settingsApi.getTenantProfile(activeTier);
    if (profile) {
      if (googleFormBackupHeading) {
        googleFormBackupHeading.textContent = "Google Form backup \u2014 " + profile.displayName;
      }
      if (googleFormBackupHint) {
        googleFormBackupHint.textContent =
          "Sends each FNOL submit to the " + profile.displayName +
          " backup Google Form. Set your initials so the Sheet shows who did intake.";
      }
    } else {
      if (googleFormBackupHeading) {
        googleFormBackupHeading.textContent = "Google Form backup";
      }
      if (googleFormBackupHint) {
        googleFormBackupHint.textContent =
          "Sends each FNOL submit to your team\u2019s backup Google Form. " +
          "Set your initials so the Sheet shows who did intake.";
      }
    }
  }

  function resolveTierUiState(settings) {
    const tier = settingsApi.getActivationTier(settings);
    if (tier === "trial") {
      return settingsApi.isTrialExpired(settings) ? "trial-expired" : "trial-active";
    }
    return tier; // "none" or "teamallenssm"
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
    fnolSelectIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el) {
        partial[id] = el.value || "";
      }
    });
    if (fnolIntakeInitials) {
      partial.fnolIntakeInitials = String(fnolIntakeInitials.value || "").trim();
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
    fnolSelectIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el && settings && settings[id] !== undefined) {
        el.value = settings[id] || "";
      }
    });
    if (fnolIntakeInitials && settings) {
      fnolIntakeInitials.value = settings.fnolIntakeInitials || "";
    }
    setToolSectionsVisible(resolveTierUiState(settings), settings);
  }

  function savePublicSettings() {
    settingsApi.saveSettings(readPublicSettingsFromForm());
  }

  function autoSaveTeamSettings() {
    settingsApi.getSettings(function onLoaded(current) {
      if (!settingsApi.isTeamAllenActivated(current)) {
        return;
      }
      settingsApi.saveSettings(readTeamSettingsFromForm());
    });
  }

  function applyTrialUpgradeMailto() {
    const trialUpgradeEmail = document.getElementById("trialUpgradeEmail");
    if (!trialUpgradeEmail) {
      return;
    }
    const email = settingsApi.CONTACT_EMAIL || "Ceoturobov@gmail.com";
    trialUpgradeEmail.href =
      "mailto:" + email + "?subject=" +
      encodeURIComponent("ServPro Helper — Full access / Google Form setup");
    trialUpgradeEmail.textContent = email;
  }

  settingsApi.getSettings(function onLoad(settings) {
    applySettingsToForm(settings);
    applyTrialUpgradeMailto();
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
        setStatus(activationStatus, "", "");
        if (activationCode) {
          activationCode.value = "";
        }
        applySettingsToForm(settings);
        const tier = settingsApi.getActivationTier(settings);
        if (tier === "trial") {
          setStatus(activationStatus, "Trial activated!", "ok");
        } else {
          setStatus(activationStatus, "Team tools unlocked.", "ok");
        }
      } else {
        setStatus(activationStatus, "Invalid code.", "error");
      }
    });
  });

  function doReset() {
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
  }

  if (resetActivationBtn) {
    resetActivationBtn.addEventListener("click", doReset);
  }
  if (resetActivationBtn2) {
    resetActivationBtn2.addEventListener("click", doReset);
  }

  activationCode.addEventListener("keydown", function onKey(e) {
    if (e.key === "Enter") {
      activateBtn.click();
    }
  });

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", function onSave() {
      settingsApi.getSettings(function onLoaded(current) {
        if (!settingsApi.isTeamAllenActivated(current)) {
          setStatus(settingsStatus, "These settings require a full team access code.", "error");
          return;
        }
        settingsApi.saveSettings(readTeamSettingsFromForm(), function onSaved(ok) {
          setStatus(settingsStatus, ok ? "Settings saved." : "Failed to save.", ok ? "ok" : "error");
        });
      });
    });
  }

  teamCheckboxIds.forEach(function eachId(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", autoSaveTeamSettings);
    }
  });

  fnolSelectIds.forEach(function eachId(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", autoSaveTeamSettings);
    }
  });

  if (defaultJobModeOnFill) {
    defaultJobModeOnFill.addEventListener("change", autoSaveTeamSettings);
  }

  if (teamAllenAddJobUi) {
    teamAllenAddJobUi.addEventListener("change", autoSaveTeamSettings);
  }

  if (fnolIntakeInitials) {
    fnolIntakeInitials.addEventListener("change", autoSaveTeamSettings);
    fnolIntakeInitials.addEventListener("blur", autoSaveTeamSettings);
  }
})();
