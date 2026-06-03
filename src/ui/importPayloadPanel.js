(function initImportPayloadPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const hintsApi = root.buttonHints;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function formatPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }
    try {
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      return "";
    }
  }

  function parsePayloadText(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      return { ok: false, error: "JSON is empty." };
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { ok: false, error: "Payload must be a JSON object." };
      }
      return { ok: true, payload: parsed };
    } catch (error) {
      return { ok: false, error: "Invalid JSON: " + error.message };
    }
  }

  function readClipboardText(callback) {
    const nav = global.navigator;
    if (nav && nav.clipboard && typeof nav.clipboard.readText === "function") {
      nav.clipboard.readText().then(function onRead(text) {
        callback({ ok: true, text: text || "" });
      }).catch(function onFail(error) {
        callback({ ok: false, error: error && error.message ? error.message : "Clipboard read failed." });
      });
      return;
    }
    callback({ ok: false, error: "Clipboard paste is not available in this browser." });
  }

  function copyText(text, callback) {
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

  function createImportPayloadPanel(options) {
    const onSave = options.onSave || function noop() {};
    const onStatus = options.onStatus || function noop() {};
    const analyzePayload = options.analyzePayload || null;
    const enablePaste = Boolean(options.enablePaste);
    const pastePlacement = options.pastePlacement || "editor";
    const pasteInline = enablePaste && pastePlacement === "inline";
    const getBaselinePayload = options.getBaselinePayload || function noop() {
      return null;
    };

    const section = document.createElement("div");
    section.className = "servpro-import-json-section";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "servpro-json-toggle";
    toggle.textContent = "Show payload JSON";

    const editorPanel = document.createElement("div");
    editorPanel.style.display = "none";
    editorPanel.style.marginTop = "4px";

    const textarea = document.createElement("textarea");
    textarea.className = "servpro-import-json-editor";
    textarea.spellcheck = false;

    const errorEl = document.createElement("div");
    errorEl.className = "servpro-import-json-error";

    const actions = document.createElement("div");
    actions.className = "servpro-import-json-actions";

    function styleSecondaryButton(btn) {
      btn.className = "servpro-btn";
    }

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save payload";
    styleSecondaryButton(saveBtn);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy JSON";
    styleSecondaryButton(copyBtn);

    const copyPlainBtn = document.createElement("button");
    copyPlainBtn.type = "button";
    copyPlainBtn.textContent = "Copy as normal text";
    styleSecondaryButton(copyPlainBtn);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reset to last scrape";
    styleSecondaryButton(resetBtn);

    let pasteBtn = null;
    if (enablePaste && !pasteInline) {
      pasteBtn = document.createElement("button");
      pasteBtn.type = "button";
      pasteBtn.textContent = "Paste JSON";
      styleSecondaryButton(pasteBtn);
    }

    let expanded = false;
    let lastSavedPayload = null;

    function syncToggleHint() {
      if (hintsApi && hintsApi.applyButtonHint) {
        hintsApi.applyButtonHint(toggle, expanded ? "jsonHidePayload" : "jsonShowPayload");
      }
    }

    function setJsonError(message, isWarning) {
      if (!normalizeText(message)) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
        return;
      }
      errorEl.style.display = "block";
      errorEl.textContent = message;
      errorEl.classList.toggle("is-warning", Boolean(isWarning));
    }

    function runPayloadChecks(payload) {
      if (!analyzePayload) {
        return { ok: true, errors: [], warnings: [] };
      }
      return analyzePayload(payload) || { ok: true, errors: [], warnings: [] };
    }

    function applyEditorPayload(parsed, analysis) {
      setPayload(parsed, { expand: true });
      if (analysis.warnings.length) {
        setJsonError(analysis.warnings.join(" "), true);
        onStatus("Pasted with notes: " + analysis.warnings.join(" "));
      } else {
        setJsonError("");
        onStatus("Pasted JSON into editor.");
      }
    }

    function setPayload(payload, optionsInner) {
      const opts = optionsInner || {};
      lastSavedPayload = payload && typeof payload === "object" ? payload : null;
      textarea.value = formatPayload(payload);
      if (opts.expand) {
        expanded = true;
        editorPanel.style.display = "block";
        toggle.textContent = "Hide payload JSON";
        syncToggleHint();
      }
      setJsonError("");
    }

    function getPayloadFromEditor() {
      return parsePayloadText(textarea.value);
    }

    function toggleExpanded() {
      expanded = !expanded;
      editorPanel.style.display = expanded ? "block" : "none";
      toggle.textContent = expanded ? "Hide payload JSON" : "Show payload JSON";
      syncToggleHint();
    }

    if (hintsApi && hintsApi.applyButtonHint) {
      const apply = hintsApi.applyButtonHint;
      apply(saveBtn, "jsonSavePayload");
      apply(copyBtn, "jsonCopyJson");
      apply(copyPlainBtn, "jsonCopyPlain");
      apply(resetBtn, "jsonResetScrape");
      if (pasteBtn) {
        apply(pasteBtn, "jsonPasteJson");
      }
      syncToggleHint();
    }

    toggle.addEventListener("click", toggleExpanded);

    saveBtn.addEventListener("click", function onSaveClick() {
      const parsed = getPayloadFromEditor();
      if (!parsed.ok) {
        setJsonError(parsed.error);
        onStatus(parsed.error);
        return;
      }
      const analysis = runPayloadChecks(parsed.payload);
      if (!analysis.ok) {
        const msg = analysis.errors.join(" ");
        setJsonError(msg);
        onStatus(msg);
        return;
      }
      if (analysis.warnings.length) {
        setJsonError(analysis.warnings.join(" "), true);
      } else {
        setJsonError("");
      }
      onSave(parsed.payload, function onSaved(ok, message) {
        if (ok) {
          lastSavedPayload = parsed.payload;
        }
        const warnSuffix = analysis.warnings.length ? " " + analysis.warnings.join(" ") : "";
        onStatus((message || (ok ? "Payload saved." : "Failed to save payload.")) + warnSuffix);
      });
    });

    function pasteFromClipboard(done) {
      readClipboardText(function onClipboard(result) {
        if (!result.ok) {
          setJsonError(result.error);
          onStatus(result.error);
          if (typeof done === "function") {
            done(false);
          }
          return;
        }
        const parsed = parsePayloadText(result.text);
        if (!parsed.ok) {
          setJsonError(parsed.error);
          onStatus(parsed.error);
          if (typeof done === "function") {
            done(false);
          }
          return;
        }
        const analysis = runPayloadChecks(parsed.payload);
        if (!analysis.ok) {
          const msg = analysis.errors.join(" ");
          setJsonError(msg);
          onStatus(msg);
          if (typeof done === "function") {
            done(false);
          }
          return;
        }
        applyEditorPayload(parsed.payload, analysis);
        if (typeof done === "function") {
          done(true);
        }
      });
    }

    if (pasteBtn) {
      pasteBtn.addEventListener("click", function onPasteClick() {
        pasteFromClipboard();
      });
    }

    copyBtn.addEventListener("click", function onCopyClick() {
      const text = textarea.value || "";
      if (!normalizeText(text)) {
        onStatus("Nothing to copy.");
        return;
      }
      copyText(text, function onCopied(copied) {
        onStatus(copied ? "Copied JSON to clipboard." : "Clipboard copy failed.");
      });
    });

    copyPlainBtn.addEventListener("click", function onCopyPlainClick() {
      const parsed = getPayloadFromEditor();
      const plainTextApi = root.payloadPlainText;
      if (!parsed.ok) {
        setJsonError(parsed.error);
        onStatus(parsed.error);
        return;
      }
      const text = plainTextApi
        ? plainTextApi.formatPayloadAsPlainText(parsed.payload)
        : "";
      if (!normalizeText(text)) {
        onStatus("Nothing to copy.");
        return;
      }
      copyText(text, function onCopied(copied) {
        onStatus(copied ? "Copied as normal text." : "Clipboard copy failed.");
      });
    });

    resetBtn.addEventListener("click", function onReset() {
      const baseline = getBaselinePayload() || lastSavedPayload;
      if (!baseline) {
        onStatus("No scraped payload to reset to.");
        return;
      }
      setPayload(baseline, { expand: true });
      onStatus("Reset editor to last scraped payload.");
    });

    actions.appendChild(saveBtn);
    if (pasteBtn) {
      actions.appendChild(pasteBtn);
    }
    actions.appendChild(copyBtn);
    actions.appendChild(copyPlainBtn);
    actions.appendChild(resetBtn);

    editorPanel.appendChild(textarea);
    editorPanel.appendChild(errorEl);
    editorPanel.appendChild(actions);

    section.appendChild(toggle);
    section.appendChild(editorPanel);

    return {
      element: section,
      setPayload,
      getPayloadFromEditor,
      getText: function getText() {
        return textarea.value;
      },
      setJsonError,
      expand: function expand() {
        if (!expanded) {
          toggleExpanded();
        }
      },
      pasteFromClipboard: pasteFromClipboard
    };
  }

  root.importPayloadPanel = {
    formatPayload,
    parsePayloadText,
    readClipboardText,
    copyText,
    createImportPayloadPanel
  };
})(window);
