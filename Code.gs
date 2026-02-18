/**
 * Code.gs
 * Main orchestration logic for the Kaptar Email Triage System.
 *
 * Entry points:
 *   processEmails()          – Main trigger function. Wire this to a
 *                              time-driven trigger (every 15–30 minutes).
 *   runManualTriage()        – Run manually from the Apps Script editor.
 *   initialiseSheets()       – One-time setup: creates sheet tabs + headers.
 *   testSingleEmail()        – Analyse a hard-coded test email (no side effects).
 *   resetProcessedLabel()    – Clears the "Processed" label so emails are
 *                              re-triaged (useful during development).
 */

// ---------------------------------------------------------------------------
// MAIN TRIGGER FUNCTION
// ---------------------------------------------------------------------------

/**
 * processEmails()
 *
 * Called by a time-driven trigger. Fetches unprocessed emails from Gmail,
 * analyses each one, applies labels, optionally creates draft replies,
 * and logs every result to Google Sheets.
 *
 * Design decisions:
 *   - We mark a thread as processed by applying CONFIG.PROCESSED_LABEL so the
 *     next run skips it. This avoids duplicate processing without a database.
 *   - We cap processing at CONFIG.MAX_EMAILS_PER_RUN to stay within Apps
 *     Script's 6-minute execution limit.
 *   - All sheet writes are batched after processing to reduce Sheets API calls.
 */
function processEmails() {
  Logger.log('=== Kaptar Email Triage: processEmails() started ===');

  var startTime = Date.now();
  var results   = [];

  try {
    var threads = _fetchUnprocessedThreads();
    Logger.log('Found ' + threads.length + ' unprocessed thread(s).');

    if (threads.length === 0) {
      Logger.log('Nothing to process. Exiting.');
      return;
    }

    threads.forEach(function(thread) {
      // Safety valve: stop if we've used > 5 minutes (Apps Script limit is 6)
      if (Date.now() - startTime > 300000) {
        Logger.log('Approaching execution time limit – stopping early.');
        return;
      }

      try {
        var result = _processThread(thread);
        if (result) results.push(result);
      } catch (e) {
        Logger.log('[Code] Error processing thread ' + thread.getId() + ': ' + e.message);
      }
    });

    // Write all results to Sheets
    results.forEach(function(r) {
      logToSheet(r);
    });

    // Refresh dashboard once after the batch
    updateDashboard();

    Logger.log('=== Triage complete. Processed: ' + results.length +
               ' | Elapsed: ' + Math.round((Date.now() - startTime) / 1000) + 's ===');

  } catch (e) {
    Logger.log('[Code] Fatal error in processEmails(): ' + e.message);
    Logger.log(e.stack);
  }
}

// ---------------------------------------------------------------------------
// THREAD PROCESSOR
// ---------------------------------------------------------------------------

/**
 * Processes a single Gmail thread.
 *
 * @param {GmailThread} thread
 * @returns {Object|null}  Log record, or null if the thread was skipped.
 */
