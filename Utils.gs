/**
 * Utils.gs
 * Shared utility functions for the Kaptar Email Triage System.
 *
 * Covers:
 *   - Google Sheets logging (Email Log tab)
 *   - Dashboard statistics update
 *   - Gmail draft creation
 *   - Gmail label management
 *   - HTML stripping
 *   - Date/time formatting
 *   - Sheet initialisation (creates headers on first run)
 */

// ---------------------------------------------------------------------------
// SHEET LOGGING
// ---------------------------------------------------------------------------

/**
 * Logs a processed email record to the "Email Log" sheet.
 * Creates the sheet and header row on first use.
 *
 * @param {Object} record  Object with the following fields:
 *   timestamp, threadId, messageId, subject, from, category,
 *   confidence, secondaryCategory, sentiment, sentimentLabel,
 *   isVIP, isUrgent, isSarcastic, language, draftCreated,
 *   labels, wordCount, bodySnippet
 */
function logToSheet(record) {
  if (!SHEET_ID) {
    Logger.log('[Utils] SHEET_ID is not configured – skipping sheet log.');
    return;
  }

  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = _getOrCreateSheet(ss, CONFIG.SHEETS.LOG);

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      _writeLogHeaders(sheet);
    }

    sheet.appendRow([
      record.timestamp       || new Date(),
      record.threadId        || '',
      record.messageId       || '',
      record.subject         || '',
      record.from            || '',
      record.category        || '',
      record.confidence      || 0,
      record.secondaryCategory || '',
      record.sentiment       || 0,
      record.sentimentLabel  || '',
      record.isVIP           ? 'Yes' : 'No',
      record.isUrgent        ? 'Yes' : 'No',
      record.isSarcastic     ? 'Yes' : 'No',
      record.language        || 'en',
      record.draftCreated    ? 'Yes' : 'No',
      record.labels          || '',
      record.wordCount       || 0,
      record.bodySnippet     || '',
    ]);
  } catch (e) {
    Logger.log('[Utils] Failed to log to sheet: ' + e.message);
  }
}

/** Column headers for the Email Log sheet. */
function _writeLogHeaders(sheet) {
  var headers = [
    'Timestamp',
    'Thread ID',
    'Message ID',
    'Subject',
    'From',
    'Category',
    'Confidence',
    'Secondary Category',
    'Sentiment Score',
    'Sentiment Label',
    'VIP',
    'Urgent',
    'Sarcastic',
    'Language',
    'Draft Created',
    'Labels Applied',
    'Word Count',
    'Body Snippet',
  ];
  sheet.appendRow(headers);

  // Style the header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2c2c2c');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // Set column widths for readability
  sheet.setColumnWidth(1,  160); // Timestamp
  sheet.setColumnWidth(4,  260); // Subject
  sheet.setColumnWidth(5,  200); // From
  sheet.setColumnWidth(6,  120); // Category
  sheet.setColumnWidth(18, 300); // Body Snippet
}

// ---------------------------------------------------------------------------
// DASHBOARD UPDATE
// ---------------------------------------------------------------------------

/**
 * Refreshes the Dashboard sheet with aggregated statistics.
 * Reads all rows from the Email Log and recalculates metrics.
 * Safe to call after every batch – it rewrites the stats block.
 */
function updateDashboard() {
  if (!SHEET_ID) return;

  try {
    var ss        = SpreadsheetApp.openById(SHEET_ID);
    var logSheet  = _getOrCreateSheet(ss, CONFIG.SHEETS.LOG);
    var dashSheet = _getOrCreateSheet(ss, CONFIG.SHEETS.DASHBOARD);

    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('[Utils] No email log data to summarise yet.');
      return;
    }

    // Column indices (0-based), matching _writeLogHeaders order
    var COL = {
      timestamp:  0,
      category:   5,
      confidence: 6,
      sentiment:  8,
      isVIP:      10,
      isUrgent:   11,
      draft:      14,
    };

    var rows = data.slice(1); // Skip header

    // Aggregate
    var stats = {
      total:         rows.length,
      byCategory:    {},
      avgConfidence: 0,
      avgSentiment:  0,
      vipCount:      0,
      urgentCount:   0,
      draftCount:    0,
      today:         0,
    };

    var today     = new Date();
    var todayStr  = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var confSum   = 0;
    var sentSum   = 0;

    rows.forEach(function(row) {
      var cat  = row[COL.category]  || 'UNKNOWN';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

      confSum  += Number(row[COL.confidence]) || 0;
      sentSum  += Number(row[COL.sentiment])  || 0;

      if (row[COL.isVIP]    === 'Yes') stats.vipCount++;
      if (row[COL.isUrgent] === 'Yes') stats.urgentCount++;
      if (row[COL.draft]    === 'Yes') stats.draftCount++;

      var rowDate = row[COL.timestamp] instanceof Date
        ? Utilities.formatDate(row[COL.timestamp], Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : String(row[COL.timestamp]).substring(0, 10);
      if (rowDate === todayStr) stats.today++;
    });

    stats.avgConfidence = stats.total > 0
      ? Math.round((confSum / stats.total) * 100) / 100 : 0;
    stats.avgSentiment  = stats.total > 0
      ? Math.round((sentSum / stats.total) * 100) / 100 : 0;

    // Write to dashboard
    dashSheet.clearContents();

    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var summaryData = [
      ['KAPTAR EMAIL TRIAGE — DASHBOARD', '', ''],
      ['Last updated:', now, ''],
      ['', '', ''],
      ['OVERVIEW', '', ''],
      ['Total emails processed', stats.total, ''],
      ['Emails today', stats.today, ''],
      ['Avg. confidence', stats.avgConfidence, ''],
      ['Avg. sentiment', stats.avgSentiment, ''],
      ['VIP emails', stats.vipCount, ''],
      ['Urgent emails', stats.urgentCount, ''],
      ['Auto-drafts created', stats.draftCount, ''],
      ['', '', ''],
      ['BY CATEGORY', 'Count', '% of Total'],
    ];

    var categoryOrder = ['BILLING', 'BOOKING', 'COMPLAINT', 'INFO_REQUEST', 'MEMBERSHIP', 'SPAM'];
    categoryOrder.forEach(function(cat) {
      var count = stats.byCategory[cat] || 0;
      var pct   = stats.total > 0 ? Math.round((count / stats.total) * 1000) / 10 : 0;
      summaryData.push([cat, count, pct + '%']);
    });

    // Any unlisted categories
    Object.keys(stats.byCategory).forEach(function(cat) {
      if (categoryOrder.indexOf(cat) === -1) {
        var count = stats.byCategory[cat];
        var pct   = stats.total > 0 ? Math.round((count / stats.total) * 1000) / 10 : 0;
        summaryData.push([cat, count, pct + '%']);
      }
    });

    dashSheet.getRange(1, 1, summaryData.length, 3).setValues(summaryData);

    // Basic formatting
    dashSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    dashSheet.getRange(4, 1).setFontWeight('bold');
    dashSheet.getRange(13, 1, 1, 3).setFontWeight('bold').setBackground('#e8e8e8');
    dashSheet.setColumnWidth(1, 220);
    dashSheet.setColumnWidth(2, 100);
    dashSheet.setColumnWidth(3, 100);

    Logger.log('[Utils] Dashboard updated. Total rows: ' + stats.total);

  } catch (e) {
    Logger.log('[Utils] Failed to update dashboard: ' + e.message);
  }
}

