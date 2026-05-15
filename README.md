# Servpro Upload Helper

Chrome extension for Servpro WorkCenter that adds a bulk image-type action to the docs upload screen.

## What it does

- Detects the Servpro docs page and docs iframe.
- Injects a small helper panel into the docs page.
- Lets you choose one image type and apply it to all visible upload rows.
- Uses the Kendo/Telerik dropdown/listbox UI already on the page.
- Remembers the last image type you selected.

## Current version

This first version focuses on one workflow:

- Choose one type like `Pre-Construction`
- Click `Apply to all visible uploads`
- The extension updates every visible upload row it can find

## Install

1. Open Chrome and go to `chrome://extensions`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select the folder `servpro-upload-extension`.

## Use

1. Open a Servpro job.
2. Go to the docs/pics upload area.
3. Upload your files.
4. In the helper panel, pick the image type.
5. Click `Apply to all visible uploads`.

## Notes

- The docs page appears inside `/Jobs/ServeProDocuments`, so the extension runs in frames too.
- Servpro uses dynamic Kendo IDs, so the extension matches rows and dropdowns by visible structure instead of fixed IDs.
- If Servpro changes the upload markup, update selector lists in `src/lib/selectors.js`.

## Planned next steps

- Add filename-based auto-matching rules.
- Add quick buttons for common categories.

## WorkCenter scrape + TeamAllenssm import

Cross-page helper for moving WorkCenter job data into TeamAllenssm with DOM-based scraping, editable JSON, and expanded autofill.

### Supported flow

1. Open a WorkCenter project page on `servpronet.io`.
2. Use the floating **WorkCenter Import Helper**:
   - `Scrape WorkCenter` reads stable field IDs (see `examples/workcenter-field.html`) and saves JSON to extension storage.
   - Expand **Show payload JSON** to review or edit values, then `Save payload`.
   - `Copy JSON` (in the JSON panel) copies the current editor text.
   - `Export JSON` downloads the current editor text as a `.json` file.
   - `Autofill TeamAllenssm` saves the current payload and opens `teamallenssm.com/jobs1_add.php`.
3. On the TeamAllen add-job page, use **TeamAllenssm Import Helper**:
   - Review or edit JSON, then click `Fill from WorkCenter payload`.
   - Choose a record from the last 5 scraped history entries if needed.
   - Optional: enable `Apply recon defaults` for rebuild/recon jobs (Coordinator/Recon Mgr).
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
- TeamAllen address fields use dynamic IDs (`value_Address1_*`); the filler targets the visible inline-edit row in the address grid.

### Notes

- Franchise to Bus.Unit mapping includes Northwest Brooklyn, Staten Island, Rockaways/Coney, Forest Hills, Bay Ridge, and Mill Basin.
- Loss type and coordinator values are normalized before dropdown matching (e.g. `Water` → `WATER`, strip franchise suffix from coordinator).
- Unmapped dropdown options are reported in the status line after fill.
- Payload history stores the last 5 scrapes in extension local storage.
- Field maps live in `src/lib/workcenterFields.js`; update `examples/workcenter-field.html` when WorkCenter markup changes.
