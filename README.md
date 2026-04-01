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

- `storage`: used only to remember the last selected image type
- `https://*.servpronet.io/*`: required so the extension can run on ServPro WorkCenter pages

## Privacy

This extension does not collect, transmit, sell, or share personal data. It uses local browser storage only to save the last selected image type.
