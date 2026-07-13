(function initWorkcenterFields(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const WORKCENTER_SELECTORS = {
    projectName: { id: "MainContent_JobInfoHeader1_lblJobName", kind: "text" },
    franchiseName: { id: "MainContent_JobInfoHeader1_lblJobSite", kind: "text" },
    primaryContact: { id: "MainContent_JobInfoHeader1_txt_PrimaryContact", kind: "text" },
    secondaryContact: { id: "MainContent_JobInfoHeader1_txt_SecondaryContact", kind: "text" },
    emailLink: { id: "MainContent_JobInfoHeader1_link_emailAddress", kind: "emailLink" },
    fullAddress: { id: "MainContent_JobInfoHeader1_txt_FullAddress", kind: "text" },
    lossType: { id: "MainContent_JobInfoHeader1_snap_ListType", kind: "text" },
    causeOfLoss: { id: "MainContent_JobInfoHeader1_snap_CauseOfLoss", kind: "text" },
    // Form claim is primary; header lblJobLotBlock is often empty/hidden.
    claimNumber: { id: "MainContent_txt_LotBlock", kind: "inputValue" },
    claimNumberHeader: { id: "MainContent_JobInfoHeader1_lblJobLotBlock", kind: "text" },
    projectId: { id: "MainContent_txt_JobID", kind: "inputValue" },
    notes: { id: "MainContent_txt_Notes", idEndsWith: "txt_Notes", kind: "inputValue" },
    propertyType: { id: "MainContent_cmb_JobType", idEndsWith: "cmb_JobType", kind: "selectText" },
    // jobCustom* ids are duplicated on wrapper DIVs — prefer name=jobCustomN; also search iframes.
    policyNumber: { id: "jobCustom1", name: "jobCustom1", kind: "inputValue" },
    deductible: { id: "jobCustom2", name: "jobCustom2", kind: "inputValue" },
    // Prefer id$=cmb_Project_Input; fallback ClientState JSON .text / lnk_LoadSelectedProject title.
    insuranceCarrier: {
      id: "ctl00_MainContent_cmb_Project_Input",
      idEndsWith: "cmb_Project_Input",
      clientStateEndsWith: "cmb_Project_ClientState",
      kind: "inputValue"
    },
    address1: { id: "MainContent_txt_Address1", kind: "inputValue" },
    yearBuilt: { id: "MainContent_txt_YearHouseBuilt", kind: "inputValue" },
    yearBuiltRad: { id: "ctl00_MainContent_txt_YearHouseBuilt", kind: "inputValue" },
    building: { id: "MainContent_txt_Bldg", kind: "inputValue" },
    unit: { id: "MainContent_txt_Unit", kind: "inputValue" },
    city: { id: "MainContent_txt_City", kind: "inputValue" },
    state: { id: "MainContent_cmb_StateCD", kind: "selectAbbrev" },
    zip: { id: "MainContent_txt_Zip", kind: "inputValue" },
    coordinator: { id: "ctl00_MainContent_cmb_Staff5_Input", kind: "inputValue" }
  };

  const TEAMALLENSSM_FIELD_MAP = {
    customerName: "value_Customer_1",
    businessName: "value_Business_1",
    primaryPhone: "value_PhonePrimary_1",
    secondaryPhone: "value_PhoneAlternate_1",
    email: "value_EMail_1",
    propertyType: "value_Commercial_1",
    payType: "value_fkJobType_1",
    businessUnit: "value_BusinessUnit_1",
    claimNumber: "value_InsClaimNo_1",
    address1: "value_Address1_",
    address2: "value_Address2_",
    city: "value_City_",
    state: "value_State_",
    zip: "value_Zip_",
    yearBuilt: "value_YearBuilt_",
    addLocation: "value_AddLocation_",
    billAddress: "value_BillAddress_",
    coordinator: "value_Coordinator_1",
    projectManager: "value_fkPrjMan_1",
    reconManager: "value_fkReconManId_1",
    insuranceCarrier: "value_InsuranceCompany_1",
    lossType: "value_fkLossType_1",
    jobStatus: "value_JobStatus_1"
  };

  const LOSS_TYPE_ALIASES = {
    water: "WATER",
    fire: "FIRE",
    mold: "MOLD",
    "bio hazard": "BIO HAZARD",
    biohazard: "BIO HAZARD",
    "board up": "BOARD UP",
    "duct cleaning": "DUCT CLEANING",
    "gen. cleaning": "GEN. CLEANING",
    "general cleaning": "GEN. CLEANING",
    puffback: "PUFFBACK",
    rebuild: "REBUILD",
    recon: "REBUILD",
    sewer: "SEWER",
    smoke: "SMOKE",
    storm: "STORM",
    "structure damage": "STRUCTURE DAMAGE"
  };

  const ADDRESS_GRID_PAGE = "dbo_sp_jobaddresses_listJob";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function stripParenthetical(value) {
    return normalizeText(value).replace(/\s*\([^)]*\)\s*$/, "");
  }

  function mapLossTypeForTeamAllen(value) {
    const key = normalizeKey(value);
    if (!key) {
      return "";
    }
    if (LOSS_TYPE_ALIASES[key]) {
      return LOSS_TYPE_ALIASES[key];
    }
    for (const aliasKey of Object.keys(LOSS_TYPE_ALIASES)) {
      if (key.indexOf(aliasKey) !== -1) {
        return LOSS_TYPE_ALIASES[aliasKey];
      }
    }
    return normalizeText(value).toUpperCase();
  }

  function mapCoordinatorForTeamAllen(value) {
    return stripParenthetical(value);
  }

  function mapAddLocationForTeamAllen(propertyType) {
    const key = normalizeKey(propertyType);
    if (key.indexOf("commercial") !== -1) {
      return "Commercial";
    }
    if (key.indexOf("residential") !== -1) {
      return "Residence";
    }
    return "";
  }

  function mapAddLocationValueForTeamAllen(propertyType) {
    const key = normalizeKey(propertyType);
    if (key.indexOf("commercial") !== -1) {
      return "2";
    }
    if (key.indexOf("residential") !== -1 || key.indexOf("residence") !== -1) {
      return "1";
    }
    return "";
  }

  const INVALID_BUSINESS_NAMES = new Set([
    "name",
    "business",
    "business name",
    "company name",
    "project name",
    "claim number",
    "policy numbr",
    "policy number",
    "property type",
    "insurance carrier",
    "insurance company",
    "loss type",
    "cause of loss",
    "project id",
    "project progress",
    "customer",
    "contact",
    "address",
    "city",
    "state/province",
    "zip/postal",
    "year built",
    "building",
    "unit",
    "country",
    "n/a",
    "na",
    "none",
    "null",
    "undefined"
  ]);

  const WORKCENTER_FIELD_LABEL_PATTERN =
    /^(claim number|project name|project id|property type|policy numbr|insurance carrier|loss type|cause of loss|address|city|state\/province|zip\/postal|year built|building|unit|country|business name|company name)\s*:?/i;

  const INVALID_CLAIM_NUMBERS = new Set([
    "claim number",
    "loss type",
    "loss number",
    "list type",
    "policy numbr",
    "policy number",
    "project name",
    "project id",
    "property type",
    "insurance carrier",
    "cause of loss",
    "n/a",
    "na",
    "none"
  ]);

  function isPlausibleClaimNumber(value) {
    const text = normalizeText(value);
    if (!text || text.length < 3) {
      return false;
    }
    const key = normalizeKey(text);
    if (INVALID_CLAIM_NUMBERS.has(key)) {
      return false;
    }
    if (WORKCENTER_FIELD_LABEL_PATTERN.test(text)) {
      return false;
    }
    if (/^(loss|claim|list)\s*(type|number)\s*:?$/i.test(text)) {
      return false;
    }
    if (!/\d/.test(text)) {
      return false;
    }
    // Allow State Farm-style claims with a colon suffix (e.g. 320H7R728:RECON).
    if (!/^[A-Za-z0-9][A-Za-z0-9:-]*$/.test(text.replace(/\s+/g, ""))) {
      return false;
    }
    return true;
  }

  function isPlausibleBusinessName(value) {
    const text = normalizeText(value);
    if (!text || text.length < 2) {
      return false;
    }
    const key = normalizeKey(text);
    if (INVALID_BUSINESS_NAMES.has(key)) {
      return false;
    }
    if (WORKCENTER_FIELD_LABEL_PATTERN.test(text)) {
      return false;
    }
    if (/^name\s*:?/i.test(text)) {
      return false;
    }
    if (/^business\s*name\s*:?/i.test(text)) {
      return false;
    }
    if (/^project\s*name\s*:?/i.test(text)) {
      return false;
    }
    return true;
  }

  function isFullAddressLine(value) {
    const text = normalizeText(value);
    if (!text) {
      return false;
    }
    const commaCount = (text.match(/,/g) || []).length;
    if (commaCount >= 2) {
      return true;
    }
    return /,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}/.test(text);
  }

  function parseAddress(fullAddress) {
    let raw = normalizeText(fullAddress);
    raw = raw.replace(/,?\s*(USA|U\.S\.A\.|United States)\s*$/i, "");
    if (!raw) {
      return {
        address1: "",
        city: "",
        state: "",
        zip: "",
        country: ""
      };
    }
    const parts = raw.split(",").map(function trimPart(part) {
      return normalizeText(part);
    });
    const address1 = parts[0] || "";
    const city = parts[1] || "";
    const stateZipCountry = parts.slice(2).join(" ");
    const match = stateZipCountry.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*(.*)$/i);
    return {
      address1,
      city,
      state: match ? normalizeText(match[1]) : "",
      zip: match ? normalizeText(match[2]) : "",
      country: match ? normalizeText(match[3]) : ""
    };
  }

  root.workcenterFields = {
    WORKCENTER_SELECTORS,
    TEAMALLENSSM_FIELD_MAP,
    LOSS_TYPE_ALIASES,
    ADDRESS_GRID_PAGE,
    normalizeText,
    normalizeKey,
    stripParenthetical,
    mapLossTypeForTeamAllen,
    mapCoordinatorForTeamAllen,
    mapAddLocationForTeamAllen,
    mapAddLocationValueForTeamAllen,
    isPlausibleBusinessName,
    isPlausibleClaimNumber,
    isFullAddressLine,
    parseAddress
  };
})(window);
