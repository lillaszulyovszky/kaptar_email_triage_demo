// ============================================
// SAFE TEST EMAIL GENERATION
// ============================================

const TEST_EMAILS = [
  // Hungarian - Billing (3)
  {
    subject: 'Kérdés a számlával kapcsolatban',
    body: 'Szia! Megkaptam a #2026-123-as számlát, de már múlt héten kifizettem banki átutalással. Tudnátok ellenőrizni a státuszát? Köszönöm szépen!',
    from: 'tamas.kovacs@example.hu',
    language: 'hu',
    expectedCategory: 'BILLING'
  },
  {
    subject: 'Nyugta kérés',
    body: 'Jó napot! Kérnék egy hivatalos számlát a múlt havi tagsági díjról. Az adószámom: 12345678-1-42. Köszönöm!',
    from: 'eva.nagy@example.hu',
    language: 'hu',
    expectedCategory: 'BILLING'
  },
  {
    subject: 'Díj visszatérítés',
    body: 'Szia! Tévedésből kétszer fizettem be a havi díjat. Tudnátok visszautalni az egyik összeget? Köszönöm!',
    from: 'peter.szabo@example.hu',
    language: 'hu',
    expectedCategory: 'BILLING'
  },
  
  // Hungarian - Booking (3)
  {
    subject: 'Tárgyaló foglalás holnapra',
    body: 'Szia! Szeretném a nagy tárgyalót foglalni holnap délutánra 14:00-16:00 között. 8 fő leszünk. Elérhető? Köszönöm!',
    from: 'anna.horvath@example.hu',
    language: 'hu',
    expectedCategory: 'BOOKING'
  },
  {
    subject: 'Hot desk foglalás',
    body: 'Jó napot! Szeretnék egy hot desket foglalni jövő hétre, hétfőtől péntekig. Van még hely? Üdv!',
    from: 'gabor.varga@example.hu',
    language: 'hu',
    expectedCategory: 'BOOKING'
  },
  {
    subject: 'Foglalás módosítás',
    body: 'Szia! A holnapi tárgyaló foglalásomat szeretném módosítani 16:00-18:00-ra. Lehetséges? Köszönöm!',
    from: 'zsofia.kiss@example.hu',
    language: 'hu',
    expectedCategory: 'BOOKING'
  },
  
  // Hungarian - Complaint (3)
  {
    subject: 'Panasz a WiFi-vel kapcsolatban',
    body: 'Jó napot! A WiFi már 3 napja nem működik megfelelően. Folyamatosan megszakad a kapcsolat. Ez így elfogadhatatlan, nem tudok dolgozni! Kérem orvosolják sürgősen!',
    from: 'laszlo.toth@example.hu',
    language: 'hu',
    expectedCategory: 'COMPLAINT'
  },
  {
    subject: 'Zaj probléma',
    body: 'Szia! A mellettünk lévő teremből folyamatosan áthallatszik a zaj. Nagyon zavaró, nem tudok koncentrálni. Kérem tegyetek valamit!',
    from: 'katalin.molnar@example.hu',
    language: 'hu',
    expectedCategory: 'COMPLAINT'
  },
  {
    subject: 'Klíma nem működik',
    body: 'Jó napot! A 3. emeleti klíma nem működik, nagyon meleg van. Mikor javítják meg? Sürgős lenne!',
    from: 'istvan.fekete@example.hu',
    language: 'hu',
    expectedCategory: 'COMPLAINT'
  },
  
  // English - Billing (3)
  {
    subject: 'Invoice question',
    body: 'Hi, I received invoice #2026-456 but I already paid last week via bank transfer. Could you please check the payment status? Thanks!',
    from: 'john.smith@example.com',
    language: 'en',
    expectedCategory: 'BILLING'
  },
  {
    subject: 'Receipt request',
    body: 'Hello! Could I please get an official receipt for last month\'s membership fee? My tax number is 87654321-2-51. Thank you!',
    from: 'sarah.jones@example.com',
    language: 'en',
    expectedCategory: 'BILLING'
  },
  {
    subject: 'Payment issue',
    body: 'Hi, my credit card payment failed yesterday. I\'ve updated my card details. Could you please try charging again? Thanks!',
    from: 'mike.brown@example.com',
    language: 'en',
    expectedCategory: 'BILLING'
  },
  
  // English - Booking (3)
  {
    subject: 'Meeting room booking',
    body: 'Hi, I\'d like to book the large meeting room for tomorrow from 2pm to 4pm. We\'ll have 6 people. Is it available? Thanks!',
    from: 'emma.wilson@example.com',
    language: 'en',
    expectedCategory: 'BOOKING'
  },
  {
    subject: 'Desk reservation',
    body: 'Hello! I need to book a hot desk for next week, Monday through Friday. Do you have availability? Best regards!',
    from: 'david.miller@example.com',
    language: 'en',
    expectedCategory: 'BOOKING'
  },
  {
    subject: 'Change booking',
    body: 'Hi, I need to change my meeting room booking from 10am-12pm to 3pm-5pm tomorrow. Is that possible? Thanks!',
    from: 'lisa.taylor@example.com',
    language: 'en',
    expectedCategory: 'BOOKING'
  },
  
  // English - Info Request (3)
  {
    subject: 'Membership pricing',
    body: 'Hi, I\'m interested in joining your coworking space. Could you tell me about the membership options and pricing? Thanks!',
    from: 'alex.anderson@example.com',
    language: 'en',
    expectedCategory: 'INFO_REQUEST'
  },
  {
    subject: 'Opening hours',
    body: 'Hello! What are your opening hours during the holidays? Are you open on weekends? Best regards!',
    from: 'rachel.thomas@example.com',
    language: 'en',
    expectedCategory: 'INFO_REQUEST'
  },
  {
    subject: 'Parking information',
    body: 'Hi, do you have parking available for members? If so, what\'s the cost? Thanks!',
    from: 'chris.martin@example.com',
    language: 'en',
    expectedCategory: 'INFO_REQUEST'
  }
];

