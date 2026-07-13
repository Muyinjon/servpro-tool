(function initKendoHelpers(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;

  function delay(ms) {
    return new Promise((resolve) => global.setTimeout(resolve, ms));
  }

  function isVisible(element) {
    if (!element || !(element instanceof Element)) {
      return false;
    }

    const style = global.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isSameOriginFrame(frame) {
    try {
      return Boolean(frame && frame.contentDocument);
    } catch (error) {
      return false;
    }
  }

  function queryFirst(rootNode, selectorList) {
    for (const selector of selectorList) {
      const match = rootNode.querySelector(selector);
      if (match) {
        return match;
      }
    }
    return null;
  }

  function queryAll(rootNode, selectorList) {
    const seen = new Set();
    const results = [];

    for (const selector of selectorList) {
      const matches = rootNode.querySelectorAll(selector);
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.add(match);
          results.push(match);
        }
      }
    }

    return results;
  }

  function getKendoWidget(host) {
    try {
      if (global.jQuery && typeof global.jQuery === "function") {
        const jqHost = global.jQuery(host);
        if (jqHost.data("kendoDropDownList")) {
          return jqHost.data("kendoDropDownList");
        }

        const embeddedInput = host.querySelector('[data-role="dropdownlist"]');
        if (embeddedInput) {
          const jqInput = global.jQuery(embeddedInput);
          if (jqInput.data("kendoDropDownList")) {
            return jqInput.data("kendoDropDownList");
          }
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function getDisplayedDropdownText(host) {
    const input = host.querySelector(".k-input");
    const source = input || host;
    return source ? source.textContent.trim() : "";
  }

  async function openDropdown(host) {
    const widget = getKendoWidget(host);
    if (widget && typeof widget.open === "function") {
      widget.open();
      await delay(120);
      return true;
    }

    const clickTarget =
      host.querySelector(".k-select") ||
      host.querySelector(".k-dropdown-wrap") ||
      host;

    clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    clickTarget.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    clickTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await delay(180);
    return true;
  }

  function findPopupListForHost(host) {
    const owns = host.getAttribute("aria-owns");
    const controls = host.getAttribute("aria-controls");
    const listId = owns || controls;

    if (listId) {
      const directList = document.getElementById(listId);
      if (directList) {
        return directList;
      }
    }

    const visibleLists = Array.from(document.querySelectorAll('ul[role="listbox"], .k-list-container'))
      .filter(isVisible);

    if (!visibleLists.length) {
      return null;
    }

    return visibleLists[visibleLists.length - 1];
  }

  function findOptionElement(listRoot, text) {
    if (!listRoot) {
      return null;
    }

    const normalizedTarget = selectorsApi.normalizeText(text);
    const options = queryAll(listRoot, selectorsApi.SELECTORS.popupListItems);

    return options.find((option) => {
      return selectorsApi.normalizeText(option.textContent) === normalizedTarget;
    }) || null;
  }

  async function selectDropdownOption(host, text, maxAttempts) {
    const attempts = typeof maxAttempts === "number" ? maxAttempts : 4;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const widget = getKendoWidget(host);
      if (widget && typeof widget.dataSource?.data === "function") {
        const data = widget.dataSource.data();
        const match = Array.from(data).find((item) => {
          const candidate = item.text || item.name || item.cbmDesc || item.cmbDesc || item;
          return selectorsApi.normalizeText(candidate) === selectorsApi.normalizeText(text);
        });

        if (match) {
          const valueField = widget.options?.dataValueField;
          const value = valueField && match[valueField] !== undefined ? match[valueField] : match.value ?? match.id ?? match;

          widget.value(value);
          if (typeof widget.trigger === "function") {
            widget.trigger("change");
          }

          const inputNode = widget.element && widget.element[0] ? widget.element[0] : null;
          if (inputNode) {
            inputNode.dispatchEvent(new Event("change", { bubbles: true }));
          }

          await delay(150);
          return true;
        }
      }

      await openDropdown(host);
      const listRoot = findPopupListForHost(host);
      const option = findOptionElement(listRoot, text);

      if (option) {
        option.scrollIntoView({ block: "nearest" });
        option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        option.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        option.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        const inputNode = host.querySelector('[data-role="dropdownlist"]');
        if (inputNode) {
          inputNode.dispatchEvent(new Event("change", { bubbles: true }));
        }

        await delay(220);
        return true;
      }

      await delay(220);
    }

    return selectorsApi.normalizeText(getDisplayedDropdownText(host)) === selectorsApi.normalizeText(text);
  }

  function getKendoDateTimePicker(hostOrInput) {
    try {
      if (!global.jQuery || typeof global.jQuery !== "function") {
        return null;
      }
      const el = hostOrInput && hostOrInput.nodeType === 1 ? hostOrInput : null;
      if (!el) {
        return null;
      }
      const jq = global.jQuery(el);
      if (jq.data("kendoDateTimePicker")) {
        return jq.data("kendoDateTimePicker");
      }
      const embedded = el.querySelector
        ? el.querySelector('[data-role="datetimepicker"]')
        : null;
      if (embedded) {
        const jqInput = global.jQuery(embedded);
        if (jqInput.data("kendoDateTimePicker")) {
          return jqInput.data("kendoDateTimePicker");
        }
      }
      const wrap = el.closest ? el.closest(".k-datetimepicker") : null;
      if (wrap) {
        const input = wrap.querySelector('[data-role="datetimepicker"]');
        if (input) {
          const jqWrapInput = global.jQuery(input);
          if (jqWrapInput.data("kendoDateTimePicker")) {
            return jqWrapInput.data("kendoDateTimePicker");
          }
        }
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function getDateTimePickerValue(hostOrInput) {
    const widget = getKendoDateTimePicker(hostOrInput);
    if (widget && typeof widget.value === "function") {
      const value = widget.value();
      return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
    }
    return null;
  }

  function setDateTimePickerValue(hostOrInput, date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return false;
    }
    const widget = getKendoDateTimePicker(hostOrInput);
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

  root.kendoHelpers = {
    delay,
    isVisible,
    isSameOriginFrame,
    queryFirst,
    queryAll,
    getKendoWidget,
    getKendoDateTimePicker,
    getDateTimePickerValue,
    setDateTimePickerValue,
    getDisplayedDropdownText,
    selectDropdownOption
  };
})(window);
