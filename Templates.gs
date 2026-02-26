// ============================================
// DRAFT REPLY TEMPLATES
// ============================================

function generateDraftReply(message, analysis) {
  const category = analysis.categoryName;
  const language = analysis.language || 'en';
  const sentiment = analysis.sentiment || 'neutral';
  
  const senderEmail = message.getFrom();
  const senderName = extractName(senderEmail);
  const subject = message.getSubject();
  
  let replyText = '';
  
  // Generate context-aware reply based on category and language
  switch (category) {
    case 'BILLING':
      replyText = generateBillingReply(language, senderName, subject);
      break;
    case 'BOOKING':
      replyText = generateBookingReply(language, senderName);
      break;
    case 'INFO_REQUEST':
      replyText = generateInfoReply(language, senderName);
      break;
    case 'MEMBERSHIP':
      replyText = generateMembershipReply(language, senderName);
      break;
    case 'COMPLAINT':
      // Don't auto-generate for complaints
      return null;
    default:
      replyText = generateGenericReply(language, senderName);
  }
  
  return replyText;
}

function generateBillingReply(language, name, subject) {
  if (language === 'hu') {
    return `Kedves ${name}!

Köszönöm az e-mailedet a számlával kapcsolatban. 

Megvizsgálom a kérdésedet és 24 órán belül visszajelzek a részletekkel. Ha sürgős lenne, kérlek hívj telefonon: +36 1 234 5678.

Üdvözlettel,
Kaptár Csapat

---
Kaptár Coworking
Budapest, Magyarország
info@kaptar.hu | +36 1 234 5678`;
  } else {
    return `Dear ${name},

Thank you for your email regarding billing.

I will review your question and get back to you within 24 hours with details. If this is urgent, please call us at +36 1 234 5678.

Best regards,
Kaptár Team

---
Kaptár Coworking
Budapest, Hungary
info@kaptar.hu | +36 1 234 5678`;
  }
}

function generateBookingReply(language, name) {
  if (language === 'hu') {
    return `Kedves ${name}!

Köszönöm a foglalási kérésedet!

Ellenőrzöm a rendelkezésre álló időpontokat és hamarosan küldöm a megerősítést. Ha sürgős, nézd meg az online naptárunkat vagy hívj: +36 1 234 5678.

Üdvözlettel,
Kaptár Csapat

---
Kaptár Coworking
Budapest, Magyarország
info@kaptar.hu | +36 1 234 5678`;
  } else {
    return `Dear ${name},

Thank you for your booking request!

I'm checking availability and will send you a confirmation soon. If this is urgent, please check our online calendar or call us at +36 1 234 5678.

Best regards,
Kaptár Team

---
Kaptár Coworking
Budapest, Hungary
info@kaptar.hu | +36 1 234 5678`;
  }
}

function generateInfoReply(language, name) {
  if (language === 'hu') {
    return `Kedves ${name}!

Köszönöm az érdeklődésedet!

Szívesen válaszolok a kérdéseidre. Részletes információkat küldök 24 órán belül, vagy ha szeretnél, foglalhatsz egy személyes bemutatót a helyszínen.

Látogass el weboldalunkra is: www.kaptar.hu

Üdvözlettel,
Kaptár Csapat

---
Kaptár Coworking
Budapest, Magyarország
info@kaptar.hu | +36 1 234 5678`;
  } else {
    return `Dear ${name},

Thank you for your interest!

I'm happy to answer your questions. I'll send you detailed information within 24 hours, or if you prefer, you can book an in-person tour of our space.

Visit our website: www.kaptar.hu

Best regards,
Kaptár Team

---
Kaptár Coworking
Budapest, Hungary
info@kaptar.hu | +36 1 234 5678`;
  }
}

function generateMembershipReply(language, name) {
  if (language === 'hu') {
    return `Kedves ${name}!

Köszönöm az e-mailedet a tagságoddal kapcsolatban.

Feldolgozom a kérésedet és hamarosan visszajelzek a részletekkel. Ha bármilyen kérdésed van, nyugodtan hívj: +36 1 234 5678.

Üdvözlettel,
Kaptár Csapat

---
Kaptár Coworking
Budapest, Magyarország
info@kaptar.hu | +36 1 234 5678`;
  } else {
    return `Dear ${name},

Thank you for your email regarding membership.

I'm processing your request and will get back to you shortly with details. If you have any questions, feel free to call us at +36 1 234 5678.

Best regards,
Kaptár Team

---
Kaptár Coworking
Budapest, Hungary
info@kaptar.hu | +36 1 234 5678`;
  }
}

function generateGenericReply(language, name) {
  if (language === 'hu') {
    return `Kedves ${name}!

Köszönöm az e-mailedet!

Hamarosan válaszolok részletes információkkal. Ha sürgős lenne, kérlek hívj: +36 1 234 5678.

Üdvözlettel,
Kaptár Csapat

---
Kaptár Coworking
Budapest, Magyarország
info@kaptar.hu | +36 1 234 5678`;
  } else {
    return `Dear ${name},

Thank you for your email!

I'll get back to you soon with detailed information. If this is urgent, please call us at +36 1 234 5678.

Best regards,
Kaptár Team

---
Kaptár Coworking
Budapest, Hungary
info@kaptar.hu | +36 1 234 5678`;
  }
}

function extractName(email) {
  // Extract name from email address
  const match = email.match(/^([^<@]+)/);
  if (match) {
    const name = match[1].trim();
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return 'Kedves Ügyfél / Dear Customer';
}
