(function initPopup() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  const selectorsApi = window.ServproUploadExtension && window.ServproUploadExtension.selectors;
  const activationLine = document.getElementById("activationLine");
  const openSettings = document.getElementById("openSettings");
  const openFnol = document.getElementById("openFnol");
  const openAddJob = document.getElementById("openAddJob");
  const popupStatus = document.getElementById("popupStatus");
  const popupUpsell = document.getElementById("popupUpsell");
  const popupDarkMode = document.getElementById("popupDarkMode");
  const wi =
    (selectorsApi && selectorsApi.WORKCENTER_IMPORT) || {
      teamallenssmAddUrl: "https://teamallenssm.com/jobs1_add.php?",
      teamallenssmListUrl: "https://teamallenssm.com/jobs1_list.php?page=listJobs"
    };

  if (!settingsApi) {
    activationLine.textContent = "Settings unavailable.";
    return;
  }

  openSettings.addEventListener("click", function onOpen(e) {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
    window.close();
  });

  function fnolPageUrl() {
    return chrome.runtime.getURL("fnol.html");
  }

  if (popupDarkMode) {
    popupDarkMode.addEventListener("change", function onDarkToggle() {
      settingsApi.saveSettings({ darkMode: popupDarkMode.checked });
    });
  }

  if (openFnol) {
    openFnol.addEventListener("click", function onOpenFnol() {
      settingsApi.getSettings(function onLoaded(settings) {
        if (!settingsApi.isAnyActivated(settings)) {
          const email = settingsApi.CONTACT_EMAIL || "Ceoturobov@gmail.com";
          popupStatus.textContent = "Access code required. Email " + email + " for a code.";
          popupStatus.className = "popup-status error";
          if (popupUpsell) {
            popupUpsell.classList.remove("hidden");
          }
          return;
        }
        chrome.tabs.create({ url: fnolPageUrl() });
        window.close();
      });
    });
  }

  openAddJob.addEventListener("click", function onOpenAddJob() {
    settingsApi.getSettings(function onLoaded(settings) {
      if (!settingsApi.isTeamAllenActivated(settings)) {
        popupStatus.textContent = "This requires a full team access code.";
        popupStatus.className = "popup-status error";
        return;
      }
      const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
      const targetUrl =
        openVia === "modal" ? wi.teamallenssmListUrl : wi.teamallenssmAddUrl;
      chrome.tabs.create({ url: targetUrl });
      window.close();
    });
  });

  function applyPopupState(settings) {
    if (popupDarkMode) {
      popupDarkMode.checked = Boolean(settings.darkMode);
    }

    const tier = settingsApi.getActivationTier(settings);
    const isTeamAllen = settingsApi.isTeamAllenActivated(settings);
    const isTrial = settingsApi.isTrialActivated(settings);
    const isExpired = tier === "trial" && settingsApi.isTrialExpired(settings);
    const anyActive = isTeamAllen || isTrial;

    // Activation line
    if (isTeamAllen) {
      activationLine.textContent = "Team tools unlocked";
      activationLine.className = "popup-sub ok";
    } else if (isTrial) {
      const days = settingsApi.getTrialDaysRemaining(settings);
      activationLine.textContent =
        days === 1
          ? "Trial \u2014 1 day left"
          : days > 0
            ? "Trial \u2014 " + days + " days left"
            : "Trial \u2014 expiring today";
      activationLine.className = "popup-sub ok";
    } else if (isExpired) {
      activationLine.textContent = "Trial expired \u2014 open Settings";
      activationLine.className = "popup-sub error";
    } else {
      activationLine.textContent = "Enter access code in Settings";
      activationLine.className = "popup-sub";
    }

    // FNOL button — always visible; click handler handles gating

    // Add Job button — TeamAllen only
    if (isTeamAllen) {
      openAddJob.classList.remove("hidden");
      const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
      openAddJob.textContent =
        openVia === "modal" ? "Open jobs list" : "Open new job page";
    } else {
      openAddJob.classList.add("hidden");
    }

    // Upsell footer — shown when no active tier
    if (popupUpsell) {
      if (!anyActive) {
        popupUpsell.classList.remove("hidden");
      } else {
        popupUpsell.classList.add("hidden");
      }
    }
  }

  settingsApi.getSettings(function onLoaded(settings) {
    applyPopupState(settings);
  });

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function onChanged(changes, areaName) {
      if (areaName !== "local" || !changes[settingsApi.SETTINGS_KEY]) {
        return;
      }
      applyPopupState(settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue));
    });
  }
})();
