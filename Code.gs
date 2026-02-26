// ============================================
// EMAIL TRIAGE SYSTEM V3 - MAIN CODE
// Safe Testing Version
// ============================================

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('🧪 Email Triage')
    .addItem('✅ Test Setup', 'testSetup')
    .addSeparator()
    .addItem('📧 Send 1 Test Email (SAFE)', 'sendSingleTestEmail')
    .addItem('📧 Send 6 Test Emails (SAFE)', 'generateSafeTestEmails')
    .addSeparator()
    .addItem('▶️ Process Emails', 'processUnreadEmails')
    .addItem('🏷️ Setup Labels', 'ensureLabelsExist')
    .addSeparator()
    .addItem('📊 Test Accuracy', 'testAccuracy')
    .addItem('📝 Draft Statistics', 'showDraftStatistics')
    .addToUi();
}

function testSetup() {
  Logger.log('Starting setup test...');
  
  try {
    Logger.log('Testing Gmail access...');
    const threads = GmailApp.search('is:unread', 0, 1);
    Logger.log('✓ Gmail works: ' + threads.length + ' unread emails found');
    
    Logger.log('Testing Sheet access...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = ss.getName();
    Logger.log('✓ Sheet works: ' + sheetName);
    
    Logger.log('Checking AI configuration...');
    if (AI_CONFIG && AI_CONFIG.geminiApiKey) {
      if (AI_CONFIG.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        Logger.log('⚠️ WARNING: Gemini API key not set yet');
        Logger.log('Get your free API key from: https://aistudio.google.com/app/apikey');
      } else {
        Logger.log('✓ Gemini API key is configured');
      }
    }
    
    Logger.log('\n✓✓✓ ALL TESTS PASSED ✓✓✓\n');
    
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '✓ Setup Successful!\n\n' +
        'Gmail: Working ✓\n' +
        'Sheet: ' + sheetName + ' ✓\n' +
        'AI Config: ' + (AI_CONFIG.geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE' ? 'Configured ✓' : 'Not yet set ⚠️') +
        '\n\nNext steps:\n' +
        '1. Set Gemini API key in Config.gs\n' +
        '2. Run "Setup Labels"\n' +
        '3. Send test email'
      );
    } catch (uiError) {
      Logger.log('Note: Could not show alert (no UI context)');
    }
    
    return 'Success!';
    
  } catch (e) {
    Logger.log('✗ ERROR: ' + e.message);
    try {
      SpreadsheetApp.getUi().alert('✗ Setup Failed:\n\n' + e.message);
    } catch (uiError) {}
    return 'Failed: ' + e.message;
  }
}

function processUnreadEmails() {
  Logger.log('Starting email processing...');
  
  try {
    // Search for unread emails from yourself (test emails)
    // IMPORTANT: Change this email to YOUR email address
    const threads = GmailApp.search('is:unread from:YOUR_EMAIL@gmail.com', 0, 10);
    
    Logger.log(`Found ${threads.length} unread emails from yourself to process`);
    
    if (threads.length === 0) {
      Logger.log('No emails to process');
      try {
        SpreadsheetApp.getActiveSpreadsheet().getUi().alert(
          'No unread emails found from yourself.\n\n' +
          'Make sure your test emails are:\n' +
          '1. Unread (bold in Gmail)\n' +
          '2. From: YOUR_EMAIL@gmail.com\n\n' +
          'Mark them as unread and try again.'
        );
      } catch (e) {}
      return;
    }
    
    let processed = 0;
    let errors = 0;
    
    ensureLabelsExist();
    
    threads.forEach(thread => {
      try {
        processThread(thread);
        processed++;
        Logger.log(`✓ Processed ${processed}/${threads.length}`);
      } catch (e) {
        Logger.log(`✗ Error processing thread: ${e.message}`);
        errors++;
      }
    });
    
    Logger.log(`\nProcessing complete. Processed: ${processed}, Errors: ${errors}`);
    
    try {
      SpreadsheetApp.getActiveSpreadsheet().getUi().alert(
        `Email Processing Complete!\n\n` +
        `Processed: ${processed}\n` +
        `Errors: ${errors}\n\n` +
        `Check Gmail for labels and drafts!`
      );
    } catch (e) {}
    
  } catch (e) {
    Logger.log(`Fatal error: ${e.message}`);
    Logger.log(`Stack trace: ${e.stack}`);
    try {
      SpreadsheetApp.getActiveSpreadsheet().getUi().alert(
        `Error: ${e.message}\n\nCheck View > Logs for details`
      );
    } catch (e2) {}
  }
}

