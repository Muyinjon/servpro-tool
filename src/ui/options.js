(function initOptionsPage() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  if (!settingsApi) {
    return;
  }

  const catalogApi = window.ServproUploadExtension && window.ServproUploadExtension.fnolFieldCatalog;

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
  const teamAllenToolsSection = document.getElementById("teamAllenToolsSection");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsStatus = document.getElementById("settingsStatus");
  const openFnolLink = document.getElementById("openFnolLink");
  const openFnolAdvancedLink = document.getElementById("openFnolAdvancedLink");
  const defaultJobModeOnFill = document.getElementById("defaultJobModeOnFill");
  const teamAllenAddJobUi = document.getElementById("teamAllenAddJobUi");
  const darkModeCheckbox = document.getElementById("darkMode");
  const fnolIntakeInitials = document.getElementById("fnolIntakeInitials");
  const googleFormBackupHeading = document.getElementById("googleFormBackupHeading");
  const googleFormBackupHint = document.getElementById("googleFormBackupHint");
  const fnolAdvancedEnabled = document.getElementById("fnolAdvancedEnabled");

  const teamCheckboxIds = [
    "hideListPanel",
    "hideAddEditHelperPanel",
    "autoCollapsePanels",
    "fnolAutoSave",
    "fnolPasteNotesAfterSave",
    "showEditCopyButton",
    "fnolClearAfterSubmit",
    "fnolCopyOnSubmit",
    "fnolGoogleFormBackup",
    "fnolAddressLookupHelper",
    "snapshotMaxxingEnabled"
  ];

  const snapshotOffsetIds = [
    "snapshotOffsetCustomerCalledMinutes",
    "snapshotOffsetApptStartMinutes",
    "snapshotOffsetApptEndMinutes",
    "snapshotOffsetSiteInspectedMinutes",
    "snapshotOffsetEstimateDeliveredMinutes",
    "snapshotOffsetEstimateApprovedMinutes",
    "snapshotOffsetWaSignedMinutes",
    "snapshotOffsetTargetStartMinutes",
    "snapshotOffsetTargetCompletionMinutes",
    "snapshotOffsetWorkStartMinutes",
    "snapshotOffsetDryingStartedMinutes",
    "snapshotOffsetDryingCompletedMinutes",
    "snapshotOffsetProjectCompletedMinutes"
  ];

  const fnolSelectIds = [
    "fnolDefaultPropertyType",
    "fnolDefaultPayType",
    "fnolDefaultBusinessUnit",
    "fnolDefaultJobStatus"
  ];

  const LEGACY_TO_PRESET = {
    fnolDefaultPropertyType: "propertyType",
    fnolDefaultPayType: "payType",
    fnolDefaultBusinessUnit: "businessUnit",
    fnolDefaultJobStatus: "jobStatus"
  };

  function fnolPageUrl(hash) {
    return chrome.runtime.getURL("fnol.html") + (hash || "");
  }

  function bindOpenFnol(link, hash) {
    if (!link) {
      return;
    }
    link.href = fnolPageUrl(hash);
    link.addEventListener("click", function onOpenFnol(e) {
      e.preventDefault();
      chrome.tabs.create({ url: fnolPageUrl(hash) });
    });
  }

  bindOpenFnol(openFnolLink, "");
  bindOpenFnol(openFnolAdvancedLink, "#advanced");

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

    showEl(teamAllenToolsSection, isTeamAllen);

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

    if (tier !== "none" && tier !== "trial-expired" && fnolAccessStatus) {
      setStatus(fnolAccessStatus, "", "");
    }

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
    return tier;
  }

  function patchActivePresetFromLegacy(settings, partial) {
    if (!catalogApi || !settings || !settings.fnolAdvancedEnabled) {
      return partial;
    }
    const migrated = catalogApi.migrateLegacyIntoActivePreset(settings);
    const presets = catalogApi.normalizePresets(migrated.fnolPresets, migrated);
    const activeId = migrated.fnolActivePresetId || (presets[0] && presets[0].id);
    const nextPresets = presets.map(function mapPreset(preset) {
      if (preset.id !== activeId) {
        return preset;
      }
      const defaults = Object.assign({}, preset.defaults);
      Object.keys(LEGACY_TO_PRESET).forEach(function eachKey(settingKey) {
        if (Object.prototype.hasOwnProperty.call(partial, settingKey)) {
          defaults[LEGACY_TO_PRESET[settingKey]] = partial[settingKey] || "";
        }
      });
      return Object.assign({}, preset, { defaults: defaults });
    });
    return Object.assign({}, partial, {
      fnolPresets: nextPresets,
      fnolActivePresetId: activeId
    });
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
    if (fnolAdvancedEnabled) {
      partial.fnolAdvancedEnabled = fnolAdvancedEnabled.checked;
    }
    snapshotOffsetIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el) {
        const n = Number(el.value);
        partial[id] = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
      }
    });
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
    if (fnolAdvancedEnabled && settings) {
      fnolAdvancedEnabled.checked = Boolean(settings.fnolAdvancedEnabled);
    }
    snapshotOffsetIds.forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el && settings && settings[id] !== undefined) {
        el.value = String(settings[id]);
      }
    });
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
      const partial = readTeamSettingsFromForm();
      settingsApi.saveSettings(patchActivePresetFromLegacy(current, partial));
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
        const partial = readTeamSettingsFromForm();
        settingsApi.saveSettings(
          patchActivePresetFromLegacy(current, partial),
          function onSaved(ok) {
            setStatus(settingsStatus, ok ? "Settings saved." : "Failed to save.", ok ? "ok" : "error");
          }
        );
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

  if (fnolAdvancedEnabled) {
    fnolAdvancedEnabled.addEventListener("change", autoSaveTeamSettings);
  }

  snapshotOffsetIds.forEach(function eachId(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", autoSaveTeamSettings);
      el.addEventListener("blur", autoSaveTeamSettings);
    }
  });

  function closeAccordion(section) {
    if (!section) {
      return;
    }
    section.classList.remove("is-open");
    const toggle = section.querySelector("[data-accordion-toggle]");
    const body = section.querySelector(".sp-accordion-body");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    if (body) {
      body.hidden = true;
    }
  }

  function openAccordion(section) {
    if (!section) {
      return;
    }
    section.classList.add("is-open");
    const toggle = section.querySelector("[data-accordion-toggle]");
    const body = section.querySelector(".sp-accordion-body");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
    if (body) {
      body.hidden = false;
    }
  }

  function initAccordions() {
    const sections = Array.prototype.slice.call(
      document.querySelectorAll("[data-accordion]")
    );
    sections.forEach(function eachSection(section) {
      const toggle = section.querySelector("[data-accordion-toggle]");
      if (!toggle) {
        return;
      }
      toggle.addEventListener("click", function onToggle() {
        const isOpen = section.classList.contains("is-open");
        sections.forEach(closeAccordion);
        if (!isOpen) {
          openAccordion(section);
        }
      });
    });
  }

  initAccordions();
})();
