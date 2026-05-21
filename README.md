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

## Extension icon, settings, and access code

Click the extension icon to open the popup.

- **First Notice of Loss** — dedicated page (`fnol.html`) with a two-panel layout: job history (name + entered timestamp) and the entry form.
- **Settings** — access code, display preferences, add-job mode (list popup vs full page), FNOL auto-save, and a link to open the FNOL page.

Enter access code **`TeamAllenSSM`** in Settings to unlock import tools and FNOL.

- Coordinator defaults on the import helper panel: **Non-default**, **Default recon**, or **Default mitigation**.
- **Add job opens as** (default: **List popup**): jobs list + Add Job modal. **Full page** opens `jobs1_add.php` directly.
- **FNOL page**: sectioned form (basic, address, insurance & adjuster, notes), **Copy as normal text**, **Jobs entered** list with timestamps; submit opens TeamAllen and auto-fills (auto-save optional in Settings).
- On **edit** pages, use **Copy current job (JSON)** or **Copy as normal text**; address is read from the visible address grid (opens inline edit if needed).
- JSON panels also include **Copy as normal text** beside **Copy JSON**.

## Privacy

This extension does not collect, transmit, sell, or share personal data. It uses local browser storage only to remember your last selected image type and scraped WorkCenter payloads (including the last five scrape history entries). Data stays on your device.

## WorkCenter scrape + TeamAllenssm import

Cross-page helper for moving WorkCenter job data into TeamAllenssm with DOM-based scraping, editable JSON, and expanded autofill.

### Supported flow

1. Open a WorkCenter project page on `servpronet.io`.
2. Use the floating **WorkCenter Import Helper**:
   - `Scrape WorkCenter` reads stable field IDs (see `examples/workcenter-field.html`) and saves JSON to extension storage.
   - Expand **Show payload JSON** to review or edit values, then `Save payload`.
   - `Copy JSON` (in the JSON panel) copies the current editor text.
   - `Export JSON` downloads the current editor text as a `.json` file.
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
| `claimNumber` | Header or label | Claim # |
| `coordinator` | Job File Coord. combobox | Coordinator |
| `address1`–`zip`, `yearBuilt` | Structured address inputs (not header one-liner) | Customer address grid |
| `addLocation` | Derived from property type | Add Location (Residence/Commercial) |
| `billAddress` | Default true | Bill Address checkbox |

Metadata only in JSON (not filled on add form): `projectName`, `projectId`, `projectProgress`, `causeOfLoss`, `policyNumber`, `fullAddress`.

### Commercial vs residential

- **Commercial**: `businessName` = project name or primary header contact; `customerName` = secondary contact person (point of contact).
- **Residential**: `customerName` = primary contact (falls back to project name if weak); `businessName` stays empty unless WorkCenter has an explicit business label.

### Address handling

- Street/city/state/zip come from `MainContent_txt_*` inputs first; header `txt_FullAddress` is parsed only as fallback.
- TeamAllen address fields use dynamic IDs (`value_Address1_*`); the filler and edit-page copy target the **visible** address grid row and open inline edit when values are display-only.
- FNOL `lossTypeValue` is stored when you pick a loss type from the dropdown so TeamAllen autofill can select by option value.

### Notes

- Franchise to Bus.Unit mapping includes Northwest Brooklyn, Staten Island, Rockaways/Coney, Forest Hills, Bay Ridge, and Mill Basin.
- Loss type and coordinator values are normalized before dropdown matching (e.g. `Water` → `WATER`, strip franchise suffix from coordinator).
- Unmapped dropdown options are reported in the status line after fill.
- Payload history stores the last 5 scrapes in extension local storage.
- Field maps live in `src/lib/workcenterFields.js`; update `examples/workcenter-field.html` when WorkCenter markup changes.

## Planned next steps

- Add filename-based auto-matching rules.
- Add quick buttons for common categories.
