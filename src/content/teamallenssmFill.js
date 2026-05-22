(function initTeamallenssmFill(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const fieldsApi = root.workcenterFields || {};
  const settingsApi = root.settings;
  const fnolNotesApi = root.fnolNotes;
  const helperPanelApi = root.helperPanel;
  const themeApi = root.theme;

  if (!selectorsApi) {
    return;
  }

  let cachedSettings = settingsApi
    ? settingsApi.mergeSettings(null)
    : { teamAllenActivated: true };

  const ADDRESS_GRID_PAGE = fieldsApi.ADDRESS_GRID_PAGE || "dbo_sp_jobaddresses_listJob";
  const mapLossTypeForTeamAllen = selectorsApi.mapLossTypeForTeamAllen || fieldsApi.mapLossTypeForTeamAllen;
  const mapCoordinatorForTeamAllen = selectorsApi.mapCoordinatorForTeamAllen || fieldsApi.mapCoordinatorForTeamAllen;
  const mapAddLocationForTeamAllen = selectorsApi.mapAddLocationForTeamAllen || fieldsApi.mapAddLocationForTeamAllen;
  const mapAddLocationValueForTeamAllen =
    selectorsApi.mapAddLocationValueForTeamAllen || fieldsApi.mapAddLocationValueForTeamAllen;
  const ADDRESS_GRID_INLINE_SELECTOR =
    'input[id^="value_Address1_"], input[id^="value_City_"], input[id^="value_State_"], input[id^="value_Zip_"], select[id^="value_AddLocation_"]';
  const ADDRESS_FIELD_KEYS = new Set([
    "address1",
    "address2",
    "city",
    "state",
    "zip",
    "yearBuilt",
    "addLocation",
    "billAddress"
  ]);
  const ADDRESS_TEXT_FIELD_KEYS = ["address1", "address2", "city", "state", "zip", "yearBuilt"];
  const isPlausibleBusinessName = fieldsApi.isPlausibleBusinessName || selectorsApi.isPlausibleBusinessName || function always(value) {
    return Boolean(normalizeText(value));
  };
  const isPlausibleClaimNumber = fieldsApi.isPlausibleClaimNumber || selectorsApi.isPlausibleClaimNumber || function always(value) {
    return Boolean(normalizeText(value));
  };

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

  function getStorage() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function isTeamAllenFeatureEnabled() {
    if (!settingsApi) {
      return true;
    }
    return settingsApi.isTeamAllenActivated(cachedSettings);
  }

  function loadSettings(callback) {
    if (!settingsApi) {
      cachedSettings = { teamAllenActivated: true };
      callback(cachedSettings);
      return;
    }
    settingsApi.getSettings(function onLoaded(settings) {
      cachedSettings = settings;
      syncPanelThemes(cachedSettings);
      callback(settings);
    });
  }

  function getInputValueById(id) {
    const el = document.getElementById(id);
    if (!el) {
      return "";
    }
    if (el.tagName === "SELECT") {
      const opt = el.options[el.selectedIndex];
      return normalizeText(opt ? opt.textContent : "");
    }
    if (el.type === "checkbox") {
      return el.checked ? "1" : "";
    }
    return normalizeText(el.value || el.textContent);
  }

  function isAddressGridRowVisible(row) {
    if (!row) {
      return false;
    }
    if (row.getAttribute("data-hidden") !== null && row.getAttribute("data-hidden") !== "") {
      return false;
    }
    const style = global.getComputedStyle(row);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function getAddressGridRows() {
    return orderAddressGridRows(
      Array.from(document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]'))
    );
  }

  function getVisibleAddressGridRow(rows) {
    const list = rows || getAddressGridRows();
    const visible = list.find(function match(rowEl) {
      if (!isAddressGridRowVisible(rowEl)) {
        return false;
      }
      const rid = rowEl.getAttribute("data-record-id") || "";
      return /^\d+$/.test(rid);
    });
    if (visible) {
      return visible;
    }
    return list.find(function match(rowEl) {
      return isAddressGridRowVisible(rowEl) && /^\d+$/.test(rowEl.getAttribute("data-record-id") || "");
    }) || null;
  }

  function readElementDisplayText(el) {
    if (!el) {
      return "";
    }
    return normalizeText(el.getAttribute("val") || el.textContent);
  }

  function readAddressDisplayCell(recordId, fieldName, scopeRoot) {
    if (!recordId || !/^\d+$/.test(String(recordId)) || !fieldName) {
      return "";
    }
    const id = "edit" + recordId + "_" + fieldName;
    const root = scopeRoot || document;
    let el = null;
    if (root.querySelector) {
      el = root.querySelector('[id="' + id + '"]');
    }
    if (!el && (!scopeRoot || scopeRoot === document)) {
      el = document.getElementById(id);
    }
    return readElementDisplayText(el);
  }

  function findAddressRecordIdFromDisplay() {
    const cells = document.querySelectorAll('[id^="edit"][id*="_Address1"]');
    for (let i = 0; i < cells.length; i += 1) {
      const match = String(cells[i].id || "").match(/^edit(\d+)_Address1$/i);
      if (match) {
        return match[1];
      }
    }
    return "";
  }

  function readAddressValueFromRow(row, fieldName) {
    if (!fieldName) {
      return "";
    }
    if (row) {
      const input = row.querySelector(
        'input[id^="value_' + fieldName + '_"], select[id^="value_' + fieldName + '_"]'
      );
      if (input) {
        if (input.tagName === "SELECT") {
          const opt = input.options[input.selectedIndex];
          return normalizeText(opt ? opt.textContent : "");
        }
        return normalizeText(input.value);
      }
      const fieldVariants = [fieldName, fieldName.toLowerCase(), fieldName.toUpperCase()];
      for (let i = 0; i < fieldVariants.length; i += 1) {
        const variant = fieldVariants[i];
        const display = row.querySelector('[data-field="' + variant + '"]');
        if (!display) {
          continue;
        }
        const span = display.querySelector('span[id$="_' + fieldName + '"], span[id*="_' + fieldName + '_"]');
        const target = span || display;
        const valAttr = target.getAttribute && target.getAttribute("val");
        if (valAttr) {
          return normalizeText(valAttr);
        }
        const lookup = display.querySelector(".r-lookup-value");
        if (lookup) {
          return normalizeText(lookup.textContent);
        }
        const text = normalizeText(display.textContent);
        if (text) {
          return text;
        }
      }
      const recordId = row.getAttribute("data-record-id") || "";
      if (/^\d+$/.test(recordId)) {
        const scopedDisplay = row.querySelector('[id^="edit"][id$="_' + fieldName + '"]');
        const fromScoped = readElementDisplayText(scopedDisplay);
        if (fromScoped) {
          return fromScoped;
        }
        const fromDisplayId = readAddressDisplayCell(recordId, fieldName, row);
        if (fromDisplayId) {
          return fromDisplayId;
        }
      }
    }
    return "";
  }

  function addressRowHasReadableDisplay(row) {
    const rid = row && row.getAttribute("data-record-id");
    if (!rid || !/^\d+$/.test(rid)) {
      return false;
    }
    return Boolean(
      readAddressDisplayCell(rid, "Address1") ||
        readAddressDisplayCell(rid, "City") ||
        readAddressDisplayCell(rid, "State") ||
        readAddressDisplayCell(rid, "Zip")
    );
  }

  function addressRowHasInlineInputs(row) {
    if (!row) {
      return false;
    }
    return Boolean(
      row.querySelector(
        'input[id^="value_Address1_"], input[id^="value_City_"], input[id^="value_State_"], input[id^="value_Zip_"], select[id^="value_AddLocation_"]'
      )
    );
  }

  function getAddressFieldFromGrid(fieldName) {
    const row = getVisibleAddressGridRow();
    const fromRow = readAddressValueFromRow(row, fieldName);
    if (fromRow) {
      return fromRow;
    }
    const fallbackRecordId = findAddressRecordIdFromDisplay();
    return readAddressDisplayCell(fallbackRecordId, fieldName) || "";
  }

  function scrapePayloadFromPage() {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const editId = getEditJobIdFromSearch();
    const pkJobs = getInputValueById("value_pkJobsId_1") || editId;
    const propertyType = getInputValueById(map.propertyType);
    const payload = {
      customerName: getInputValueById(map.customerName),
      businessName: getInputValueById(map.businessName),
      primaryPhone: getInputValueById(map.primaryPhone).replace(/\D+/g, ""),
      secondaryPhone: getInputValueById(map.secondaryPhone).replace(/\D+/g, ""),
      email: getInputValueById(map.email),
      payType: getInputValueById(map.payType),
      businessUnit: getInputValueById(map.businessUnit),
      claimNumber: getInputValueById(map.claimNumber).replace(/\s+/g, ""),
      propertyType: propertyType,
      insuranceCarrier: getInputValueById(map.insuranceCarrier),
      lossType: getInputValueById(map.lossType),
      coordinator: getInputValueById(map.coordinator),
      address1: getAddressFieldFromGrid("Address1"),
      address2: getAddressFieldFromGrid("Address2"),
      city: getAddressFieldFromGrid("City"),
      state: getAddressFieldFromGrid("State"),
      zip: getAddressFieldFromGrid("Zip"),
      yearBuilt: getAddressFieldFromGrid("YearBuilt"),
      addLocation: getAddressFieldFromGrid("AddLocation") || (mapAddLocationForTeamAllen ? mapAddLocationForTeamAllen(propertyType) : ""),
      billAddress: true,
      teamAllenJobId: pkJobs,
      source: "teamallen-edit",
      sourceUrl: global.location.href,
      scrapedAt: new Date().toISOString()
    };
    return payload;
  }

  function scrapePayloadFromPageAsync(callback) {
    if (!isOnEditJobPage()) {
      callback(scrapePayloadFromPage());
      return;
    }
    const rows = getAddressGridRows();
    const visibleRow = getVisibleAddressGridRow(rows);
    if (
      !visibleRow ||
      addressRowHasInlineInputs(visibleRow) ||
      addressRowHasReadableDisplay(visibleRow)
    ) {
      callback(scrapePayloadFromPage());
      return;
    }
    const editLink = visibleRow.querySelector('a[id^="iEditLink"]');
    if (!editLink || typeof editLink.click !== "function") {
      callback(scrapePayloadFromPage());
      return;
    }
    editLink.click();
    global.setTimeout(function afterEditOpen() {
      callback(scrapePayloadFromPage());
    }, 280);
  }

  function copyTextToClipboard(text, callback) {
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

  function clickTeamAllenSaveButton() {
    const candidates = [
      "#saveButton1",
      'a[id^="saveButton"]',
      'button[id^="saveButton"]',
      '[data-itemtype="edit_save"] a',
      'a[type="button"]#saveButton1'
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const btn = document.querySelector(candidates[i]);
      if (btn && typeof btn.click === "function") {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function noteTextFromPayload(payload) {
    if (fnolNotesApi && fnolNotesApi.getNoteTextFromPayload) {
      return fnolNotesApi.getNoteTextFromPayload(payload);
    }
    return normalizeText((payload && (payload.notes || payload.notesUser)) || "");
  }

  function pasteNotesFromPayload(payload, callback) {
    let noteText = noteTextFromPayload(payload);
    if (!noteText) {
      callback(false, "No notes in payload to paste.");
      return;
    }
    let trimSuffix = "";
    if (fnolNotesApi && fnolNotesApi.truncateNoteText) {
      const truncated = fnolNotesApi.truncateNoteText(noteText);
      noteText = truncated.text;
      if (truncated.trimmed) {
        trimSuffix = " Note was trimmed to 500 characters.";
      }
    }

    const addNotesBtn = document.querySelector('a[id^="inlineAdd"]');
    if (!addNotesBtn || typeof addNotesBtn.click !== "function") {
      callback(false, "Add Notes button not found — scroll to the Notes section and try again.");
      return;
    }
    addNotesBtn.click();

    let waited = 0;
    const maxWait = 2000;
    function waitForNotesTextarea() {
      const textarea = document.querySelector('textarea[id^="value_Notes_"]');
      if (textarea) {
        textarea.focus();
        textarea.value = noteText;
        try {
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e) {
          /* ignore */
        }

        const suffix = textarea.id.replace(/^value_Notes_/, "");
        const typeSelect = document.getElementById("value_fkNoteTypeId_" + suffix) ||
          document.querySelector('select[id^="value_fkNoteTypeId_"]');
        if (typeSelect) {
          try {
            setSelectByValue(typeSelect, "1");
          } catch (e) {
            /* best-effort */
          }
        }

        const saveLink = document.getElementById("saveLink" + suffix) ||
          document.querySelector('a[id^="saveLink"]');
        if (saveLink && typeof saveLink.click === "function") {
          global.setTimeout(function clickSave() {
            saveLink.click();
            callback(true, "Note pasted and saved." + trimSuffix);
          }, 120);
        } else {
          callback(false, "Note text filled but save link not found — click Save manually." + trimSuffix);
        }
        return;
      }
      waited += 100;
      if (waited >= maxWait) {
        callback(false, "Notes textarea did not appear — the Notes section may not be visible.");
        return;
      }
      global.setTimeout(waitForNotesTextarea, 100);
    }
    global.setTimeout(waitForNotesTextarea, 100);
  }

  const NOTES_UI_POLL_MS = 500;
  const NOTES_UI_POLL_MAX_MS = 30000;

  function tryPendingNotesPaste(setStatus) {
    if (!settingsApi || cachedSettings.fnolPasteNotesAfterSave === false) {
      return;
    }
    settingsApi.getPendingNotesPaste(function onPending(pending) {
      if (!pending || !normalizeText(pending.text)) {
        return;
      }
      const noteText = normalizeText(pending.text);
      let waited = 0;
      function pollForNotesUi() {
        const addNotesBtn = document.querySelector('a[id^="inlineAdd"]');
        if (addNotesBtn) {
          if (setStatus) {
            setStatus("Adding notes from FNOL…");
          }
          pasteNotesFromPayload({ notes: noteText }, function onPasted(ok, msg) {
            if (ok) {
              settingsApi.clearPendingNotesPaste();
            }
            if (setStatus) {
              setStatus(msg);
            }
          });
          return;
        }
        waited += NOTES_UI_POLL_MS;
        if (waited >= NOTES_UI_POLL_MAX_MS) {
          if (setStatus) {
            setStatus("Job saved. Click Add notes from FNOL when Notes section is visible.");
          }
          return;
        }
        global.setTimeout(pollForNotesUi, NOTES_UI_POLL_MS);
      }
      pollForNotesUi();
    });
  }

  function tryPendingNotesPasteOnEditBoot(setStatus) {
    if (!isOnEditJobPage() || !settingsApi || cachedSettings.fnolPasteNotesAfterSave === false) {
      return;
    }
    settingsApi.getPendingNotesPaste(function onPending(pending) {
      if (!pending || !normalizeText(pending.text)) {
        return;
      }
      if (!document.querySelector('a[id^="inlineAdd"]')) {
        return;
      }
      tryPendingNotesPaste(setStatus);
    });
  }

  function isTopFrame() {
    try {
      return global.self === global.top;
    } catch (error) {
      return true;
    }
  }

  function usesModalAddJobUi() {
    return cachedSettings.teamAllenAddJobUi !== "page";
  }

  function findAddJobButton() {
    const wi = selectorsApi.WORKCENTER_IMPORT || {};
    const selectors = wi.teamallenssmAddJobButtonSelectors || ["#AddJpb_Button_99", "#AddJpb_Button_9"];
    for (let i = 0; i < selectors.length; i += 1) {
      const btn = document.querySelector(selectors[i]);
      if (btn) {
        return btn;
      }
    }
    return null;
  }

  function clickAddJobButtonWithRetry(done, attempt) {
    const tries = attempt || 0;
    const btn = findAddJobButton();
    if (btn && typeof btn.click === "function") {
      btn.click();
      if (typeof done === "function") {
        done(true);
      }
      return;
    }
    if (tries >= 30) {
      if (typeof done === "function") {
        done(false);
      }
      return;
    }
    global.setTimeout(function retry() {
      clickAddJobButtonWithRetry(done, tries + 1);
    }, 100);
  }

  function tryPendingModalAddJobClick(setStatus) {
    if (!isOnListPage() || !isTopFrame() || !isTeamAllenFeatureEnabled() || !settingsApi) {
      return;
    }
    settingsApi.getPendingAutoSubmit(function onPending(pending) {
      if (!pending || pending.openVia !== "modal") {
        return;
      }
      if (settingsApi.isPendingStaleOnList && settingsApi.isPendingStaleOnList(pending)) {
        settingsApi.clearPendingAutoSubmit();
        return;
      }
      if (pending.consumedListClick === true) {
        return;
      }
      if (setStatus) {
        setStatus("Opening Add Job popup…");
      }
      clickAddJobButtonWithRetry(function onClicked(ok) {
        if (ok && settingsApi.patchPendingAutoSubmit) {
          settingsApi.patchPendingAutoSubmit({ consumedListClick: true });
        }
        if (!ok && setStatus) {
          setStatus("Add Job button not found on list page.");
        }
      });
    });
  }

  function tryPendingAutoFill(setStatus) {
    if (!isOnAddJobPage() || !isTeamAllenFeatureEnabled() || !settingsApi) {
      return;
    }
    settingsApi.getPendingAutoSubmit(function onPending(pending) {
      if (!pending) {
        return;
      }
      loadPayloads(function onLoaded(latest, history, storedJobDefaultMode) {
        const payload = latest || (history.length ? history[0] : null);
        if (!payload) {
          settingsApi.clearPendingAutoSubmit();
          if (setStatus) {
            setStatus("Auto-fill: no payload found.");
          }
          return;
        }
        const defaultMode = normalizeJobDefaultMode(
          storedJobDefaultMode || cachedSettings.defaultJobModeOnFill
        );
        const shouldSave = Boolean(pending.autoSave) && cachedSettings.fnolAutoSave !== false;
        if (setStatus) {
          setStatus(shouldSave ? "Auto-fill: filling form…" : "Auto-fill: filling form (save manually)…");
        }
        runFillWithAddressPrep(payload, defaultMode, function onFilled(fillResult) {
          global.setTimeout(function afterFill() {
            let saved = false;
            if (shouldSave) {
              saved = clickTeamAllenSaveButton();
            }
            settingsApi.clearPendingAutoSubmit();
            const msg =
              "Auto-fill: filled " + fillResult.filled + " fields." +
              (shouldSave
                ? saved
                  ? " Save clicked."
                  : " Save button not found — click Save manually."
                : "") +
              formatFillMissingMessage(fillResult.missing);
            if (setStatus) {
              setStatus(msg);
            }
            if (shouldSave && saved) {
              tryPendingNotesPaste(setStatus);
            } else {
              settingsApi.getPendingNotesPaste(function onNotesPending(pending) {
                if (pending && normalizeText(pending.text) && setStatus) {
                  setStatus(
                    msg + " Click Add notes from FNOL when Notes section is visible."
                  );
                }
              });
            }
          }, 450);
        });
      });
    });
  }

  function safeFocus(element) {
    if (!element || typeof element.focus !== "function") {
      return;
    }
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      try {
        element.focus();
      } catch (ignored) {
        /* Some TeamAllen fields are not focusable in iframes */
      }
    }
  }

  function setInputValue(input, value) {
    if (!input) {
      return false;
    }
    const tag = String(input.tagName || "").toUpperCase();
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      return false;
    }
    safeFocus(input);
    input.value = value || "";
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      return false;
    }
    return true;
  }

  function setCheckboxValue(input, checked) {
    if (!input) {
      return false;
    }
    input.checked = Boolean(checked);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function resolveFillControl(element) {
    if (!element) {
      return null;
    }
    const tag = String(element.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return element;
    }
    const nested = element.querySelector("input, textarea, select");
    return nested || element;
  }

  function resolveElementByMapValue(mapValue) {
    if (!mapValue) {
      return null;
    }
    if (mapValue.endsWith("_")) {
      return resolveAddressGridElement(mapValue);
    }
    return resolveFillControl(document.getElementById(mapValue));
  }

  function orderAddressGridRows(rows) {
    if (!isOnEditJobPage()) {
      return rows;
    }
    const numeric = [];
    const add = [];
    const rest = [];
    rows.forEach(function eachRow(row) {
      const rid = row.getAttribute("data-record-id") || "";
      if (/^\d+$/.test(rid)) {
        numeric.push(row);
      } else if (rid === "add") {
        add.push(row);
      } else {
        rest.push(row);
      }
    });
    return numeric.concat(add).concat(rest);
  }

  function resolveAddressGridElement(prefix) {
    const rows = orderAddressGridRows(
      Array.from(document.querySelectorAll('tr[data-page="' + ADDRESS_GRID_PAGE + '"][data-record-id]'))
    );
    const activeRow = rows.find(function isVisible(row) {
      if (row.getAttribute("data-hidden") !== null && row.getAttribute("data-hidden") !== "") {
        return false;
      }
      const style = global.getComputedStyle(row);
      return style.display !== "none" && style.visibility !== "hidden";
    }) || rows[0];

    if (activeRow) {
      const inRow = activeRow.querySelector('[id^="' + prefix + '"]');
      if (inRow) {
        return inRow;
      }
    }

    const candidates = Array.from(document.querySelectorAll('[id^="' + prefix + '"]'));
    return candidates.find(function isVisible(el) {
      const style = global.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    }) || candidates[0] || null;
  }

  function isSelectElement(element) {
    return element && String(element.tagName || "").toUpperCase() === "SELECT";
  }

  function setSelectByText(select, value) {
    if (!isSelectElement(select) || !value) {
      return false;
    }

    const target = normalizeKey(value);
    const option = Array.from(select.options).find(function match(entry) {
      const optionText = normalizeKey(entry.textContent);
      return optionText === target || optionText.indexOf(target) !== -1 || target.indexOf(optionText) !== -1;
    });
    if (!option) {
      return false;
    }

    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setSelectByValue(select, value) {
    if (!isSelectElement(select) || value === undefined || value === null || value === "") {
      return false;
    }
    const target = String(value);
    const option = Array.from(select.options).find(function match(entry) {
      return String(entry.value) === target;
    });
    if (!option) {
      return false;
    }
    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setSelectField(select, textValue, optionValue) {
    if (!select) {
      return false;
    }
    if (optionValue && setSelectByValue(select, optionValue)) {
      return true;
    }
    if (textValue) {
      return setSelectByText(select, textValue);
    }
    return false;
  }

  function isOnAddJobPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_add\.php/i.test(global.location.pathname + global.location.search);
  }

  function isOnEditJobPage() {
    if (!/teamallenssm\.com$/i.test(global.location.hostname)) {
      return false;
    }
    if (!/jobs1_edit\.php/i.test(global.location.pathname)) {
      return false;
    }
    const search = global.location.search || "";
    return /(?:^|[?&])editid1=\d+/i.test(search) || /page=editjob/i.test(search);
  }

  function getEditJobIdFromSearch() {
    const m = String(global.location.search || "").match(/(?:^|[?&])editid1=(\d+)/i);
    return m ? m[1] : "";
  }

  function isOnListPage() {
    return /teamallenssm\.com$/i.test(global.location.hostname) && /jobs1_list\.php/i.test(global.location.pathname + global.location.search);
  }

  const JOB_DEFAULT_MODES = ["none", "recon", "mitigation"];

  function normalizeJobDefaultMode(value) {
    const key = normalizeKey(value);
    if (key === "recon" || key.indexOf("recon") !== -1) {
      return "recon";
    }
    if (key === "mitigation" || key.indexOf("mitig") !== -1) {
      return "mitigation";
    }
    return "none";
  }

  function applyJobDefaultModeToSelects(selectFieldValues, defaultMode) {
    const wi = selectorsApi.WORKCENTER_IMPORT;
    if (defaultMode === "recon" && wi.reconDefaults) {
      selectFieldValues.coordinator = wi.reconDefaults.coordinator;
      selectFieldValues.coordinatorValue = wi.reconDefaults.coordinatorValue;
      selectFieldValues.reconManager = wi.reconDefaults.reconManager;
      selectFieldValues.reconManagerValue = wi.reconDefaults.reconManagerValue;
      selectFieldValues.lossType = wi.reconDefaults.lossType;
      selectFieldValues.lossTypeValue = wi.reconDefaults.lossTypeValue;
    } else if (defaultMode === "mitigation" && wi.mitigationDefaults) {
      selectFieldValues.coordinator = wi.mitigationDefaults.coordinator;
      selectFieldValues.coordinatorValue = wi.mitigationDefaults.coordinatorValue;
      delete selectFieldValues.reconManager;
      delete selectFieldValues.reconManagerValue;
    }
  }

  function getStalenessMessage(payload) {
    const scrapedAt = new Date(payload.scrapedAt || 0).getTime();
    if (!scrapedAt) {
      return "";
    }
    const elapsedMs = Date.now() - scrapedAt;
    const staleMs = selectorsApi.WORKCENTER_IMPORT.staleHours * 60 * 60 * 1000;
    if (elapsedMs > staleMs) {
      return " Warning: payload older than " + selectorsApi.WORKCENTER_IMPORT.staleHours + "h.";
    }
    return "";
  }

  function mapPropertyType(sourceValue) {
    const val = normalizeKey(sourceValue);
    if (val.indexOf("residential") !== -1) {
      return "Residential";
    }
    if (val.indexOf("commercial") !== -1) {
      return "Commercial";
    }
    return "";
  }

  function isResidential(payload, propertyTypeMapped) {
    const key = normalizeKey(propertyTypeMapped || payload.propertyType);
    return key.indexOf("residential") !== -1;
  }

  function buildSource(payload) {
    const propertyTypeRaw = firstNonEmpty([payload.propertyType, payload.PropertyType, payload.type]);
    const propertyTypeMapped = mapPropertyType(propertyTypeRaw);
    const residential = isResidential(payload, propertyTypeMapped);

    const rawBusinessName = firstNonEmpty([
      payload.businessName,
      payload.business,
      payload.Business
    ]);
    const businessName = isPlausibleBusinessName(rawBusinessName) ? rawBusinessName : "";

    return {
      customerName: firstNonEmpty([payload.customerName, payload.customer, payload.Customer]),
      businessName: businessName,
      primaryPhone: firstNonEmpty([payload.primaryPhone, payload.phone1, payload.phone, payload.PhonePrimary]).replace(/\D+/g, ""),
      secondaryPhone: firstNonEmpty([payload.secondaryPhone, payload.phone2, payload.PhoneAlternate]).replace(/\D+/g, ""),
      email: firstNonEmpty([payload.email, payload.EMail, payload.Email]),
      payType: firstNonEmpty([payload.payType, payload.paytype, payload.fkJobType]),
      businessUnit: firstNonEmpty([payload.businessUnit, payload.busUnit, payload.BusinessUnit]),
      claimNumber: (function resolveClaim() {
        const raw = firstNonEmpty([payload.claimNumber, payload.claim, payload.claimNo, payload.InsClaimNo]);
        return isPlausibleClaimNumber(raw) ? normalizeText(raw).replace(/\s+/g, "") : "";
      })(),
      address1: firstNonEmpty([payload.address1, payload.Address1, payload.address]),
      address2: firstNonEmpty([payload.address2, payload.Address2]),
      city: firstNonEmpty([payload.city, payload.City]),
      state: firstNonEmpty([payload.state, payload.State]),
      zip: firstNonEmpty([payload.zip, payload.Zip, payload.zipCode]),
      yearBuilt: firstNonEmpty([payload.yearBuilt, payload.YearBuilt]),
      propertyType: propertyTypeMapped,
      insuranceCarrier: firstNonEmpty([payload.insuranceCarrier, payload.InsuranceCompany, payload.insurance]),
      lossType: firstNonEmpty([payload.lossType, payload.LossType]),
      coordinator: firstNonEmpty([payload.coordinator, payload.Coordinator]),
      coordinatorValue: firstNonEmpty([payload.coordinatorValue, payload.CoordinatorValue]),
      jobStatus: firstNonEmpty([payload.jobStatus, payload.JobStatus]),
      addLocation: firstNonEmpty([
        payload.addLocation,
        mapAddLocationForTeamAllen ? mapAddLocationForTeamAllen(propertyTypeRaw) : ""
      ]),
      addLocationValue: firstNonEmpty([
        payload.addLocationValue,
        mapAddLocationValueForTeamAllen ? mapAddLocationValueForTeamAllen(propertyTypeRaw) : ""
      ]),
      billAddress: payload.billAddress !== false
    };
  }

  function formatAddressSummary(source) {
    const parts = [];
    if (source.address1) {
      parts.push(source.address1);
    }
    const cityLine = [source.city, source.state, source.zip].filter(Boolean).join(", ");
    if (cityLine) {
      parts.push(cityLine);
    }
    return parts.join(" | ");
  }

  function hasRecognizableJobField(payload) {
    const fieldGroups = [
      ["customerName", "customer", "Customer"],
      ["businessName", "business", "Business"],
      ["primaryPhone", "phone1", "phone", "PhonePrimary"],
      ["claimNumber", "claim", "claimNo", "InsClaimNo"],
      ["address1", "Address1", "address", "fullAddress"],
      ["propertyType", "PropertyType", "type"],
      ["lossType", "LossType"],
      ["email", "EMail", "Email"],
      ["businessUnit", "busUnit", "BusinessUnit"],
      ["insuranceCarrier", "InsuranceCompany", "insurance"],
      ["coordinator", "Coordinator"]
    ];
    return fieldGroups.some(function eachGroup(keys) {
      return Boolean(firstNonEmpty(keys.map(function fieldKey(key) {
        return payload[key];
      })));
    });
  }

  function analyzeImportPayload(payload) {
    const errors = [];
    const warnings = [];

    if (payload.steps && Array.isArray(payload.steps)) {
      errors.push("This looks like a browser recording (has a \"steps\" list), not job data.");
    }
    if (
      normalizeText(payload.title).indexOf("recording") !== -1 &&
      !hasRecognizableJobField(payload)
    ) {
      errors.push("This looks like a recording export, not a WorkCenter job payload.");
    }

    if (!hasRecognizableJobField(payload)) {
      errors.push("No recognizable job fields. Add customer, address, claim #, phone, or similar.");
    }

    const source = buildSource(payload);
    const rawClaim = firstNonEmpty([payload.claimNumber, payload.claim, payload.claimNo, payload.InsClaimNo]);
    if (normalizeText(rawClaim) && !source.claimNumber) {
      warnings.push("Claim # looks invalid (not a real claim number).");
    }
    const rawBusiness = firstNonEmpty([payload.businessName, payload.business, payload.Business]);
    if (normalizeText(rawBusiness) && !source.businessName) {
      warnings.push("Business name looks like a label or placeholder.");
    }
    if (source.email && source.email.indexOf("@") === -1) {
      warnings.push("Email does not look valid.");
    }
    if (source.primaryPhone && source.primaryPhone.replace(/\D/g, "").length > 0 && source.primaryPhone.replace(/\D/g, "").length < 7) {
      warnings.push("Primary phone looks too short.");
    }
    if (!source.customerName && !source.businessName) {
      warnings.push("No customer or business name to fill.");
    }
    if (!source.address1 && !normalizeText(payload.fullAddress)) {
      warnings.push("No address found.");
    }

    return {
      ok: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  function formatImportAnalysisMessage(analysis) {
    const parts = [];
    if (analysis.errors.length) {
      parts.push(analysis.errors.join(" "));
    }
    if (analysis.warnings.length) {
      parts.push(analysis.warnings.join(" "));
    }
    return parts.join(" ");
  }

  const FILL_TEXT_FIELDS = [
      "customerName",
      "businessName",
      "primaryPhone",
      "secondaryPhone",
      "email",
      "claimNumber",
      "address1",
      "address2",
      "city",
      "state",
      "zip",
      "yearBuilt"
    ];

  const FILL_SELECT_FIELDS = [
    "propertyType",
    "payType",
    "businessUnit",
    "insuranceCarrier",
    "lossType",
    "coordinator",
    "reconManager",
    "addLocation",
    "jobStatus"
  ];

  function formatFillMissingMessage(missing) {
    if (!missing || !missing.length) {
      return "";
    }
    const addressMissing = [];
    const otherMissing = [];
    missing.forEach(function eachKey(key) {
      if (ADDRESS_FIELD_KEYS.has(key)) {
        addressMissing.push(key);
      } else {
        otherMissing.push(key);
      }
    });
    const parts = [];
    if (otherMissing.length) {
      parts.push(" Missing: " + otherMissing.join(", ") + ".");
    }
    if (addressMissing.length) {
      parts.push(" Address missing: " + addressMissing.join(", ") + ".");
    }
    return parts.join("");
  }

  function mergeFillResults(mainResult, addressResult) {
    const main = mainResult || { filled: 0, missing: [], addressSummary: "" };
    const address = addressResult || { filled: 0, missing: [], addressSummary: "" };
    return {
      filled: main.filled + address.filled,
      missing: main.missing.concat(address.missing),
      addressSummary: address.addressSummary || main.addressSummary || ""
    };
  }

  function visibleAddressRowHasInlineInputs(row) {
    const targetRow = row || getVisibleAddressGridRow();
    if (!targetRow) {
      return false;
    }
    return Boolean(targetRow.querySelector(ADDRESS_GRID_INLINE_SELECTOR));
  }

  function waitForAddressInlineInputs(callback, maxMs, elapsed) {
    const limit = typeof maxMs === "number" ? maxMs : 2000;
    const waited = typeof elapsed === "number" ? elapsed : 0;
    if (visibleAddressRowHasInlineInputs()) {
      callback(true);
      return;
    }
    if (waited >= limit) {
      callback(false);
      return;
    }
    global.setTimeout(function retry() {
      waitForAddressInlineInputs(callback, limit, waited + 100);
    }, 100);
  }

  function resolveBillAddressInRow() {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP || {};
    const row = getVisibleAddressGridRow();
    if (row && map.billAddress) {
      const inRow = row.querySelector('[id^="' + map.billAddress + '"]');
      if (inRow) {
        return resolveFillControl(inRow);
      }
      const roleCheckbox = row.querySelector('[role="checkbox"]');
      if (roleCheckbox) {
        return resolveFillControl(roleCheckbox);
      }
    }
    return resolveElementByMapValue(map.billAddress);
  }

  function setBillAddressInRow(checked) {
    const control = resolveBillAddressInRow();
    if (!control) {
      return false;
    }
    if (setCheckboxValue(control, checked)) {
      return true;
    }
    if (typeof control.click === "function") {
      const wantChecked = Boolean(checked);
      if (control.checked !== wantChecked) {
        control.click();
      }
      if (control.checked !== wantChecked) {
        control.click();
      }
      return control.checked === wantChecked;
    }
    return false;
  }

  function fillAddressGridFromSource(source) {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP || {};
    let filled = 0;
    const missing = [];

    if (source.addLocation || source.addLocationValue) {
      const addLocationSelect = resolveElementByMapValue(map.addLocation);
      const addLocationOk = setSelectField(
        addLocationSelect,
        source.addLocation,
        source.addLocationValue
      );
      if (addLocationOk) {
        filled += 1;
      } else {
        missing.push("addLocation");
      }
    }

    if (source.billAddress !== false && map.billAddress) {
      if (setBillAddressInRow(true)) {
        filled += 1;
      } else {
        missing.push("billAddress");
      }
    }

    ADDRESS_TEXT_FIELD_KEYS.forEach(function eachField(key) {
      try {
        const elementId = map[key];
        if (!elementId) {
          return;
        }
        const value = source[key];
        if (!value) {
          return;
        }
        const input = resolveElementByMapValue(elementId);
        const ok = setInputValue(input, value);
        if (ok) {
          filled += 1;
        } else {
          missing.push(key);
        }
      } catch (error) {
        missing.push(key);
      }
    });

    return {
      filled: filled,
      missing: missing,
      addressSummary: formatAddressSummary(source)
    };
  }

  function needsAddressGridPrep(payload) {
    return (isOnAddJobPage() || isOnEditJobPage()) && payloadTouchesAddressGrid(payload);
  }

  function runFillWithAddressPrep(payload, defaultMode, callback) {
    if (!needsAddressGridPrep(payload)) {
      callback(fillFromPayload(payload, defaultMode));
      return;
    }
    prepareAddressGridForFill(payload, function afterPrepare() {
      waitForAddressInlineInputs(function onReady() {
        const source = buildSource(payload);
        const addressResult = fillAddressGridFromSource(source);
        const mainResult = fillFromPayload(payload, defaultMode, { skipAddress: true });
        const merged = mergeFillResults(mainResult, addressResult);
        if (!onReady && addressResult.missing.length) {
          merged.missing.push("addressGridInputs");
        }
        callback(merged);
      });
    });
  }

  function fillFromPayload(payload, defaultMode, options) {
    const opts = options || {};
    const skipAddress = Boolean(opts.skipAddress);
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP || {};
    if (!payload || typeof payload !== "object") {
      return { filled: 0, missing: [], addressSummary: "" };
    }
    const source = buildSource(payload);
    const mode = normalizeJobDefaultMode(defaultMode);
    const textFields = skipAddress
      ? FILL_TEXT_FIELDS.filter(function notAddress(key) {
          return ADDRESS_TEXT_FIELD_KEYS.indexOf(key) === -1;
        })
      : FILL_TEXT_FIELDS;
    const selectFields = skipAddress
      ? FILL_SELECT_FIELDS.filter(function notAddLocation(key) {
          return key !== "addLocation";
        })
      : FILL_SELECT_FIELDS;
    const selectFieldValues = {
      propertyType: source.propertyType,
      payType: source.payType,
      businessUnit: source.businessUnit,
      insuranceCarrier: source.insuranceCarrier,
      lossType: mapLossTypeForTeamAllen ? mapLossTypeForTeamAllen(source.lossType) : source.lossType,
      coordinator: mapCoordinatorForTeamAllen ? mapCoordinatorForTeamAllen(source.coordinator) : source.coordinator,
      addLocation: source.addLocation,
      jobStatus: source.jobStatus
    };

    applyJobDefaultModeToSelects(selectFieldValues, mode);

    const selectOptionValues = {
      coordinator: source.coordinatorValue || selectFieldValues.coordinatorValue,
      reconManager: selectFieldValues.reconManagerValue,
      lossType: selectFieldValues.lossTypeValue || payload.lossTypeValue,
      jobStatus: source.jobStatus
    };

    let filled = 0;
    const missing = [];

    textFields.forEach(function eachField(key) {
      try {
        const elementId = map[key];
        if (!elementId) {
          return;
        }
        const input = resolveElementByMapValue(elementId);
        const value = source[key];
        if (!value) {
          return;
        }
        const ok = setInputValue(input, value);
        if (ok) {
          filled += 1;
        } else {
          missing.push(key);
        }
      } catch (error) {
        missing.push(key);
      }
    });

    selectFields.forEach(function eachSelect(key) {
      try {
        const elementId = map[key];
        if (!elementId) {
          return;
        }
        const value = selectFieldValues[key];
        if (!value) {
          return;
        }
        const select = resolveElementByMapValue(elementId);
        const optionValue =
          key === "addLocation" ? source.addLocationValue : selectOptionValues[key];
        const ok = setSelectField(select, value, optionValue);
        if (ok) {
          filled += 1;
        } else {
          missing.push(key);
        }
      } catch (error) {
        missing.push(key);
      }
    });

    if (!skipAddress && source.billAddress && map.billAddress) {
      if (setBillAddressInRow(true)) {
        filled += 1;
      } else {
        missing.push("billAddress");
      }
    }

    return {
      filled,
      missing,
      addressSummary: formatAddressSummary(source)
    };
  }

  function payloadTouchesAddressGrid(payload) {
    const map = selectorsApi.TEAMALLENSSM_FIELD_MAP;
    const source = buildSource(payload);
    const wantBill = source.billAddress !== false && map && map.billAddress;
    return Boolean(
      source.address1 ||
        source.address2 ||
        source.city ||
        source.state ||
        source.zip ||
        source.yearBuilt ||
        source.addLocation ||
        wantBill
    );
  }

  function prepareAddressGridForFill(payload, done) {
    if (!needsAddressGridPrep(payload)) {
      done();
      return;
    }
    const visibleRow = getVisibleAddressGridRow();
    if (!visibleRow) {
      done();
      return;
    }
    const rid = visibleRow.getAttribute("data-record-id") || "";
    if (rid === "add") {
      const addLink = visibleRow.querySelector('a[id^="iEditLink"], a[id^="iAddLink"]');
      if (addLink && typeof addLink.click === "function") {
        addLink.click();
        global.setTimeout(done, 280);
        return;
      }
    }
    if (!/^\d+$/.test(rid)) {
      done();
      return;
    }
    if (visibleAddressRowHasInlineInputs(visibleRow)) {
      done();
      return;
    }
    const editLink = visibleRow.querySelector('a[id^="iEditLink"]');
    if (!editLink || typeof editLink.click !== "function") {
      done();
      return;
    }
    editLink.click();
    global.setTimeout(done, 280);
  }

  function loadPayloads(callback) {
    const storage = getStorage();
    if (!storage) {
      callback(null, []);
      return;
    }
    const modeKey = selectorsApi.WORKCENTER_IMPORT.jobDefaultModeKey;
    storage.get([
      selectorsApi.WORKCENTER_IMPORT.storageKey,
      selectorsApi.WORKCENTER_IMPORT.historyKey,
      modeKey,
      selectorsApi.WORKCENTER_IMPORT.reconToggleKey
    ], function onLoad(result) {
      const latest = result && result[selectorsApi.WORKCENTER_IMPORT.storageKey];
      const history = result && result[selectorsApi.WORKCENTER_IMPORT.historyKey];
      let jobDefaultMode = result && result[modeKey];
      if (!jobDefaultMode && result && result[selectorsApi.WORKCENTER_IMPORT.reconToggleKey]) {
        jobDefaultMode = "recon";
      }
      callback(
        latest || null,
        Array.isArray(history) ? history : [],
        normalizeJobDefaultMode(jobDefaultMode)
      );
    });
  }

  function saveJobDefaultMode(mode, callback) {
    const storage = getStorage();
    if (!storage) {
      if (typeof callback === "function") {
        callback(false);
      }
      return;
    }
    const normalized = normalizeJobDefaultMode(mode);
    storage.set({ [selectorsApi.WORKCENTER_IMPORT.jobDefaultModeKey]: normalized }, function onSaved() {
      if (typeof callback === "function") {
        callback(!global.chrome.runtime.lastError, normalized);
      }
    });
  }

  function createJobDefaultModeControl(initialMode, onModeChanged) {
    const wrap = document.createElement("div");
    wrap.className = "servpro-job-default-mode";
    wrap.style.cssText = "margin-top:8px;";

    const label = document.createElement("div");
    label.textContent = "Coordinator defaults";
    label.style.cssText = "font-size:12px;color:#627d98;margin-bottom:4px;";

    const group = document.createElement("div");
    group.style.cssText =
      "display:flex;border:1px solid #c7d2da;border-radius:6px;overflow:hidden;width:100%;";

    let currentMode = normalizeJobDefaultMode(initialMode);
    const buttons = [];

    function styleBtn(btn, active) {
      btn.style.cssText = [
        "flex:1",
        "border:none",
        "padding:6px 4px",
        "font:12px/1.3 Arial,sans-serif",
        "cursor:pointer",
        active
          ? "background:var(--sp-accent,#1b4332);color:#fff;"
          : "background:var(--sp-surface-muted,#f8fafc);color:var(--sp-text,#334e68);"
      ].join("");
    }

    function setMode(mode) {
      currentMode = normalizeJobDefaultMode(mode);
      buttons.forEach(function each(entry) {
        styleBtn(entry.btn, entry.mode === currentMode);
      });
      if (typeof onModeChanged === "function") {
        onModeChanged(currentMode);
      }
    }

    [
      { mode: "none", label: "Non-default" },
      { mode: "recon", label: "Default recon" },
      { mode: "mitigation", label: "Default mitigation" }
    ].forEach(function eachDef(def) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = def.label;
      btn.addEventListener("click", function onClick() {
        setMode(def.mode);
        saveJobDefaultMode(def.mode);
      });
      buttons.push({ mode: def.mode, btn: btn });
      group.appendChild(btn);
    });

    setMode(currentMode);
    wrap.appendChild(label);
    wrap.appendChild(group);

    return {
      element: wrap,
      getMode: function getMode() {
        return currentMode;
      },
      setMode: setMode
    };
  }

  function savePayload(payload, callback) {
    const storage = getStorage();
    if (!storage) {
      callback(false);
      return;
    }
    storage.get([selectorsApi.WORKCENTER_IMPORT.historyKey], function onLoad(result) {
      const history = Array.isArray(result && result[selectorsApi.WORKCENTER_IMPORT.historyKey])
        ? result[selectorsApi.WORKCENTER_IMPORT.historyKey]
        : [];
      const deduped = history.filter(function keep(item) {
        if (!item || !payload) {
          return Boolean(item);
        }
        if (item.sourceUrl === payload.sourceUrl && item.projectId && item.projectId === payload.projectId) {
          return false;
        }
        return true;
      });
      deduped.unshift(payload);
      storage.set({
        [selectorsApi.WORKCENTER_IMPORT.storageKey]: payload,
        [selectorsApi.WORKCENTER_IMPORT.historyKey]: deduped.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5)
      }, function onSaved() {
        callback(!global.chrome.runtime.lastError);
      });
    });
  }

  function syncPanelThemes(settings) {
    const merged = settings || cachedSettings;
    ["servpro-teamallenssm-list-panel", "servpro-teamallenssm-helper-panel"].forEach(function eachId(id) {
      const el = document.getElementById(id);
      if (el && themeApi && themeApi.applyThemeToPanel) {
        themeApi.applyThemeToPanel(el, merged);
      }
    });
  }

  function createListPagePanel() {
    if (document.getElementById("servpro-teamallenssm-list-panel")) {
      return;
    }
    if (cachedSettings.hideListPanel) {
      return;
    }

    const payloadPanelApi = root.importPayloadPanel;
    if (!payloadPanelApi) {
      return;
    }

    if (helperPanelApi) {
      helperPanelApi.ensureHelperTheme(document);
    }

    const shell = helperPanelApi
      ? helperPanelApi.createHelperShell({
          id: "servpro-teamallenssm-list-panel",
          title: "Paste payload",
          variant: "list",
          settings: cachedSettings
        })
      : null;

    const panel = shell ? shell.panel : document.createElement("div");
    if (!shell) {
      panel.id = "servpro-teamallenssm-list-panel";
    }

    const hint = document.createElement("div");
    hint.className = "sp-hint";
    hint.textContent = "Paste WorkCenter JSON, save, then click Add Job above.";

    function setStatus(message) {
      if (shell) {
        shell.setStatus(message);
      }
    }

    let listPanelHasPayload = false;

    const jsonEditor = payloadPanelApi.createImportPayloadPanel({
      getBaselinePayload: function getBaseline() {
        return null;
      },
      onStatus: setStatus,
      onSave: function onSavePayload(payload, done) {
        savePayload(payload, function onSaved(ok) {
          if (ok) {
            listPanelHasPayload = true;
          }
          done(ok, ok ? "Payload saved. Now click \u201cAdd Job\u201d to open the form." : "Failed to save payload.");
        });
      }
    });

    jsonEditor.expand();

    const body = shell ? shell.body : panel;
    body.appendChild(hint);
    body.appendChild(jsonEditor.element);
    document.body.appendChild(panel);

    if (shell && shell.mountCollapsibleBody) {
      shell.mountCollapsibleBody({
        collapsedLabel: "Show payload editor",
        expandedLabel: "Hide payload editor",
        startExpanded: true
      });
    }

    const collapseControl = shell ? shell.mountCollapse("Job import") : { collapse: function noop() {} };
    if (cachedSettings.autoCollapsePanels !== false) {
      collapseControl.collapse();
    }

    function queueModalFillOnAddJobClick() {
      if (!usesModalAddJobUi() || !settingsApi || !listPanelHasPayload) {
        return;
      }
      settingsApi.setPendingAutoSubmit({
        autoSave: false,
        openVia: "modal",
        consumedListClick: true
      });
    }

    document.addEventListener("mousedown", function onAddJobMouseDown(e) {
      const target = e.target;
      const wi = selectorsApi.WORKCENTER_IMPORT || {};
      const selectors = wi.teamallenssmAddJobButtonSelectors || ["#AddJpb_Button_99", "#AddJpb_Button_9"];
      for (let i = 0; i < selectors.length; i += 1) {
        if (target && target.closest && target.closest(selectors[i])) {
          queueModalFillOnAddJobClick();
          break;
        }
      }
    }, true);

    document.addEventListener("click", function onAddJobClick(e) {
      const target = e.target;
      const wi = selectorsApi.WORKCENTER_IMPORT || {};
      const selectors = wi.teamallenssmAddJobButtonSelectors || ["#AddJpb_Button_99", "#AddJpb_Button_9"];
      let addJobBtn = null;
      for (let i = 0; i < selectors.length; i += 1) {
        if (target && target.closest && target.closest(selectors[i])) {
          addJobBtn = target.closest(selectors[i]);
          break;
        }
      }
      if (!addJobBtn) {
        return;
      }
      if (!collapseControl.isCollapsed || !collapseControl.isCollapsed()) {
        collapseControl.collapse();
      }
    }, true);

    loadPayloads(function initEditor(latest, history) {
      const existing = latest || (history.length ? history[0] : null);
      listPanelHasPayload = Boolean(existing);
      if (existing) {
        jsonEditor.setPayload(existing, { expand: true });
        setStatus("Existing payload loaded. Edit if needed, then save.");
      }
    });
  }

  function createPanel(isEditJob) {
    if (document.getElementById("servpro-teamallenssm-helper-panel")) {
      return;
    }
    if (cachedSettings.hideAddEditHelperPanel) {
      return;
    }

    const editJobMode = Boolean(isEditJob);
    const editJobId = editJobMode ? getEditJobIdFromSearch() : "";

    const payloadPanelApi = root.importPayloadPanel;
    let jsonEditor = null;
    let latestStoredPayload = null;

    if (helperPanelApi) {
      helperPanelApi.ensureHelperTheme(document);
    }

    const shellTitle = editJobMode
      ? "Job import" + (editJobId ? " \u00b7 #" + editJobId : "")
      : "Job import";

    const shell = helperPanelApi
      ? helperPanelApi.createHelperShell({
          id: "servpro-teamallenssm-helper-panel",
          title: shellTitle,
          variant: "import",
          settings: cachedSettings
        })
      : null;

    const panel = shell ? shell.panel : document.createElement("div");
    if (!shell) {
      panel.id = "servpro-teamallenssm-helper-panel";
    }

    const actionRow = shell ? shell.toolbar : document.createElement("div");
    if (!shell) {
      actionRow.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;";
    }

    const fillButton = document.createElement("button");
    fillButton.type = "button";
    fillButton.textContent = editJobMode ? "Update from payload" : "Fill from payload";
    if (helperPanelApi) {
      helperPanelApi.styleButton(fillButton, "primary");
    }

    const pasteJsonButton = document.createElement("button");
    pasteJsonButton.type = "button";
    pasteJsonButton.textContent = "Paste JSON";
    if (helperPanelApi) {
      helperPanelApi.styleButton(pasteJsonButton);
    }

    const copyJobButton = document.createElement("button");
    copyJobButton.type = "button";
    copyJobButton.textContent = "Copy job (JSON)";
    if (helperPanelApi) {
      helperPanelApi.styleButton(copyJobButton);
    }
    const copyPlainJobButton = document.createElement("button");
    copyPlainJobButton.type = "button";
    copyPlainJobButton.textContent = "Copy plain text";
    if (helperPanelApi) {
      helperPanelApi.styleButton(copyPlainJobButton);
    }
    const pasteNotesButton = document.createElement("button");
    pasteNotesButton.type = "button";
    pasteNotesButton.textContent = "Add notes from FNOL";
    pasteNotesButton.title = "Add FNOL notes to job Notes (Misc)";
    if (helperPanelApi) {
      helperPanelApi.styleButton(pasteNotesButton);
    }
    const pasteNotesRow = document.createElement("div");
    pasteNotesRow.className = "servpro-helper-row";
    pasteNotesRow.style.display = "none";

    const historyLabel = document.createElement("div");
    historyLabel.className = "servpro-helper-label";
    historyLabel.textContent = "History";

    const historySelect = document.createElement("select");
    historySelect.className = "servpro-helper-select";

    let jobDefaultModeControl = null;

    let selectedHistoryIndex = -1;

    function setStatus(message) {
      if (shell) {
        shell.setStatus(message);
      }
    }

    function summarizePayload(payload, index) {
      const when = payload && payload.scrapedAt ? new Date(payload.scrapedAt).toLocaleString() : "Unknown time";
      const primary = firstNonEmpty([payload.projectName, payload.customerName, payload.businessName, payload.claimNumber, "Record"]);
      return "#" + (index + 1) + " - " + primary + " - " + when;
    }

    function populateHistory(history, latest) {
      historySelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "-1";
      defaultOption.textContent = latest ? "Latest saved payload" : "Select history record";
      historySelect.appendChild(defaultOption);

      history.slice(0, selectorsApi.WORKCENTER_IMPORT.maxHistory || 5).forEach(function eachItem(item, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = summarizePayload(item, index);
        historySelect.appendChild(option);
      });

      historySelect.value = selectedHistoryIndex >= 0 ? String(selectedHistoryIndex) : "-1";
      refreshAddNotesFromFnolVisibility(latest, history);
    }

    function refreshAddNotesFromFnolVisibility(latest, history) {
      if (!settingsApi || !pasteNotesRow) {
        return;
      }
      settingsApi.getPendingNotesPaste(function onPending(pending) {
        let payload = latest || null;
        if (selectedHistoryIndex >= 0 && history && history[selectedHistoryIndex]) {
          payload = history[selectedHistoryIndex];
        } else if (!payload && history && history.length) {
          payload = history[0];
        }
        const hasPending = pending && normalizeText(pending.text);
        const hasPayloadNotes = noteTextFromPayload(payload);
        pasteNotesRow.style.display = hasPending || hasPayloadNotes ? "flex" : "none";
      });
    }

    function loadPayloadForEditor(latest, history) {
      let payload = latest || null;
      if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
        payload = history[selectedHistoryIndex];
      } else if (!payload && history.length) {
        payload = history[0];
      }
      if (jsonEditor && payload) {
        jsonEditor.setPayload(payload, { expand: false });
      }
    }

    function finishCopyJob(scraped, format) {
      const plainTextApi = root.payloadPlainText;
      const text =
        format === "plain" && plainTextApi
          ? plainTextApi.formatPayloadAsPlainText(scraped)
          : JSON.stringify(scraped, null, 2);
      const addressWarning =
        !normalizeText(scraped.address1) && !normalizeText(scraped.city)
          ? " Address not found in grid — open address inline edit and retry."
          : "";
      savePayload(scraped, function onSaved(ok) {
        if (jsonEditor) {
          jsonEditor.setPayload(scraped, { expand: true });
        }
        latestStoredPayload = scraped;
        loadPayloads(function onReload(latest, history) {
          populateHistory(history, latest);
        });
        copyTextToClipboard(text, function onCopied(copied) {
          const formatLabel = format === "plain" ? "normal text" : "JSON";
          setStatus(
            (ok ? "Job saved to payload history." : "Failed to save to history.") +
              (copied ? " Copied as " + formatLabel + "." : " Could not copy to clipboard.") +
              addressWarning
          );
        });
      });
    }

    copyJobButton.addEventListener("click", function onCopyJob() {
      scrapePayloadFromPageAsync(function onScraped(scraped) {
        finishCopyJob(scraped, "json");
      });
    });

    copyPlainJobButton.addEventListener("click", function onCopyPlainJob() {
      scrapePayloadFromPageAsync(function onScraped(scraped) {
        finishCopyJob(scraped, "plain");
      });
    });

    historySelect.addEventListener("change", function onHistoryChanged() {
      const parsed = Number(historySelect.value);
      selectedHistoryIndex = Number.isNaN(parsed) ? -1 : parsed;
      loadPayloads(function onLoaded(latest, history) {
        populateHistory(history, latest);
        loadPayloadForEditor(latest, history);
      });
    });

    if (payloadPanelApi) {
      jsonEditor = payloadPanelApi.createImportPayloadPanel({
        enablePaste: true,
        pastePlacement: "inline",
        analyzePayload: analyzeImportPayload,
        getBaselinePayload: function getBaseline() {
          return latestStoredPayload;
        },
        onStatus: setStatus,
        onSave: function onSavePayload(payload, done) {
          savePayload(payload, function onSaved(ok) {
            if (ok) {
              latestStoredPayload = payload;
            }
            done(ok, ok ? "Payload saved." : "Failed to save payload.");
          });
        }
      });
    }

    let bodyDropdown = null;

    pasteJsonButton.addEventListener("click", function onPasteJson() {
      if (bodyDropdown) {
        bodyDropdown.expand();
      }
      if (jsonEditor && jsonEditor.pasteFromClipboard) {
        jsonEditor.pasteFromClipboard();
      }
    });

    pasteNotesButton.addEventListener("click", function onPasteNotes() {
      function runPaste(payload) {
        if (!payload || !noteTextFromPayload(payload)) {
          setStatus("No FNOL notes in payload — submit from FNOL or load a payload with notes.");
          return;
        }
        setStatus("Adding notes from FNOL…");
        pasteNotesFromPayload(payload, function onDone(ok, msg) {
          if (ok && settingsApi) {
            settingsApi.clearPendingNotesPaste();
          }
          setStatus(msg);
        });
      }

      if (!settingsApi) {
        setStatus("Settings unavailable.");
        return;
      }
      settingsApi.getPendingNotesPaste(function onPending(pending) {
        if (pending && normalizeText(pending.text)) {
          runPaste({ notes: pending.text });
          return;
        }
        loadPayloads(function onLoaded(latest, history) {
          let payload = null;
          const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };
          if (editorParsed.ok && normalizeText(jsonEditor && jsonEditor.getText())) {
            payload = editorParsed.payload;
          } else if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
            payload = history[selectedHistoryIndex];
          } else if (latest) {
            payload = latest;
          } else if (history.length) {
            payload = history[0];
          }
          runPaste(payload);
        });
      });
    });

    fillButton.addEventListener("click", function onFill() {
      loadPayloads(function onLoaded(latest, history, storedJobDefaultMode) {
        populateHistory(history, latest);
        if (latest) {
          latestStoredPayload = latest;
        }

        let payload = null;
        const editorHasText = jsonEditor && payloadPanelApi && normalizeText(jsonEditor.getText());
        const editorParsed = jsonEditor ? jsonEditor.getPayloadFromEditor() : { ok: false };

        if (editorHasText) {
          if (!editorParsed.ok) {
            jsonEditor.setJsonError(editorParsed.error);
            setStatus(editorParsed.error);
            return;
          }
          const analysis = analyzeImportPayload(editorParsed.payload);
          if (!analysis.ok) {
            const msg = formatImportAnalysisMessage(analysis);
            jsonEditor.setJsonError(analysis.errors.join(" "));
            setStatus(msg);
            return;
          }
          if (analysis.warnings.length) {
            jsonEditor.setJsonError(analysis.warnings.join(" "), true);
          } else if (jsonEditor.setJsonError) {
            jsonEditor.setJsonError("");
          }
          payload = editorParsed.payload;
        } else if (selectedHistoryIndex >= 0 && history[selectedHistoryIndex]) {
          payload = history[selectedHistoryIndex];
        } else if (latest) {
          payload = latest;
        } else if (history.length) {
          payload = history[0];
        }

        const defaultMode = jobDefaultModeControl
          ? jobDefaultModeControl.getMode()
          : normalizeJobDefaultMode(storedJobDefaultMode || cachedSettings.defaultJobModeOnFill);
        if (!payload) {
          setStatus("No payload to fill. Paste JSON, save a payload, or scrape on WorkCenter first.");
          return;
        }

        runFillWithAddressPrep(payload, defaultMode, function afterFill(fillResult) {
          const staleMessage = getStalenessMessage(payload);
          const missingText = formatFillMissingMessage(fillResult.missing);
          const addressText = fillResult.addressSummary ? " Address: " + fillResult.addressSummary + "." : "";
          setStatus(
            "Filled " + fillResult.filled + " fields." +
            addressText +
            staleMessage +
            " History: " + history.length + "/5." +
            missingText +
            (editJobMode ? " Use Save or Save & Exit on this page when done." : "")
          );
        });
      });
    });

    actionRow.appendChild(fillButton);
    if (editJobMode && cachedSettings.showEditCopyButton !== false) {
      actionRow.appendChild(copyPlainJobButton);
      actionRow.appendChild(copyJobButton);
    }
    actionRow.appendChild(pasteJsonButton);

    const body = shell ? shell.body : panel;
    pasteNotesRow.appendChild(pasteNotesButton);
    body.appendChild(pasteNotesRow);
    body.appendChild(historyLabel);
    body.appendChild(historySelect);

    if (jsonEditor) {
      body.appendChild(jsonEditor.element);
    }
    document.body.appendChild(panel);

    if (shell && shell.mountCollapsibleBody) {
      bodyDropdown = shell.mountCollapsibleBody({
        collapsedLabel: "Show payload & options",
        expandedLabel: "Hide payload & options",
        startExpanded: false
      });
    }

    const collapseControl = shell ? shell.mountCollapse("Job import") : { collapse: function noop() {} };
    if (cachedSettings.autoCollapsePanels !== false) {
      collapseControl.collapse();
    }

    loadPayloads(function initHistory(latest, history, storedJobDefaultMode) {
      latestStoredPayload = latest || null;
      populateHistory(history, latest);
      loadPayloadForEditor(latest, history);
      const initialMode = normalizeJobDefaultMode(
        storedJobDefaultMode || cachedSettings.defaultJobModeOnFill
      );
      jobDefaultModeControl = createJobDefaultModeControl(initialMode);
      body.insertBefore(jobDefaultModeControl.element, historyLabel);
      if (history.length || latest) {
        setStatus(editJobMode ? "Ready. Paste JSON or click Update." : "Ready. Paste JSON or click Fill.");
      } else {
        setStatus(
          editJobMode
            ? "Ready. Paste JSON from WorkCenter or scrape there first, then click Update."
            : "Ready. Paste JSON from WorkCenter or scrape there first."
        );
      }
      if (!editJobMode) {
        tryPendingAutoFill(setStatus);
      } else {
        tryPendingNotesPasteOnEditBoot(setStatus);
      }
    });
  }

  function boot() {
    if (isOnAddJobPage()) {
      if (!cachedSettings.hideAddEditHelperPanel) {
        createPanel(false);
      } else {
        tryPendingAutoFill(null);
      }
    } else if (isOnEditJobPage()) {
      if (!cachedSettings.hideAddEditHelperPanel) {
        createPanel(true);
      } else {
        tryPendingNotesPasteOnEditBoot(null);
      }
    } else if (isOnListPage()) {
      settingsApi.getPendingAutoSubmit(function onPending(pending) {
        if (pending && !cachedSettings.hideListPanel) {
          createListPagePanel();
        }
        tryPendingModalAddJobClick(null);
      });
    }
  }

  function registerStorageListener() {
    if (!getStorage() || !settingsApi) {
      return;
    }
    chrome.storage.onChanged.addListener(function onStorageChanged(changes, areaName) {
      if (areaName !== "local") {
        return;
      }
      if (changes[settingsApi.SETTINGS_KEY]) {
        cachedSettings = settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue);
        syncPanelThemes(cachedSettings);
        const listPanel = document.getElementById("servpro-teamallenssm-list-panel");
        const helperPanel = document.getElementById("servpro-teamallenssm-helper-panel");
        if (!isTeamAllenFeatureEnabled()) {
          if (listPanel) {
            listPanel.remove();
          }
          if (helperPanel) {
            helperPanel.remove();
          }
          return;
        }
        if (cachedSettings.hideListPanel && listPanel) {
          listPanel.remove();
        }
        if (cachedSettings.hideAddEditHelperPanel && helperPanel) {
          helperPanel.remove();
        }
      }
    });
  }

  function start() {
    loadSettings(function onSettings() {
      if (!isTeamAllenFeatureEnabled()) {
        return;
      }
      registerStorageListener();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      } else {
        boot();
      }
    });
  }

  start();
})(window);
