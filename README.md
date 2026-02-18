# Kaptar Email Triage System

Automated Gmail triage for Kaptar Coworking Space, built entirely in Google Apps Script.

Processes ~70 emails/day, categorises them into six types, auto-generates draft replies for high-confidence matches, flags VIP and urgent emails, and logs everything to a real-time Google Sheets dashboard.

---

## Features

| Feature | Detail |
|---|---|
| **Auto-categorisation** | Billing · Booking · Complaint · Info Request · Membership · Spam |
| **Confidence scoring** | 0–1 score per email; drafts only created at ≥ 0.8 |
| **Sentiment analysis** | −1 to +1 scale with negation and intensifier handling |
| **VIP detection** | Matches full email address or domain against configurable lists |
| **Auto-draft replies** | HTML templates per category; personalised with sender first name |
| **Gmail labels** | `Kaptar/Processed`, `Kaptar/Category/*`, `Kaptar/VIP`, `Kaptar/Urgent`, `Kaptar/DraftCreated` |
| **Sheets logging** | Every email logged with 18 columns of metadata |
| **Live dashboard** | Aggregated stats rebuilt after every processing run |
| **Edge case handling** | Multi-topic emails, sarcasm heuristics, basic language detection |
| **Test suite** | 60 realistic coworking scenarios with expected outcomes |

---

## File Structure

```
kaptar_email_triage_demo/
├── Code.gs                  Main orchestration logic + trigger setup
├── Config.gs                All configuration: categories, keywords, VIP lists
├── Analyzer.gs              Email analysis engine (categorisation + sentiment)
├── Templates.gs             HTML reply templates for each category
├── Utils.gs                 Sheets logging, Gmail helpers, HTML stripping
├── TestEmailGenerator.gs    60 test scenarios + accuracy reporter
├── test-emails.json         Test scenarios as a JSON reference file
├── sheet-template.csv       Example Sheet layout with column definitions
├── README.md                This file
└── DEPLOYMENT.md            Step-by-step deployment guide
```

---

## Quick Start

### Prerequisites

- A Google account with Gmail
- Google Apps Script access (free, no billing required)
- A blank Google Sheet

### 5-Minute Setup

