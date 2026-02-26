// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Gmail labels (bilingual)
  labels: {
    billing: '💰 Számlázás / Billing',
    booking: '📅 Foglalás / Booking',
    complaint: '⚠️ Panasz / Complaint',
    infoRequest: '❓ Információ / Info',
    membership: '👥 Tagság / Membership',
    spam: '🚫 Spam',
    
    // Language labels
    hungarian: '🇭🇺 Magyar',
    english: '🇬🇧 English',
    
    // Status labels
    processed: '✅ Processed',
    draftReady: '📝 Draft Ready',
    needsReview: '👀 Needs Review',
    urgent: '🚨 Urgent',
    vip: '⭐ VIP',
    internal: '🏢 Internal'
  },
  
  // Processing settings
  maxEmailsPerRun: 50,
  confidenceThreshold: 0.7,
  
  // Sheet name for logging
  emailLogSheet: 'Email Log',
  
  // VIP senders (example - customize with your important contacts)
  vipSenders: [
    'boss@company.com',
    'important@client.com'
  ],
  
  // Internal domains (won't process - customize with your company domain)
  internalDomains: [
    '@yourcompany.com'
  ]
};

// AI Configuration - Gemini
const AI_CONFIG = {
  // Get your free API key from: https://aistudio.google.com/app/apikey
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE', 
  model: 'gemini-1.5-flash',
  enabled: true,
  temperature: 0.3,
  maxTokens: 500
};

// Email categories with Hungarian/English examples
const CATEGORIES = {
  BILLING: {
    label: CONFIG.labels.billing,
    keywords: {
      hu: ['számla', 'fizetés', 'befizetés', 'költség', 'díj', 'nyugta', 'átutalás'],
      en: ['invoice', 'payment', 'bill', 'charge', 'fee', 'receipt', 'transaction']
    },
    examples: {
      hu: 'Kérdésem van a számlámmal kapcsolatban',
      en: 'I have a question about my invoice'
    }
  },
  
  BOOKING: {
    label: CONFIG.labels.booking,
    keywords: {
      hu: ['foglalás', 'tárgyaló', 'terem', 'helyiség', 'asztal', 'időpont'],
      en: ['booking', 'reservation', 'meeting room', 'desk', 'space', 'availability']
    },
    examples: {
      hu: 'Szeretnék tárgyalót foglalni holnapra',
      en: 'I would like to book a meeting room for tomorrow'
    }
  },
  
  COMPLAINT: {
    label: CONFIG.labels.complaint,
    keywords: {
      hu: ['panasz', 'probléma', 'nem működik', 'rossz', 'elégedetlen', 'reklamáció'],
      en: ['complaint', 'problem', 'issue', 'not working', 'disappointed', 'unhappy']
    },
    examples: {
      hu: 'Panaszom van a WiFi minőségével kapcsolatban',
      en: 'I have a complaint about the WiFi quality'
    }
  },
  
  INFO_REQUEST: {
    label: CONFIG.labels.infoRequest,
    keywords: {
      hu: ['kérdés', 'információ', 'tudni', 'érdeklődöm', 'milyen', 'hogyan'],
      en: ['question', 'information', 'inquiry', 'interested', 'how', 'what', 'when']
    },
    examples: {
      hu: 'Milyen árak vannak?',
      en: 'What are your prices?'
    }
  },
  
  MEMBERSHIP: {
    label: CONFIG.labels.membership,
    keywords: {
      hu: ['tagság', 'csatlakozás', 'beiratkozás', 'lemondás', 'felmondás'],
      en: ['membership', 'join', 'sign up', 'cancel', 'subscription']
    },
    examples: {
      hu: 'Szeretnék csatlakozni a coworking térhez',
      en: 'I would like to join the coworking space'
    }
  },
  
  SPAM: {
    label: CONFIG.labels.spam,
    keywords: {
      hu: ['nyeremény', 'ingyenes', 'viagra', 'klikk'],
      en: ['winner', 'free money', 'viagra', 'click here', 'congratulations']
    }
  }
};