// ============================================
// SAFE TEST FUNCTIONS
// ============================================

function sendSingleTestEmail() {
  // IMPORTANT: Change this to YOUR email address
  const targetEmail = 'YOUR_EMAIL@gmail.com';
  
  if (targetEmail === 'YOUR_EMAIL@gmail.com') {
    SpreadsheetApp.getUi().alert(
      'Email Not Configured',
      'Please edit EmailGenerator.gs and set your email address in sendSingleTestEmail() function.\n\nFind line 2 and replace YOUR_EMAIL@gmail.com with your actual email.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  const testEmail = TEST_EMAILS[0]; // First test email (Hungarian billing)
  
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Send Single Test Email',
    `Send 1 test email to:\n${targetEmail}\n\nEmail: ${testEmail.subject}\nLanguage: ${testEmail.language.toUpperCase()}\n\nContinue?`,
    ui.ButtonSet.YES_NO
  );
  
  if (result !== ui.Button.YES) return;
  
  try {
    const languageName = testEmail.language === 'hu' ? 'Magyar' : 'English';
    
    const htmlBody = `<div style="font-family: Arial, sans-serif; charset=UTF-8;">
<p><strong>[Test Email - ${languageName}]</strong><br>
<em>[From: ${testEmail.from}]</em></p>
<p>${testEmail.body.replace(/\n/g, '<br>')}</p>
</div>`;
    
    const plainText = `[Test Email - ${languageName}]\n[From: ${testEmail.from}]\n\n${testEmail.body}`;
    
    GmailApp.sendEmail(targetEmail, testEmail.subject, plainText, {
      htmlBody: htmlBody
    });
    
    Logger.log('✓ Test email sent successfully');
    
    ui.alert(
      'Test Email Sent!',
      `Email sent to: ${targetEmail}\n\nWait 1 minute, then run:\nEmail Triage > Process Emails`,
      ui.ButtonSet.OK
    );
    
  } catch (e) {
    Logger.log(`✗ Failed: ${e.message}`);
    ui.alert('Error', `Failed to send email: ${e.message}`, ui.ButtonSet.OK);
  }
}

function generateSafeTestEmails() {
  // IMPORTANT: Change this to YOUR email address
  const targetEmail = 'YOUR_EMAIL@gmail.com';
  
  if (targetEmail === 'YOUR_EMAIL@gmail.com') {
    SpreadsheetApp.getUi().alert(
      'Email Not Configured',
      'Please edit EmailGenerator.gs and set your email address in generateSafeTestEmails() function.\n\nFind line 2 and replace YOUR_EMAIL@gmail.com with your actual email.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  // Safe test set: 3 HU + 3 EN = 6 total
  const safeTestSet = [
    TEST_EMAILS[0],  // HU Billing
    TEST_EMAILS[3],  // HU Booking
    TEST_EMAILS[6],  // HU Complaint
    TEST_EMAILS[9],  // EN Billing
    TEST_EMAILS[12], // EN Booking
    TEST_EMAILS[15]  // EN Info
  ];
  
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Safe Test Email Generation',
    `This will send ${safeTestSet.length} test emails to:\n${targetEmail}\n\n` +
    `With 15-second delays between each email.\nTotal time: ~90 seconds\n\nContinue?`,
    ui.ButtonSet.YES_NO
  );
  
  if (result !== ui.Button.YES) return;
  
  Logger.log(`Starting safe test batch: ${safeTestSet.length} emails`);
  
  let sent = 0;
  let failed = 0;
  
  safeTestSet.forEach((email, index) => {
    try {
      const languageName = email.language === 'hu' ? 'Magyar' : 'English';
      
      const htmlBody = `<div style="font-family: Arial, sans-serif; charset=UTF-8;">
<p><strong>[Test Email - ${languageName}]</strong><br>
<em>[From: ${email.from}]</em></p>
<p>${email.body.replace(/\n/g, '<br>')}</p>
</div>`;
      
      const plainText = `[Test Email - ${languageName}]\n[From: ${email.from}]\n\n${email.body}`;
      
      GmailApp.sendEmail(targetEmail, email.subject, plainText, {
        htmlBody: htmlBody
      });
      
      sent++;
      Logger.log(`✓ ${index + 1}/${safeTestSet.length}: [${email.language.toUpperCase()}] ${email.subject}`);
      
      // CRITICAL SAFETY: 15-second delay between emails
      if (index < safeTestSet.length - 1) {
        Logger.log(`  Waiting 15 seconds...`);
        Utilities.sleep(15000);
      }
      
    } catch (e) {
      failed++;
      Logger.log(`✗ Failed: ${e.message}`);
    }
  });
  
  Logger.log(`\n✓ Complete! Sent: ${sent}, Failed: ${failed}`);
  
  ui.alert(
    'Test Emails Sent!',
    `Successfully sent ${sent} emails to:\n${targetEmail}\n\n` +
    `Wait 2 minutes, then run:\nEmail Triage > Process Emails`,
    ui.ButtonSet.OK
  );
}
