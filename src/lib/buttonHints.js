(function initButtonHints(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const BUTTON_HINTS = {
    fnolSubmitTeamAllen:
      "Saves this intake, sends Google Form backup if enabled, then opens TeamAllen to fill and save the job.",
    fnolSubmitGeneric:
      "Saves to your local job list and copies all fields as plain text to paste into another system. Trial: no TeamAllen or Google backup.",
    fnolClearForm:
      "Clears every field on this screen. Does not remove jobs in the Jobs entered list.",
    fnolCopyPlain:
      "Copies customer, address, insurance, and notes in readable paragraphs (good for email or Teams).",
    fnolCopyJson:
      "Copies the same data as structured JSON for the import helper or technical tools—not meant for customers.",
    fnolLoadFromScrape:
      "Prefills this form from the last WorkCenter or Alacrity scrape saved in the extension.",
    fnolAddressLookupPasteClipboard:
      "Reads your clipboard into the paste box (browser may ask for permission).",
    fnolAddressLookupFill:
      "Splits the pasted address into Address 1, City, State, and Zip fields.",
    fnolNewJob:
      "Starts a blank form for another intake without submitting the current one.",
    fnolUnlock:
      "Enter your team access code to use intake.",
    fnolOpenSettings:
      "Open extension settings: access code, intake initials, auto-save, Google backup.",
    fnolDeleteJob:
      "Removes this entry from the local Jobs entered list only.",
    fnolNotes:
      "Adjuster details are added into notes on submit (500 character limit on the job site).",

    teamAllenFillFromPayload:
      "Fills the add-job form from saved WorkCenter, Alacrity, or FNOL data.",
    teamAllenUpdateFromPayload:
      "Updates the edit-job form from the saved payload.",
    teamAllenPasteJson: "Pastes JSON from your clipboard into the payload editor.",
    teamAllenCopyJobJson:
      "Copies the current job as JSON for saving or re-importing.",
    teamAllenCopyPlain:
      "Copies the job as readable text (same style as FNOL plain text).",
    teamAllenAddNotesFromFnol:
      "Adds FNOL note text to this job's Notes section (Misc).",
    coordinatorNone: "Does not change coordinator when filling.",
    coordinatorRecon: "Sets coordinator to your recon default when filling.",
    coordinatorMitigation: "Sets coordinator to your mitigation default when filling.",
    payloadHistory:
      "Pick a previous scraped or saved payload (last 5).",

    workcenterScrape:
      "Reads job fields from this WorkCenter page and saves them in the extension.",
    workcenterExportJson: "Downloads the payload as a .json file.",
    workcenterCopyPlain:
      "Copies scraped job data as readable text for email or Teams.",
    workcenterOpenImport:
      "Saves the payload and opens TeamAllen to add the job (full access only).",

    alacrityScrape:
      "Reads claim fields from this Alacrity page and saves them in the extension.",
    alacrityExportJson: "Downloads the Alacrity payload as a .json file.",
    alacrityCopyPlain: "Copies scraped claim data as readable text for email or Teams.",
    alacrityOpenImport:
      "Saves the payload and opens TeamAllen to add the job (full access only).",

    jsonShowPayload: "Expand or collapse the JSON editor.",
    jsonHidePayload: "Expand or collapse the JSON editor.",
    jsonSavePayload: "Saves your edits to extension storage for fill/import.",
    jsonCopyJson: "Copies the JSON in the editor.",
    jsonCopyPlain: "Copies a human-readable summary of the payload.",
    jsonResetScrape: "Discards edits and restores the last scraped values.",
    jsonPasteJson: "Pastes JSON from the clipboard into the editor.",

    popupOpenFnol:
      "Opens the intake form (access code required to use it).",
    popupOpenSettings: "Opens preferences and access code entry.",
    popupOpenJobsList:
      "Opens the TeamAllen jobs list and Add Job popup (full TeamAllen access only).",
    popupOpenAddJobPage:
      "Opens the TeamAllen add-job page directly (full TeamAllen access only).",

    settingsFnolAutoSave:
      "After FNOL submit, automatically save the job on TeamAllen when the form is ready.",
    settingsFnolPasteNotes:
      "After the job is saved, automatically add FNOL notes when the Notes section is ready.",
    settingsFnolGoogleBackup:
      "Sends each FNOL submit to your team's Google Form backup sheet (TeamAllen access only).",
    settingsFnolIntakeInitials:
      "Your initials appear on the Google Form backup row (e.g. IT). Required when backup is on.",
    settingsFnolClearAfterSubmit:
      "Clears the FNOL form after a successful submit.",
    settingsFnolAddressLookupHelper:
      "Shows paste-to-parse helper on the FNOL address section.",
    settingsFnolCopyOnSubmit:
      "Copies intake as plain text to the clipboard when you submit."
  };

  function applyButtonHint(element, key) {
    if (!element || !key) {
      return;
    }
    const hint = BUTTON_HINTS[key];
    if (hint) {
      element.title = hint;
    }
  }

  function applySubmitHint(btn, settings, settingsApi) {
    if (!btn || !settingsApi || !settingsApi.getSubmitHandler) {
      return;
    }
    const handler = settingsApi.getSubmitHandler(settings);
    applyButtonHint(
      btn,
      handler === "teamallenssm" ? "fnolSubmitTeamAllen" : "fnolSubmitGeneric"
    );
  }

  root.buttonHints = {
    BUTTON_HINTS,
    applyButtonHint,
    applySubmitHint
  };
})(typeof window !== "undefined" ? window : self);
