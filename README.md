# ServPro Helper - WorkCenter Help

Chrome extension for ServPro WorkCenter that helps users quickly apply one image type to all visible upload rows in the documents upload screen.

## What It Does

- Detects the ServPro WorkCenter docs upload page
- Injects a small helper panel into the page
- Lets you choose one image type and apply it to all visible upload rows
- Remembers your last selected image type locally in Chrome storage

## Install

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

### Package for Chrome Web Store (upload zip)

Double-click **`build-extension.bat`** in the project root (or run `dist\build.ps1` in PowerShell).

It creates **`dist\servpro-helper-v<version>.zip`** with only the files needed for the extension — ready to upload at the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole). The `dist` folder opens automatically after a successful build.

## Use

1. Open a ServPro WorkCenter job
2. Go to the docs or pictures upload area
3. Upload your files
4. In the helper panel, choose the image type
5. Click `Apply to all visible uploads`

## Permissions

- `storage`: used to remember the last selected image type and scraped WorkCenter payloads (including scrape history)
- `tabs`: used to open TeamAllen add-job from FNOL and the settings page
- `https://*.servpronet.io/*`: required so the extension can run on ServPro WorkCenter pages
- `https://teamallenssm.com/*`: required for TeamAllenssm job form autofill
- `https://docs.google.com/*`: required for TeamAllen FNOL Google Form backup (optional in Settings)

## Extension icon, settings, and access code

Click the extension icon to open the popup.

- **First Notice of Loss** — dedicated page (`fnol.html`) always openable; intake requires an access code (*You require an access code for the intake.*). Trial: save & copy only; full **TeamAllenSSM** code unlocks TeamAllen submit and optional Google Form backup.
- **Settings** — access code, display preferences, add-job mode (list popup vs full page), FNOL auto-save, FNOL post-save notes, and a link to open the FNOL page.

Enter access code **`TeamAllenSSM`** in Settings to unlock import tools and FNOL.

- Coordinator defaults on the import helper panel: **Non-default**, **Default recon**, or **Default mitigation**.
- **Add job opens as** (default: **List popup**): jobs list + Add Job modal. **Full page** opens `jobs1_add.php` directly.
- **FNOL page**: sectioned form (basic, address, insurance & adjuster, notes); **Customer**, **Phone 1**, and **Address 1** are required; live **500-character** notes counter; **Jobs entered** list with timestamps. **Trial**: save & copy, no Google backup (upgrade via email in Settings). **TeamAllen**: submit opens TeamAllen and auto-fills; optional **Google Form backup** (intake initials in Settings, e.g. `IT`). See [`docs/google-form-fnol-backup.md`](docs/google-form-fnol-backup.md). Notes are added **after** the job is saved on TeamAllen when configured.
- On **edit** pages, use **Copy current job (JSON)** or **Copy as normal text**; address is read from the visible address grid (opens inline edit if needed).
- JSON panels also include **Copy as normal text** beside **Copy JSON**.

## Privacy

By default, data stays in local Chrome storage (image type preference, WorkCenter payloads, FNOL job history). If you use **TeamAllen** access and leave **Send FNOL backup to Google Form** enabled in Settings, each FNOL submit also POSTs job fields to your team’s Google Form (linked Google Sheet). That backup is optional and limited to the TeamAllen tier. See [`docs/google-form-fnol-backup.md`](docs/google-form-fnol-backup.md).

## WorkCenter scrape + TeamAllenssm import

Cross-page helper for moving WorkCenter job data into TeamAllenssm with DOM-based scraping, editable JSON, and expanded autofill.

### Supported flow

1. Open a WorkCenter project page on `servpronet.io`.
2. Use the floating **WorkCenter Import Helper**:
   - `Scrape WorkCenter` reads General form fields (claim, address, notes, job ID) plus header when present (see `examples/workcenter-field.html`) and saves JSON to extension storage.
   - Expand **Show payload JSON** to review or edit values, then `Save payload`.
   - `Copy JSON` (in the JSON panel) copies the current editor text.
   - `Export JSON` downloads the current editor text as a `.json` file.
   - `Copy as normal text` copies a readable job summary (same as Alacrity capture; always visible on the toolbar).
   - `Autofill TeamAllenssm` saves the current payload and opens TeamAllen (jobs list + Add Job popup by default, or the full add page if configured).
