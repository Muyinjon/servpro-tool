(function initImportPayloadPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

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
    const getBaselinePayload = options.getBaselinePayload || function noop() {
      return null;
    };

    const section = document.createElement("div");
    section.className = "servpro-import-json-section";
    section.style.marginTop = "8px";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = "Show payload JSON";
    toggle.style.cssText =
      "border:1px solid #c7d2da;background:#f8fafc;color:#334e68;border-radius:6px;padding:4px 8px;cursor:pointer;width:100%;text-align:left;";

    const editorPanel = document.createElement("div");
    editorPanel.style.display = "none";
    editorPanel.style.marginTop = "6px";

    const textarea = document.createElement("textarea");
    textarea.className = "servpro-import-json-editor";
    textarea.spellcheck = false;
    textarea.style.cssText =
      "width:100%;min-height:140px;max-height:220px;box-sizing:border-box;font:12px/1.4 Consolas,Monaco,monospace;padding:8px;border:1px solid #c7d2da;border-radius:6px;resize:vertical;";

    const errorEl = document.createElement("div");
    errorEl.className = "servpro-import-json-error";
    errorEl.style.cssText = "color:#b42318;font-size:12px;margin-top:4px;display:none;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;";

    function styleSecondaryButton(btn) {
      btn.style.cssText =
        "border:1px solid #c7d2da;background:#fff;color:#334e68;border-radius:6px;padding:5px 8px;cursor:pointer;font:inherit;";
    }

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save payload";
    styleSecondaryButton(saveBtn);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy JSON";
    styleSecondaryButton(copyBtn);

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reset to last scrape";
    styleSecondaryButton(resetBtn);

    let expanded = false;
    let lastSavedPayload = null;

    function setJsonError(message) {
      if (!normalizeText(message)) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
        return;
      }
      errorEl.style.display = "block";
      errorEl.textContent = message;
    }

    function setPayload(payload, optionsInner) {
      const opts = optionsInner || {};
      lastSavedPayload = payload && typeof payload === "object" ? payload : null;
      textarea.value = formatPayload(payload);
      if (opts.expand) {
        expanded = true;
        editorPanel.style.display = "block";
        toggle.textContent = "Hide payload JSON";
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
    }

    toggle.addEventListener("click", toggleExpanded);

    saveBtn.addEventListener("click", function onSaveClick() {
      const parsed = getPayloadFromEditor();
      if (!parsed.ok) {
        setJsonError(parsed.error);
        onStatus(parsed.error);
        return;
      }
      setJsonError("");
      onSave(parsed.payload, function onSaved(ok, message) {
        if (ok) {
          lastSavedPayload = parsed.payload;
        }
        onStatus(message || (ok ? "Payload saved." : "Failed to save payload."));
      });
    });

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
    actions.appendChild(copyBtn);
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
      }
    };
  }

  root.importPayloadPanel = {
    formatPayload,
    parsePayloadText,
    copyText,
    createImportPayloadPanel
  };
})(window);
