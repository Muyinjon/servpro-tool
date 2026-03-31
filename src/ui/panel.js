(function initPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;

  function getStorageApi() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function loadSavedType(select, storageKey) {
    const storage = getStorageApi();
    if (!storage || !storageKey) {
      return;
    }

    storage.get([storageKey], function onLoad(result) {
      const value = result && result[storageKey];
      if (!value) {
        return;
      }

      const option = Array.from(select.options).find(function matches(entry) {
        return entry.value === value;
      });

      if (option) {
        select.value = value;
      }
    });
  }

  function saveSelectedType(value, storageKey) {
    const storage = getStorageApi();
    if (!storage || !storageKey) {
      return;
    }

    storage.set({ [storageKey]: value });
  }

  function ensureStyles(doc) {
    if (doc.getElementById("servpro-upload-helper-styles")) {
      return;
    }

    const style = doc.createElement("style");
    style.id = "servpro-upload-helper-styles";
    style.textContent = [
      "[id$='helper-panel']{position:sticky;top:8px;z-index:2147483647;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;margin:8px;border:1px solid #c7d2da;border-radius:8px;background:#ffffff;color:#1f2933;font:13px/1.4 Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.12)}",
      "[id$='helper-panel'] select,[id$='helper-panel'] button{font:inherit}",
      "[id$='helper-panel'] select{min-width:220px;padding:6px}",
      "[id$='helper-panel'] button{padding:7px 10px;border:1px solid #1976d2;border-radius:6px;background:#1976d2;color:#fff;cursor:pointer}",
      "[id$='helper-panel'] button[disabled]{opacity:.6;cursor:default}",
      "[id$='helper-panel'] .servpro-upload-helper-status{min-width:160px;color:#334e68}",
      "[id$='helper-panel'] .servpro-upload-helper-title{font-weight:700}"
    ].join("");
    doc.head.appendChild(style);
  }

  function createPanel(doc, options) {
    const panelId = (options && options.panelId) || "servpro-upload-helper-panel";
    const panelTitle = (options && options.title) || "Servpro Upload Helper";
    const selectOptions = (options && options.selectOptions) || selectorsApi.IMAGE_TYPES;
    const storageKey = options && options.storageKey;
    const primaryButtonLabel = (options && options.buttonLabel) || "Apply to all visible uploads";

    const existing = doc.getElementById(panelId);
    if (existing) {
      return existing;
    }

    ensureStyles(doc);

    const panel = doc.createElement("div");
    panel.id = panelId;

    const title = doc.createElement("span");
    title.className = "servpro-upload-helper-title";
    title.textContent = panelTitle;

    const select = doc.createElement("select");
    select.id = panelId + "-type";
    for (const imageType of selectOptions) {
      const option = doc.createElement("option");
      option.value = imageType;
      option.textContent = imageType;
      select.appendChild(option);
    }
    loadSavedType(select, storageKey);
    select.addEventListener("change", function onTypeChange() {
      saveSelectedType(select.value, storageKey);
    });

    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = primaryButtonLabel;

    const refreshButton = doc.createElement("button");
    refreshButton.type = "button";
    refreshButton.textContent = "Refresh rows";

    const status = doc.createElement("span");
    status.className = "servpro-upload-helper-status";
    status.textContent = "Waiting for upload rows";

    button.addEventListener("click", async function onClick() {
      if (!options || typeof options.onApply !== "function") {
        return;
      }

      button.disabled = true;
      status.textContent = "Applying type...";

      try {
        saveSelectedType(select.value, storageKey);
        const result = await options.onApply(select.value);
        status.textContent = result;
      } catch (error) {
        status.textContent = "Bulk apply failed";
      } finally {
        button.disabled = false;
      }
    });

    refreshButton.addEventListener("click", function onRefresh() {
      if (options && typeof options.onRefresh === "function") {
        options.onRefresh();
      }
    });

    panel.appendChild(title);
    panel.appendChild(select);
    panel.appendChild(button);
    panel.appendChild(refreshButton);
    panel.appendChild(status);

    return panel;
  }

  function mountPanel(doc, container, options) {
    const panel = createPanel(doc, options);
    const target = container || doc.body;

    if (!panel.isConnected) {
      target.insertBefore(panel, target.firstChild);
    }

    return {
      element: panel,
      setStatus(message) {
        const status = panel.querySelector(".servpro-upload-helper-status");
        if (status) {
          status.textContent = message;
        }
      }
    };
  }

  root.panel = {
    mountPanel
  };
})(window);