3. On the TeamAllen add-job form (popup iframe or full page), use **TeamAllenssm Import Helper**:
   - Review or edit JSON, then click `Fill from WorkCenter payload`.
   - Choose a record from the last 5 scraped history entries if needed.
   - Optional: choose coordinator default mode (Non-default / Default recon / Default mitigation) on the import helper panel.
   - Review the form and click Save manually.

### Fields scraped and filled

| Payload key | WorkCenter source | TeamAllenssm target |
|-------------|-------------------|---------------------|
| `businessUnit` | Franchise header | Bus. Unit |
| `customerName` | Primary contact (residential) or secondary contact (commercial) | Customer |
| `businessName` | Project name / primary header (commercial only) | Business |
| `propertyType` | `MainContent_cmb_JobType` | Type (Residential/Commercial) |
| `primaryPhone`, `secondaryPhone` | Parsed from contact lines | Phone 1 / Phone 2 |
| `email` | Email link text or href | EMail |
| `payType` | Derived from insurance/claim | Pay Type |
| `insuranceCarrier` | Insurance combobox input | Insurance Company |
| `lossType` | Header loss type span | Loss Type |
| `claimNumber` | General form `#MainContent_txt_LotBlock` (header often empty); colon-style claims allowed | Claim # |
| `coordinator` | Job File Coord. combobox | Coordinator |
| `address1`–`zip`, `yearBuilt` | Structured address inputs (not header one-liner) | Customer address grid |
| `notes` / `notesUser` | General `#MainContent_txt_Notes` | Notes paste flow |
| `addLocation` | Derived from property type | Add Location (Residence/Commercial) |
| `billAddress` | Default true | Bill Address checkbox |

Metadata only in JSON (not filled on add form): `projectName`, `projectId` (from `#MainContent_txt_JobID`), `projectProgress`, `causeOfLoss`, `policyNumber` / `deductible` (from `name=jobCustom1` / `jobCustom2`), `fullAddress`, `notes`.

### Commercial vs residential

- **Commercial**: `businessName` = project name or primary header contact; `customerName` = secondary contact person (point of contact).
- **Residential**: `customerName` = primary contact (falls back to project name if weak); `businessName` stays empty unless WorkCenter has an explicit business label.

### Address handling

- Street/city/state/zip come from `MainContent_txt_*` inputs first; header `txt_FullAddress` is parsed only as fallback.
- TeamAllen customer address fields use dynamic IDs (`value_Address1_*`, `value_AddLocation_*`, `value_BillAddress_*`) and display cells (`edit{recordId}_Address1`, etc.). **Copy current job** / **Copy as normal text** scrape both inline inputs and display cells. On **add job** (full page or list modal) and **edit job**, the filler opens the visible address grid row for inline edit, then sets **Add Location** (option value `1` = Residence, `2` = Commercial), checks **Bill Address**, and fills street/city/state/zip.
- FNOL stores `addLocation` / `addLocationValue` from property type (Residential/Commercial) plus `lossTypeValue` when you pick a loss type so TeamAllen autofill can select by option value.

### FNOL notes (TeamAllen)

- TeamAllen limits notes to **500 characters**. The FNOL form shows a live counter (merged notes + adjuster backup) and blocks submit when over the limit.
- On submit, note text is queued in extension storage. After auto-save (if enabled), the import helper polls for the Notes grid (up to ~30s) and runs the Add Notes → Misc → save flow automatically. Turn this off in Settings with **After FNOL save, automatically add notes when Notes section is ready**.
- If auto-paste times out or auto-save is off, use **Add notes from FNOL** on the add-job or edit-job helper when the Notes section is visible.

### Notes

- Franchise to Bus.Unit mapping includes Northwest Brooklyn, Staten Island, Rockaways/Coney, Forest Hills, Bay Ridge, and Mill Basin.
- Loss type and coordinator values are normalized before dropdown matching (e.g. `Water` → `WATER`, strip franchise suffix from coordinator).
- Unmapped dropdown options are reported in the status line after fill.
- Payload history stores the last 5 scrapes in extension local storage.
- Field maps live in `src/lib/workcenterFields.js`; update `examples/workcenter-field.html` when WorkCenter markup changes.

## Planned next steps

- Add filename-based auto-matching rules.
- Add quick buttons for common categories.
