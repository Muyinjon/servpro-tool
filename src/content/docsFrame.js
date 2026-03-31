(function initDocsFrame(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const helpers = root.kendoHelpers;
  const panelApi = root.panel;

  if (!selectorsApi || !helpers || !panelApi) {
    return;
  }

  const flowConfigs = Object.values(selectorsApi.FLOWS || {});
  const mountedPanels = new Map();
  let refreshTimer = null;
  let observer = null;

  function hasUploadUi(rootNode, flow) {
    const scope = rootNode || document;
    return flow.uploadMarkers.some(function matches(selector) {
      return Boolean(scope.querySelector(selector));
    });
  }

  function hasVisibleUploadUi(rootNode, flow) {
    const scope = rootNode || document;
    return flow.uploadMarkers.some(function matches(selector) {
      const element = scope.querySelector(selector);
      return Boolean(element) && helpers.isVisible(element);
    });
  }

  function frameLooksSupported() {
    return flowConfigs.some(function matches(flow) {
      return hasUploadUi(document, flow);
    });
  }

  function dedupeElements(elements) {
    return elements.filter(function dedupe(candidate, index, items) {
      return candidate && items.indexOf(candidate) === index;
    });
  }

  function getVisibleDialogHost(flow) {
    const candidates = dedupeElements(
      flow.dialogSelectors
        .flatMap(function query(selector) {
          return Array.from(document.querySelectorAll(selector));
        })
        .map(function resolveWindowHost(candidate) {
          return candidate.classList.contains("k-window") ? candidate : candidate.closest(".k-window") || candidate;
        })
    );

    return candidates.find(function matchVisible(candidate) {
      return helpers.isVisible(candidate);
    }) || null;
  }

  function getDialogHost(flow) {
    const visibleHost = getVisibleDialogHost(flow);
    if (visibleHost) {
      return visibleHost;
    }

    const sourceDialog = document.querySelector(flow.dialogSelectors[0]);
    if (!sourceDialog) {
      return null;
    }

    return hasVisibleUploadUi(sourceDialog, flow) ? sourceDialog : null;
  }

  function rowBelongsToFlow(row, flow) {
    const dialogHost = getDialogHost(flow);
    if (!dialogHost) {
      return false;
    }

    return dialogHost === row || dialogHost.contains(row);
  }

  function getUploadListRows(flow) {
    const dialogHost = getDialogHost(flow);
    const scopedRows = dialogHost
      ? flow.rowSelectors.flatMap(function query(selector) {
          return Array.from(dialogHost.querySelectorAll(selector));
        }).filter(function onlyFlowRows(row) {
          return rowBelongsToFlow(row, flow);
        })
      : [];

    if (scopedRows.length) {
      return dedupeElements(scopedRows);
    }

    return dedupeElements(flow.rowSelectors.flatMap(function query(selector) {
      return Array.from(document.querySelectorAll(selector));
    })).filter(function withinVisibleWindow(row) {
      return rowBelongsToFlow(row, flow);
    });
  }

  function containsTypeDropdown(element, flow) {
    return Boolean(findTypeDropdown(element, flow));
  }

  function getUploadRows(flow) {
    const importDialogRows = getUploadListRows(flow);
    if (importDialogRows.length) {
      return importDialogRows.filter(function onlyUsable(row) {
        return helpers.isVisible(row) && Boolean(findTypeDropdown(row, flow)) && Boolean(findFileName(row));
      });
    }

    const rows = [];
    const candidates = helpers.queryAll(document, selectorsApi.SELECTORS.rowCandidates);

    for (const candidate of candidates) {
      if (candidate.closest("[id$='helper-panel']")) {
        continue;
      }

      if (!rowBelongsToFlow(candidate, flow)) {
        continue;
      }

      if (!helpers.isVisible(candidate)) {
        continue;
      }

      if (!containsTypeDropdown(candidate, flow)) {
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

  function findTypeDropdown(row, flow) {
    const preferredSelector = flow.dropdownSelectors.find(function match(selector) {
      return selector.indexOf('span[data-role="dropdownlist"]') !== -1;
    });
    const nestedKendoDropdown = preferredSelector ? row.querySelector(preferredSelector) : null;
    if (nestedKendoDropdown && helpers.isVisible(nestedKendoDropdown)) {
      return nestedKendoDropdown;
    }

    const explicitHost = flow.dropdownSelectors
      .map(function query(selector) {
        return row.querySelector(selector);
      })
      .find(function visible(element) {
        return element && helpers.isVisible(element);
      });
    if (explicitHost && helpers.isVisible(explicitHost)) {
      return explicitHost;
    }

    const hosts = helpers.queryAll(row, selectorsApi.SELECTORS.dropdownHosts.concat(flow.dropdownSelectors)).filter(function onlyVisible(element) {
      return helpers.isVisible(element);
    });

    for (const host of hosts) {
      const owns = host.getAttribute("aria-owns") || host.getAttribute("aria-controls") || "";
      const normalizedOwns = selectorsApi.normalizeText(owns);
      const displayedText = selectorsApi.normalizeText(helpers.getDisplayedDropdownText(host));

      if (flow.dropdownOwnsHints.some(function matches(hint) {
        return normalizedOwns.indexOf(hint) !== -1;
      })) {
        return host;
      }

      if (displayedText && flow.types.some(function matches(type) {
        return selectorsApi.normalizeText(type) === displayedText;
      })) {
        return host;
      }
    }

    return hosts[0] || null;
  }

  async function applyTypeToAllRows(flow, imageType) {
    const importDialog = getDialogHost(flow);
    if (!importDialog) {
      return "Import dialog is not open";
    }

    const rows = getUploadRows(flow);
    if (!rows.length) {
      const rawRows = getUploadListRows(flow);
      return rawRows.length
        ? "Files are listed, but dropdowns were not detected"
        : "No uploaded files found yet";
    }

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const dropdown = findTypeDropdown(row, flow);
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

  function getPanelState(flow) {
    return mountedPanels.get(flow.key) || null;
  }

  function refreshPanelStatus(flow) {
    const panelState = getPanelState(flow);
    if (!panelState) {
      return;
    }

    const rawRows = getUploadListRows(flow);
    const importDialog = getDialogHost(flow);
    if (!importDialog && !rawRows.length) {
      panelState.api.setStatus("Import dialog closed");
      return;
    }

    if (!rawRows.length) {
      panelState.api.setStatus("Import dialog open, waiting for files");
      return;
    }

    const rowCount = getUploadRows(flow).length;
    if (!rowCount) {
      panelState.api.setStatus("Files listed, dropdowns not resolved yet");
      return;
    }

    panelState.api.setStatus("Found " + rowCount + " upload row(s)");
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      global.clearTimeout(refreshTimer);
    }

    refreshTimer = global.setTimeout(function runRefresh() {
      refreshTimer = null;
      flowConfigs.forEach(function refresh(flow) {
        refreshPanelStatus(flow);
      });
    }, 500);
  }

  function mount(flow) {
    const existingPanel = getPanelState(flow);
    const container = getDialogHost(flow);
    if (!container) {
      return;
    }

    if (existingPanel) {
      if (!existingPanel.api.element.isConnected || existingPanel.api.element.parentElement !== container) {
        container.insertBefore(existingPanel.api.element, container.firstChild);
      }
      refreshPanelStatus(flow);
      return;
    }

    const panel = panelApi.mountPanel(document, container, {
      panelId: flow.panelId,
      title: flow.panelTitle,
      selectOptions: flow.types,
      storageKey: flow.storageKey,
      buttonLabel: flow.buttonLabel,
      onApply: function onApply(selectedType) {
        return applyTypeToAllRows(flow, selectedType);
      },
      onRefresh: function onRefresh() {
        refreshPanelStatus(flow);
      }
    });
    mountedPanels.set(flow.key, { api: panel });
    refreshPanelStatus(flow);
  }

  function boot() {
    global.setTimeout(function delayedMount() {
      if (frameLooksSupported()) {
        flowConfigs.forEach(function maybeMount(flow) {
          if (getDialogHost(flow)) {
            mount(flow);
          }
        });
        scheduleRefresh();
      }
    }, 1200);

    observer = new MutationObserver(function onMutation(mutations) {
      const hasRelevantChange = mutations.some(function isRelevant(mutation) {
        const target = mutation.target;
        return !(target instanceof Element) || !target.closest("[id$='helper-panel']");
      });

      if (hasRelevantChange) {
        flowConfigs.forEach(function maybeMount(flow) {
          if (getDialogHost(flow)) {
            mount(flow);
          }
        });
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
