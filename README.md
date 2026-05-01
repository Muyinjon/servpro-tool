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

This version also adds a cross-page helper for moving core WorkCenter job data into TeamAllenssm.

### Supported flow

1. Open a WorkCenter project page on `servpronet.io`.
2. Use the floating **WorkCenter Import Helper**:
   - `Scrape WorkCenter` saves a normalized payload in local extension storage.
   - `Export JSON` downloads the payload as a `.json` file for CRM/other tools.
   - `Copy JSON` copies the payload to clipboard.
   - `Autofill TeamAllenssm` opens TeamAllenssm new-job page.
3. On `teamallenssm.com/jobs1_add.php`, use **TeamAllenssm Import Helper**:
   - Click `Fill from WorkCenter payload`.
   - Optionally choose a specific record from the last 5 scraped history entries before filling.
   - Optional: enable `Apply recon defaults` to set Coordinator and Recon Mgr on recon/rebuild jobs.
   - Review values, then click Save manually.

### Core fields in payload

- Project: name, ID, progress
- Loss: type, cause, claim number
- Contact: customer name, phones, email
- Address: line 1, line 2, city, state, zip, year built, country, full address
- Classification: property type, franchise name, mapped business unit, pay type
- Insurance carrier
- Metadata: source URL and scrape timestamp

### Notes

- Selector logic uses label/value fallbacks so minor markup changes are tolerated.
- Franchise to Bus.Unit mapping currently includes:
  - `Northwest Brooklyn` -> `NW Brooklyn`
  - `Northern Staten Island` -> `Staten Island`
  - `The Rockaways, Coney Island` -> `Rockaways/Coney`
  - `Forest Hills/Ridgewood` -> `Forest Hills`
  - `Bay Ridge` -> `Bay Ridge`
  - `Mill Basin, Flatlands` -> `Mill Basin`
- Name logic:
  - Commercial jobs prefer project name as `businessName`.
  - Non-commercial jobs can fallback project name to `customerName` when contact name is weak/missing.
- Claim number is sourced from `Claim Number` with fallback parsing.
- Autofill maps by TeamAllenssm field IDs and dynamic address prefixes.
- Dropdown fill uses text matching; if no matching option exists, the helper reports missing fields.
- Payload history stores last 5 scrapes in extension local storage (most recent first).
