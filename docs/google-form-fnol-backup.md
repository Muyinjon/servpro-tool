# Google Form setup — FNOL backup (TeamAllen SSM)

This guide describes how to create a **Google Form** linked to a **Google Sheet** so the ServPro Helper extension can send each FNOL submit as a new row (office-wide backup). It matches the fields collected in `fnol.html` / `buildFnolPayload()` plus metadata (who submitted, when, team).

**Important:** Create questions in the **exact order** below. If you reorder or delete questions later, you must update the extension’s `entry.XXXXXXXX` mapping.

---

## What this backup is for

| Layer | Purpose |
|-------|---------|
| **Google Sheet** | Shared backup for the whole team; filter by intake initials, date, customer |
| **FNOL “Jobs entered”** (extension) | Local history on that computer (up to 30 jobs) |
| **TeamAllen** | Primary job system after submit (autofill / auto-save) |

On submit (TeamAllen tier only), the extension: saves locally → POSTs to Google Form (if enabled in Settings) → continues the normal TeamAllen flow.

**Live form (TeamAllen SSM):**

- View: `https://docs.google.com/forms/d/e/1FAIpQLSeeVh8IhYFDddum4eTSGd-JFVjxUdM86MFtdp9z8dTVS7naZw/viewform`
- POST: `https://docs.google.com/forms/d/e/1FAIpQLSeeVh8IhYFDddum4eTSGd-JFVjxUdM86MFtdp9z8dTVS7naZw/formResponse`

Entry IDs are hardcoded in [`src/lib/googleFormTeamAllen.js`](../src/lib/googleFormTeamAllen.js). Trial and other access codes do not use this form.

---

## One-time Google setup

