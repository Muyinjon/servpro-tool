(function initPopup() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  const selectorsApi = window.ServproUploadExtension && window.ServproUploadExtension.selectors;
  const activationLine = document.getElementById("activationLine");
  const openSettings = document.getElementById("openSettings");
  const openFnol = document.getElementById("openFnol");
  const openAddJob = document.getElementById("openAddJob");
  const popupStatus = document.getElementById("popupStatus");
  const wi =
    (selectorsApi && selectorsApi.WORKCENTER_IMPORT) || {
      teamallenssmAddUrl: "https://teamallenssm.com/jobs1_add.php?",
      teamallenssmListUrl: "https://teamallenssm.com/jobs1_list.php?page=listJobs"
    };

  if (!settingsApi) {
    activationLine.textContent = "Settings module unavailable.";
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

  if (openFnol) {
    openFnol.addEventListener("click", function onOpenFnol() {
      settingsApi.getSettings(function onLoaded(settings) {
        if (!settingsApi.isTeamAllenActivated(settings)) {
          popupStatus.textContent = "Enter access code in Settings first.";
          popupStatus.className = "status error";
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
        popupStatus.textContent = "Enter access code in Settings first.";
        popupStatus.className = "status error";
        return;
      }
      const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
      const targetUrl =
        openVia === "modal" ? wi.teamallenssmListUrl : wi.teamallenssmAddUrl;
      if (openVia === "modal") {
        settingsApi.setPendingAutoSubmit({ autoSave: false, openVia: "modal" }, function onPending() {
          chrome.tabs.create({ url: targetUrl });
          window.close();
        });
        return;
      }
      chrome.tabs.create({ url: targetUrl });
      window.close();
    });
  });

  settingsApi.getSettings(function onLoaded(settings) {
    if (settingsApi.isTeamAllenActivated(settings)) {
      activationLine.textContent = "Access enabled";
      activationLine.className = "sub ok";
      if (openFnol) {
        openFnol.classList.remove("hidden");
      }
      openAddJob.classList.remove("hidden");
      const openVia = settingsApi.resolveTeamAllenOpenVia(settings);
      openAddJob.textContent =
        openVia === "modal" ? "Open jobs list (Add Job popup)" : "Open add job page";
    } else {
      activationLine.textContent = "Enter code in Settings";
      activationLine.className = "sub";
      if (openFnol) {
        openFnol.classList.add("hidden");
      }
      openAddJob.classList.add("hidden");
    }
  });
})();
