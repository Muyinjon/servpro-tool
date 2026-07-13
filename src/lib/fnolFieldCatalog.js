(function initFnolFieldCatalog(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const NOTES_MAX_DEFAULT = 500;
  const NOTES_MAX_CAP = 2000;
  const DEFAULT_PRESET_ID = "default";

  const COORDINATOR_OPTIONS = [
    { label: "Angelica DeSimone", value: "3" },
    { label: "Babita Bhajan", value: "2" },
    { label: "Cesar Chaj", value: "6" },
    { label: "Cynthia Marrero", value: "5" },
    { label: "Elis Lamos", value: "15" },
    { label: "Felece Jordan", value: "14" },
    { label: "Jamie Raskin", value: "9" },
    { label: "Johnny Turobov", value: "8" },
    { label: "Kerri McGarry", value: "11" },
    { label: "Kristen Comilloni", value: "18" },
    { label: "Marie Allen", value: "10" },
    { label: "Robert Allen", value: "4" },
    { label: "Stefania Zielinski", value: "16" }
  ];

  const PROPERTY_TYPE_OPTIONS = [
    { label: "Residential", value: "Residential" },
    { label: "Commercial", value: "Commercial" }
  ];

  const PAY_TYPE_OPTIONS = [
    { label: "SELF", value: "SELF" },
    { label: "INSURANCE", value: "INSURANCE" },
    { label: "3RD PARTY", value: "3RD PARTY" },
    { label: "COMM Account", value: "COMM Account" }
  ];

  const BUSINESS_UNIT_OPTIONS = [
    { label: "NW Brooklyn", value: "NW Brooklyn" },
    { label: "Staten Island", value: "Staten Island" },
    { label: "Rockaways/Coney", value: "Rockaways/Coney" },
    { label: "Forest Hills", value: "Forest Hills" },
    { label: "Bay Ridge", value: "Bay Ridge" },
    { label: "Mill Basin", value: "Mill Basin" }
  ];

  const JOB_STATUS_OPTIONS = [
    { label: "Estimate", value: "1" },
    { label: "Testing", value: "2" },
    { label: "On Hold", value: "3" },
    { label: "Active", value: "4" },
    { label: "Canceled", value: "12" }
  ];

  // Loss types mirrored from selectors.TEAMALLEN_LOSS_TYPES (kept local so options page
  // can load catalog without selectors.js).
  const LOSS_TYPE_OPTIONS = [
    { label: "WATER", value: "1" },
    { label: "FIRE", value: "2" },
    { label: "MOLD", value: "3" },
    { label: "GEN. CLEANING", value: "4" },
    { label: "DUCT CLEANING", value: "5" },
    { label: "BIO HAZARD", value: "15" },
    { label: "REBUILD", value: "16" },
    { label: "STORM", value: "17" },
    { label: "PUFFBACK", value: "18" },
    { label: "SMOKE", value: "19" },
    { label: "SEWER", value: "14" },
    { label: "BOARD UP", value: "22" },
    { label: "STRUCTURE DAMAGE", value: "23" }
  ];

  /**
   * Catalog of FNOL fields beyond always-visible core intake.
   * - defaultable: can hold a blank-only default in a preset
   * - optional: can be shown/hidden on the FNOL form per preset
   * - control: select | text | email | number
   * - coreForm: already present in fnol.html (not dynamically mounted)
   * - fillsTeamAllen: key exists on TEAMALLENSSM_FIELD_MAP (or will after this feature)
   */
  const FIELD_DEFS = [
    {
      key: "propertyType",
      label: "Property type",
      kind: "defaultable",
      control: "select",
      options: PROPERTY_TYPE_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      legacySetting: "fnolDefaultPropertyType"
    },
    {
      key: "payType",
      label: "Pay type",
      kind: "defaultable",
      control: "select",
      options: PAY_TYPE_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      legacySetting: "fnolDefaultPayType"
    },
    {
      key: "businessUnit",
      label: "Bus. unit",
      kind: "defaultable",
      control: "select",
      options: BUSINESS_UNIT_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      legacySetting: "fnolDefaultBusinessUnit"
    },
    {
      key: "jobStatus",
      label: "Job status",
      kind: "defaultable",
      control: "select",
      options: JOB_STATUS_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      legacySetting: "fnolDefaultJobStatus"
    },
    {
      key: "lossType",
      label: "Loss type",
      kind: "defaultable",
      control: "select",
      options: LOSS_TYPE_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      valueKey: "lossTypeValue",
      storeLabel: true
    },
    {
      key: "coordinator",
      label: "Coordinator",
      kind: "defaultable",
      control: "select",
      options: COORDINATOR_OPTIONS,
      coreForm: true,
      fillsTeamAllen: true,
      valueKey: "coordinatorValue",
      storeLabel: true
    },
    {
      key: "projectManager",
      label: "Project manager",
      kind: "optional",
      control: "text",
      fillsTeamAllen: true,
      plainTextLabel: "Project manager"
    },
    {
      key: "reconManager",
      label: "Recon manager",
      kind: "optional",
      control: "text",
      fillsTeamAllen: true,
      plainTextLabel: "Recon manager"
    },
    {
      key: "yearBuilt",
      label: "Year built",
      kind: "optional",
      control: "text",
      fillsTeamAllen: true,
      plainTextLabel: "Year built"
    },
    {
      key: "policyNumber",
      label: "Policy #",
      kind: "optional",
      control: "text",
      fillsTeamAllen: false,
      plainTextLabel: "Policy #"
    },
    {
      key: "deductible",
      label: "Deductible",
      kind: "optional",
      control: "text",
      fillsTeamAllen: false,
      plainTextLabel: "Deductible"
    },
    {
      key: "secondaryEmail",
      label: "Secondary email",
      kind: "optional",
      control: "email",
      fillsTeamAllen: false,
      plainTextLabel: "Secondary email"
    },
    {
      key: "causeOfLoss",
      label: "Cause of loss",
      kind: "optional",
      control: "text",
      fillsTeamAllen: false,
      plainTextLabel: "Cause of loss"
    },
    {
      key: "dateOfLoss",
      label: "Date of loss",
      kind: "optional",
      control: "text",
      fillsTeamAllen: false,
      plainTextLabel: "Date of loss"
    }
  ];

  const RESERVED_PAYLOAD_KEYS = {
    customerName: true,
    businessName: true,
    primaryPhone: true,
    secondaryPhone: true,
    email: true,
    claimNumber: true,
    propertyType: true,
    payType: true,
    lossType: true,
    lossTypeValue: true,
    businessUnit: true,
    address1: true,
    address2: true,
    city: true,
    state: true,
    zip: true,
    insuranceCarrier: true,
    jobStatus: true,
    coordinator: true,
    coordinatorValue: true,
    projectManager: true,
    projectManagerValue: true,
    reconManager: true,
    reconManagerValue: true,
    yearBuilt: true,
    policyNumber: true,
    deductible: true,
    secondaryEmail: true,
    causeOfLoss: true,
    dateOfLoss: true,
    adjusterName: true,
    adjusterPhone: true,
    adjusterEmail: true,
    notesUser: true,
    notes: true,
    billAddress: true,
    addLocation: true,
    addLocationValue: true,
    source: true,
    fnolId: true,
    sourceUrl: true,
    scrapedAt: true,
    fnolCustomFields: true,
    custom: true
  };

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getFieldDefs() {
    return FIELD_DEFS.slice();
  }

  function getDefaultableFields() {
    return FIELD_DEFS.filter(function isDefaultable(f) {
      return f.kind === "defaultable";
    });
  }

  function getOptionalFields() {
    return FIELD_DEFS.filter(function isOptional(f) {
      return f.kind === "optional";
    });
  }

  function getFieldByKey(key) {
    const needle = String(key || "");
    for (let i = 0; i < FIELD_DEFS.length; i += 1) {
      if (FIELD_DEFS[i].key === needle) {
        return FIELD_DEFS[i];
      }
    }
    return null;
  }

  function sanitizeCustomFieldKey(raw) {
    let key = normalizeText(raw)
      .replace(/[^a-zA-Z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!key) {
      return "";
    }
    if (/^[0-9]/.test(key)) {
      key = "x_" + key;
    }
    if (RESERVED_PAYLOAD_KEYS[key]) {
      key = "custom_" + key;
    }
    return key;
  }

  function normalizeCustomField(raw, index) {
    const source = raw && typeof raw === "object" ? raw : {};
    const label = normalizeText(source.label) || "Custom field " + (index + 1);
    let key = sanitizeCustomFieldKey(source.key || label);
    if (!key) {
      key = "custom_field_" + (index + 1);
    }
    return {
      id: normalizeText(source.id) || "cf-" + Date.now() + "-" + index,
      label: label,
      key: key,
      defaultValue: source.defaultValue == null ? "" : String(source.defaultValue)
    };
  }

  function emptyDefaults() {
    const defaults = {};
    getDefaultableFields().forEach(function eachField(field) {
      defaults[field.key] = "";
    });
    return defaults;
  }

  function createEmptyPreset(id, name) {
    return {
      id: id || "preset-" + Date.now(),
      name: normalizeText(name) || "Preset",
      defaults: emptyDefaults(),
      visibleFields: [],
      customFields: []
    };
  }

  function createDefaultPresetFromLegacy(settings) {
    const preset = createEmptyPreset(DEFAULT_PRESET_ID, "Default");
    const source = settings && typeof settings === "object" ? settings : {};
    getDefaultableFields().forEach(function eachField(field) {
      if (field.legacySetting && source[field.legacySetting]) {
        preset.defaults[field.key] = String(source[field.legacySetting] || "");
      }
    });
    return preset;
  }

  function normalizePreset(raw, index) {
    const source = raw && typeof raw === "object" ? raw : {};
    const preset = createEmptyPreset(
      normalizeText(source.id) || "preset-" + (index + 1),
      normalizeText(source.name) || "Preset " + (index + 1)
    );
    const defaultsIn = source.defaults && typeof source.defaults === "object" ? source.defaults : {};
    getDefaultableFields().forEach(function eachField(field) {
      if (defaultsIn[field.key] != null && String(defaultsIn[field.key]).trim()) {
        preset.defaults[field.key] = String(defaultsIn[field.key]).trim();
      }
    });
    const visibleIn = Array.isArray(source.visibleFields) ? source.visibleFields : [];
    const optionalKeys = {};
    getOptionalFields().forEach(function eachOpt(f) {
      optionalKeys[f.key] = true;
    });
    preset.visibleFields = visibleIn
      .map(function mapKey(k) {
        return String(k || "").trim();
      })
      .filter(function keep(k) {
        return Boolean(optionalKeys[k]);
      });
    const customIn = Array.isArray(source.customFields) ? source.customFields : [];
    preset.customFields = customIn.map(normalizeCustomField);
    return preset;
  }

  function normalizePresets(presets, settings) {
    const list = Array.isArray(presets) ? presets.map(normalizePreset) : [];
    if (!list.length) {
      return [createDefaultPresetFromLegacy(settings)];
    }
    const seen = {};
    const deduped = [];
    list.forEach(function eachPreset(preset) {
      let id = preset.id;
      if (seen[id]) {
        id = id + "-" + deduped.length;
        preset.id = id;
      }
      seen[id] = true;
      deduped.push(preset);
    });
    return deduped;
  }

  function normalizeNotesMaxLength(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < NOTES_MAX_DEFAULT) {
      return NOTES_MAX_DEFAULT;
    }
    return Math.min(NOTES_MAX_CAP, Math.floor(n));
  }

  function getActivePreset(settings) {
    const merged = settings && typeof settings === "object" ? settings : {};
    const presets = normalizePresets(merged.fnolPresets, merged);
    const activeId = normalizeText(merged.fnolActivePresetId) || DEFAULT_PRESET_ID;
    for (let i = 0; i < presets.length; i += 1) {
      if (presets[i].id === activeId) {
        return presets[i];
      }
    }
    return presets[0];
  }

  function resolveNotesMaxLength(settings, advancedEnabled) {
    if (!advancedEnabled) {
      return NOTES_MAX_DEFAULT;
    }
    return normalizeNotesMaxLength(settings && settings.fnolNotesMaxLength);
  }

  function selectLabelForValue(options, value) {
    const target = String(value || "").trim();
    if (!target || !Array.isArray(options)) {
      return "";
    }
    for (let i = 0; i < options.length; i += 1) {
      if (String(options[i].value) === target) {
        return options[i].label;
      }
    }
    return "";
  }

  function syncLegacyDefaultsFromPreset(preset) {
    const patch = {};
    const defaults = (preset && preset.defaults) || {};
    getDefaultableFields().forEach(function eachField(field) {
      if (field.legacySetting) {
        patch[field.legacySetting] = defaults[field.key] || "";
      }
    });
    return patch;
  }

  function migrateLegacyIntoActivePreset(settings) {
    const merged = settings && typeof settings === "object" ? Object.assign({}, settings) : {};
    const presets = normalizePresets(merged.fnolPresets, merged);
    merged.fnolPresets = presets;
    if (!normalizeText(merged.fnolActivePresetId)) {
      merged.fnolActivePresetId = presets[0].id;
    }
    const active = getActivePreset(merged);
    getDefaultableFields().forEach(function eachField(field) {
      if (!field.legacySetting) {
        return;
      }
      if (!active.defaults[field.key] && merged[field.legacySetting]) {
        active.defaults[field.key] = String(merged[field.legacySetting] || "");
      }
    });
    merged.fnolPresets = presets.map(function mapPreset(p) {
      return p.id === active.id ? active : p;
    });
    return merged;
  }

  root.fnolFieldCatalog = {
    NOTES_MAX_DEFAULT,
    NOTES_MAX_CAP,
    DEFAULT_PRESET_ID,
    COORDINATOR_OPTIONS,
    PROPERTY_TYPE_OPTIONS,
    PAY_TYPE_OPTIONS,
    BUSINESS_UNIT_OPTIONS,
    JOB_STATUS_OPTIONS,
    LOSS_TYPE_OPTIONS,
    FIELD_DEFS,
    RESERVED_PAYLOAD_KEYS,
    getFieldDefs,
    getDefaultableFields,
    getOptionalFields,
    getFieldByKey,
    sanitizeCustomFieldKey,
    normalizeCustomField,
    emptyDefaults,
    createEmptyPreset,
    createDefaultPresetFromLegacy,
    normalizePreset,
    normalizePresets,
    normalizeNotesMaxLength,
    getActivePreset,
    resolveNotesMaxLength,
    selectLabelForValue,
    syncLegacyDefaultsFromPreset,
    migrateLegacyIntoActivePreset
  };
})(typeof window !== "undefined" ? window : self);
