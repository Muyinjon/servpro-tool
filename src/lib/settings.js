(function initSettings(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const SETTINGS_KEY = "servproUploadHelper.settings";
  const PENDING_AUTO_SUBMIT_KEY = "servproUploadHelper.pendingTeamAllenAutoSubmit";
  const ACTIVATION_CODE = "TeamAllenSSM";

  const DEFAULT_SETTINGS = {
    teamAllenActivated: false,
    hideListPanel: false,
    hideAddEditHelperPanel: false,
    autoCollapsePanels: true,
    defaultJobModeOnFill: "none",
    fnolAutoSave: true,
    showEditCopyButton: true
  };

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function mergeSettings(stored) {
    const merged = Object.assign({}, DEFAULT_SETTINGS);
    if (stored && typeof stored === "object") {
      Object.keys(DEFAULT_SETTINGS).forEach(function eachKey(key) {
        if (Object.prototype.hasOwnProperty.call(stored, key)) {
          merged[key] = stored[key];
        }
      });
      if (stored.applyReconDefaultsDefault && merged.defaultJobModeOnFill === "none") {
        merged.defaultJobModeOnFill = "recon";
      }
    }
    if (merged.defaultJobModeOnFill !== "recon" && merged.defaultJobModeOnFill !== "mitigation") {
      merged.defaultJobModeOnFill = "none";
    }
    return merged;
  }

  function getSettings(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(mergeSettings(null));
      return;
    }
    storage.get([SETTINGS_KEY], function onLoad(result) {
      callback(mergeSettings(result && result[SETTINGS_KEY]));
    });
  }

  function saveSettings(partial, callback) {
    const storage = getStorage();
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    getSettings(function onLoaded(current) {
      const next = mergeSettings(Object.assign({}, current, partial || {}));
      storage.set({ [SETTINGS_KEY]: next }, function onSaved() {
        if (typeof callback === "function") {
          callback(!global.chrome.runtime.lastError, next);
        }
      });
    });
  }

  function activateWithCode(code, callback) {
    if (String(code || "").trim() === ACTIVATION_CODE) {
      saveSettings({ teamAllenActivated: true }, callback);
      return;
    }
    if (typeof callback === "function") {
      callback(false, mergeSettings(null));
    }
  }

  function setPendingAutoSubmit(enabled, callback) {
    const storage = getStorage();
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const value = enabled
      ? { at: new Date().toISOString(), autoSave: true }
      : null;
    storage.set({ [PENDING_AUTO_SUBMIT_KEY]: value }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError);
      }
    });
  }

  function getPendingAutoSubmit(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null);
      return;
    }
    storage.get([PENDING_AUTO_SUBMIT_KEY], function onLoad(result) {
      callback((result && result[PENDING_AUTO_SUBMIT_KEY]) || null);
    });
  }

  function clearPendingAutoSubmit(callback) {
    setPendingAutoSubmit(false, callback);
  }

  function isTeamAllenActivated(settings) {
    return Boolean(settings && settings.teamAllenActivated);
  }

  root.settings = {
    SETTINGS_KEY,
    PENDING_AUTO_SUBMIT_KEY,
    ACTIVATION_CODE,
    DEFAULT_SETTINGS,
    mergeSettings,
    getSettings,
    saveSettings,
    activateWithCode,
    setPendingAutoSubmit,
    getPendingAutoSubmit,
    clearPendingAutoSubmit,
    isTeamAllenActivated
  };
})(typeof window !== "undefined" ? window : self);
