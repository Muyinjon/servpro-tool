(function initHelperPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const themeApi = root.theme;

  const THEME_STYLE_ID = "servpro-helper-theme-styles";
  let themeCssText = null;

  function getThemeCssUrl() {
    if (global.chrome && global.chrome.runtime && global.chrome.runtime.getURL) {
      return chrome.runtime.getURL("src/ui/theme.css");
    }
    return "";
  }

  function ensureHelperTheme(doc) {
    const documentRef = doc || global.document;
    if (!documentRef || !documentRef.head) {
      return;
    }
    if (documentRef.getElementById(THEME_STYLE_ID)) {
      return;
    }
    const link = documentRef.createElement("link");
    link.id = THEME_STYLE_ID;
    link.rel = "stylesheet";
    link.href = getThemeCssUrl();
    documentRef.head.appendChild(link);
  }

  function createHelperShell(options) {
    const opts = options || {};
    const doc = opts.doc || global.document;
    ensureHelperTheme(doc);

    const panel = doc.createElement("div");
    panel.id = opts.id || "servpro-helper-panel";
    panel.className = "servpro-helper-panel servpro-helper-panel--" + (opts.variant || "default");

    if (themeApi && themeApi.applyThemeToPanel) {
      themeApi.applyThemeToPanel(panel, opts.settings || null);
    } else if (opts.darkMode) {
      panel.dataset.servproTheme = opts.darkMode ? "dark" : "light";
    }

    const header = doc.createElement("div");
    header.className = "servpro-helper-header";

    const titleWrap = doc.createElement("div");
    titleWrap.style.cssText = "display:flex;align-items:center;gap:6px;min-width:0;flex:1;";

    const titleEl = doc.createElement("span");
    titleEl.className = "servpro-helper-title";
    titleEl.textContent = opts.title || "Helper";

    titleWrap.appendChild(titleEl);

    if (opts.badge) {
      const badge = doc.createElement("span");
      badge.className = "servpro-helper-badge";
      badge.textContent = opts.badge;
      titleWrap.appendChild(badge);
    }

    const closeBtn = doc.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "servpro-helper-close";
    closeBtn.textContent = "\u00d7";
    closeBtn.title = "Collapse panel";
    closeBtn.setAttribute("aria-label", "Collapse panel");

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    const toolbar = doc.createElement("div");
    toolbar.className = "servpro-helper-toolbar";

    const body = doc.createElement("div");
    body.className = "servpro-helper-body";

    const statusEl = doc.createElement("div");
    statusEl.className = "servpro-helper-status";
    statusEl.textContent = opts.statusText || "Ready";

    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(body);
    panel.appendChild(statusEl);

    function setStatus(message) {
      statusEl.textContent = message || "";
    }

    function syncTheme(settings) {
      if (themeApi && themeApi.applyThemeToPanel) {
        themeApi.applyThemeToPanel(panel, settings);
      }
    }

    function mountCollapse(restoreLabel) {
      const label = restoreLabel || "Helper";
      let restoreBtn = null;

      function collapse() {
        panel.style.display = "none";
        if (restoreBtn && restoreBtn.parentElement) {
          return;
        }
        restoreBtn = doc.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.className = "servpro-helper-fab";
        restoreBtn.textContent = label;
        restoreBtn.addEventListener("click", function onRestore() {
          panel.style.display = "";
          if (restoreBtn && restoreBtn.parentElement) {
            restoreBtn.parentElement.removeChild(restoreBtn);
          }
          restoreBtn = null;
        });
        doc.body.appendChild(restoreBtn);
      }

      closeBtn.addEventListener("click", collapse);

      return { collapse: collapse, expand: function expand() {
        panel.style.display = "";
        if (restoreBtn && restoreBtn.parentElement) {
          restoreBtn.parentElement.removeChild(restoreBtn);
          restoreBtn = null;
        }
      } };
    }

    if (typeof opts.onClose === "function") {
      closeBtn.addEventListener("click", opts.onClose);
    }

    return {
      panel: panel,
      header: header,
      titleEl: titleEl,
      closeBtn: closeBtn,
      toolbar: toolbar,
      body: body,
      statusEl: statusEl,
      setStatus: setStatus,
      syncTheme: syncTheme,
      mountCollapse: mountCollapse
    };
  }

  function styleButton(btn, variant) {
    if (!btn) {
      return;
    }
    btn.className = variant === "primary" ? "servpro-btn servpro-btn-primary" : "servpro-btn";
  }

  root.helperPanel = {
    ensureHelperTheme: ensureHelperTheme,
    createHelperShell: createHelperShell,
    styleButton: styleButton
  };
})(typeof window !== "undefined" ? window : self);