1. Go to [Google Forms](https://forms.google.com) → **Blank form**.
2. Title example: `ServPro FNOL Backup — TeamAllen SSM`.
3. **Settings** (gear icon):
   - Turn **off** “Limit to 1 response” (unless you want one row per person per day).
   - Under **Responses** → collect email: **off** (optional).
   - For intake staff who are **not** signed into Google: do **not** restrict the form to your organization only; use **Anyone with the link** can respond (or equivalent).
4. **Responses** tab → link to **Google Sheets** → **Create spreadsheet** (or pick existing).
5. Add every question below, **in order**, using the types listed.
6. After the form is finished, copy each question’s **entry ID** into the table in [Entry IDs](#entry-ids-fill-in-after-you-create-the-form) (see [How to find entry IDs](#how-to-find-entry-ids)).

---

## Questions to add (in this order)

Use these **titles** (or very close wording) so the Sheet headers are easy to read. For programmatic submit, **Short answer** and **Paragraph** are the most reliable; dropdowns only work if the submitted text **exactly** matches a form option.

| # | Question title (recommended) | Google Form type | Required? | What the extension will send |
|---|------------------------------|------------------|-----------|------------------------------|
| 1 | Team | Short answer | No | Fixed: `TeamAllenSSM` when TeamAllen access code is active |
| 2 | Intake initials | Short answer | No | From Settings (e.g. `IT`) — each user sets their own |
| 3 | Submitted at (ISO) | Short answer | No | UTC/local ISO timestamp at submit, e.g. `2026-06-03T14:30:00.000Z` |
| 4 | Submitted at (local display) | Short answer | No | Human-readable time in the user’s locale |
| 5 | FNOL ID | Short answer | No | Unique id, e.g. `fnol-1717423800123` |
| 6 | Source | Short answer | No | `fnol` |
| 7 | Customer | Short answer | Yes* | `customerName` |
| 8 | Business | Short answer | No | `businessName` |
| 9 | Phone 1 | Short answer | Yes | `primaryPhone` |
| 10 | Phone 2 | Short answer | No | `secondaryPhone` |
| 11 | Email | Short answer | No | `email` |
| 12 | Property type | Short answer | No | `Residential` or `Commercial` |
| 13 | Pay type | Short answer | No | `SELF`, `INSURANCE`, `3RD PARTY`, `COMM Account`, or empty |
| 14 | Bus. unit | Short answer | No | e.g. `NW Brooklyn`, `Staten Island`, … |
| 15 | Loss type | Short answer | No | Label, e.g. `WATER`, `FIRE`, … (see loss types below) |
| 16 | Loss type value | Short answer | No | TeamAllen option value, e.g. `1` for WATER |
| 17 | Job status | Short answer | No | Option **value**: `1` Estimate, `2` Testing, `3` On Hold, `4` Active, `12` Canceled |
| 18 | Job status label | Short answer | No | Display text: `Estimate`, `Testing`, … (optional column; extension may send label only or both) |
| 19 | Coordinator | Short answer | No | Selected coordinator **name** (label) |
| 20 | Coordinator value | Short answer | No | TeamAllen id, e.g. `8` for Johnny Turobov |
| 21 | Address 1 | Short answer | Yes | `address1` |
| 22 | Address 2 | Short answer | No | `address2` |
| 23 | City | Short answer | No | `city` |
| 24 | State | Short answer | No | `state` (2-letter) |
| 25 | Zip | Short answer | No | `zip` |
| 26 | Add location | Short answer | No | `Residence` or `Commercial` (derived from property type) |
| 27 | Insurance company | Short answer | No | `insuranceCarrier` |
| 28 | Claim # | Short answer | No | `claimNumber` |
| 29 | Adjuster name | Short answer | No | `adjusterName` |
| 30 | Adjuster phone | Short answer | No | `adjusterPhone` |
| 31 | Adjuster email | Short answer | No | `adjusterEmail` |
| 32 | Notes (user only) | Paragraph | No | Text from the Notes field only (`notesUser`) |
| 33 | Notes (merged for TeamAllen) | Paragraph | No | Full notes sent to TeamAllen (`notes`) — includes adjuster backup block when present; max **500** characters |

FNOL and this form both require **Customer**, **Phone 1**, and **Address 1** before submit.

### Optional extra columns

Add these if you want more traceability (extension can send when implemented):

| Title | Type | Content |
|-------|------|---------|
| Scraped at | Short answer | Same as submit time from payload `scrapedAt` |
| Source URL | Short answer | `fnol://local` |
| Extension version | Short answer | Manifest version at submit time |

Google Sheets also adds its own **Timestamp** column for when the response was recorded; keep column 3–4 anyway so the row shows the time the extension intended, even if POST is delayed.

---

## Reference: FNOL dropdown values

Use these if you switch any question to **Dropdown** instead of Short answer (answers must match **exactly**, including spaces and casing).

### Property type

- `Residential`
- `Commercial`

### Pay type

- `SELF`
- `INSURANCE`
- `3RD PARTY`
- `COMM Account`

### Bus. unit

- `NW Brooklyn`
- `Staten Island`
- `Rockaways/Coney`
- `Forest Hills`
- `Bay Ridge`
- `Mill Basin`

### Loss type (label → value)

| Label | Value |
|-------|-------|
| WATER | 1 |
| FIRE | 2 |
| MOLD | 3 |
| GEN. CLEANING | 4 |
| DUCT CLEANING | 5 |
| BIO HAZARD | 15 |
| REBUILD | 16 |
| STORM | 17 |
| PUFFBACK | 18 |
| SMOKE | 19 |
| SEWER | 14 |
| BOARD UP | 22 |
| STRUCTURE DAMAGE | 23 |

### Job status (value → label)

| Value | Label |
|-------|-------|
| 1 | Estimate |
| 2 | Testing |
| 3 | On Hold |
| 4 | Active |
| 12 | Canceled |

### Coordinator (value → name)

| Value | Name |
|-------|------|
| 3 | Angelica DeSimone |
| 2 | Babita Bhajan |
| 6 | Cesar Chaj |
| 5 | Cynthia Marrero |
| 15 | Elis Lamos |
| 14 | Felece Jordan |
| 9 | Jamie Raskin |
| 8 | Johnny Turobov |
| 11 | Kerri McGarry |
| 18 | Kristen Comilloni |
| 10 | Marie Allen |
| 4 | Robert Allen |
| 16 | Stefania Zielinski |

---

## Notes field behavior

- **Notes (user only):** what the intake person typed in the FNOL Notes box.
- **Notes (merged for TeamAllen):** same text plus an adjuster backup block when adjuster fields are filled, e.g.:

  ```text
  --- Adjuster (backup) ---
  Name: ...
  Phone: ...
  Email: ...
  ```

  TeamAllen uses the merged field (500 character limit in the extension). Store both columns in the Sheet if you want to audit what was typed vs. what was sent to TeamAllen.

---

## Entry IDs (TeamAllen live form)

Each question uses `entry.{id}=value` in POST requests. Mapped in `googleFormTeamAllen.js`.

| # | Question title | Entry ID |
|---|----------------|----------|
| 1 | Team | `557877839` |
| 2 | Intake initials | `1663431389` |
| 3 | Submitted at (ISO) | `2012427992` |
| 4 | Submitted at (local display) | `1800928947` |
| 5 | FNOL ID | `1254530566` |
| 6 | Source | `2025400599` |
| 7 | Customer | `1964079271` |
| 8 | Business | `2005527105` |
| 9 | Phone 1 | `1081498974` |
| 10 | Phone 2 | `1328887507` |
| 11 | Email | `43255243` |
| 12 | Property type | `479005657` |
| 13 | Pay type | `1788040439` |
| 14 | Bus. unit | `133109963` |
| 15 | Loss type | `1342898522` |
| 16 | Loss type value | `608949856` |
| 17 | Job status | `84187241` |
| 18 | Job status label | `1427098788` |
| 19 | Coordinator | `1005380351` |
| 20 | Coordinator value | `1975198778` |
| 21 | Address 1 | `1590261881` |
| 22 | Address 2 | `1369365126` |
| 23 | City | `1286759553` |
| 24 | State | `1932336798` |
| 25 | Zip | `2022493569` |
| 26 | Add location | `1926008928` |
| 27 | Insurance company | `1202686929` |
| 28 | Claim # | `1296570466` |
| 29 | Adjuster name | `1874526809` |
| 30 | Adjuster phone | `411449463` |
| 31 | Adjuster email | `161862103` |
| 32 | Notes (user only) | `1211854415` |
| 33 | Notes (merged for TeamAllen) | `1279992290` |

If you edit the Google Form (reorder or delete questions), update `ENTRY_IDS` in [`src/lib/googleFormTeamAllen.js`](../src/lib/googleFormTeamAllen.js).

---

## How to find entry IDs

**Method A — Pre-filled link (easiest)**

1. In the form editor, click **⋮** (More) → **Get pre-filled link**.
2. Fill sample text in each field → **Get link**.
3. Open the link; the URL contains `entry.1234567890=Sample` for each question **in form order**.
4. Copy each number into the table above.

**Method B — View page source**

1. Open the public form URL (`/viewform`).
2. View page source and search for `entry.`.

**Method C — Browser devtools**

1. Inspect the form HTML on the live form page; inputs are named `entry.XXXXXXXX`.

---

## Extension settings (implemented)

In **Settings** → FNOL defaults (TeamAllen access code only):

| Setting | Example | Purpose |
|---------|---------|---------|
| Intake initials | `IT` | Identifies who did intake; required before submit when Google backup is on |
| Send FNOL backup to Google Form | on (default) | POST row on FNOL submit |

The form URL is hardcoded for **TeamAllenSSM** only (`googleFormTeamAllen.js`). Other companies need a separate config module if added later.

Team label `TeamAllenSSM` is sent automatically; intake staff do **not** need to sign in to Google if the form allows anonymous responses.

### Trial vs full access

| Capability | Trial | TeamAllen (full) |
|------------|-------|------------------|
| Open FNOL page | Yes | Yes |
| Use intake form (save & copy) | Yes | Yes (+ TeamAllen submit) |
| Google Form backup | No — email to upgrade / set up your form | Yes (optional checkbox) |
| TeamAllen auto-fill / import helpers | No | Yes |

---

## Onboarding a new team

The extension uses a tenant registry (`src/lib/tenantRegistry.js`) so each access code maps to its own team configuration. Adding a new team requires exactly **two file edits** and no other changes:

### Step 1 — Add their access code to `src/lib/settings.js`

Open `TENANT_CODES` (near the top of the file) and add one line:

```js
"TheirAccessCode": "theirtier"
```

The tier key (e.g. `"theirtier"`) is a short, lowercase slug you choose. It ties the code to their profile.

### Step 2 — Add their profile to `src/lib/tenantRegistry.js`

Add one block inside `TENANT_PROFILES`:

```js
"theirtier": {
  displayName: "Their Company Name",
  googleForm: {
    formId: "1FAIpQLSee...",           // from their form's publish URL
    responseUrl: "https://docs.google.com/forms/d/e/.../formResponse",
    teamLabel: "TheirTeamLabel",       // stored in the "Team" column
    entryIds: {
      team:            "...",
      intakeInitials:  "...",
      submittedAtIso:  "...",
      submittedAtLocal:"...",
      fnolId:          "...",
      source:          "...",
      customerName:    "...",
      businessName:    "...",
      primaryPhone:    "...",
      secondaryPhone:  "...",
      email:           "...",
      propertyType:    "...",
      payType:         "...",
      businessUnit:    "...",
      lossType:        "...",
      lossTypeValue:   "...",
      jobStatus:       "...",
      jobStatusLabel:  "...",
      coordinator:     "...",
      coordinatorValue:"...",
      address1:        "...",
      address2:        "...",
      city:            "...",
      state:           "...",
      zip:             "...",
      addLocation:     "...",
      insuranceCarrier:"...",
      claimNumber:     "...",
      adjusterName:    "...",
      adjusterPhone:   "...",
      adjusterEmail:   "...",
      notesUser:       "...",
      notesMerged:     "..."
    }
  },
  submitHandler: "generic",           // "teamallenssm" only for TeamAllen autofill
  features: {
    googleFormBackup: true,
    teamAllenAutofill: false
  }
}
```

To get the `entry.XXXXXXXX` IDs for their form, use the **prefill-link method** described earlier in this doc (open the form with `?embedded=true` and parse `FB_PUBLIC_LOAD_DATA_` from the page source).

### After the two edits

- Ship the extension update (rebuild + pack the zip).
- The new team enters their access code in Settings.
- Their Settings page automatically shows **"Google Form backup — Their Company Name"** as the section heading.
- Every FNOL submit POSTs to their form URL with no further changes.

> **What does NOT change when adding a team:**
> FNOL page HTML, Chrome storage keys, trial behavior, or any other team's configuration. Only `settings.js` and `tenantRegistry.js` are touched.

---

## Per-machine checklist for your team

1. Admin creates the form + Sheet using this doc.
2. Admin shares the form response URL and entry ID map with whoever maintains the extension build.
3. Each intake person installs/updates the extension.
4. Each person opens **Settings** → sets **Intake initials** (e.g. `IT`).
5. Enable **Google Form backup** when that option exists.
6. Submit a **test** FNOL; confirm a new row appears in the Sheet with correct initials and customer name.

---

## Privacy and access

- Rows contain **PII** (names, phones, addresses, claim numbers, notes).
- Restrict the linked **Google Sheet** to managers/office staff only.
- Do not commit form URLs or entry IDs to a public repo if the form accepts open submissions.
- Enabling backup changes the extension privacy story: data leaves the browser for Google when backup is on.

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| No new row in Sheet | Form must allow responses without sign-in; correct `formResponse` URL; entry IDs match current question order |
| Wrong column data | Question order changed — recreate mapping or restore order |
| Dropdown answer rejected | Submitted text must match a form option exactly; prefer Short answer |
| Notes truncated in Sheet | Paragraph field; merged notes capped at 500 chars in extension |
| Duplicate rows | One submit = one POST; double-clicks or retries may create duplicates — use FNOL ID column to dedupe |

---

## Minimal form (if you want fewer columns)

At minimum for a useful backup:

1. Team  
2. Intake initials  
3. Submitted at (ISO)  
4. Customer  
5. Phone 1  
6. Claim #  
7. Notes (merged for TeamAllen)  

You can add the rest later, but **new questions must be appended at the end** unless you re-map all entry IDs.

---

## Button hints

Hover tooltips for FNOL and related buttons are documented in [`docs/ui-hints.md`](ui-hints.md).

## Related code (for developers)

| File | Role |
|------|------|
| `src/ui/fnol.js` | `buildFnolPayload()`, submit handler |
| `src/lib/fnolNotes.js` | Merged notes + 500 char limit |
| `src/lib/settings.js` | Settings storage (initials + form URL to be added) |
| `fnol.html` | Form fields and dropdown options |

Implementation: [`src/lib/googleFormTeamAllen.js`](../src/lib/googleFormTeamAllen.js), hooked from [`src/ui/fnol.js`](../src/ui/fnol.js). `host_permissions` includes `https://docs.google.com/*` in `manifest.json`.
