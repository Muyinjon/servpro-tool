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

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function looksLikeFileName(value) {
    return /\.[a-z0-9]{2,5}$/i.test(String(value || "").trim());
  }

  root.selectors = {
    IMAGE_TYPES: ATTACHMENT_IMAGE_TYPES,
    ATTACHMENT_IMAGE_TYPES,
    MISC_DOCUMENT_TYPES,
    SELECTORS,
    FLOWS,
    normalizeText,
    looksLikeFileName
  };
})(window);
