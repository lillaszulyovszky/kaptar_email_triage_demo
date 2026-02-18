# Deployment Guide — Kaptar Email Triage System

Step-by-step instructions for deploying the triage system to a live Gmail account.

---

## Prerequisites

- [ ] A Google account (Gmail or Google Workspace)
- [ ] Access to [Google Apps Script](https://script.google.com) (free)
- [ ] Access to [Google Sheets](https://sheets.google.com) (free)
- [ ] This repository cloned or downloaded locally

---

## Phase 1 — Create the Google Sheet

### Step 1.1 — Create a blank spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click the **+** button (Blank spreadsheet)
3. Rename the spreadsheet to `Kaptar Email Triage` (top-left, click "Untitled spreadsheet")

### Step 1.2 — Copy the Sheet ID

The Sheet ID is the long string between `/d/` and `/edit` in the URL:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        This is your SHEET_ID
```

Copy this ID — you'll need it in Phase 2.

---

## Phase 2 — Set Up Google Apps Script

### Step 2.1 — Create a new Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Click "Untitled project" at the top and rename it to `Kaptar Email Triage`

### Step 2.2 — Create script files

You need to create **6 script files**. The default project has one file called `Code.gs`.

For each file listed below:
1. Click the **+** button next to "Files" in the left sidebar
2. Select **Script**
3. Type the exact filename (without `.gs` — Apps Script adds the extension)
4. Paste the file contents from this repository

**Files to create (in order):**

| File | Where to find content |
|---|---|
| `Config` (rename the blank file) | `Config.gs` in this repo |
| `Analyzer` | `Analyzer.gs` in this repo |
| `Templates` | `Templates.gs` in this repo |
| `Utils` | `Utils.gs` in this repo |
| `Code` (rename the default `Code.gs`) | `Code.gs` in this repo |
| `TestEmailGenerator` | `TestEmailGenerator.gs` in this repo |

> **Tip:** You can paste all file contents in any order — Apps Script loads them all into one global scope.

### Step 2.3 — Add your Sheet ID to Config.gs

1. Open `Config` in the left sidebar
2. Find line 12 (the `SHEET_ID` variable):
   ```javascript
   var SHEET_ID = ''; // <-- PASTE YOUR GOOGLE SHEET ID HERE
   ```
3. Replace the empty string with your Sheet ID from Step 1.2:
   ```javascript
   var SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
   ```
4. Click **Save** (Ctrl+S / Cmd+S)

### Step 2.4 — Review VIP lists (optional)

Still in `Config.gs`, update the VIP lists with your real key clients:

```javascript
var VIP_EMAILS = [
  'your-vip@client.com',
  'another-vip@enterprise.com',
];

var VIP_DOMAINS = [
  'importantclient.com',
];
```

---

## Phase 3 — Authorise Permissions

### Step 3.1 — Run initialiseSheets()

1. In the Apps Script editor, click the **function selector dropdown** (next to the Run button) — it probably says `myFunction` or `processEmails`
2. Select `initialiseSheets`
3. Click the **Run** button (▶)
4. A popup will appear: **"Authorization required"** — click **Review permissions**
5. Choose your Google account
6. Click **Advanced** → **Go to Kaptar Email Triage (unsafe)**
   (This warning appears because the script isn't published to the Marketplace — it's safe)
7. Click **Allow**

Apps Script now has permission to read Gmail and write to Sheets.

### Step 3.2 — Verify Sheet tabs were created

1. Go back to your Google Sheet
2. You should see two tabs at the bottom: **Email Log** and **Dashboard**
3. The Email Log tab should have a bold header row with 18 columns

If the tabs aren't there, check the Apps Script execution log:
- In the editor: **View → Executions** to see any errors

---

## Phase 4 — Run the Test Suite

### Step 4.1 — Run runAnalysisOnTestEmails()

1. In the function dropdown, select `runAnalysisOnTestEmails`
2. Click **Run**
3. Open **View → Logs** (or Ctrl+Enter)

You should see output like:
```
=== KAPTAR EMAIL TRIAGE — TEST RESULTS ===
#    Subject                                              Expected       Got            Conf   Result
--------------------------------------------------------------------------------------------------------------
1    Invoice #1087 – incorrect amount                    BILLING        BILLING        87%    PASS
2    Payment confirmation needed                         BILLING        BILLING        74%    PASS
...
--------------------------------------------------------------------------------------------------------------
ACCURACY: 52/60 (86.7%)
Target: >85% | ✓ PASSING
```

If accuracy is below 85%, see the Tuning section below.

### Step 4.2 — Test a single email

1. Select `testSingleEmail` and run it
2. Check the logs — you should see a billing dispute email correctly categorised as BILLING

---

## Phase 5 — Install the Live Trigger

### Step 5.1 — Create the time-driven trigger

1. Select `createTimeTrigger` from the dropdown
2. Click **Run**
3. Check the logs — you should see: `Time-driven trigger created: processEmails() every 15 minutes.`

### Step 5.2 — Verify the trigger in the dashboard

1. In the Apps Script editor, click the **clock icon** in the left sidebar (Triggers)
2. You should see one trigger: `processEmails` | `Time-driven` | `Every 15 minutes`

The system is now live. It will automatically check your Gmail inbox every 15 minutes.

---

## Phase 6 — Verify Live Processing

### Step 6.1 — Send a test email to yourself

Send a test email to your own Gmail address with a subject like:
> "Question about my invoice from March"

Wait up to 15 minutes, or run `processEmails()` manually from the editor.

### Step 6.2 — Check Gmail labels

In Gmail, look for the new label hierarchy in the left sidebar:
```
Kaptar/
  ├── Processed
  ├── Category/
  │     ├── BILLING
  │     ├── BOOKING
  │     ├── COMPLAINT
  │     ├── INFO_REQUEST
  │     ├── MEMBERSHIP
  │     └── SPAM
  ├── VIP
  ├── Urgent
  └── DraftCreated
```

Your test email should have `Kaptar/Processed` and `Kaptar/Category/BILLING` labels.

### Step 6.3 — Check Gmail Drafts

If the confidence score was ≥ 0.8, a draft reply should appear in Gmail's **Drafts** folder.

### Step 6.4 — Check the Google Sheet

In your Google Sheet:
- **Email Log** tab: should have one new row with the processed email's data
- **Dashboard** tab: should show updated statistics

---

## Tuning After Deployment

### If accuracy is below 85%

1. Run `runSingleScenario(index)` for any failing tests to see the detailed score breakdown
2. Find terms that should score higher and increase their `weight` in `Config.gs`
3. If a category is matching too often, raise its `threshold`
4. If your inbox contains industry-specific terms, add them to the relevant category's `keywords` array

### If too many emails are getting through unprocessed

Increase `LOOKBACK_HOURS` in `Config.gs`. The default is 2 hours; for a less frequent check pattern, try 4 or 6 hours.

### If you're getting false positives on spam

Review `CATEGORIES.SPAM.keywords` and raise the `threshold` from `2` to `3` or `4`.

---

## Maintenance

### Viewing execution logs

- **Apps Script editor** → **View → Executions** — shows every trigger run with timestamps and logs

### Disabling the system temporarily

Set `DRY_RUN: true` in `Config.gs`. The system will analyse emails and log them but will not create drafts or apply labels.

### Removing all Kaptar labels from Gmail

Run the following in the editor:
```javascript
function cleanupLabels() {
  var labels = GmailApp.getUserLabels();
  labels.forEach(function(label) {
    if (label.getName().indexOf('Kaptar') === 0) {
      label.deleteLabel();
    }
  });
}
```

### Resetting the Email Log

Simply delete all rows below the header row in the **Email Log** sheet tab. The Dashboard will update on the next trigger run.

### Re-processing emails

Run `resetProcessedLabel()` to remove the `Kaptar/Processed` label from all threads. The next trigger run will re-analyse them.

---

## Google Workspace Deployment

If deploying for a Google Workspace (G Suite) organisation:

1. Ask your Workspace admin to allow OAuth for internal Apps Script projects
2. In Apps Script: **Project Settings** → check **"Show appsscript.json manifest file in editor"**
3. Add the following OAuth scopes to `appsscript.json`:
   ```json
   {
     "oauthScopes": [
       "https://www.googleapis.com/auth/gmail.modify",
       "https://www.googleapis.com/auth/gmail.compose",
       "https://www.googleapis.com/auth/gmail.labels",
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/script.scriptapp"
     ]
   }
   ```
4. Deploy as a **bound script** on the Google Sheet (Tools → Script editor from within the sheet) so permissions are scoped to the sheet owner's account

---

## Checklist Summary

- [ ] Google Sheet created and Sheet ID copied
- [ ] Apps Script project created and named
- [ ] All 6 `.gs` files created with correct content
- [ ] `SHEET_ID` pasted into `Config.gs` line 12
- [ ] VIP lists updated with real client emails/domains
- [ ] `initialiseSheets()` run and OAuth approved
- [ ] Sheet shows "Email Log" and "Dashboard" tabs with headers
- [ ] `runAnalysisOnTestEmails()` shows ≥85% accuracy
- [ ] `createTimeTrigger()` run and trigger visible in Triggers panel
- [ ] Test email sent and processed correctly
- [ ] Draft reply visible in Gmail Drafts
- [ ] Sheet row visible in Email Log
- [ ] Dashboard shows correct counts
