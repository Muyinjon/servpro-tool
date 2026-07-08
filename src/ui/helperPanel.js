(function initHelperPanel(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const themeApi = root.theme;

  const THEME_FULL_ID = "servpro-helper-theme-styles";
  const THEME_CRITICAL_ID = "servpro-helper-critical-styles";
  let themeLoadPromise = null;

  /* Shown immediately if full theme.css is still loading or blocked */
  const CRITICAL_HELPER_CSS = [
    ".servpro-helper-panel[data-servpro-theme=light]{--sp-surface:#fff;--sp-surface-muted:#f1f5f9;--sp-border:#cbd5e1;",
    "--sp-text:#0f172a;--sp-text-muted:#64748b;--sp-accent:#1b4332;--sp-accent-hover:#2d6a4f;",
    "--sp-accent-soft:#d8f3dc;--sp-shadow:0 2px 10px rgba(15,23,42,.12);--sp-radius:6px;--sp-radius-lg:8px;--sp-font:system-ui,sans-serif}",
    ".servpro-helper-panel[data-servpro-theme=dark]{--sp-surface:#1a2332;--sp-surface-muted:#141c28;--sp-border:#334155;",
    "--sp-text:#e2e8f0;--sp-text-muted:#94a3b8;--sp-accent:#40916c;--sp-accent-hover:#52b788;",
    "--sp-accent-soft:#1b4332;--sp-shadow:0 2px 12px rgba(0,0,0,.45)}",
    ".servpro-helper-panel{position:fixed!important;right:12px!important;bottom:12px!important;",
    "z-index:2147483647!important;width:min(340px,calc(100vw - 24px))!important;max-height:88vh!important;",
    "overflow:auto!important;display:flex!important;flex-direction:column!important;gap:6px!important;",
    "padding:8px 10px!important;background:var(--sp-surface)!important;border:1px solid var(--sp-border)!important;",
    "border-radius:8px!important;box-shadow:var(--sp-shadow)!important;font:12px/1.35 var(--sp-font,sans-serif)!important;",
    "color:var(--sp-text)!important}",
    ".servpro-helper-header{display:flex!important;align-items:center!important;justify-content:space-between!important}",
    ".servpro-helper-title{font-weight:700!important;font-size:12px!important}",
    ".servpro-helper-toolbar{display:flex!important;flex-wrap:wrap!important;gap:4px!important;align-items:center!important}",
    ".servpro-helper-toolbar .servpro-btn,.servpro-helper-toolbar .servpro-btn-primary{flex:0 1 auto!important}",
    ".servpro-helper-body-toggle{width:100%!important;text-align:left!important;border:1px solid var(--sp-border)!important;",
    "background:var(--sp-surface-muted)!important;color:var(--sp-text-muted)!important;border-radius:6px!important;",
    "padding:5px 8px!important;font:inherit!important;font-size:11px!important;cursor:pointer!important}",
    ".servpro-helper-body-toggle.is-open{color:var(--sp-text)!important}",
    ".servpro-helper-body[hidden]{display:none!important}",
    ".servpro-helper-body{display:flex!important;flex-direction:column!important;gap:6px!important}",
    ".servpro-helper-status{font-size:11px!important;color:var(--sp-text-muted)!important}",
    ".servpro-helper-fab{position:fixed!important;right:12px!important;bottom:12px!important;z-index:2147483647!important;",
    "border:none!important;background:#1b4332!important;color:#fff!important;border-radius:16px!important;",
    "padding:6px 12px!important;font:11px/1.3 system-ui,sans-serif!important;cursor:pointer!important}",
    ".servpro-btn{border:1px solid var(--sp-border)!important;background:var(--sp-surface)!important;",
    "color:var(--sp-text)!important;border-radius:6px!important;padding:5px 8px!important;cursor:pointer!important}",
    ".servpro-btn-primary{border-color:#1b4332!important;background:#1b4332!important;color:#fff!important}",
    ".servpro-helper-panel.is-collapsed{display:none!important}",
    ".servpro-helper-close{cursor:pointer!important;background:transparent!important;border:none!important;",
    "font-size:16px!important;line-height:1!important;padding:0 4px!important;color:var(--sp-text-muted)!important}"
  ].join("");

  function getThemeCssUrl() {
    if (global.chrome && global.chrome.runtime && global.chrome.runtime.getURL) {
      return chrome.runtime.getURL("src/ui/theme.css");
    }
    return "";
  }

  function appendStyle(doc, id, cssText) {
    const parent = doc.head || doc.documentElement;
    if (!parent) {
      return null;
    }
    let style = doc.getElementById(id);
    if (!style) {
      style = doc.createElement("style");
      style.id = id;
      parent.appendChild(style);
    }
    style.textContent = cssText;
    return style;
  }

  function loadThemeStylesheet(doc) {
    const documentRef = doc || global.document;
    if (!documentRef) {
      return Promise.resolve(false);
    }

    appendStyle(documentRef, THEME_CRITICAL_ID, CRITICAL_HELPER_CSS);

    if (documentRef.getElementById(THEME_FULL_ID)) {
      return Promise.resolve(true);
    }

    if (themeLoadPromise) {
      return themeLoadPromise;
    }

    const url = getThemeCssUrl();
    if (!url) {
      return Promise.resolve(false);
    }

    themeLoadPromise = fetch(url)
      .then(function onResponse(response) {
        if (!response.ok) {
          throw new Error("theme.css HTTP " + response.status);
        }
        return response.text();
      })
      .then(function onCss(css) {
        appendStyle(documentRef, THEME_FULL_ID, css);
        return true;
      })
      .catch(function onError(error) {
        themeLoadPromise = null;
        try {
          console.warn("[ServPro Helper] Could not load theme.css:", error && error.message ? error.message : error);
        } catch (e) {
          /* ignore */
        }
        return false;
      });

    return themeLoadPromise;
  }

  function ensureHelperTheme(doc) {
    const documentRef = doc || global.document;
    if (!documentRef) {
      return;
    }
    loadThemeStylesheet(documentRef);
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

      function expandPanel() {
        panel.classList.remove("is-collapsed");
      }

      function collapse() {
        panel.classList.add("is-collapsed");
        if (restoreBtn && restoreBtn.parentElement) {
          return;
        }
        restoreBtn = doc.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.className = "servpro-helper-fab";
        restoreBtn.textContent = label;
        restoreBtn.addEventListener("click", function onRestore(e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          expandPanel();
          if (restoreBtn && restoreBtn.parentElement) {
            restoreBtn.parentElement.removeChild(restoreBtn);
          }
          restoreBtn = null;
        });
        doc.body.appendChild(restoreBtn);
      }

      closeBtn.addEventListener("click", function onCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        collapse();
      });

      return {
        collapse: collapse,
        expand: function expand() {
          expandPanel();
          if (restoreBtn && restoreBtn.parentElement) {
            restoreBtn.parentElement.removeChild(restoreBtn);
            restoreBtn = null;
          }
        },
        isCollapsed: function isCollapsed() {
          return panel.classList.contains("is-collapsed");
        }
      };
    }

    function mountCollapsibleBody(bodyOpts) {
      const bOpts = bodyOpts || {};
      const collapsedLabel = bOpts.collapsedLabel || "Show payload & options";
      const expandedLabel = bOpts.expandedLabel || "Hide payload & options";
      const startExpanded = bOpts.startExpanded === true;

      const toggle = doc.createElement("button");
      toggle.type = "button";
      toggle.className = "servpro-helper-body-toggle";
      if (startExpanded) {
        toggle.classList.add("is-open");
      }
      toggle.textContent = startExpanded ? expandedLabel : collapsedLabel;
      toggle.setAttribute("aria-expanded", startExpanded ? "true" : "false");

      body.hidden = !startExpanded;

      function setBodyOpen(open) {
        body.hidden = !open;
        toggle.textContent = open ? expandedLabel : collapsedLabel;
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      }

      toggle.addEventListener("click", function onBodyToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        setBodyOpen(body.hidden);
      });

      panel.insertBefore(toggle, body);

      return {
        toggle: toggle,
        expand: function expand() {
          setBodyOpen(true);
        },
        collapse: function collapseBody() {
          setBodyOpen(false);
        },
        isOpen: function isOpen() {
          return !body.hidden;
        }
      };
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
      mountCollapse: mountCollapse,
      mountCollapsibleBody: mountCollapsibleBody
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
    loadThemeStylesheet: loadThemeStylesheet,
    createHelperShell: createHelperShell,
    styleButton: styleButton
  };
})(typeof window !== "undefined" ? window : self);