1. **Create a Google Sheet**
   - Go to [sheets.google.com](https://sheets.google.com) → Blank spreadsheet
   - Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/**<SHEET_ID>**/edit`

2. **Open Apps Script**
   - Go to [script.google.com](https://script.google.com) → New project
   - Rename the project to `Kaptar Email Triage`
   - Delete the default `Code.gs` content

3. **Create the script files**
   - For each `.gs` file in this repo, click `+` → Script and paste the contents
   - File names must match exactly (including capitalisation)

4. **Add your Sheet ID**
   - Open `Config.gs`
   - Paste your Sheet ID into line 12:
     ```javascript
     var SHEET_ID = 'your-sheet-id-here';
     ```

5. **Initialise Sheets**
   - In the editor, select function `initialiseSheets` from the dropdown
   - Click **Run**
   - Approve the OAuth permissions when prompted

6. **Run a test**
   - Select `runAnalysisOnTestEmails` and click **Run**
   - Open **View → Logs** — you should see 60 test results with >85% accuracy

7. **Install the trigger**
   - Select `createTimeTrigger` and click **Run**
   - This installs a 15-minute time-driven trigger for `processEmails`

The system is now live. It will process your Gmail inbox every 15 minutes.

---

## Configuration Reference

All configuration lives in `Config.gs`.

### Settings (`CONFIG` object)

| Setting | Default | Description |
|---|---|---|
| `MAX_EMAILS_PER_RUN` | `50` | Max threads per trigger run |
| `CONFIDENCE_THRESHOLD` | `0.8` | Min score to auto-create a draft |
| `LOOKBACK_HOURS` | `2` | How far back to search for new emails |
| `URGENT_SENTIMENT_THRESHOLD` | `-0.4` | Below this → Urgent label applied |
| `DRY_RUN` | `false` | `true` = analyse only, no drafts or labels |
| `PROCESSED_LABEL` | `Kaptar/Processed` | Label marking a thread as done |

### VIP Lists

```javascript
// Full email addresses
var VIP_EMAILS = [
  'ceo@bigcorporate.com',
  // add more...
];

// All senders from these domains are VIP
var VIP_DOMAINS = [
  'goldmember.com',
  // add more...
];
```

### Category Keywords

Each category in `CATEGORIES` has:
- `threshold` – minimum raw score to be considered a match
- `priority` – tie-breaking order (lower = wins ties)
- `keywords` – array of `{ term, weight }` pairs

To tune accuracy, increase `weight` for reliable high-signal terms or raise `threshold` to make a category harder to match.

---

## How It Works

### Processing Pipeline

```
Gmail Inbox
    │
    ▼
_fetchUnprocessedThreads()      Query: in:inbox, after:<lookback>, -label:Processed
    │
    ▼
_getLatestRelevantMessage()     Skip own-account messages; pick newest non-self message
    │
    ▼
analyzeEmail(message)           Analyzer.gs
    ├── _scoreAllCategories()   Keyword matching with weights → raw + normalised scores
    ├── _pickPrimary()          Highest scorer above threshold; tie-break by priority
    ├── _pickSecondary()        Second scorer at ≥60% of primary (multi-topic detection)
    ├── analyzeSentiment()      Token walk with negation + intensifier handling
    ├── detectVIP()             Email address + domain lookup
    └── _detectSarcasm()        Positive phrases + negative context heuristic
    │
    ▼
Apply Gmail labels              Processed, Category/*, VIP, Urgent, DraftCreated
    │
    ▼
createDraftReply()              If confidence ≥ 0.8 AND category ≠ SPAM
    │
    ▼
logToSheet()                    Append row to "Email Log" tab
    │
    ▼
updateDashboard()               Rewrite "Dashboard" tab with aggregated stats
```

### Confidence Scoring

The confidence score (0–1) for a category is calculated as:

```
raw_score     = sum of weights for all matched keywords
max_possible  = sum of all keyword weights in the category
normalised    = min(1, raw_score / (max_possible × 0.35))
```

The `0.35` denominator means a category needs to match ~35% of its maximum possible score to reach confidence 1.0. This was tuned on the 60-email test set to give practical confidence levels for real emails.

### Sentiment Analysis

Tokens are walked left-to-right. A **negation window** (3 tokens wide) flips the sign of any sentiment word that follows a negator (`not`, `don't`, etc.). **Intensifiers** (`very`, `extremely`, etc.) multiply the next sentiment word's score. The raw score is divided by `log(token_count)` to normalise for email length.

---

## Accuracy

Target: **>85%** on the 60-scenario test set.

Run `runAnalysisOnTestEmails()` to see the current accuracy table in the Apps Script Logger.

Factors that affect accuracy:
- **Short emails** – fewer keywords, lower confidence
- **Multi-topic emails** – correct category is the one with the highest score
- **Sarcasm** – heuristic is conservative; may miss subtle sarcasm
- **Non-English** – foreign-language emails are analysed in English keyword space; accuracy is lower

---

## Customisation

### Adding a new category

1. Add an entry to `CATEGORIES` in `Config.gs`
2. Add a template function to `Templates.gs` and update the `switch` in `getTemplate()`
3. Add test scenarios to `TestEmailGenerator.gs`

### Adjusting keyword weights

In `Config.gs`, increase a keyword's `weight` to make it a stronger signal. As a guide:
- Weight 3 = very strong signal (e.g. "invoice", "refund")
- Weight 2 = moderate signal (e.g. "charge", "payment")
- Weight 1 = weak signal (e.g. "cost", "price")

### Changing the trigger interval

Run `deleteTriggers()` to remove the existing trigger, then re-run `createTimeTrigger()` with a modified interval (edit the `everyMinutes()` call in `Code.gs`).

---

## Testing

### No-side-effect analysis

```javascript
// In the Apps Script editor, run:
runAnalysisOnTestEmails()   // All 60 scenarios, accuracy summary
runSingleScenario(0)        // Detailed output for scenario at index 0
testSingleEmail()           // Hard-coded billing dispute example
```

### Live inbox testing

```javascript
// ⚠ Sends 60 real emails to your own Gmail address
sendTestEmailsToSelf()
```

After running, wait for the next trigger fire (up to 15 minutes) or run `processEmails()` manually.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| "SHEET_ID is not configured" error | `SHEET_ID` left empty | Paste your Sheet ID into `Config.gs` line 12 |
| Emails processed twice | Trigger fired before first run finished | Check execution logs; increase `LOOKBACK_HOURS` |
| Low confidence scores | Email uses unusual vocabulary | Add domain-specific keywords to `Config.gs` |
| No drafts created | `DRY_RUN: true` or confidence < 0.8 | Set `DRY_RUN: false`; lower `CONFIDENCE_THRESHOLD` |
| Script exceeds 6-minute limit | Too many emails in backlog | Lower `MAX_EMAILS_PER_RUN` or run manually to clear backlog |
| Labels not created | Insufficient Gmail permissions | Re-run `initialiseSheets()` and re-approve OAuth |

---

## Limits and Quotas

| Resource | Limit | Notes |
|---|---|---|
| Apps Script execution time | 6 min/run | `MAX_EMAILS_PER_RUN: 50` stays well within this |
| Gmail API calls | 100/sec | Batched processing stays within limit |
| Sheets API calls | 100/100sec | One row per email + one dashboard refresh per run |
| Trigger frequency | 1/minute minimum | 15-minute interval recommended |
| Daily email sends (drafts) | 100/day (consumer), 1500/day (Workspace) | Drafts are created, not sent automatically |

---

## License

MIT — free to use, modify, and deploy.
