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
