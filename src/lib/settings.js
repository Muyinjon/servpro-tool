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
    teamAllenAddJobUi: "modal",
    fnolAutoSave: true,
    showEditCopyButton: true
  };

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function isTruthyFlag(value) {
    return (
      value === true ||
      value === 1 ||
      String(value || "").trim().toLowerCase() === "true"
    );
  }

  function normalizeStoredRecord(raw) {
    if (raw == null) {
      return null;
    }
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (isTruthyFlag(trimmed)) {
        return { teamAllenActivated: true };
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    if (typeof raw === "object") {
      return raw;
    }
    return null;
  }

  function mergeSettings(stored) {
    const merged = Object.assign({}, DEFAULT_SETTINGS);
    const record = normalizeStoredRecord(stored);
    if (record) {
      Object.keys(DEFAULT_SETTINGS).forEach(function eachKey(key) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          merged[key] = record[key];
        }
      });
      if (record.applyReconDefaultsDefault && merged.defaultJobModeOnFill === "none") {
        merged.defaultJobModeOnFill = "recon";
      }
      if (!isTruthyFlag(merged.teamAllenActivated)) {
        if (isTruthyFlag(record.activated)) {
          merged.teamAllenActivated = true;
        } else if (isTruthyFlag(record.teamAllenAccess)) {
          merged.teamAllenActivated = true;
        }
      }
    }
    if (merged.defaultJobModeOnFill !== "recon" && merged.defaultJobModeOnFill !== "mitigation") {
      merged.defaultJobModeOnFill = "none";
    }
    merged.teamAllenAddJobUi = merged.teamAllenAddJobUi === "page" ? "page" : "modal";
    merged.teamAllenActivated = isTruthyFlag(merged.teamAllenActivated);
    return merged;
  }

  function normalizePendingOptions(options) {
    if (options === true) {
      return { autoSave: true, openVia: "page" };
    }
    if (!options || typeof options !== "object") {
      return null;
    }
    return {
      autoSave: Boolean(options.autoSave),
      openVia: options.openVia === "modal" ? "modal" : "page"
    };
  }

  function getSettings(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(mergeSettings(null));
      return;
    }
    storage.get([SETTINGS_KEY], function onLoad(result) {
      const merged = mergeSettings(result && result[SETTINGS_KEY]);
      if (!merged.teamAllenActivated) {
        callback(merged);
        return;
      }
      const raw = result && result[SETTINGS_KEY];
      const rawRecord = normalizeStoredRecord(raw);
      if (rawRecord && !isTruthyFlag(rawRecord.teamAllenActivated)) {
        saveSettings({ teamAllenActivated: true }, function onMigrated() {
          callback(mergeSettings(Object.assign({}, rawRecord, { teamAllenActivated: true })));
        });
        return;
      }
      callback(merged);
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

  function setPendingAutoSubmit(options, callback) {
    const storage = getStorage();
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const normalized = normalizePendingOptions(options);
    const value = normalized
      ? {
          at: new Date().toISOString(),
          autoSave: normalized.autoSave,
          openVia: normalized.openVia
        }
      : null;
    storage.set({ [PENDING_AUTO_SUBMIT_KEY]: value }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError);
      }
    });
  }

  function resolveTeamAllenOpenVia(settings) {
    const merged = mergeSettings(settings);
    return merged.teamAllenAddJobUi === "page" ? "page" : "modal";
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
    const merged = mergeSettings(settings);
    return merged.teamAllenActivated === true;
  }

  function resetActivation(callback) {
    saveSettings({ teamAllenActivated: false }, callback);
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
    resolveTeamAllenOpenVia,
    resetActivation,
    isTeamAllenActivated
  };
})(typeof window !== "undefined" ? window : self);