function processThread(thread) {
  const messages = thread.getMessages();
  const latestMessage = messages[messages.length - 1];
  
  const sender = latestMessage.getFrom();
  const subject = latestMessage.getSubject();
  
  if (isInternalEmail(sender)) {
    thread.addLabel(getOrCreateLabel(CONFIG.labels.internal));
    thread.addLabel(getOrCreateLabel(CONFIG.labels.processed));
    Logger.log(`Skipped internal email from ${sender}`);
    return;
  }
  
  const analysis = analyzeEmailWithAI(latestMessage);
  
  if (!analysis) {
    Logger.log(`Failed to analyze: ${subject}`);
    return;
  }
  
  Logger.log(`[${analysis.analysisMethod}] [${analysis.language?.toUpperCase()}] ${subject} → ${analysis.categoryName} (${(analysis.confidence * 100).toFixed(0)}%)`);
  
  const categoryLabel = getOrCreateLabel(CATEGORIES[analysis.categoryName]?.label || analysis.categoryName);
  if (categoryLabel) thread.addLabel(categoryLabel);
  
  if (analysis.language === 'hu') {
    thread.addLabel(getOrCreateLabel(CONFIG.labels.hungarian));
  } else if (analysis.language === 'en') {
    thread.addLabel(getOrCreateLabel(CONFIG.labels.english));
  }
  
  if (analysis.isUrgent) {
    const urgentLabel = getOrCreateLabel(CONFIG.labels.urgent);
    if (urgentLabel) thread.addLabel(urgentLabel);
    thread.markImportant();
    thread.star();
  }
  
  if (isVIP(sender)) {
    const vipLabel = getOrCreateLabel(CONFIG.labels.vip);
    if (vipLabel) thread.addLabel(vipLabel);
    thread.markImportant();
    Logger.log(`VIP email detected from ${sender}`);
  }
  
  if (analysis.confidence >= CONFIG.confidenceThreshold && 
      analysis.categoryName !== 'COMPLAINT' &&
      analysis.categoryName !== 'SPAM') {
    
    try {
      const draftReply = generateDraftReply(latestMessage, analysis);
      
      if (draftReply) {
        thread.createDraftReply(draftReply);
        
        const draftLabel = getOrCreateLabel(CONFIG.labels.draftReady);
        if (draftLabel) thread.addLabel(draftLabel);
        
        Logger.log(`✓ Draft reply created [${analysis.language?.toUpperCase()}]`);
      }
    } catch (e) {
      Logger.log(`Failed to create draft: ${e.message}`);
    }
  }
  
  if (analysis.confidence < 0.6 || analysis.categoryName === 'COMPLAINT') {
    const reviewLabel = getOrCreateLabel(CONFIG.labels.needsReview);
    if (reviewLabel) thread.addLabel(reviewLabel);
  }
  
  logEmailAnalysis(latestMessage, analysis);
  
  const processedLabel = getOrCreateLabel(CONFIG.labels.processed);
  if (processedLabel) thread.addLabel(processedLabel);
}

function showDraftStatistics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(CONFIG.emailLogSheet);
    
    if (!logSheet) {
      SpreadsheetApp.getUi().alert('No email log found. Process emails first.');
      return;
    }
    
    const data = logSheet.getDataRange().getValues();
    
    let totalEmails = data.length - 1;
    let draftsCreated = 0;
    let hungarianDrafts = 0;
    let englishDrafts = 0;
    let manualReview = 0;
    
    for (let i = 1; i < data.length; i++) {
      const language = data[i][3];
      const draftCreated = data[i][8];
      const status = data[i][9];
      
      if (draftCreated === 'Yes ✓') {
        draftsCreated++;
        if (language.includes('HU')) hungarianDrafts++;
        if (language.includes('EN')) englishDrafts++;
      }
      
      if (status && status.includes('Manual Review')) {
        manualReview++;
      }
    }
    
    const draftRate = ((draftsCreated / totalEmails) * 100).toFixed(1);
    
    SpreadsheetApp.getUi().alert(
      `📊 Draft Reply Statistics\n\n` +
      `Total Emails Processed: ${totalEmails}\n` +
      `Drafts Created: ${draftsCreated} (${draftRate}%)\n` +
      `  └─ Hungarian: ${hungarianDrafts}\n` +
      `  └─ English: ${englishDrafts}\n\n` +
      `Requires Manual Review: ${manualReview}\n\n` +
      `Time Saved: ~${(draftsCreated * 3).toFixed(0)} minutes\n` +
      `(3 min per manual reply avoided)`
    );
    
  } catch (e) {
    Logger.log(`Error showing draft stats: ${e.message}`);
    SpreadsheetApp.getUi().alert(`Error: ${e.message}`);
  }
}
