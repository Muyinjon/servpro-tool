(function initSelectors(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const IMAGE_TYPES = [
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
    IMAGE_TYPES,
    SELECTORS,
    normalizeText,
    looksLikeFileName
  };
})(window);
