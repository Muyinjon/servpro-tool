(function initSettings(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const SETTINGS_KEY = "servproUploadHelper.settings";
  const PENDING_AUTO_SUBMIT_KEY = "servproUploadHelper.pendingTeamAllenAutoSubmit";
  const PENDING_NOTES_PASTE_KEY = "servproUploadHelper.pendingTeamAllenNotesPaste";
  const PENDING_STALE_MS = 10 * 60 * 1000;
  const TRIAL_DAYS = 7;
  const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const CONTACT_EMAIL = "Ceoturobov@gmail.com";

  // Registry: code string → tier name.
  // To add a new company: add one entry here.
  const TENANT_CODES = {
    "TeamAllenSSM": "teamallenssm",
    "muyin1234": "trial"
  };

  // Registry: tier name → submit handler name.
  // Tiers absent from this map fall back to the "generic" handler (save + copy, no redirect).
  // To add a new company with its own site integration, add one entry here.
  const TENANT_SUBMIT = {
    "teamallenssm": "teamallenssm"
    // future: "acmecorp": "acmecorp"
  };

  const DEFAULT_SETTINGS = {
    darkMode: false,
    activationTier: "none",
    trialStartedAt: null,
    // kept for backward-compat reads but no longer written as primary flag
    teamAllenActivated: false,
    hideListPanel: false,
    hideAddEditHelperPanel: false,
    autoCollapsePanels: true,
    defaultJobModeOnFill: "none",
    teamAllenAddJobUi: "modal",
    fnolAutoSave: true,
    fnolPasteNotesAfterSave: true,
    showEditCopyButton: true,
    fnolDefaultPropertyType: "",
    fnolDefaultPayType: "",
    fnolDefaultBusinessUnit: "",
    fnolDefaultJobStatus: "",
    fnolClearAfterSubmit: false,
    fnolCopyOnSubmit: false
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

  function resolveActivationTier(record) {
    if (!record) {
      return "none";
    }
    // New-style tier already stored
    const storedTier = String(record.activationTier || "").trim();
    if (storedTier === "teamallenssm" || storedTier === "trial") {
      return storedTier;
    }
    // Backward compat: legacy boolean flag
    if (
      isTruthyFlag(record.teamAllenActivated) ||
      isTruthyFlag(record.activated) ||
      isTruthyFlag(record.teamAllenAccess)
    ) {
      return "teamallenssm";
    }
    return "none";
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
    }

    merged.activationTier = resolveActivationTier(record);
    // Keep legacy flag in sync for any old code that might read it
    merged.teamAllenActivated = merged.activationTier === "teamallenssm";

    if (merged.defaultJobModeOnFill !== "recon" && merged.defaultJobModeOnFill !== "mitigation") {
      merged.defaultJobModeOnFill = "none";
    }
    merged.teamAllenAddJobUi = merged.teamAllenAddJobUi === "page" ? "page" : "modal";

    // Preserve trialStartedAt if present
    if (record && record.trialStartedAt) {
      merged.trialStartedAt = record.trialStartedAt;
    } else {
      merged.trialStartedAt = null;
    }

    return merged;
  }

  // --- Tier helpers ---

  function getActivationTier(settings) {
    const merged = mergeSettings(settings);
    return merged.activationTier || "none";
  }

  function isTrialExpired(settings) {
    const merged = mergeSettings(settings);
    if (merged.activationTier !== "trial") {
      return false;
    }
    if (!merged.trialStartedAt) {
      return false;
    }
    const at = Date.parse(merged.trialStartedAt);
    if (Number.isNaN(at)) {
      return false;
    }
    return Date.now() - at > TRIAL_MS;
  }

  function isTrialActivated(settings) {
    const merged = mergeSettings(settings);
    return merged.activationTier === "trial" && !isTrialExpired(merged);
  }

  function isTeamAllenActivated(settings) {
    const merged = mergeSettings(settings);
    return merged.activationTier === "teamallenssm";
  }

  function isAnyActivated(settings) {
    return isTrialActivated(settings) || isTeamAllenActivated(settings);
  }

  function getTrialDaysRemaining(settings) {
    const merged = mergeSettings(settings);
    if (merged.activationTier !== "trial" || !merged.trialStartedAt) {
      return 0;
    }
    const at = Date.parse(merged.trialStartedAt);
    if (Number.isNaN(at)) {
      return 0;
    }
    const msLeft = TRIAL_MS - (Date.now() - at);
    if (msLeft <= 0) {
      return 0;
    }
    return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  }

  // --- Pending options ---

  function normalizePendingOptions(options) {
    if (options === true) {
      return { autoSave: true, openVia: "page", consumedListClick: true };
    }
    if (!options || typeof options !== "object") {
      return null;
    }
    return {
      autoSave: Boolean(options.autoSave),
      openVia: options.openVia === "modal" ? "modal" : "page",
      consumedListClick: options.consumedListClick === true
    };
  }

  function isPendingStaleOnList(pending) {
    if (!pending || pending.openVia !== "modal") {
      return false;
    }
    if (pending.consumedListClick === undefined) {
      return true;
    }
    if (!pending.at) {
      return true;
    }
    const at = Date.parse(pending.at);
    if (Number.isNaN(at)) {
      return true;
    }
    return Date.now() - at > PENDING_STALE_MS;
  }

  // --- Storage helpers ---

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
    const trimmed = String(code || "").trim();
    const tier = TENANT_CODES[trimmed];
    if (!tier) {
      if (typeof callback === "function") {
        callback(false, mergeSettings(null));
      }
      return;
    }
    getSettings(function onLoaded(current) {
      const patch = { activationTier: tier };
      // Only set trialStartedAt the first time a trial code is entered
      if (tier === "trial" && !current.trialStartedAt) {
        patch.trialStartedAt = new Date().toISOString();
      }
      saveSettings(patch, callback);
    });
  }

  function resetActivation(callback) {
    saveSettings({ activationTier: "none", teamAllenActivated: false, trialStartedAt: null }, callback);
  }

  function resolveTeamAllenOpenVia(settings) {
    const merged = mergeSettings(settings);
    return merged.teamAllenAddJobUi === "page" ? "page" : "modal";
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
          openVia: normalized.openVia,
          consumedListClick: normalized.consumedListClick === true
        }
      : null;
    storage.set({ [PENDING_AUTO_SUBMIT_KEY]: value }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError);
      }
    });
  }

  function patchPendingAutoSubmit(partial, callback) {
    const storage = getStorage();
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    getPendingAutoSubmit(function onPending(pending) {
      if (!pending) {
        if (typeof callback === "function") {
          callback(false);
        }
        return;
      }
      const next = Object.assign({}, pending, partial || {});
      storage.set({ [PENDING_AUTO_SUBMIT_KEY]: next }, function onSaved() {
        if (typeof callback === "function") {
          callback(!global.chrome.runtime.lastError, next);
        }
      });
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

  function setPendingNotesPaste(noteText, callback) {
    const storage = getStorage();
    if (typeof noteText === "function") {
      callback = noteText;
      noteText = "";
    }
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const text = String(noteText || "").trim();
    const value = text
      ? {
          at: new Date().toISOString(),
          text: text
        }
      : null;
    storage.set({ [PENDING_NOTES_PASTE_KEY]: value }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError);
      }
    });
  }

  function getPendingNotesPaste(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null);
      return;
    }
    storage.get([PENDING_NOTES_PASTE_KEY], function onLoad(result) {
      callback((result && result[PENDING_NOTES_PASTE_KEY]) || null);
    });
  }

  function clearPendingNotesPaste(callback) {
    setPendingNotesPaste("", callback);
  }

  function getSubmitHandler(settings) {
    const tier = getActivationTier(settings);
    return TENANT_SUBMIT[tier] || "generic";
  }

  root.settings = {
    SETTINGS_KEY,
    PENDING_AUTO_SUBMIT_KEY,
    PENDING_NOTES_PASTE_KEY,
    TENANT_CODES,
    TENANT_SUBMIT,
    TRIAL_DAYS,
    CONTACT_EMAIL,
    DEFAULT_SETTINGS,
    mergeSettings,
    getSettings,
    saveSettings,
    activateWithCode,
    resetActivation,
    getActivationTier,
    isTrialActivated,
    isTrialExpired,
    isTeamAllenActivated,
    isAnyActivated,
    getTrialDaysRemaining,
    getSubmitHandler,
    setPendingAutoSubmit,
    patchPendingAutoSubmit,
    getPendingAutoSubmit,
    clearPendingAutoSubmit,
    isPendingStaleOnList,
    PENDING_STALE_MS,
    setPendingNotesPaste,
    getPendingNotesPaste,
    clearPendingNotesPaste,
    resolveTeamAllenOpenVia
  };
})(typeof window !== "undefined" ? window : self);
