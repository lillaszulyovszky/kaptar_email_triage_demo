// ============================================
// ACCURACY TESTING
// ============================================

function testAccuracy() {
  Logger.log('Starting accuracy test...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let testSheet = ss.getSheetByName('Accuracy Test');
  
  if (!testSheet) {
    testSheet = ss.insertSheet('Accuracy Test');
    testSheet.appendRow([
      'Subject',
      'Language',
      'Expected Category',
      'AI Category',
      'Confidence',
      'Correct?',
      'Method'
    ]);
  } else {
    testSheet.clear();
    testSheet.appendRow([
      'Subject',
      'Language',
      'Expected Category',
      'AI Category',
      'Confidence',
      'Correct?',
      'Method'
    ]);
  }
  
  let correct = 0;
  let total = 0;
  
  // Test first 10 emails (mix of HU and EN)
  const testSet = TEST_EMAILS.slice(0, 10);
  
  testSet.forEach(testEmail => {
    // Create a mock message object
    const mockMessage = {
      getSubject: () => testEmail.subject,
      getPlainBody: () => testEmail.body,
      getFrom: () => testEmail.from
    };
    
    const analysis = analyzeEmailWithAI(mockMessage);
    const isCorrect = analysis.categoryName === testEmail.expectedCategory;
    
    testSheet.appendRow([
      testEmail.subject,
      testEmail.language.toUpperCase(),
      testEmail.expectedCategory,
      analysis.categoryName,
      (analysis.confidence * 100).toFixed(1) + '%',
      isCorrect ? '✓' : '✗',
      analysis.analysisMethod
    ]);
    
    if (isCorrect) correct++;
    total++;
  });
  
  const accuracy = ((correct / total) * 100).toFixed(1);
  
  testSheet.appendRow([]);
  testSheet.appendRow(['ACCURACY:', '', '', '', '', `${correct}/${total} = ${accuracy}%`]);
  
  Logger.log(`Accuracy test complete: ${accuracy}%`);
  
  try {
    SpreadsheetApp.getUi().alert(
      `Accuracy Test Complete!\n\n` +
      `Correct: ${correct}/${total}\n` +
      `Accuracy: ${accuracy}%\n\n` +
      `Check the "Accuracy Test" sheet for details.`
    );
  } catch (e) {}
}

function createConfusionMatrix() {
  // Advanced: Create confusion matrix for detailed analysis
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CONFIG.emailLogSheet);
  
  if (!logSheet) {
    Logger.log('No email log found');
    return;
  }
  
  // Implementation left as exercise - would analyze all logged emails
  // and create a matrix showing predicted vs actual categories
  Logger.log('Confusion matrix creation not yet implemented');
}
