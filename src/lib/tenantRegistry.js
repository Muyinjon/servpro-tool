(function initTenantRegistry(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  // ─── TeamAllen SSM ───────────────────────────────────────────────────────────
  // Google Form: https://docs.google.com/forms/d/e/1FAIpQLSeeVh8IhYFDddum4eTSGd-JFVjxUdM86MFtdp9z8dTVS7naZw/viewform
  // Entry IDs captured 2026-06-03 via FB_PUBLIC_LOAD_DATA_ extraction.
  var TEAMALLENSSM_FORM = {
    formId: "1FAIpQLSeeVh8IhYFDddum4eTSGd-JFVjxUdM86MFtdp9z8dTVS7naZw",
    responseUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSeeVh8IhYFDddum4eTSGd-JFVjxUdM86MFtdp9z8dTVS7naZw/formResponse",
    teamLabel: "TeamAllenSSM",
    entryIds: {
      team: "557877839",
      intakeInitials: "1663431389",
      submittedAtIso: "2012427992",
      submittedAtLocal: "1800928947",
      fnolId: "1254530566",
      source: "2025400599",
      customerName: "1964079271",
      businessName: "2005527105",
      primaryPhone: "1081498974",
      secondaryPhone: "1328887507",
      email: "43255243",
      propertyType: "479005657",
      payType: "1788040439",
      businessUnit: "133109963",
      lossType: "1342898522",
      lossTypeValue: "608949856",
      jobStatus: "84187241",
      jobStatusLabel: "1427098788",
      coordinator: "1005380351",
      coordinatorValue: "1975198778",
      address1: "1590261881",
      address2: "1369365126",
      city: "1286759553",
      state: "1932336798",
      zip: "2022493569",
      addLocation: "1926008928",
      insuranceCarrier: "1202686929",
      claimNumber: "1296570466",
      adjusterName: "1874526809",
      adjusterPhone: "411449463",
      adjusterEmail: "161862103",
      notesUser: "1211854415",
      notesMerged: "1279992290"
    }
  };

  // ─── Tenant profile registry ─────────────────────────────────────────────────
  // To onboard a new team:
  //   1. Add their code → tier to TENANT_CODES in settings.js  (one line)
  //   2. Add a profile block here using that same tier key     (one block)
  //   3. Ship the update — their Settings page and Google Form backup work automatically.
  //
  // Profile shape:
  //   displayName   {string}   shown in Settings UI headings / hints
  //   googleForm    {object|null}  null = no backup form for this tier
  //     .formId       Google Form published ID
  //     .responseUrl  full formResponse URL
  //     .teamLabel    value sent in the "Team" column
  //     .entryIds     map of logical field → numeric entry ID
  //   submitHandler  {string}  matches TENANT_SUBMIT key; "generic" = save+copy only
  //   features       {object}  capability flags
  //     .googleFormBackup    {boolean}
  //     .teamAllenAutofill   {boolean}
  var TENANT_PROFILES = {
    "teamallenssm": {
      displayName: "TeamAllen SSM",
      googleForm: TEAMALLENSSM_FORM,
      submitHandler: "teamallenssm",
      features: {
        googleFormBackup: true,
        teamAllenAutofill: true
      }
    }
    // ── Future team example ──────────────────────────────────────────────────
    // "acmecorp": {
    //   displayName: "Acme Corp",
    //   googleForm: {
    //     formId: "...",
    //     responseUrl: "https://docs.google.com/forms/d/e/.../formResponse",
    //     teamLabel: "AcmeCorp",
    //     entryIds: { team: "...", customerName: "...", ... }
    //   },
    //   submitHandler: "generic",
    //   features: { googleFormBackup: true, teamAllenAutofill: false }
    // }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function getTenantProfile(tier) {
    if (!tier || tier === "none" || tier === "trial") {
      return null;
    }
    return TENANT_PROFILES[tier] || null;
  }

  function getActiveTenantProfile(settings, settingsApi) {
    if (!settingsApi || !settingsApi.getActivationTier) {
      return null;
    }
    var tier = settingsApi.getActivationTier(settings);
    return getTenantProfile(tier);
  }

  function getTenantDisplayName(tier) {
    var profile = getTenantProfile(tier);
    return profile ? profile.displayName : "";
  }

  root.tenantRegistry = {
    TENANT_PROFILES: TENANT_PROFILES,
    getTenantProfile: getTenantProfile,
    getActiveTenantProfile: getActiveTenantProfile,
    getTenantDisplayName: getTenantDisplayName
  };
})(typeof window !== "undefined" ? window : self);
