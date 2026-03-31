(function initDocsFrame(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const helpers = root.kendoHelpers;
  const panelApi = root.panel;

  if (!selectorsApi || !helpers || !panelApi) {
    return;
  }

  let mountedPanel = null;
  let refreshTimer = null;
  let observer = null;

  function pathLooksSupported() {
    return selectorsApi.SELECTORS.docsFramePathHints.some(function matches(hint) {
      return global.location.pathname.indexOf(hint) !== -1;
    });
  }

  function hasServproUploadUi(rootNode) {
    const scope = rootNode || document;
    return Boolean(
      scope.querySelector("#importDialog") ||
      scope.querySelector("#imageAttachmentsWrapper") ||
      scope.querySelector("input[name='imageAttachments']") ||
      scope.querySelector("ul.k-upload-files > li.k-file")
    );
  }

  function frameLooksSupported() {
    return hasServproUploadUi(document);
  }

  function getVisibleImportWindow() {
    const candidates = Array.from(
      document.querySelectorAll(
        '.k-window[aria-labelledby="importDialog_wnd_title"], ' +
        '.k-window-content[aria-labelledby="importDialog_wnd_title"], ' +
        '#importDialog'
      )
    )
      .map(function resolveWindowHost(candidate) {
        return candidate.classList.contains("k-window") ? candidate : candidate.closest(".k-window") || candidate;
      })
      .filter(function dedupe(candidate, index, items) {
        return candidate && items.indexOf(candidate) === index;
      });

    return candidates.find(function matchVisible(candidate) {
      return helpers.isVisible(candidate);
    }) || null;
  }

  function getImportDialog() {
    const dialog = document.querySelector("#importDialog");
    const visibleWindow = getVisibleImportWindow();

    if (visibleWindow) {
      return visibleWindow;
    }

    if (!dialog) {
      return null;
    }

    const hasUploadUi =
      Boolean(dialog.querySelector(".k-upload")) ||
      Boolean(dialog.querySelector("ul.k-upload-files")) ||
      Boolean(dialog.querySelector("input[name='imageAttachments']"));

    return hasUploadUi ? dialog : null;
  }

  function getUploadListRows() {
    const importDialog = getImportDialog();
    const scopedRows = importDialog
      ? Array.from(importDialog.querySelectorAll("ul.k-upload-files > li.k-file"))
      : [];

    if (scopedRows.length) {
      return scopedRows;
    }

    return Array.from(document.querySelectorAll("ul.k-upload-files > li.k-file")).filter(function withinVisibleWindow(row) {
      const windowHost = row.closest(".k-window");
      if (!windowHost) {
        return row.closest("#importDialog") !== null;
      }

      return helpers.isVisible(windowHost);
    });
  }

  function containsTypeDropdown(element) {
    return Boolean(helpers.queryFirst(element, selectorsApi.SELECTORS.dropdownHosts));
  }

  function getUploadRows() {
    const importDialogRows = getUploadListRows();
    if (importDialogRows.length) {
      return importDialogRows.filter(function onlyUsable(row) {
        return helpers.isVisible(row) && Boolean(findTypeDropdown(row)) && Boolean(findFileName(row));
      });
    }

    const rows = [];
    const candidates = helpers.queryAll(document, selectorsApi.SELECTORS.rowCandidates);

    for (const candidate of candidates) {
      if (candidate.id === "servpro-upload-helper-panel" || candidate.closest("#servpro-upload-helper-panel")) {
        continue;
      }

      if (!helpers.isVisible(candidate)) {
        continue;
      }

      if (!containsTypeDropdown(candidate)) {
        continue;
      }

      if (!findFileName(candidate)) {
        continue;
      }

      rows.push(candidate);
    }

    return rows;
  }

  function findFileName(row) {
    const dataFileNameNode = row.querySelector("[data-filename]");
    if (dataFileNameNode) {
      const attrValue = dataFileNameNode.getAttribute("data-filename");
      if (selectorsApi.looksLikeFileName(attrValue)) {
        return attrValue.trim();
      }
    }

    const directMatches = helpers.queryAll(row, selectorsApi.SELECTORS.fileNameHints);
    for (const match of directMatches) {
      const text = (
        match.getAttribute("data-filename") ||
        match.textContent ||
        match.getAttribute("title") ||
        ""
      ).trim();
      if (selectorsApi.looksLikeFileName(text)) {
        return text;
      }
    }

    const textNodes = Array.from(row.querySelectorAll("td, span, div, a, label"));
    for (const node of textNodes) {
      const text = (node.textContent || "").trim();
      if (selectorsApi.looksLikeFileName(text)) {
        return text;
      }
    }

    return "";
  }

  function findTypeDropdown(row) {
    const nestedKendoDropdown = row.querySelector('span[data-role="dropdownlist"][aria-owns*="_imageType_listbox"]');
    if (nestedKendoDropdown && helpers.isVisible(nestedKendoDropdown)) {
      return nestedKendoDropdown;
    }

    const explicitHost = row.querySelector(".imageTypes.fileRow-dropdown.k-dropdown");
    if (explicitHost && helpers.isVisible(explicitHost)) {
      return explicitHost;
    }

    const hosts = helpers.queryAll(row, selectorsApi.SELECTORS.dropdownHosts).filter(function onlyVisible(element) {
      return helpers.isVisible(element);
    });

    for (const host of hosts) {
      const owns = host.getAttribute("aria-owns") || host.getAttribute("aria-controls") || "";
      const normalizedOwns = selectorsApi.normalizeText(owns);
      const displayedText = selectorsApi.normalizeText(helpers.getDisplayedDropdownText(host));

      if (normalizedOwns.indexOf("imagetype") !== -1 || normalizedOwns.indexOf("listbox") !== -1) {
        return host;
      }

      if (displayedText && selectorsApi.IMAGE_TYPES.some(function matches(type) {
        return selectorsApi.normalizeText(type) === displayedText;
      })) {
        return host;
      }
    }

    return hosts[0] || null;
  }

  async function applyTypeToAllRows(imageType) {
    const importDialog = getImportDialog();
    if (!importDialog) {
      return "Import dialog is not open";
    }

    const rows = getUploadRows();
    if (!rows.length) {
      const rawRows = getUploadListRows();
      return rawRows.length
        ? "Files are listed, but dropdowns were not detected"
        : "No uploaded files found yet";
    }

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const dropdown = findTypeDropdown(row);
      if (!dropdown) {
        skipped += 1;
        continue;
      }

      const fileName = findFileName(row);
      const alreadySelected = selectorsApi.normalizeText(helpers.getDisplayedDropdownText(dropdown)) === selectorsApi.normalizeText(imageType);
      if (alreadySelected) {
        skipped += 1;
        continue;
      }

      const ok = await helpers.selectDropdownOption(dropdown, imageType, 5);
      if (ok) {
        updated += 1;
      } else {
        skipped += 1;
        if (fileName) {
          row.dataset.servproUploadHelperLastError = fileName;
        }
      }

      await helpers.delay(140);
    }

    if (!updated && skipped) {
      return "Updated 0 row(s), skipped " + skipped + " (they may already match)";
    }

    return "Updated " + updated + " row(s), skipped " + skipped;
  }

  function findPanelContainer() {
    const importDialog = getImportDialog();
    if (importDialog) {
      return importDialog;
    }

    const bodyFirstElement = document.body && document.body.firstElementChild;
    if (bodyFirstElement && bodyFirstElement.parentElement === document.body) {
      return document.body;
    }

    return document.body;
  }

  function refreshPanelStatus() {
    if (!mountedPanel) {
      return;
    }

    const rawRows = getUploadListRows();
    const importDialog = getImportDialog();
    if (!importDialog && !rawRows.length) {
      mountedPanel.setStatus("Import dialog closed");
      return;
    }

    if (!rawRows.length) {
      mountedPanel.setStatus("Import dialog open, waiting for files");
      return;
    }

    const rowCount = getUploadRows().length;
    if (!rowCount) {
      mountedPanel.setStatus("Files listed, dropdowns not resolved yet");
      return;
    }

    mountedPanel.setStatus("Found " + rowCount + " upload row(s)");
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      global.clearTimeout(refreshTimer);
    }

    refreshTimer = global.setTimeout(function runRefresh() {
      refreshTimer = null;
      refreshPanelStatus();
    }, 500);
  }

  function mount() {
    if (mountedPanel) {
      refreshPanelStatus();
      return;
    }

    const container = findPanelContainer();
    mountedPanel = panelApi.mountPanel(document, container, {
      onApply: applyTypeToAllRows,
      onRefresh: refreshPanelStatus
    });
    refreshPanelStatus();
  }

  function boot() {
    global.setTimeout(function delayedMount() {
      if (frameLooksSupported()) {
        mount();
        scheduleRefresh();
      }
    }, 1200);

    observer = new MutationObserver(function onMutation(mutations) {
      const hasRelevantChange = mutations.some(function isRelevant(mutation) {
        const target = mutation.target;
        return !(target instanceof Element) || !target.closest("#servpro-upload-helper-panel");
      });

      if (hasRelevantChange) {
        if (!mountedPanel && frameLooksSupported()) {
          mount();
        }
        scheduleRefresh();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
