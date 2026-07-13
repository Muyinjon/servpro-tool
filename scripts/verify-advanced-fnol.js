/* eslint-disable */
const fs = require("fs");
const path = require("path");
const root = process.cwd();

const sandbox = { ServproUploadExtension: undefined };
sandbox.window = sandbox;
sandbox.self = sandbox;

function load(rel) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  const fn = new Function("window", "self", code);
  fn(sandbox, sandbox);
}

load("src/lib/fnolFieldCatalog.js");
load("src/lib/settings.js");
load("src/lib/tenantRegistry.js");
load("src/lib/fnolNotes.js");
load("src/lib/payloadPlainText.js");
load("src/lib/workcenterFields.js");

const ext = sandbox.ServproUploadExtension;
const settingsApi = ext.settings;
const plain = ext.payloadPlainText;

const raw = {
  activationTier: "teamallenssm",
  fnolAdvancedEnabled: true,
  fnolNotesMaxLength: 1200,
  fnolDefaultPayType: "INSURANCE",
  fnolDefaultBusinessUnit: "NW Brooklyn",
  fnolActivePresetId: "water-nw",
  fnolPresets: [
    {
      id: "water-nw",
      name: "Water NW",
      defaults: {
        propertyType: "Residential",
        payType: "INSURANCE",
        businessUnit: "NW Brooklyn",
        jobStatus: "1",
        lossType: "1",
        coordinator: "8"
      },
      visibleFields: ["projectManager", "yearBuilt", "policyNumber", "secondaryEmail"],
      customFields: [
        {
          id: "cf1",
          label: "Referral source",
          key: "referral_source",
          defaultValue: "Dispatch"
        }
      ]
    }
  ]
};

const merged = settingsApi.mergeSettings(raw);
const checks = [];

function assert(name, cond) {
  checks.push({ name: name, ok: Boolean(cond) });
  if (!cond) {
    console.error("FAIL:", name);
  } else {
    console.log("ok:", name);
  }
}

assert("teamallen activated", settingsApi.isTeamAllenActivated(merged));
assert("advanced enabled", settingsApi.canUseAdvancedFnol(merged));
assert("notes max 1200", settingsApi.getEffectiveFnolNotesMaxLength(merged) === 1200);

const preset = settingsApi.getActiveFnolPreset(merged);
assert("preset name", preset && preset.name === "Water NW");
assert("visible PM", preset.visibleFields.indexOf("projectManager") !== -1);
assert("custom key", preset.customFields[0].key === "referral_source");
assert("loss default", preset.defaults.lossType === "1");

const payload = {
  customerName: "Jane Doe",
  primaryPhone: "7185551212",
  email: "jane@example.com",
  secondaryEmail: "alt@example.com",
  propertyType: "Residential",
  payType: "INSURANCE",
  businessUnit: "NW Brooklyn",
  lossType: "WATER",
  lossTypeValue: "1",
  jobStatus: "1",
  coordinator: "Johnny Turobov",
  coordinatorValue: "8",
  projectManager: "Marie Allen",
  yearBuilt: "1988",
  policyNumber: "POL-9",
  address1: "123 Main St",
  city: "Brooklyn",
  state: "NY",
  zip: "11201",
  notesUser: "Leak under sink",
  notes: "Leak under sink",
  referral_source: "Dispatch",
  custom: { referral_source: "Dispatch" },
  fnolCustomFields: [
    { key: "referral_source", label: "Referral source", value: "Dispatch" }
  ],
  source: "fnol"
};

const text = plain.formatPayloadAsPlainText(payload);
assert("plain has PM", text.indexOf("Project manager: Marie Allen") !== -1);
assert("plain has referral", text.indexOf("Referral source: Dispatch") !== -1);
assert("plain has secondary email", text.indexOf("Secondary email: alt@example.com") !== -1);
assert("JSON has PM map", ext.workcenterFields.TEAMALLENSSM_FIELD_MAP.projectManager === "value_fkPrjMan_1");

const json = JSON.stringify(payload, null, 2);
assert("JSON includes referral", json.indexOf("referral_source") !== -1);

// Legacy migration when enabling advanced with empty presets
const legacyOnly = settingsApi.mergeSettings({
  activationTier: "teamallenssm",
  fnolAdvancedEnabled: true,
  fnolDefaultPropertyType: "Commercial",
  fnolDefaultPayType: "SELF"
});
const migrated = ext.fnolFieldCatalog.migrateLegacyIntoActivePreset(legacyOnly);
const active = ext.fnolFieldCatalog.getActivePreset(migrated);
assert("legacy property migrated", active.defaults.propertyType === "Commercial");
assert("legacy pay migrated", active.defaults.payType === "SELF");

// Trial cannot use advanced even if flag set
const trial = settingsApi.mergeSettings({
  activationTier: "trial",
  trialStartedAt: new Date().toISOString(),
  fnolAdvancedEnabled: true,
  fnolNotesMaxLength: 2000
});
assert("trial no advanced", settingsApi.canUseAdvancedFnol(trial) === false);
assert("trial notes stay 500", settingsApi.getEffectiveFnolNotesMaxLength(trial) === 500);

const failed = checks.filter((c) => !c.ok);
console.log("\n" + (checks.length - failed.length) + "/" + checks.length + " passed");
if (failed.length) {
  process.exit(1);
}
