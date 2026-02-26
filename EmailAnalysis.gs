// ============================================
// AI-POWERED EMAIL ANALYSIS
// ============================================

function analyzeEmailWithAI(message) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.geminiApiKey || AI_CONFIG.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    Logger.log('AI not configured, using fallback');
    return analyzeFallback(message);
  }
  
  try {
    return analyzeWithGemini(message);
  } catch (e) {
    Logger.log(`AI analysis failed: ${e.message}, using fallback`);
    return analyzeFallback(message);
  }
}

function analyzeWithGemini(message) {
  const subject = message.getSubject();
  const body = message.getPlainBody().substring(0, 2000); // Limit to 2000 chars
  const from = message.getFrom();
  
  const prompt = `You are an email triage assistant for a coworking space in Budapest, Hungary.

ANALYZE THIS EMAIL:

Subject: ${subject}
From: ${from}
Body: ${body}

COWORKING SPACE CONTEXT:
- Location: Budapest, Hungary
- Services: Hot desks, meeting rooms, private offices
- Common inquiries: Billing, room bookings, membership, general info, complaints

CATEGORIES (choose ONE):
- BILLING: invoices, payments, receipts (számlák, fizetések, nyugták)
- BOOKING: meeting room reservations, desk bookings (tárgyaló foglalás)
- COMPLAINT: problems, issues, dissatisfaction (panaszok, problémák)
- INFO_REQUEST: questions, general information (kérdések, információ)
- MEMBERSHIP: joining, canceling, upgrading (tagság, csatlakozás, lemondás)
- SPAM: promotional, irrelevant content

IMPORTANT:
- Detect the language (Hungarian "hu" or English "en")
- Consider context, sentiment, and urgency
- Be accurate in categorization

RESPOND WITH ONLY THIS JSON (no markdown, no code blocks):
{
  "category": "BILLING",
  "confidence": 0.95,
  "language": "hu",
  "sentiment": "neutral",
  "urgency": "normal",
  "reasoning": "Brief explanation in English"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.geminiApiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxTokens
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (!result.candidates || !result.candidates[0]) {
    throw new Error('No response from Gemini');
  }
  
  const aiText = result.candidates[0].content.parts[0].text;
  
  // Clean and parse JSON
  let cleaned = aiText.trim();
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  const analysis = JSON.parse(cleaned);
  
  return {
    categoryName: analysis.category || 'INFO_REQUEST',
    confidence: analysis.confidence || 0.5,
    language: analysis.language || 'en',
    sentiment: analysis.sentiment || 'neutral',
    isUrgent: analysis.urgency === 'high' || analysis.urgency === 'urgent',
    reasoning: analysis.reasoning || '',
    analysisMethod: 'Gemini'
  };
}

function analyzeFallback(message) {
  // Simple keyword-based fallback
  const subject = message.getSubject().toLowerCase();
  const body = message.getPlainBody().toLowerCase().substring(0, 1000);
  const text = subject + ' ' + body;
  
  // Detect language
  const hungarianChars = (text.match(/[áéíóöőúüű]/g) || []).length;
  const language = hungarianChars > 3 ? 'hu' : 'en';
  
  // Categorize by keywords
  let categoryName = 'INFO_REQUEST';
  let confidence = 0.5;
  
  for (const [category, config] of Object.entries(CATEGORIES)) {
    const keywords = config.keywords[language] || [];
    const matches = keywords.filter(kw => text.includes(kw)).length;
    
    if (matches > 0) {
      categoryName = category;
      confidence = Math.min(0.9, 0.6 + (matches * 0.1));
      break;
    }
  }
  
  return {
    categoryName: categoryName,
    confidence: confidence,
    language: language,
    sentiment: 'neutral',
    isUrgent: false,
    reasoning: 'Fallback keyword matching',
    analysisMethod: 'Fallback'
  };
}

function trackAIUsage(category, language, confidence) {
  // Optional: Track AI usage for analytics
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let usageSheet = ss.getSheetByName('AI Usage');
  
  if (!usageSheet) {
    usageSheet = ss.insertSheet('AI Usage');
    usageSheet.appendRow(['Timestamp', 'Category', 'Language', 'Confidence', 'Method']);
  }
  
  usageSheet.appendRow([
    new Date(),
    category,
    language,
    confidence,
    'Gemini'
  ]);
}