function _processThread(thread) {
  var threadId  = thread.getId();
  var messages  = thread.getMessages();

  // Analyse only the latest unread message to avoid duplicate processing
  // of long reply chains. For new threads, this is the first (only) message.
  var message   = _getLatestRelevantMessage(messages);
  if (!message) {
    Logger.log('[Code] Thread ' + threadId + ' has no relevant message – skipping.');
    return null;
  }

  Logger.log('[Code] Processing thread: ' + threadId + ' | "' + message.getSubject() + '"');

  // ------------------------------------------------------------------
  // 1. ANALYSE
  // ------------------------------------------------------------------
  var analysis = analyzeEmail(message);

  Logger.log('[Code] Category: ' + analysis.category +
             ' (' + (analysis.confidence * 100).toFixed(0) + '%) | ' +
             'Sentiment: ' + analysis.sentimentLabel +
             ' (' + analysis.sentiment + ') | ' +
             'VIP: ' + analysis.isVIP + ' | Urgent: ' + analysis.isUrgent);

  // ------------------------------------------------------------------
  // 2. APPLY LABELS
  // ------------------------------------------------------------------
  var appliedLabels = [];

  // Always: processed label (prevents re-processing)
  applyLabel(thread, CONFIG.PROCESSED_LABEL);
  appliedLabels.push(CONFIG.PROCESSED_LABEL);

  // Category label
  applyCategoryLabel(thread, analysis.category);
  appliedLabels.push('Kaptar/Category/' + analysis.category);

  // VIP label
  if (analysis.isVIP) {
    applyLabel(thread, CONFIG.VIP_LABEL);
    appliedLabels.push(CONFIG.VIP_LABEL);
  }

  // Urgent label (complaints + very negative sentiment)
  if (analysis.isUrgent) {
    applyLabel(thread, CONFIG.URGENT_LABEL);
    appliedLabels.push(CONFIG.URGENT_LABEL);
  }

  // ------------------------------------------------------------------
  // 3. STAR VIP AND URGENT THREADS
  // ------------------------------------------------------------------
  if (analysis.isVIP || analysis.isUrgent) {
    try {
      message.star();
    } catch (e) {
      Logger.log('[Code] Could not star message: ' + e.message);
    }
  }

  // ------------------------------------------------------------------
  // 4. AUTO-DRAFT REPLY (high-confidence, non-spam)
  // ------------------------------------------------------------------
  var draftCreated = false;

  if (analysis.confidence >= CONFIG.CONFIDENCE_THRESHOLD &&
      analysis.category !== 'SPAM' &&
      !CONFIG.DRY_RUN) {

    var template = getTemplate(analysis.category, analysis);
    if (template) {
      draftCreated = createDraftReply(thread, template.subject, template.body);
      if (draftCreated) {
        applyLabel(thread, CONFIG.DRAFT_CREATED_LABEL);
        appliedLabels.push(CONFIG.DRAFT_CREATED_LABEL);
        Logger.log('[Code] Draft reply created for thread ' + threadId);
      }
    }
  } else {
    Logger.log('[Code] Skipping draft: confidence=' + analysis.confidence.toFixed(2) +
               ', category=' + analysis.category);
  }

  // ------------------------------------------------------------------
  // 5. BUILD LOG RECORD
  // ------------------------------------------------------------------
  return {
    timestamp:         new Date(),
    threadId:          threadId,
    messageId:         message.getId(),
    subject:           analysis.subject,
    from:              analysis.from,
    category:          analysis.category,
    confidence:        analysis.confidence,
    secondaryCategory: analysis.secondaryCategory,
    sentiment:         analysis.sentiment,
    sentimentLabel:    analysis.sentimentLabel,
    isVIP:             analysis.isVIP,
    isUrgent:          analysis.isUrgent,
    isSarcastic:       analysis.isSarcastic,
    language:          analysis.language,
    draftCreated:      draftCreated,
    labels:            appliedLabels.join(', '),
    wordCount:         analysis.wordCount,
    bodySnippet:       analysis.bodySnippet,
  };
}

// ---------------------------------------------------------------------------
// EMAIL FETCHING
// ---------------------------------------------------------------------------

/**
 * Returns unprocessed Gmail threads within the configured lookback window.
 *
 * A thread is "unprocessed" if it does NOT have the processed label.
 * We query Gmail directly rather than fetching all threads to stay efficient.
 */
