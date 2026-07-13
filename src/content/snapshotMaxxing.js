(function initSnapshotMaxxing(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const settingsApi = root.settings;

  const PANEL_SELECTOR = "#MainContent_JobInfoHeader1_pnl_JobSnapshot2";
  const FORM_SELECTOR = "#ListDetailsForm";
  const BASE_PROPERTY = "listDateListOpened";
  const BUTTON_CLASS = "servpro-snapshot-optimize";
  const FILL_ALL_CLASS = "servpro-snapshot-fill-all";
  const FILL_ALL_BAR_CLASS = "servpro-snapshot-fill-all-bar";
  const HOST_CLASS = "servpro-snapshot-opt";
  const STYLE_ID = "servpro-snapshot-maxxing-style";
  const REQUEST_EVENT = "servpro-snapshot-maxxing-request";
  const RESULT_EVENT = "servpro-snapshot-maxxing-result";

  const FIELD_CONFIG = [
    {
      propertyName: "dateContacted",
      label: "Customer Called",
      offsetKey: "snapshotOffsetCustomerCalledMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateReviewStart",
      label: "Site Appt Start",
      offsetKey: "snapshotOffsetApptStartMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateReviewEnd",
      label: "Site Appt End",
      offsetKey: "snapshotOffsetApptEndMinutes",
      baseProperty: "dateReviewStart",
      fallbackBase: BASE_PROPERTY,
      fallbackOffsetKeys: [
        "snapshotOffsetApptStartMinutes",
        "snapshotOffsetApptEndMinutes"
      ]
    },
    {
      propertyName: "dateSiteInspected",
      label: "Site Inspected",
      offsetKey: "snapshotOffsetSiteInspectedMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateEstimateDelivered",
      label: "Estimate Delivered",
      offsetKey: "snapshotOffsetEstimateDeliveredMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "estimateApproved",
      label: "Estimate Approved",
      offsetKey: "snapshotOffsetEstimateApprovedMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateEstimateAccepted",
      label: "WA Signed",
      offsetKey: "snapshotOffsetWaSignedMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "targetStartDate",
      label: "Target Start Date",
      offsetKey: "snapshotOffsetTargetStartMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateProjectedClose",
      label: "Target Completion",
      offsetKey: "snapshotOffsetTargetCompletionMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dateRepairStart",
      label: "Work Date Start",
      offsetKey: "snapshotOffsetWorkStartMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dryingStarted",
      label: "Drying Started",
      offsetKey: "snapshotOffsetDryingStartedMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "dryingCompleted",
      label: "Drying Completed",
      offsetKey: "snapshotOffsetDryingCompletedMinutes",
      baseProperty: BASE_PROPERTY
    },
    {
      propertyName: "jobCompleted",
      label: "Project Completed",
      offsetKey: "snapshotOffsetProjectCompletedMinutes",
      baseProperty: BASE_PROPERTY
    }
  ];

  let cachedSettings = settingsApi
    ? settingsApi.mergeSettings(null)
    : { snapshotMaxxingEnabled: false };
  let observer = null;
  let injectTimer = null;
  let requestSeq = 0;
  const pendingRequests = new Map();

  function isTopFrame() {
    try {
      return global.self === global.top;
    } catch (error) {
      return true;
    }
  }

  function isFeatureEnabled() {
    if (!settingsApi) {
      return false;
    }
    return (
      settingsApi.isTeamAllenActivated(cachedSettings) &&
      Boolean(cachedSettings.snapshotMaxxingEnabled)
    );
  }

  function getOffset(key) {
    const n = Number(cachedSettings[key]);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "#ListDetailsForm .k-datetimepicker." +
      HOST_CLASS +
      " .k-select{width:10em;}" +
      "#ListDetailsForm .k-datetimepicker." +
      HOST_CLASS +
      " .k-picker-wrap{padding-right:10em;}" +
      "#ListDetailsForm .k-datetimepicker.link-5." +
      HOST_CLASS +
      " .k-select{width:12em;}" +
      "#ListDetailsForm .k-datetimepicker.link-5." +
      HOST_CLASS +
      " .k-picker-wrap{padding-right:12em;}" +
      "#ListDetailsForm ." +
      BUTTON_CLASS +
      "{cursor:pointer;font-size:11px;font-weight:700;line-height:1;padding:0 2px;color:#0b5cab;}" +
      "#ListDetailsForm ." +
      BUTTON_CLASS +
      ".is-error{color:#b00020;}" +
      "#ListDetailsForm ." +
      FILL_ALL_BAR_CLASS +
      "{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:6px 8px;" +
      "background:#f3f7fb;border:1px solid #c5d6e8;border-radius:4px;}" +
      "#ListDetailsForm ." +
      FILL_ALL_CLASS +
      "{cursor:pointer;font-size:12px;font-weight:700;padding:4px 10px;" +
      "color:#fff;background:#0b5cab;border:0;border-radius:3px;}" +
      "#ListDetailsForm ." +
      FILL_ALL_CLASS +
      ":hover{background:#094a8a;}" +
      "#ListDetailsForm ." +
      FILL_ALL_CLASS +
      ".is-error{background:#b00020;}" +
      "#ListDetailsForm .servpro-snapshot-fill-all-hint{font-size:11px;color:#456;}";
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyles() {
    const style = document.getElementById(STYLE_ID);
    if (style) {
      style.remove();
    }
  }

  function getForm() {
    const panel = document.querySelector(PANEL_SELECTOR);
    if (!panel) {
      return null;
    }
    return panel.querySelector(FORM_SELECTOR) || document.querySelector(FORM_SELECTOR);
  }

  function findInput(form, propertyName) {
    return form.querySelector(
      'input[data-role="datetimepicker"][data-propertyname="' + propertyName + '"]'
    );
  }

  function isInputEditable(input) {
    if (!input) {
      return false;
    }
    if (input.disabled || input.readOnly) {
      return false;
    }
    const wrap = input.closest(".k-picker-wrap");
    if (wrap && wrap.classList.contains("k-state-disabled")) {
      return false;
    }
    return true;
  }

  function removeButtons() {
    document.querySelectorAll("." + BUTTON_CLASS).forEach(function eachBtn(btn) {
      const host = btn.closest(".k-datetimepicker");
      if (host) {
        host.classList.remove(HOST_CLASS);
      }
      const link = btn.closest(".k-link");
      if (link) {
        link.remove();
      } else {
        btn.remove();
      }
    });
    document.querySelectorAll("." + FILL_ALL_BAR_CLASS).forEach(function eachBar(bar) {
      bar.remove();
    });
  }

  function requestAction(action, payload) {
    return new Promise(function requestPromise(resolve) {
      requestSeq += 1;
      const requestId = "snap-" + requestSeq + "-" + Date.now();
      const timeoutId = global.setTimeout(function onTimeout() {
        pendingRequests.delete(requestId);
        resolve({
          ok: false,
          reason: "timeout",
          message: "Timed out updating the date field."
        });
      }, action === "optimize-all" ? 8000 : 3000);

      pendingRequests.set(requestId, function onResult(result) {
        global.clearTimeout(timeoutId);
        resolve(result || { ok: false, reason: "empty", message: "No response." });
      });

      document.dispatchEvent(
        new CustomEvent(REQUEST_EVENT, {
          detail: Object.assign({}, payload, { requestId: requestId, action: action })
        })
      );
    });
  }

  function buildFieldPayload(config) {
    const payload = {
      propertyName: config.propertyName,
      offsetMinutes: getOffset(config.offsetKey),
      baseProperty: config.baseProperty || BASE_PROPERTY
    };
    if (config.fallbackBase) {
      payload.fallbackBase = config.fallbackBase;
      let fallback = 0;
      (config.fallbackOffsetKeys || []).forEach(function eachKey(key) {
        fallback += getOffset(key);
      });
      payload.fallbackOffsetMinutes = fallback;
    }
    return payload;
  }

  function buildTitle(config) {
    const offset = getOffset(config.offsetKey);
    if (config.propertyName === "dateReviewEnd") {
      const startOffset = getOffset("snapshotOffsetApptStartMinutes");
      return (
        "Optimize: Appt Start +" +
        offset +
        " min (or Date Received +" +
        (startOffset + offset) +
        " min if Start empty)"
      );
    }
    return "Optimize: Date Received +" + offset + " min";
  }

  function flashError(el, message) {
    if (!el) {
      return;
    }
    const prev = el.getAttribute("title") || "";
    el.classList.add("is-error");
    el.setAttribute("title", message || "Could not optimize.");
    global.setTimeout(function clearFlash() {
      el.classList.remove("is-error");
      el.setAttribute("title", prev);
    }, 2500);
  }

  function onOptimizeClick(event, config, btn) {
    event.preventDefault();
    event.stopPropagation();

    if (!isFeatureEnabled()) {
      return;
    }

    requestAction("optimize", buildFieldPayload(config)).then(function onDone(result) {
      if (!result || !result.ok) {
        flashError(btn, (result && result.message) || "Set Date Received first.");
      }
    });
  }

  function onFillAllClick(event, btn, statusEl) {
    event.preventDefault();
    event.stopPropagation();

    if (!isFeatureEnabled()) {
      return;
    }

    const fields = FIELD_CONFIG.map(buildFieldPayload);
    if (statusEl) {
      statusEl.textContent = "Filling…";
    }
    btn.disabled = true;

    requestAction("optimize-all", { fields: fields }).then(function onDone(result) {
      btn.disabled = false;
      if (!result || !result.ok) {
        flashError(btn, (result && result.message) || "Set Date Received first.");
        if (statusEl) {
          statusEl.textContent = (result && result.message) || "Set Date Received first.";
        }
        return;
      }
      if (statusEl) {
        const filledCount = result.filled && result.filled.length ? result.filled.length : 0;
        statusEl.textContent = "Filled " + filledCount + " field(s).";
      }
    });
  }

  function injectButton(form, config) {
    const input = findInput(form, config.propertyName);
    if (!input || !isInputEditable(input)) {
      return;
    }

    const host = input.closest(".k-datetimepicker");
    if (!host) {
      return;
    }
    const select = host.querySelector(".k-select");
    if (!select) {
      return;
    }
    if (select.querySelector("." + BUTTON_CLASS)) {
      const existing = select.querySelector("." + BUTTON_CLASS);
      existing.setAttribute("title", buildTitle(config));
      host.classList.add(HOST_CLASS);
      // Ensure M stays last if icons were re-appended
      const link = existing.closest(".k-link");
      if (link && link.parentNode === select && select.lastElementChild !== link) {
        select.appendChild(link);
      }
      return;
    }

    const link = document.createElement("span");
    link.className = "k-link";
    const btn = document.createElement("span");
    btn.className = "k-icon-custom " + BUTTON_CLASS;
    btn.setAttribute("role", "button");
    btn.setAttribute("title", buildTitle(config));
    btn.textContent = "M";
    btn.addEventListener("click", function onClick(event) {
      onOptimizeClick(event, config, btn);
    });
    link.appendChild(btn);
    // Always last: after Clear (and ICS if present)
    select.appendChild(link);
    host.classList.add(HOST_CLASS);
  }

  function injectFillAll(form) {
    if (form.querySelector("." + FILL_ALL_BAR_CLASS)) {
      return;
    }

    const bar = document.createElement("div");
    bar.className = FILL_ALL_BAR_CLASS;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = FILL_ALL_CLASS;
    btn.textContent = "Fill All";
    btn.title = "Fill all Snapshot Maxxing date fields from Date Received using your settings offsets";

    const hint = document.createElement("span");
    hint.className = "servpro-snapshot-fill-all-hint";
    hint.textContent = "Uses Date Received + offsets from settings";

    btn.addEventListener("click", function onClick(event) {
      onFillAllClick(event, btn, hint);
    });

    bar.appendChild(btn);
    bar.appendChild(hint);

    const firstRow = form.querySelector(".row");
    if (firstRow) {
      form.insertBefore(bar, firstRow);
    } else {
      form.insertBefore(bar, form.firstChild);
    }
  }

  function syncButtons() {
    if (!isFeatureEnabled()) {
      removeButtons();
      removeStyles();
      return;
    }

    const form = getForm();
    if (!form) {
      removeButtons();
      return;
    }

    ensureStyles();
    injectFillAll(form);
    FIELD_CONFIG.forEach(function eachField(config) {
      injectButton(form, config);
    });
  }

  function scheduleSync() {
    if (injectTimer) {
      global.clearTimeout(injectTimer);
    }
    injectTimer = global.setTimeout(function runSync() {
      injectTimer = null;
      syncButtons();
    }, 120);
  }

  function startObserver() {
    if (observer || !document.body) {
      return;
    }
    observer = new MutationObserver(function onMutations() {
      if (!isFeatureEnabled()) {
        return;
      }
      scheduleSync();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function applySettings(settings) {
    cachedSettings = settingsApi
      ? settingsApi.mergeSettings(settings)
      : settings || cachedSettings;
    if (isFeatureEnabled()) {
      startObserver();
      scheduleSync();
    } else {
      stopObserver();
      removeButtons();
      removeStyles();
    }
  }

  function loadSettings(callback) {
    if (!settingsApi) {
      cachedSettings = { snapshotMaxxingEnabled: false };
      callback(cachedSettings);
      return;
    }
    settingsApi.getSettings(function onLoaded(settings) {
      cachedSettings = settings;
      callback(settings);
    });
  }

  if (!isTopFrame()) {
    return;
  }

  document.addEventListener(RESULT_EVENT, function onResult(event) {
    const detail = event && event.detail ? event.detail : null;
    if (!detail || !detail.requestId) {
      return;
    }
    const resolver = pendingRequests.get(detail.requestId);
    if (!resolver) {
      return;
    }
    pendingRequests.delete(detail.requestId);
    resolver(detail);
  });

  loadSettings(function onReady() {
    applySettings(cachedSettings);
  });

  if (global.chrome && global.chrome.storage && global.chrome.storage.onChanged) {
    global.chrome.storage.onChanged.addListener(function onStorageChanged(changes, areaName) {
      if (areaName !== "local" || !settingsApi || !changes[settingsApi.SETTINGS_KEY]) {
        return;
      }
      applySettings(settingsApi.mergeSettings(changes[settingsApi.SETTINGS_KEY].newValue));
    });
  }

  root.snapshotMaxxing = {
    syncButtons: syncButtons,
    isFeatureEnabled: isFeatureEnabled
  };
})(window);
