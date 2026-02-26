# 📋 Complete Setup Guide

## ⚠️ Before You Start

**You'll need:**
1. Google account
2. 30 minutes of time
3. Gemini API key (get it free: https://aistudio.google.com/app/apikey)

## 🔧 Step-by-Step Setup

### STEP 1: Get Gemini API Key (5 min)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)
5. **Keep this safe** - you'll need it in Step 5

### STEP 2: Create Google Sheet (2 min)

1. Go to: https://sheets.google.com
2. Click "+ Blank" to create new spreadsheet
3. Name it: "Email Triage System"
4. Leave it open (you'll come back here)

### STEP 3: Open Apps Script Editor (1 min)

1. In your Google Sheet, click: **Extensions** > **Apps Script**
2. You'll see a new tab with code editor
3. Delete the default `function myFunction()` code
4. Leave this tab open

### STEP 4: Add All 8 Files (15 min)

**For each file, follow these steps:**

#### File 1: Code.gs

1. In Apps Script, click the **+** next to "Files"
2. Choose "**Script**"
3. Name it: **Code**
4. Copy the entire content from `Code.gs` in this repo
5. Paste into the editor
6. Press Ctrl+S (or Cmd+S) to save

#### File 2: Config.gs

1. Click **+** next to "Files" again
2. Choose "**Script**"
3. Name it: **Config**
4. Copy and paste content from `Config.gs`
5. Save (Ctrl+S)

#### Repeat for remaining files:
- **EmailAnalysis** (from EmailAnalysis.gs)
- **EmailGenerator** (from EmailGenerator.gs)
- **Templates** (from Templates.gs)
- **Utils** (from Utils.gs)
- **AccuracyTesting** (from AccuracyTesting.gs)

#### Special: appsscript.json

1. Click ⚙️ **Project Settings** (left sidebar)
2. Check the box: "**Show appsscript.json manifest file in editor**"
3. Click **< Editor** (back arrow) at top
4. Now click **appsscript.json** in files list
5. Delete everything in the file
6. Copy and paste content from `appsscript.json`
7. Save

### STEP 5: Configure API Key and Email (5 min)

#### Set Gemini API Key:

1. Open **Config.gs** file
2. Find line 41: `geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE',`
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
4. Should look like: `geminiApiKey: 'AIzaSyABC123...XYZ',`
5. Save (Ctrl+S)

#### Set Your Email (3 places):

**Place 1 - Code.gs (line 67):**
- Find: `from:YOUR_EMAIL@gmail.com`
- Replace with: `from:your.actual.email@gmail.com`

**Place 2 - EmailGenerator.gs sendSingleTestEmail (line 2):**
- Find: `const targetEmail = 'YOUR_EMAIL@gmail.com';`
- Replace with: `const targetEmail = 'your.actual.email@gmail.com';`

**Place 3 - EmailGenerator.gs generateSafeTestEmails (line 2):**
- Find: `const targetEmail = 'YOUR_EMAIL@gmail.com';`
- Replace with: `const targetEmail = 'your.actual.email@gmail.com';`

Save all files!

### STEP 6: Authorize the Script (3 min)

1. In Apps Script, click the **dropdown** next to "Run" (top toolbar)
2. Select **testSetup**
3. Click **Run** (▶️ button)
4. A popup appears: "**Authorization required**"
5. Click **Review permissions**
6. Choose your Google account
7. Click **Advanced** (bottom left)
8. Click **Go to Email Triage System (unsafe)**
9. Click **Allow**
10. Wait for execution to complete

### STEP 7: Go Back to Google Sheet (1 min)

1. **Close the Apps Script tab**
2. **Return to your Google Sheet**
3. **Refresh the page** (F5 or Cmd+R)
4. You should now see a new menu: **🧪 Email Triage**

### STEP 8: Run Setup (2 min)

1. Click: **🧪 Email Triage** > **✅ Test Setup**
2. Should show: "✓ Setup Successful!"
3. If API key not set, it will warn you
4. Click: **🧪 Email Triage** > **🏷️ Setup Labels**
5. Should say: "Labels created successfully!"

### STEP 9: Test with 1 Email (5 min)

1. Click: **🧪 Email Triage** > **📧 Send 1 Test Email (SAFE)**
2. Click "Yes" to confirm
3. **Wait 1 minute**
4. Go to Gmail and check inbox - you should see a test email
5. Mark it as **unread** (if it's not already)
6. Go back to Google Sheet
7. Click: **🧪 Email Triage** > **▶️ Process Emails**
8. Should say: "Processing Complete! Processed: 1"

### STEP 10: Verify Results (2 min)

**Check Gmail:**
1. Open the test email
2. Should have labels: 💰 Számlázás / Billing, 🇭🇺 Magyar, etc.
3. Scroll down - should see a draft reply in Hungarian

**Check Google Sheet:**
1. You should see a new tab: "Email Log"
2. Should have 1 row with email data

**If everything works: You're done! 🎉**

## ✅ Success Checklist

After setup, you should have:

- [ ] All 8 files in Apps Script
- [ ] Gemini API key set in Config.gs
- [ ] Your email set in 3 places
- [ ] Custom menu "🧪 Email Triage" in Google Sheet
- [ ] Gmail labels created (visible in Gmail sidebar)
- [ ] 1 test email processed with label and draft
- [ ] "Email Log" sheet with 1 row of data

## 🧪 Optional: Full Test (10 min)

1. Click: **🧪 Email Triage** > **📧 Send 6 Test Emails (SAFE)**
2. Wait 2 minutes (emails send with 15-sec delays)
3. Click: **🧪 Email Triage** > **▶️ Process Emails**
4. Should process all 6 emails
5. Check Gmail - all should have labels and drafts
6. Click: **🧪 Email Triage** > **📊 Test Accuracy**
7. Should show 90%+ accuracy
8. Click: **🧪 Email Triage** > **📝 Draft Statistics**
9. Should show statistics on draft creation

## ❌ Troubleshooting

### "Email Not Configured" error
- You didn't replace `YOUR_EMAIL@gmail.com` in EmailGenerator.gs
- Check lines 2 in both functions

### "AI not configured" error
- You didn't replace `YOUR_GEMINI_API_KEY_HERE` in Config.gs
- Or API key is invalid - get new one from: https://aistudio.google.com/app/apikey

### "Found 0 emails to process"
- Test emails are not unread - mark them as unread in Gmail
- Or email filter in Code.gs doesn't match your email

### Character encoding issues (�� symbols)
- This was fixed in the latest version
- Make sure you copied the updated EmailGenerator.gs

## 🎓 Next Steps

**After successful setup:**

1. **Take screenshots** for your portfolio
2. **Test with different email types**
3. **Show the system to potential employers**
4. **Add to your GitHub** (already done!)
5. **Include in CV/applications**

## 📞 Support

If you get stuck:
1. Check View > Logs in Apps Script for error messages
2. Re-read the relevant section above
3. Make sure all files are saved
4. Try refreshing the Google Sheet
