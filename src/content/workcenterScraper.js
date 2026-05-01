(function initWorkcenterScraper(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;

  if (!selectorsApi || global !== global.top) {
    return;
  }

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function firstNonEmpty(values) {
    return values.find(function hasValue(value) {
      return Boolean(normalizeText(value));
    }) || "";
  }

  function byIdText(id) {
    const node = document.getElementById(id);
    return normalizeText(node ? node.textContent : "");
  }

  function getBodyLines() {
    return String(document.body ? document.body.innerText : "")
      .split(/\r?\n/)
      .map(function trimLine(line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  function extractByLabel(labels) {
    const lines = getBodyLines();
    const labelList = Array.isArray(labels) ? labels : [labels];
    for (const label of labelList) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const inlineRegex = new RegExp("^" + escaped + "\\s*:?\\s*(.+)$", "i");
      const soloRegex = new RegExp("^" + escaped + "\\s*:?\\s*$", "i");
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const inlineMatch = line.match(inlineRegex);
        if (inlineMatch && inlineMatch[1]) {
          return normalizeText(inlineMatch[1]);
        }
        if (soloRegex.test(line) && lines[index + 1]) {
          return normalizeText(lines[index + 1]);
        }
      }
    }
    return "";
  }

  function extractClaimNumber() {
    const labelValue = extractByLabel("Claim Number");
    if (labelValue) {
      return labelValue;
    }
    const lines = getBodyLines();
    for (const line of lines) {
      const match = line.match(/claim number\s*:\s*([A-Z0-9-]+)/i);
      if (match && match[1]) {
        return normalizeText(match[1]);
      }
    }
    return "";
  }

  function extractContactParts(rawContact) {
    const contact = normalizeText(rawContact);
    if (!contact) {
      return {
        customerName: "",
        primaryPhone: "",
        email: "",
        contactRaw: ""
      };
    }

    const phoneMatch = contact.match(/(?:\+?1[\s.-]*)?\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})/);
    const emailMatch = contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    let namePart = contact
      .replace(/,\s*point of contact/gi, "")
      .replace(/\bmain\b/gi, "")
      .replace(/\bmobile\b/gi, "");
    if (phoneMatch) {
      namePart = namePart.replace(phoneMatch[0], " ");
    }
    if (emailMatch) {
      namePart = namePart.replace(emailMatch[0], " ");
    }
    namePart = normalizeText(namePart).replace(/,\s*$/, "");

    return {
      customerName: namePart,
      primaryPhone: phoneMatch ? phoneMatch.slice(1).join("") : "",
      email: emailMatch ? normalizeText(emailMatch[0]) : "",
      contactRaw: contact
    };
  }

  function parseAddress(fullAddress) {
    const raw = normalizeText(fullAddress);
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

  function derivePayType(insuranceCarrier, claimNumber) {
    if (normalizeText(insuranceCarrier) || normalizeText(claimNumber)) {
      return "INSURANCE";
    }
    return "";
  }

  function deriveBusinessUnit(franchiseName) {
    const map = selectorsApi.WORKCENTER_IMPORT.franchiseToBusinessUnit || {};
    return map[normalizeKey(franchiseName)] || "";
  }

  function isCommercialProperty(propertyType) {
    const normalized = normalizeKey(propertyType);
    return normalized.indexOf("commercial") !== -1;
  }

  function looksWeakContactName(name) {
    const normalized = normalizeKey(name);
    if (!normalized) {
      return true;
    }
    if (normalized.indexOf("point of contact") !== -1) {
      return true;
    }
    return normalized.length < 3;
  }

  function isWorkcenterPage() {
    const hostOk = /servpronet\.io$/i.test(global.location.hostname);
    if (!hostOk) {
      return false;
    }
    if (document.getElementById("MainContent_JobInfoHeader1_txt_FullAddress")) {
      return true;
    }
    const bodyText = normalizeText(document.body ? document.body.innerText : "");
    return /project name:/i.test(bodyText) && /project id:/i.test(bodyText);
  }

  function buildPayload() {
    const projectName = firstNonEmpty([
      byIdText("MainContent_JobInfoHeader1_lblJobName"),
      extractByLabel("Project Name")
    ]);
    const primaryContactNode = byIdText("MainContent_JobInfoHeader1_txt_PrimaryContact");
    const secondaryContactNode = byIdText("MainContent_JobInfoHeader1_txt_SecondaryContact");
    const parsedContact = extractContactParts(secondaryContactNode);
    const emailNode = byIdText("MainContent_JobInfoHeader1_link_emailAddress");
    const claimNumber = extractClaimNumber();
    const franchiseName = byIdText("MainContent_JobInfoHeader1_lblJobSite");
    const propertyType = extractByLabel("Property Type");

    const fullAddressNode = document.getElementById("MainContent_JobInfoHeader1_txt_FullAddress");
    const fullAddress = normalizeText(fullAddressNode ? fullAddressNode.textContent : extractByLabel("Address"));
    const parsedAddress = parseAddress(fullAddress);

    const insuranceRaw = firstNonEmpty([
      extractByLabel("Insurance Carrier"),
      extractByLabel("Insurance Company")
    ]);

    const parsedCustomer = firstNonEmpty([
      parsedContact.customerName,
      extractByLabel(["Customer", "Primary Contact", "Contact Name"]),
      primaryContactNode
    ]);
    const explicitBusiness = firstNonEmpty([
      extractByLabel(["Business", "Business Name", "Company Name"]),
      primaryContactNode
    ]);

    let customerName = parsedCustomer;
    let businessName = explicitBusiness;

    if (isCommercialProperty(propertyType)) {
      businessName = firstNonEmpty([projectName, explicitBusiness, parsedCustomer]);
      customerName = firstNonEmpty([parsedCustomer, projectName, businessName]);
    } else {
      customerName = looksWeakContactName(parsedCustomer)
        ? firstNonEmpty([projectName, parsedCustomer, explicitBusiness])
        : parsedCustomer;
      businessName = firstNonEmpty([explicitBusiness, customerName, projectName]);
    }

    return {
      projectName,
      projectId: extractByLabel("Project ID"),
      projectProgress: extractByLabel("Project Progress"),
      lossType: extractByLabel("Loss Type"),
      causeOfLoss: extractByLabel(["Cause of Loss", "Cause of Loss Type"]),
      claimNumber,
      customerName,
      businessName,
      primaryPhone: firstNonEmpty([
        parsedContact.primaryPhone,
        extractByLabel(["Phone 1", "Primary Phone", "Phone"])
      ]).replace(/\D+/g, ""),
      secondaryPhone: extractByLabel(["Phone 2", "Secondary Phone"]).replace(/\D+/g, ""),
      email: firstNonEmpty([
        parsedContact.email,
        emailNode,
        extractByLabel("Email"),
        extractByLabel("EMail")
      ]),
      address1: firstNonEmpty([extractByLabel("Address"), parsedAddress.address1]),
      address2: extractByLabel(["Address 2", "Unit", "Apartment"]),
      city: firstNonEmpty([extractByLabel("City"), parsedAddress.city]),
      state: firstNonEmpty([extractByLabel("State/Province"), parsedAddress.state]),
      zip: firstNonEmpty([extractByLabel("Zip/Postal Code"), extractByLabel("Zip"), parsedAddress.zip]),
      yearBuilt: extractByLabel(["Year Built", "YearBuilt"]),
      propertyType,
      franchiseName,
      businessUnit: deriveBusinessUnit(franchiseName),
      country: firstNonEmpty([extractByLabel("Country"), parsedAddress.country]),
      fullAddress,
      insuranceCarrier: insuranceRaw.replace(/\s*\(.*\)\s*$/, ""),
      payType: derivePayType(insuranceRaw, claimNumber),
      contactRaw: parsedContact.contactRaw,
      sourceUrl: global.location.href,
      scrapedAt: new Date().toISOString()
    };
  }

  function countFilledCoreFields(payload) {
    const fields = [
      "customerName",
      "businessName",
      "primaryPhone",
      "claimNumber",
      "propertyType",
      "address1",
      "city",
      "state",
      "zip"
    ];
    return fields.filter(function isFilled(key) {
      return Boolean(normalizeText(payload[key]));
    }).length;
  }

  function setStatus(message) {
    const status = document.querySelector("#servpro-workcenter-helper-panel .servpro-workcenter-status");
    if (status) {
      status.textContent = message;
    }
  }

  function upsertHistory(history, payload) {
    const existing = Array.isArray(history) ? history : [];
    const deduped = existing.filter(function keep(item) {
      if (!item) {
        return false;
      }
      if (item.sourceUrl === payload.sourceUrl && item.projectId && item.projectId === payload.projectId) {
        return false;
      }
      return true;
    });
    deduped.unshift(payload);
    return deduped.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5);
  }

  function savePayload(payload, callback) {
    const storage = getStorage();
    if (!storage) {
      callback(false, 0);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = upsertHistory(result && result[selectorsApi.WORKCENTER_IMPORT.historyKey], payload);
      storage.set({
        [selectorsApi.WORKCENTER_IMPORT.storageKey]: payload,
        [selectorsApi.WORKCENTER_IMPORT.historyKey]: history
      }, function onSaved() {
        callback(!global.chrome.runtime.lastError, history.length);
      });
    });
  }

  function getHistoryCount(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(0);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = result && result[selectorsApi.WORKCENTER_IMPORT.historyKey];
      callback(Array.isArray(history) ? history.length : 0);
    });
  }

  function getBusinessUnitWarning(payload) {
    if (!normalizeText(payload.franchiseName)) {
      return "";
    }
    if (!normalizeText(payload.businessUnit)) {
      return " Franchise not mapped to Bus.Unit.";
    }
    return "";
  }

  function exportPayload(payload) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeProject = (payload.projectId || payload.projectName || "workcenter")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    link.href = url;
    link.download = safeProject + "-workcenter.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function cleanup() {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function copyPayload(payload, callback) {
    const text = JSON.stringify(payload, null, 2);
    const nav = global.navigator;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      nav.clipboard.writeText(text).then(function ok() {
        callback(true);
      }).catch(function fail() {
        callback(false);
      });
      return;
    }

    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    area.remove();
    callback(copied);
  }

  function createPanel() {
    if (document.getElementById("servpro-workcenter-helper-panel")) {
      return;
    }

    const panel = document.createElement("div");
    panel.id = "servpro-workcenter-helper-panel";
    panel.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "background:#fff",
      "border:1px solid #c7d2da",
      "border-radius:8px",
      "padding:10px",
      "box-shadow:0 2px 12px rgba(0,0,0,.2)",
      "width:340px",
      "font:13px/1.4 Arial,sans-serif"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "WorkCenter Import Helper";
    title.style.fontWeight = "700";
    title.style.marginBottom = "8px";

    const buttonBar = document.createElement("div");
    buttonBar.style.display = "flex";
    buttonBar.style.flexWrap = "wrap";
    buttonBar.style.gap = "6px";

    const scrapeButton = document.createElement("button");
    scrapeButton.type = "button";
    scrapeButton.textContent = "Scrape WorkCenter";

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Export JSON";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy JSON";

    const autofillButton = document.createElement("button");
    autofillButton.type = "button";
    autofillButton.textContent = "Autofill TeamAllenssm";

    [scrapeButton, exportButton, copyButton, autofillButton].forEach(function styleButton(btn) {
      btn.style.cssText = "border:1px solid #1976d2;background:#1976d2;color:#fff;border-radius:6px;padding:6px 8px;cursor:pointer;";
    });

    const status = document.createElement("div");
    status.className = "servpro-workcenter-status";
    status.style.marginTop = "8px";
    status.style.color = "#334e68";
    status.textContent = "Ready";

    let latestPayload = null;

    function scrapeAndStore(callback) {
      latestPayload = buildPayload();
      savePayload(latestPayload, function onSave(ok, historyCount) {
        const count = countFilledCoreFields(latestPayload);
        setStatus(
          ok
            ? "Scraped and saved (" + count + "/9 key fields). History: " + historyCount + "/5." + getBusinessUnitWarning(latestPayload)
            : "Scraped, but failed to save to storage"
        );
        if (callback) {
          callback(ok);
        }
      });
    }

    scrapeButton.addEventListener("click", function onScrape() {
      scrapeAndStore();
    });

    exportButton.addEventListener("click", function onExport() {
      if (!latestPayload) {
        latestPayload = buildPayload();
      }
      savePayload(latestPayload, function onSave(ok, historyCount) {
        exportPayload(latestPayload);
        setStatus("Exported JSON file. History: " + historyCount + "/5.");
      });
    });

    copyButton.addEventListener("click", function onCopy() {
      if (!latestPayload) {
        latestPayload = buildPayload();
      }
      savePayload(latestPayload, function onSave(ok, historyCount) {
        copyPayload(latestPayload, function onCopied(copied) {
          setStatus((copied ? "Copied JSON to clipboard." : "Clipboard copy failed.") + " History: " + historyCount + "/5.");
        });
      });
    });

    autofillButton.addEventListener("click", function onAutofill() {
      if (!latestPayload) {
        latestPayload = buildPayload();
      }
      savePayload(latestPayload, function onSave(ok, historyCount) {
        global.open(selectorsApi.WORKCENTER_IMPORT.teamallenssmAddUrl, "_blank");
        setStatus("Opened TeamAllenssm. History: " + historyCount + "/5.");
      });
    });

    buttonBar.appendChild(scrapeButton);
    buttonBar.appendChild(exportButton);
    buttonBar.appendChild(copyButton);
    buttonBar.appendChild(autofillButton);
    panel.appendChild(title);
    panel.appendChild(buttonBar);
    panel.appendChild(status);
    document.body.appendChild(panel);

    getHistoryCount(function onCount(historyCount) {
      if (historyCount > 0) {
        setStatus("Ready. History: " + historyCount + "/5.");
      }
    });
  }

  function boot() {
    if (!isWorkcenterPage()) {
      return;
    }
    createPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