function _fetchUnprocessedThreads() {
  var dateQuery   = getSearchDateQuery(CONFIG.LOOKBACK_HOURS);
  var labelQuery  = '-label:' + CONFIG.PROCESSED_LABEL.replace(/\//g, '-');
  var inboxQuery  = 'in:inbox';
  var query       = [inboxQuery, dateQuery, labelQuery].join(' ');

  Logger.log('[Code] Gmail query: ' + query);

  try {
    var threads = GmailApp.search(query, 0, CONFIG.MAX_EMAILS_PER_RUN);
    return threads;
  } catch (e) {
    Logger.log('[Code] Gmail search failed: ' + e.message);
    return [];
  }
}

/**
 * Returns the most relevant (latest, preferably unread) message in a thread.
 * Skips messages sent by the account itself to avoid triaging own drafts.
 */
function _getLatestRelevantMessage(messages) {
  var ownEmail = Session.getActiveUser().getEmail().toLowerCase();

  // Walk backwards (newest first) to find the first non-self message
  for (var i = messages.length - 1; i >= 0; i--) {
    var msg  = messages[i];
    var from = msg.getFrom().toLowerCase();
    if (from.indexOf(ownEmail) === -1) {
      return msg;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// MANUAL / UTILITY ENTRY POINTS
// ---------------------------------------------------------------------------

/**
 * runManualTriage()
 *
 * Identical to processEmails() but with verbose console output.
 * Run from the Apps Script editor (Run → runManualTriage) for ad-hoc triage.
 */
function runManualTriage() {
  Logger.log('>>> Manual triage started <<<');
  processEmails();
  Logger.log('>>> Manual triage finished <<<');
}

/**
 * initialiseSheets()
 *
 * One-time setup function. Creates the "Email Log" and "Dashboard" sheet tabs
 * with correct headers. Safe to run multiple times (idempotent).
 *
 * Run from the editor once after pasting your SHEET_ID into Config.gs.
 */
function initialiseSheets() {
  if (!SHEET_ID) {
    throw new Error('SHEET_ID is not set in Config.gs. Please add your Google Sheet ID first.');
  }

  Logger.log('[Code] Initialising Google Sheets...');

  var ss = SpreadsheetApp.openById(SHEET_ID);

  // Create / verify Email Log tab
  var logSheet = _getOrCreateSheet(ss, CONFIG.SHEETS.LOG);
  if (logSheet.getLastRow() === 0) {
    _writeLogHeaders(logSheet); // defined in Utils.gs
    Logger.log('[Code] Email Log headers written.');
  } else {
    Logger.log('[Code] Email Log already has data – headers not overwritten.');
  }

  // Create / verify Dashboard tab
  _getOrCreateSheet(ss, CONFIG.SHEETS.DASHBOARD);

  // Run an empty dashboard update to paint the structure
  updateDashboard();

  Logger.log('[Code] Sheet initialisation complete.');
}

/**
 * testSingleEmail()
 *
 * Analyses a hard-coded example email and prints results to the Logger.
 * No emails are sent, no drafts created, no sheets written.
 * Use this to verify the analyser is working correctly.
 */
function testSingleEmail() {
  // Simulate a GmailMessage object with the minimum required methods
  var mockMessage = {
    getFrom:    function() { return 'John Doe <john.doe@enterprise.com>'; },
    getSubject: function() { return 'Invoice #2045 – possible error'; },
    getBody:    function() {
      return '<p>Hi,</p><p>I noticed that my invoice #2045 from last month includes ' +
             'a charge of €120 for a conference room booking on 5th June, but I ' +
             'never made that reservation. Could you please look into this and ' +
             'issue a refund if applicable? I have attached the original invoice.</p>' +
             '<p>Thanks, John</p>';
    },
  };

  Logger.log('--- testSingleEmail() ---');
  var result = analyzeEmail(mockMessage);
  Logger.log('Category:    ' + result.category);
  Logger.log('Confidence:  ' + (result.confidence * 100).toFixed(1) + '%');
  Logger.log('Secondary:   ' + (result.secondaryCategory || 'none'));
  Logger.log('Sentiment:   ' + result.sentiment + ' (' + result.sentimentLabel + ')');
  Logger.log('VIP:         ' + result.isVIP);
  Logger.log('Urgent:      ' + result.isUrgent);
  Logger.log('Sarcastic:   ' + result.isSarcastic);
  Logger.log('Language:    ' + result.language);
  Logger.log('Word count:  ' + result.wordCount);
  Logger.log('All scores:  ' + safeJson(result.allScores));
}

/**
 * resetProcessedLabel()
 *
 * Removes the CONFIG.PROCESSED_LABEL from all threads so they can be
 * re-triaged. Useful during development / testing.
 *
 * WARNING: This will re-process and potentially re-draft ALL inbox emails
 *          on the next trigger run. Use with caution in production.
 */
function resetProcessedLabel() {
  var label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    Logger.log('[Code] Label "' + CONFIG.PROCESSED_LABEL + '" does not exist – nothing to reset.');
    return;
  }

  var threads = label.getThreads();
  Logger.log('[Code] Removing processed label from ' + threads.length + ' thread(s)...');
  threads.forEach(function(thread) {
    thread.removeLabel(label);
  });
  Logger.log('[Code] Reset complete.');
}

/**
 * createTimeTrigger()
 *
 * Installs a time-driven trigger to run processEmails() every 15 minutes.
 * Run this once from the editor after deployment.
 * Skips creation if a trigger for processEmails already exists.
 */
function createTimeTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var exists   = triggers.some(function(t) {
    return t.getHandlerFunction() === 'processEmails';
  });

  if (exists) {
    Logger.log('[Code] Trigger for processEmails() already exists.');
    return;
  }

  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log('[Code] Time-driven trigger created: processEmails() every 15 minutes.');
}

/**
 * deleteTriggers()
 *
 * Removes all project triggers. Run before re-deploying to avoid duplicates.
 */
function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });
  Logger.log('[Code] Deleted ' + triggers.length + ' trigger(s).');
}
