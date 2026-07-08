(function initTheme(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const settingsApi = root.settings;

  function applyTheme(settings) {
    const merged = settingsApi ? settingsApi.mergeSettings(settings) : settings || {};
    const theme = merged.darkMode ? "dark" : "light";
    const doc = global.document;
    if (doc && doc.documentElement) {
      doc.documentElement.dataset.servproTheme = theme;
    }
    if (doc && doc.body) {
      doc.body.dataset.servproTheme = theme;
    }
    return theme;
  }

  function applyThemeToPanel(panel, settings) {
    if (!panel) {
      return;
    }
    const merged = settingsApi ? settingsApi.mergeSettings(settings) : settings || {};
    panel.dataset.servproTheme = merged.darkMode ? "dark" : "light";
  }

  function initThemeOnPage() {
    if (!settingsApi) {
      applyTheme(null);
      return;
    }
    settingsApi.getSettings(function onLoad(settings) {
      applyTheme(settings);
    });
    if (global.chrome && global.chrome.storage && global.chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function onChanged(changes, areaName) {
        if (areaName !== "local" || !changes[settingsApi.SETTINGS_KEY]) {
          return;
        }
        applyTheme(settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue));
      });
    }
  }

  root.theme = {
    applyTheme,
    applyThemeToPanel,
    initThemeOnPage
  };

  if (global.document && global.document.documentElement) {
    initThemeOnPage();
  }
})(typeof window !== "undefined" ? window : self);
