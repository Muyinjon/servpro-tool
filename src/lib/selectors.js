(function initSelectors(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const ATTACHMENT_IMAGE_TYPES = [
    "Aerial",
    "Affected Area After",
    "Affected Area Before",
    "Cabinets and Countertops",
    "Cause of Loss",
    "Contents Storage",
    "Daily Departure",
    "Demolition",
    "DocuSketch 360 Photo",
    "DocuSketch 360 Still Image",
    "DocuSketch Sketch",
    "DocuSketch Sketch Photo",
    "Dumpster/Bagged Debris",
    "Front of Structure",
    "Material Reading Photo",
    "Other Image",
    "Post Mitigation",
    "PPE",
    "Pre-Construction",
    "Pre-Mitigation",
    "Removed Material",
    "Room Visit Image",
    "Subrogation",
    "Xactimate Sketch"
  ];

  const MISC_DOCUMENT_TYPES = [
    "External Document",
    "Drying Report",
    "Subcontract Invoice",
    "Final Content Inventory",
    "Invoice",
    "Initial Excel Spreadsheet - Calculator",
    "Estimate",
    "Mobile Sketch Json",
    "Mobile Sketch ESX",
    "Mobile Sketch XML"
  ];

  const SELECTORS = {
    docsFramePathHints: [
      "/Jobs/ServeProDocuments",
      "/Jobs/JobDocuments"
    ],
    docsFrameIframe: [
      'iframe[src*="/Jobs/ServeProDocuments"]',
      'iframe[src*="/Jobs/JobDocuments"]'
    ],
    uploadArea: [
      "#importDialog",
      "#importDialog[role='dialog']",
      ".upload-wrapper",
      "#imageAttachmentsWrapper",
      ".k-upload-files",
      "[id*='upload']",
      "[class*='upload']",
      "[class*='Upload']",
      "[id*='document']",
      "[class*='document']",
      "[class*='Document']",
      "table",
      ".k-grid",
      ".RadGrid"
    ],
    rowCandidates: [
      "#importDialog ul.k-upload-files > li.k-file",
      "#importDialog .k-upload-files > li.k-file",
      ".k-upload-files > li.k-file",
      "li.k-file",
      "tr",
      ".k-grid-content tr",
      ".k-master-row",
      ".document-row",
      ".upload-row",
      ".file-row",
      "[data-uid]"
    ],
    fileNameHints: [
      "[data-filename]",
      ".file-wrapper [data-filename]",
      "[id*='fileName']",
      "[id*='filename']",
      "[class*='file-name']",
      "[class*='filename']",
      "[title]"
    ],
    dropdownHosts: [
      '#importDialog span[data-role="dropdownlist"][aria-owns*="_imageType_listbox"]',
      'span[data-role="dropdownlist"][aria-owns*="_imageType_listbox"]',
      'span[data-role="dropdownlist"][aria-controls*="_imageType_listbox"]',
      ".imageTypes.fileRow-dropdown.k-dropdown",
      "span.k-widget.k-dropdown.imageTypes.fileRow-dropdown",
      'span[aria-owns*="_imageType_listbox"]',
      'span[aria-controls*="_imageType_listbox"]',
      '.k-widget.k-dropdown',
      '[role="listbox"][aria-haspopup="true"]',
      '[role="listbox"][aria-haspopup="listbox"]',
      '[data-role="dropdownlist"]',
      'span[aria-owns$="_imageType_listbox"]',
      'span[aria-controls$="_imageType_listbox"]',
      '[id*="imageType"]'
    ],
    popupListItems: [
      ".k-animation-container .k-item",
      ".k-list-container .k-item",
      "ul.k-list li.k-item"
    ]
  };

  const FLOWS = {
    attachments: {
      key: "attachments",
      panelId: "servpro-upload-helper-panel",
      panelTitle: "Servpro Upload Helper",
      buttonLabel: "Apply to all visible uploads",
      storageKey: "servproUploadHelper.lastImageType",
      types: ATTACHMENT_IMAGE_TYPES,
      dialogSelectors: [
        "#importDialog",
        '.k-window[aria-labelledby="importDialog_wnd_title"]',
        '.k-window-content[aria-labelledby="importDialog_wnd_title"]'
      ],
      windowTitleId: "importDialog_wnd_title",
      uploadMarkers: [
        "#importDialog",
        "#imageAttachmentsWrapper",
        "input[name='imageAttachments']",
        "#importDialog ul.k-upload-files > li.k-file"
      ],
      rowSelectors: [
        "#importDialog ul.k-upload-files > li.k-file",
        "#importDialog .k-upload-files > li.k-file",
        "ul.k-upload-files > li.k-file"
      ],
      dropdownSelectors: [
        '#importDialog span[data-role="dropdownlist"][aria-owns*="_imageType_listbox"]',
        'span[data-role="dropdownlist"][aria-owns*="_imageType_listbox"]',
        'span[data-role="dropdownlist"][aria-controls*="_imageType_listbox"]',
        ".imageTypes.fileRow-dropdown.k-dropdown",
        "span.k-widget.k-dropdown.imageTypes.fileRow-dropdown",
        'span[aria-owns*="_imageType_listbox"]',
        'span[aria-controls*="_imageType_listbox"]',
        '[id*="imageType"]'
      ],
      dropdownOwnsHints: [
        "imagetype",
        "_imagetype_",
        "listbox"
      ],
      fileInputName: "imageAttachments",
      wrapperSelector: "#imageAttachmentsWrapper"
    },
    miscDocuments: {
      key: "miscDocuments",
      panelId: "servpro-misc-documents-helper-panel",
      panelTitle: "Misc Documents Helper",
      buttonLabel: "Apply to all misc documents",
      storageKey: "servproUploadHelper.lastMiscDocumentType",
      types: MISC_DOCUMENT_TYPES,
      dialogSelectors: [
        "#ImportJobMiscDocuments-window",
        '.k-window[aria-labelledby="ImportJobMiscDocuments-window_wnd_title"]',
        '.k-window-content[aria-labelledby="ImportJobMiscDocuments-window_wnd_title"]'
      ],
      windowTitleId: "ImportJobMiscDocuments-window_wnd_title",
      uploadMarkers: [
        "#ImportJobMiscDocuments-window",
        "#miscDocumentsWrapper",
        "input[name='miscDocAttachments']",
        "#ImportJobMiscDocuments-window ul.k-upload-files > li.k-file"
      ],
      rowSelectors: [
        "#ImportJobMiscDocuments-window ul.k-upload-files > li.k-file",
        "#ImportJobMiscDocuments-window .k-upload-files > li.k-file",
        "ul.k-upload-files > li.k-file"
      ],
      dropdownSelectors: [
        '#ImportJobMiscDocuments-window span[data-role="dropdownlist"][aria-owns*="_documentType_listbox"]',
        'span[data-role="dropdownlist"][aria-owns*="_documentType_listbox"]',
        'span[data-role="dropdownlist"][aria-controls*="_documentType_listbox"]',
        ".documentType.fileRow-dropdown.k-dropdown",
        "span.k-widget.k-dropdown.documentType.fileRow-dropdown",
        'span[aria-owns*="_documentType_listbox"]',
        'span[aria-controls*="_documentType_listbox"]',
        '[id*="documentType"]'
      ],
      dropdownOwnsHints: [
        "documenttype",
        "_documenttype_",
        "listbox"
      ],
      fileInputName: "miscDocAttachments",
      wrapperSelector: "#miscDocumentsWrapper"
    }
  };

  const TEAMALLEN_LOSS_TYPES = [
    { label: "WATER", value: "1" },
    { label: "FIRE", value: "2" },
    { label: "MOLD", value: "3" },
    { label: "GEN. CLEANING", value: "4" },
    { label: "DUCT CLEANING", value: "5" },
    { label: "BIO HAZARD", value: "15" },
    { label: "REBUILD", value: "16" },
    { label: "STORM", value: "17" },
    { label: "PUFFBACK", value: "18" },
    { label: "SMOKE", value: "19" },
    { label: "SEWER", value: "14" },
    { label: "BOARD UP", value: "22" },
    { label: "STRUCTURE DAMAGE", value: "23" }
  ];

  const WORKCENTER_IMPORT = {
    storageKey: "servproUploadHelper.workcenterPayload",
    historyKey: "servproUploadHelper.workcenterPayloadHistory",
    fnolRegistryKey: "servproUploadHelper.fnolRegistry",
    fnolRegistryMax: 30,
    reconToggleKey: "servproUploadHelper.applyReconDefaults",
    jobDefaultModeKey: "servproUploadHelper.jobDefaultMode",
    maxHistory: 5,
    staleHours: 24,
    teamallenssmAddUrl: "https://teamallenssm.com/jobs1_add.php?",
    teamallenssmListUrl: "https://teamallenssm.com/jobs1_list.php?page=listJobs",
    teamallenssmAddJobButtonSelectors: ["#AddJpb_Button_99", "#AddJpb_Button_9"],
    franchiseToBusinessUnit: {
      "northwest brooklyn": "NW Brooklyn",
      "northern staten island": "Staten Island",
      "the rockaways, coney island": "Rockaways/Coney",
      "forest hills/ridgewood": "Forest Hills",
      "bay ridge": "Bay Ridge",
      "mill basin, flatlands": "Mill Basin"
    },
    reconDefaults: {
      coordinator: "Johnny Turobov",
      coordinatorValue: "8",
      reconManager: "Amit Persaud",
      reconManagerValue: "5",
      lossType: "REBUILD",
      lossTypeValue: "16"
    },
    mitigationDefaults: {
      coordinator: "Felece Jordan",
      coordinatorValue: "14"
    }
  };

  const fieldsApi = root.workcenterFields || {};
  const TEAMALLENSSM_FIELD_MAP = fieldsApi.TEAMALLENSSM_FIELD_MAP || {};

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function looksLikeFileName(value) {
    return /\.[a-z0-9]{2,5}$/i.test(String(value || "").trim());
  }

  const settingsApi = root.settings || {};

  root.selectors = {
    IMAGE_TYPES: ATTACHMENT_IMAGE_TYPES,
    ATTACHMENT_IMAGE_TYPES,
    MISC_DOCUMENT_TYPES,
    SELECTORS,
    FLOWS,
    WORKCENTER_IMPORT,
    TEAMALLEN_LOSS_TYPES,
    SETTINGS_KEY: settingsApi.SETTINGS_KEY || "servproUploadHelper.settings",
    PENDING_AUTO_SUBMIT_KEY:
      settingsApi.PENDING_AUTO_SUBMIT_KEY || "servproUploadHelper.pendingTeamAllenAutoSubmit",
    ACTIVATION_CODE: settingsApi.ACTIVATION_CODE || "TeamAllenSSM",
    DEFAULT_SETTINGS: settingsApi.DEFAULT_SETTINGS,
    TEAMALLENSSM_FIELD_MAP,
    WORKCENTER_SELECTORS: fieldsApi.WORKCENTER_SELECTORS,
    LOSS_TYPE_ALIASES: fieldsApi.LOSS_TYPE_ALIASES,
    mapLossTypeForTeamAllen: fieldsApi.mapLossTypeForTeamAllen,
    mapCoordinatorForTeamAllen: fieldsApi.mapCoordinatorForTeamAllen,
    mapAddLocationForTeamAllen: fieldsApi.mapAddLocationForTeamAllen,
    mapAddLocationValueForTeamAllen: fieldsApi.mapAddLocationValueForTeamAllen,
    isPlausibleBusinessName: fieldsApi.isPlausibleBusinessName,
    isPlausibleClaimNumber: fieldsApi.isPlausibleClaimNumber,
    isFullAddressLine: fieldsApi.isFullAddressLine,
    parseAddress: fieldsApi.parseAddress,
    normalizeText,
    looksLikeFileName
  };
})(window);
