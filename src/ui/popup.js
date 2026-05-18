(function initPopup() {
  const settingsApi = window.ServproUploadExtension && window.ServproUploadExtension.settings;
  const activationLine = document.getElementById("activationLine");
  const openSettings = document.getElementById("openSettings");
  const openAddJob = document.getElementById("openAddJob");
  const popupStatus = document.getElementById("popupStatus");
  const TEAMALLEN_ADD_URL = "https://teamallenssm.com/jobs1_add.php?";

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

  openAddJob.addEventListener("click", function onOpenAddJob() {
    settingsApi.getSettings(function onLoaded(settings) {
      if (!settingsApi.isTeamAllenActivated(settings)) {
        popupStatus.textContent = "Enter access code in Settings first.";
        popupStatus.className = "status error";
        return;
      }
      chrome.tabs.create({ url: TEAMALLEN_ADD_URL });
      window.close();
    });
  });

  settingsApi.getSettings(function onLoaded(settings) {
    if (settingsApi.isTeamAllenActivated(settings)) {
      activationLine.textContent = "Access enabled";
      activationLine.className = "sub ok";
      openAddJob.classList.remove("hidden");
    } else {
      activationLine.textContent = "Enter code in Settings";
      activationLine.className = "sub";
      openAddJob.classList.add("hidden");
    }
  });
})();
