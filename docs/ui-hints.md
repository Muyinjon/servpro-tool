# Button hover hints (staff reference)

The extension shows these messages when you hover over buttons (browser tooltip). Wording lives in [`src/lib/buttonHints.js`](../src/lib/buttonHints.js).

## First Notice of Loss

| Button | What it means |
|--------|----------------|
| Submit new job | Saves intake, optional Google Form backup, opens TeamAllen to fill and save. |
| Save & copy | Saves locally and copies plain text. Trial: no TeamAllen or Google backup. |
| Clear form | Clears fields only; does not delete Jobs entered list items. |
| Copy as normal text | Readable paragraphs for email or Teams. |
| Copy as JSON | Structured data for import helper—not for customers. |
| Load from last scrape | Prefills form from last WorkCenter or Alacrity scrape in extension storage. |
| Paste from clipboard | Reads clipboard into the address paste box. |
| Fill address fields | Splits pasted address into Address 1, City, State, and Zip. |
| New job | Blank form for another intake without submitting. |
| Unlock FNOL | Enter access code to use intake. |
| Open Settings | Access code, initials, auto-save, Google backup. |
| Delete (job row) | Removes from local list only. |

Required fields on FNOL: **Customer**, **Phone 1**, **Address 1** (red asterisk).

Address paste helper (Settings, off by default): copy a full address from Google Maps, paste, then **Fill address fields**.

## TeamAllen import helper

| Button | What it means |
|--------|----------------|
| Fill from payload | Fills add-job from saved WorkCenter, Alacrity, or FNOL data. |
| Update from payload | Updates edit-job from saved payload. |
| Paste JSON | Paste clipboard into JSON editor. |
| Copy job (JSON) | Copy job as JSON for re-import. |
| Copy plain text | Readable job summary. |
| Add notes from FNOL | Add FNOL notes to Notes (Misc). |
| Non-default / Default recon / Default mitigation | Coordinator behavior when filling. |
| History | Last 5 saved payloads. |

## WorkCenter import helper

| Button | What it means |
|--------|----------------|
| Scrape | Read fields from WorkCenter and save in extension. |
| JSON | Download .json file. |
| Copy text | Readable job summary for email or Teams (no JSON editor needed). |
| Import job | Save and open TeamAllen add job (full access). |

## Alacrity import helper

| Button | What it means |
|--------|----------------|
| Scrape | Read claim fields from this Alacrity page and save in extension. |
| Export JSON | Download Alacrity payload as .json file. |
| Copy as normal text | Readable claim summary for email or Teams (no JSON editor needed). |
| Open job import | Save and open TeamAllen add job (full access). |

## JSON panel (WorkCenter / Alacrity / TeamAllen)

| Button | What it means |
|--------|----------------|
| Show / Hide payload JSON | Expand or collapse editor. |
| Save payload | Save edits for fill/import. |
| Copy JSON | Copy editor JSON. |
| Copy as normal text | Human-readable summary. |
| Reset to last scrape | Undo edits, restore last scrape. |
| Paste JSON | Paste into editor. |

## Extension popup

| Button | What it means |
|--------|----------------|
| First Notice of Loss | Opens intake (code required to use). |
| Settings | Preferences and access code. |
| Open jobs list / new job page | TeamAllen (full code only). |
