(function initPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const STORAGE_KEY = "servproUploadHelper.lastImageType";

  function getStorageApi() {
    return global.chrome && global.chrome.storage && global.chrome.storage.local
      ? global.chrome.storage.local
      : null;
  }

  function loadSavedType(select) {
    const storage = getStorageApi();
    if (!storage) {
      return;
    }

    storage.get([STORAGE_KEY], function onLoad(result) {
      const value = result && result[STORAGE_KEY];
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

  function saveSelectedType(value) {
    const storage = getStorageApi();
    if (!storage) {
      return;
    }

    storage.set({ [STORAGE_KEY]: value });
  }

  function ensureStyles(doc) {
    if (doc.getElementById("servpro-upload-helper-styles")) {
      return;
    }

    const style = doc.createElement("style");
    style.id = "servpro-upload-helper-styles";
    style.textContent = [
      "#servpro-upload-helper-panel{position:sticky;top:8px;z-index:2147483647;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;margin:8px;border:1px solid #c7d2da;border-radius:8px;background:#ffffff;color:#1f2933;font:13px/1.4 Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.12)}",
      "#servpro-upload-helper-panel select,#servpro-upload-helper-panel button{font:inherit}",
      "#servpro-upload-helper-panel select{min-width:220px;padding:6px}",
      "#servpro-upload-helper-panel button{padding:7px 10px;border:1px solid #1976d2;border-radius:6px;background:#1976d2;color:#fff;cursor:pointer}",
      "#servpro-upload-helper-panel button[disabled]{opacity:.6;cursor:default}",
      "#servpro-upload-helper-panel .servpro-upload-helper-status{min-width:160px;color:#334e68}",
      "#servpro-upload-helper-panel .servpro-upload-helper-title{font-weight:700}"
    ].join("");
    doc.head.appendChild(style);
  }

  function createPanel(doc, options) {
    const existing = doc.getElementById("servpro-upload-helper-panel");
    if (existing) {
      return existing;
    }

    ensureStyles(doc);

    const panel = doc.createElement("div");
    panel.id = "servpro-upload-helper-panel";

    const title = doc.createElement("span");
    title.className = "servpro-upload-helper-title";
    title.textContent = "Servpro Upload Helper";

    const select = doc.createElement("select");
    select.id = "servpro-upload-helper-type";
    for (const imageType of selectorsApi.IMAGE_TYPES) {
      const option = doc.createElement("option");
      option.value = imageType;
      option.textContent = imageType;
      select.appendChild(option);
    }
    loadSavedType(select);
    select.addEventListener("change", function onTypeChange() {
      saveSelectedType(select.value);
    });

    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = "Apply to all visible uploads";

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
        saveSelectedType(select.value);
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
