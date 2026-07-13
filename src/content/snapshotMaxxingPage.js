/**
 * Runs in the page (MAIN) world so jQuery/Kendo DateTimePicker are available.
 * Listens for CustomEvents from the isolated snapshotMaxxing content script.
 */
(function initSnapshotMaxxingPage() {
  const REQUEST_EVENT = "servpro-snapshot-maxxing-request";
  const RESULT_EVENT = "servpro-snapshot-maxxing-result";
  const FORM_SELECTOR = "#ListDetailsForm";

  if (window.__servproSnapshotMaxxingPage) {
    return;
  }
  window.__servproSnapshotMaxxingPage = true;

  function getInput(propertyName) {
    if (!propertyName) {
      return null;
    }
    const form = document.querySelector(FORM_SELECTOR);
    if (!form) {
      return null;
    }
    return form.querySelector(
      'input[data-role="datetimepicker"][data-propertyname="' + propertyName + '"]'
    );
  }

  function getWidget(input) {
    if (!input || !window.jQuery) {
      return null;
    }
    try {
      return window.jQuery(input).data("kendoDateTimePicker") || null;
    } catch (error) {
      return null;
    }
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

  function readDate(propertyName) {
    const input = getInput(propertyName);
    if (!input) {
      return null;
    }
    const widget = getWidget(input);
    if (widget && typeof widget.value === "function") {
      const value = widget.value();
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
      }
    }
    return null;
  }

  function writeDate(propertyName, date) {
    const input = getInput(propertyName);
    if (!input || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      return false;
    }
    if (!isInputEditable(input)) {
      return false;
    }
    const widget = getWidget(input);
    if (!widget || typeof widget.value !== "function") {
      return false;
    }
    try {
      widget.value(date);
      if (typeof widget.trigger === "function") {
        widget.trigger("change");
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function emitResult(requestId, payload) {
    document.dispatchEvent(
      new CustomEvent(RESULT_EVENT, {
        detail: Object.assign({ requestId: requestId }, payload || {})
      })
    );
  }

  function optimizeOne(spec) {
    const propertyName = spec.propertyName;
    const offsetMinutes = Number(spec.offsetMinutes) || 0;
    const baseProperty = spec.baseProperty || "listDateListOpened";
    const fallbackBase = spec.fallbackBase || null;
    const fallbackOffsetMinutes = Number(spec.fallbackOffsetMinutes);

    const input = getInput(propertyName);
    if (!input) {
      return { ok: false, skipped: true, reason: "missing-input", propertyName: propertyName };
    }
    if (!isInputEditable(input)) {
      return { ok: false, skipped: true, reason: "disabled", propertyName: propertyName };
    }

    let base = readDate(baseProperty);
    let usedFallback = false;
    let appliedOffset = offsetMinutes;

    if (!base && fallbackBase) {
      base = readDate(fallbackBase);
      usedFallback = true;
      appliedOffset = Number.isFinite(fallbackOffsetMinutes)
        ? fallbackOffsetMinutes
        : offsetMinutes;
    }

    if (!base) {
      return {
        ok: false,
        skipped: false,
        reason: "missing-base",
        propertyName: propertyName,
        message: "Set Date Received first."
      };
    }

    const next = addMinutes(base, appliedOffset);
    const ok = writeDate(propertyName, next);
    return {
      ok: ok,
      skipped: false,
      reason: ok ? null : "write-failed",
      propertyName: propertyName,
      usedFallback: usedFallback,
      timestamp: next.getTime(),
      message: ok ? null : "Could not update the date field."
    };
  }

  function handleOptimize(detail) {
    const result = optimizeOne(detail);
    if (!result.ok && result.reason === "missing-base") {
      emitResult(detail.requestId, {
        ok: false,
        reason: "missing-base",
        message: "Set Date Received first."
      });
      return;
    }
    if (result.skipped) {
      emitResult(detail.requestId, {
        ok: false,
        reason: result.reason,
        message: result.reason === "disabled"
          ? "Field is not editable."
          : "Field not found."
      });
      return;
    }
    emitResult(detail.requestId, {
      ok: result.ok,
      reason: result.reason,
      message: result.message,
      usedFallback: result.usedFallback,
      timestamp: result.timestamp
    });
  }

  function handleOptimizeAll(detail) {
    const fields = Array.isArray(detail.fields) ? detail.fields : [];
    const filled = [];
    const skipped = [];
    let missingBase = false;

    for (let i = 0; i < fields.length; i += 1) {
      const result = optimizeOne(fields[i]);
      if (result.ok) {
        filled.push(result.propertyName);
        continue;
      }
      if (result.reason === "missing-base") {
        missingBase = true;
        skipped.push(result.propertyName);
        break;
      }
      skipped.push(result.propertyName);
    }

    emitResult(detail.requestId, {
      ok: !missingBase && filled.length > 0,
      reason: missingBase ? "missing-base" : null,
      message: missingBase
        ? "Set Date Received first."
        : filled.length
          ? "Filled " + filled.length + " field(s)."
          : "No fields were filled.",
      filled: filled,
      skipped: skipped
    });
  }

  document.addEventListener(REQUEST_EVENT, function onRequest(event) {
    const detail = event && event.detail ? event.detail : null;
    if (!detail || !detail.requestId) {
      return;
    }
    if (detail.action === "optimize") {
      handleOptimize(detail);
      return;
    }
    if (detail.action === "optimize-all") {
      handleOptimizeAll(detail);
      return;
    }
    emitResult(detail.requestId, {
      ok: false,
      reason: "unknown-action",
      message: "Unknown snapshot maxxing action."
    });
  });
})();
