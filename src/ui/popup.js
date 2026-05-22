(function initPopup() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  const selectorsApi = window.ServproUploadExtension && window.ServproUploadExtension.selectors;
  const activationLine = document.getElementById("activationLine");
  const openSettings = document.getElementById("openSettings");
  const openFnol = document.getElementById("openFnol");
  const openAddJob = document.getElementById("openAddJob");
  const popupStatus = document.getElementById("popupStatus");
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
        if (!settingsApi.isTeamAllenActivated(settings)) {
          popupStatus.textContent = "Enter team access code in Settings first.";
          popupStatus.className = "popup-status error";
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
        popupStatus.textContent = "Enter team access code in Settings first.";
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
    if (settingsApi.isTeamAllenActivated(settings)) {
      activationLine.textContent = "Team tools unlocked";
      activationLine.className = "popup-sub ok";
      if (openFnol) {
        openFnol.classList.remove("hidden");
      }
      openAddJob.classList.remove("hidden");
      const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
      openAddJob.textContent =
        openVia === "modal" ? "Open jobs list" : "Open new job page";
    } else {
      activationLine.textContent = "Enter access code in Settings";
      activationLine.className = "popup-sub";
      if (openFnol) {
        openFnol.classList.add("hidden");
      }
      openAddJob.classList.add("hidden");
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
