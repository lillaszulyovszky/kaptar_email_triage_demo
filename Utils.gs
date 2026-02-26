// ============================================
// UTILITY FUNCTIONS
// ============================================

function getOrCreateLabel(labelName) {
  try {
    let label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
      Logger.log(`Created label: ${labelName}`);
    }
    return label;
  } catch (e) {
    Logger.log(`Error with label ${labelName}: ${e.message}`);
    return null;
  }
}

function ensureLabelsExist() {
  Logger.log('Ensuring all labels exist...');
  
  for (const labelKey in CONFIG.labels) {
    const labelName = CONFIG.labels[labelKey];
    getOrCreateLabel(labelName);
  }
  
  Logger.log('All labels created/verified');
  
  try {
    SpreadsheetApp.getUi().alert('Labels created successfully!\n\nCheck Gmail sidebar to see all labels.');
  } catch (e) {}
}

function isInternalEmail(sender) {
  return CONFIG.internalDomains.some(domain => sender.includes(domain));
}

function isVIP(sender) {
  return CONFIG.vipSenders.some(vip => sender.includes(vip));
}

function logEmailAnalysis(message, analysis) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(CONFIG.emailLogSheet);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.emailLogSheet);
    logSheet.appendRow([
      'Timestamp',
      'From',
      'Subject',
      'Language',
      'Category',
      'Confidence',
      'Sentiment',
      'Method',
      'Draft Created',
      'Status'
    ]);
  }
  
  const draftCreated = (analysis.confidence >= CONFIG.confidenceThreshold && 
                        analysis.categoryName !== 'COMPLAINT') ? 'Yes ✓' : 'No ✗';
  
  const status = analysis.categoryName === 'COMPLAINT' ? 'Manual Review' : 
                 analysis.confidence < 0.6 ? 'Low Confidence' : 'Auto-Processed';
  
  logSheet.appendRow([
    new Date(),
    message.getFrom(),
    message.getSubject(),
    analysis.language ? analysis.language.toUpperCase() : 'N/A',
    analysis.categoryName,
    (analysis.confidence * 100).toFixed(1) + '%',
    analysis.sentiment || 'N/A',
    analysis.analysisMethod || 'N/A',
    draftCreated,
    status
  ]);
}
