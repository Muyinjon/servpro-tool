(function initGoogleFormTeamAllen(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  // Form config is now owned by tenantRegistry.js (TENANT_PROFILES["teamallenssm"].googleForm).
  // This module provides the generic POST engine and backward-compat helpers.
  // To support a future team, their entryIds and responseUrl come from their registry profile;
  // the same buildFormBody / submitGoogleFormBackup functions handle them automatically.

  const JOB_STATUS_LABELS = {
    "1": "Estimate",
    "2": "Testing",
    "3": "On Hold",
    "4": "Active",
    "12": "Canceled"
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function resolveJobStatusLabel(value) {
    const key = normalizeText(value);
    return JOB_STATUS_LABELS[key] || "";
  }

  function appendEntry(body, entryId, value) {
    if (!entryId) {
      return;
    }
    body.append("entry." + entryId, normalizeText(value));
  }

  // Generic form body builder — works for any tenant whose form uses the standard 33-field layout.
  // formConfig comes from tenantRegistry TENANT_PROFILES[tier].googleForm.
  function buildFormBody(payload, settings, formConfig) {
    const p = payload || {};
    const fc = formConfig || {};
    const ids = fc.entryIds || {};
    const now = new Date();
    const submittedIso = now.toISOString();
    const submittedLocal = now.toLocaleString();
    const jobStatusValue = normalizeText(p.jobStatus);

    const body = new URLSearchParams();
    appendEntry(body, ids.team, fc.teamLabel || "");
    appendEntry(body, ids.intakeInitials, settings && settings.fnolIntakeInitials);
    appendEntry(body, ids.submittedAtIso, submittedIso);
    appendEntry(body, ids.submittedAtLocal, submittedLocal);
    appendEntry(body, ids.fnolId, p.fnolId);
    appendEntry(body, ids.source, p.source || "fnol");
    appendEntry(body, ids.customerName, p.customerName);
    appendEntry(body, ids.businessName, p.businessName);
    appendEntry(body, ids.primaryPhone, p.primaryPhone);
    appendEntry(body, ids.secondaryPhone, p.secondaryPhone);
    appendEntry(body, ids.email, p.email);
    appendEntry(body, ids.propertyType, p.propertyType);
    appendEntry(body, ids.payType, p.payType);
    appendEntry(body, ids.businessUnit, p.businessUnit);
    appendEntry(body, ids.lossType, p.lossType);
    appendEntry(body, ids.lossTypeValue, p.lossTypeValue);
    appendEntry(body, ids.jobStatus, jobStatusValue);
    appendEntry(body, ids.jobStatusLabel, resolveJobStatusLabel(jobStatusValue));
    appendEntry(body, ids.coordinator, p.coordinator);
    appendEntry(body, ids.coordinatorValue, p.coordinatorValue);
    appendEntry(body, ids.address1, p.address1);
    appendEntry(body, ids.address2, p.address2);
    appendEntry(body, ids.city, p.city);
    appendEntry(body, ids.state, p.state);
    appendEntry(body, ids.zip, p.zip);
    appendEntry(body, ids.addLocation, p.addLocation);
    appendEntry(body, ids.insuranceCarrier, p.insuranceCarrier);
    appendEntry(body, ids.claimNumber, p.claimNumber);
    appendEntry(body, ids.adjusterName, p.adjusterName);
    appendEntry(body, ids.adjusterPhone, p.adjusterPhone);
    appendEntry(body, ids.adjusterEmail, p.adjusterEmail);
    appendEntry(body, ids.notesUser, p.notesUser);
    appendEntry(body, ids.notesMerged, p.notes);
    return body;
  }

  // Generic submission — works for any tenant profile's googleForm config.
  function submitGoogleFormBackup(payload, settings, formConfig, callback) {
    const fc = formConfig || {};
    if (!fc.responseUrl) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const body = buildFormBody(payload, settings, fc);
    if (typeof callback !== "function") {
      callback = function noop() {};
    }
    fetch(fc.responseUrl, {
      method: "POST",
      mode: "no-cors",
      body: body
    })
      .then(function onSent() {
        callback(true);
      })
      .catch(function onError(err) {
        if (global.console && global.console.warn) {
          global.console.warn("Google Form backup failed:", err);
        }
        callback(false);
      });
  }

  // Backward-compat alias: older call sites that reference submitTeamAllenFnolBackup
  // still work; they just resolve the TeamAllen form config from the registry.
  function submitTeamAllenFnolBackup(payload, settings, callback) {
    const registry = root.tenantRegistry;
    const profile = registry && registry.getTenantProfile
      ? registry.getTenantProfile("teamallenssm")
      : null;
    const formConfig = profile && profile.googleForm ? profile.googleForm : null;
    submitGoogleFormBackup(payload, settings, formConfig, callback);
  }

  // Returns true if the active tier has a Google Form and the user has it enabled.
  function shouldSubmitBackup(settings, submitHandler) {
    const registry = root.tenantRegistry;
    const profile = registry && registry.getTenantProfile
      ? registry.getTenantProfile(submitHandler)
      : null;
    if (!profile || !profile.googleForm || !profile.features.googleFormBackup) {
      return false;
    }
    const settingsApi = root.settings;
    if (settingsApi && settingsApi.canUseGoogleFormBackup) {
      return settingsApi.canUseGoogleFormBackup(settings);
    }
    return Boolean(settings && settings.fnolGoogleFormBackup !== false);
  }

  function needsIntakeInitials(settings, submitHandler) {
    if (!shouldSubmitBackup(settings, submitHandler)) {
      return false;
    }
    return !normalizeText(settings.fnolIntakeInitials);
  }

  // Expose constants that other modules previously imported directly.
  // They now come from the registry; read them at access time for fresh data.
  function getTeamAllenFormConfig() {
    const registry = root.tenantRegistry;
    const profile = registry && registry.getTenantProfile
      ? registry.getTenantProfile("teamallenssm")
      : null;
    return profile ? profile.googleForm : null;
  }

  root.googleFormTeamAllen = {
    buildFormBody: buildFormBody,
    submitGoogleFormBackup: submitGoogleFormBackup,
    submitTeamAllenFnolBackup: submitTeamAllenFnolBackup,
    resolveJobStatusLabel: resolveJobStatusLabel,
    shouldSubmitBackup: shouldSubmitBackup,
    needsIntakeInitials: needsIntakeInitials,
    getTeamAllenFormConfig: getTeamAllenFormConfig
  };
})(typeof window !== "undefined" ? window : self);