// ---------------------------------------------------------------------------
// GMAIL DRAFT CREATION
// ---------------------------------------------------------------------------

/**
 * Creates a Gmail draft reply on the given thread.
 *
 * @param {GmailThread} thread      The Gmail thread to reply to.
 * @param {string}      subject     Draft subject line.
 * @param {string}      htmlBody    HTML body for the draft.
 * @returns {boolean}  true if draft was created, false otherwise.
 */
function createDraftReply(thread, subject, htmlBody) {
  if (CONFIG.DRY_RUN) {
    Logger.log('[Utils] DRY_RUN mode: would have created draft for thread ' + thread.getId());
    return false;
  }

  try {
    thread.createDraftReply(
      '', // Plain text (empty — we provide HTML)
      { htmlBody: htmlBody, subject: subject }
    );
    return true;
  } catch (e) {
    Logger.log('[Utils] Failed to create draft: ' + e.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// GMAIL LABEL MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Applies a Gmail label to a thread, creating the label if it doesn't exist.
 *
 * @param {GmailThread} thread     The thread to label.
 * @param {string}      labelName  Full label name, e.g. "Kaptar/VIP".
 */
function applyLabel(thread, labelName) {
  try {
    var label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
      Logger.log('[Utils] Created new label: ' + labelName);
    }
    thread.addLabel(label);
  } catch (e) {
    Logger.log('[Utils] Failed to apply label "' + labelName + '": ' + e.message);
  }
}

/**
 * Applies the category label (e.g. "Kaptar/Category/BILLING") to a thread.
 */
function applyCategoryLabel(thread, category) {
  applyLabel(thread, 'Kaptar/Category/' + category);
}

// ---------------------------------------------------------------------------
// HTML STRIPPING
// ---------------------------------------------------------------------------

/**
 * Converts an HTML email body to plain text.
 * Preserves line breaks from block elements.
 *
 * @param {string} html  Raw HTML string.
 * @returns {string}  Plain text.
 */
function stripHtml(html) {
  if (!html) return '';

  return html
    // Replace block-level closing tags with newline
    .replace(/<\/(p|div|li|tr|br|h[1-6]|blockquote)>/gi, '\n')
    // Replace <br> tags
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// DATE / TIME HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns a formatted timestamp string in the script's timezone.
 * @param {Date} [date]  Defaults to now.
 * @returns {string}  e.g. "2024-06-15 14:32:07"
 */
function formatTimestamp(date) {
  return Utilities.formatDate(
    date || new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );
}

/**
 * Returns a Gmail search date string "after:YYYY/MM/DD" for N hours ago.
 * Used to limit the email fetch window.
 */
function getSearchDateQuery(hoursBack) {
  var cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  var formatted = Utilities.formatDate(cutoff, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  return 'after:' + formatted;
}

// ---------------------------------------------------------------------------
// SHEET HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns a sheet by name, creating it if it doesn't exist.
 */
function _getOrCreateSheet(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log('[Utils] Created sheet tab: ' + sheetName);
  }
  return sheet;
}

// ---------------------------------------------------------------------------
// MISC UTILITIES
// ---------------------------------------------------------------------------

/**
 * Safe JSON stringify — returns a string even if the object is circular.
 */
function safeJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

/**
 * Truncates a string to maxLen characters, appending '…' if truncated.
 */
function truncate(str, maxLen) {
  if (!str) return '';
  maxLen = maxLen || 100;
  return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str;
}

/**
 * Returns true if the value is a non-empty string.
 */
function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}
