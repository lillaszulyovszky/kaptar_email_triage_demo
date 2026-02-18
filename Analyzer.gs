/**
 * Analyzer.gs
 * Core email analysis engine for the Kaptar Email Triage System.
 *
 * Responsibilities:
 *   - Keyword-based multi-category scoring with confidence normalisation
 *   - Sentiment analysis with negation and intensifier handling
 *   - VIP detection (address + domain)
 *   - Multi-topic detection and secondary category tagging
 *   - Sarcasm heuristics
 *   - Basic foreign-language detection
 */

// ---------------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ---------------------------------------------------------------------------

/**
 * Fully analyses a single Gmail message object.
 *
 * @param {GmailMessage} message  A GmailApp.GmailMessage instance.
 * @returns {Object} Analysis result with the shape described below.
 *
 * Result shape:
 * {
 *   category:          string,   // Primary category name
 *   confidence:        number,   // 0–1 confidence for the primary category
 *   secondaryCategory: string|null,
 *   allScores:         Object,   // Raw category → normalised score map
 *   sentiment:         number,   // -1 to +1
 *   sentimentLabel:    string,   // 'positive' | 'neutral' | 'negative'
 *   isVIP:             boolean,
 *   isUrgent:          boolean,
 *   isSarcastic:       boolean,
 *   language:          string,   // 'en' | 'unknown'
 *   subject:           string,
 *   from:              string,
 *   bodySnippet:       string,   // First 300 chars of plain-text body
 *   wordCount:         number,
 * }
 */
function analyzeEmail(message) {
  var from    = message.getFrom();
  var subject = message.getSubject();
  var body    = stripHtml(message.getBody()); // Utils.gs

  // Combine subject + body for scoring; subject carries more weight by
  // prepending it three times.
  var fullText = (subject + ' ' + subject + ' ' + subject + ' ' + body).toLowerCase();

  var scores         = _scoreAllCategories(fullText);
  var primary        = _pickPrimary(scores);
  var secondary      = _pickSecondary(scores, primary.category);
  var sentiment      = analyzeSentiment(fullText);
  var isVIP          = detectVIP(from);
  var isSarcastic    = _detectSarcasm(fullText, sentiment);
  var language       = _detectLanguage(body);

  // Sarcasm correction: if sarcasm is likely and category is COMPLAINT, boost
  // confidence; if category is positive-leaning lower confidence slightly.
  if (isSarcastic && primary.category !== 'COMPLAINT') {
    primary.confidence = Math.max(0, primary.confidence - 0.1);
  }

  var isUrgent = sentiment < CONFIG.URGENT_SENTIMENT_THRESHOLD ||
                 primary.category === 'COMPLAINT';

  return {
    category:          primary.category,
    confidence:        primary.confidence,
    secondaryCategory: secondary,
    allScores:         scores,
    sentiment:         Math.round(sentiment * 100) / 100,
    sentimentLabel:    _sentimentLabel(sentiment),
    isVIP:             isVIP,
    isUrgent:          isUrgent,
    isSarcastic:       isSarcastic,
    language:          language,
    subject:           subject,
    from:              from,
    bodySnippet:       body.substring(0, 300).trim(),
    wordCount:         body.split(/\s+/).filter(Boolean).length,
  };
}

// ---------------------------------------------------------------------------
// CATEGORY SCORING
// ---------------------------------------------------------------------------

/**
 * Scores the text against every configured category.
 *
 * Returns a map: { CATEGORY_NAME: { raw, normalised, matched } }
 *   raw        – sum of matched keyword weights
 *   normalised – raw / maxPossibleScore for that category (0–1)
 *   matched    – array of matched term strings
 */
function _scoreAllCategories(text) {
  var result = {};
  var categoryNames = Object.keys(CATEGORIES);

  categoryNames.forEach(function(catName) {
    var cat     = CATEGORIES[catName];
    var raw     = 0;
    var matched = [];
    var maxPossible = 0;

    cat.keywords.forEach(function(kw) {
      maxPossible += kw.weight;
      // Use a regex word-boundary search so 'bill' doesn't match 'billiards'
      var regex = _buildKeywordRegex(kw.term);
      if (regex.test(text)) {
        raw += kw.weight;
        matched.push(kw.term);
      }
    });

    var normalised = maxPossible > 0 ? Math.min(1, raw / (maxPossible * 0.35)) : 0;

    result[catName] = {
      raw:        Math.round(raw * 100) / 100,
      normalised: Math.round(normalised * 100) / 100,
      matched:    matched,
    };
  });

  return result;
}

/**
 * Builds a RegExp for a keyword, supporting multi-word phrases and
 * word-boundary anchoring for single words.
 */
function _buildKeywordRegex(term) {
  var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (term.indexOf(' ') !== -1) {
    // Multi-word phrase: simple contains check
    return new RegExp(escaped, 'i');
  }
  // Single word: require word boundaries
  return new RegExp('\\b' + escaped + '\\b', 'i');
}

/**
 * Selects the primary category from scored results.
 * Filters out categories below their own threshold and sorts by normalised
 * score, breaking ties using the category's priority value (lower = better).
 */
function _pickPrimary(scores) {
  var candidates = Object.keys(CATEGORIES).filter(function(catName) {
    return scores[catName].raw >= CATEGORIES[catName].threshold;
  });

  if (candidates.length === 0) {
    // Fallback: pick the highest raw scorer, even if below threshold
    candidates = Object.keys(CATEGORIES);
  }

  candidates.sort(function(a, b) {
    var scoreDiff = scores[b].normalised - scores[a].normalised;
    if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
    // Tiebreak by category priority
    return CATEGORIES[a].priority - CATEGORIES[b].priority;
  });

  var winner = candidates[0];
  return {
    category:   winner,
    confidence: scores[winner].normalised,
  };
}

/**
 * Returns a secondary category if a second category also clears its threshold
 * and its score is at least 60% of the primary's score.
 */
function _pickSecondary(scores, primaryCategory) {
  var primaryScore = scores[primaryCategory].normalised;
  var candidates   = Object.keys(CATEGORIES).filter(function(catName) {
    if (catName === primaryCategory) return false;
    if (scores[catName].raw < CATEGORIES[catName].threshold) return false;
    return scores[catName].normalised >= primaryScore * 0.6;
  });

  if (candidates.length === 0) return null;

  candidates.sort(function(a, b) {
    return scores[b].normalised - scores[a].normalised;
  });

  return candidates[0];
}

// ---------------------------------------------------------------------------
// SENTIMENT ANALYSIS
// ---------------------------------------------------------------------------

/**
 * Analyses the sentiment of a text string.
 *
 * Algorithm:
 *   1. Tokenise into lowercase words.
 *   2. Walk tokens; track negation window (2 tokens) and intensifier multiplier.
 *   3. Accumulate a running score, clamped to [-1, +1].
 *
 * @param {string} text  Lowercase plain text.
 * @returns {number}  Sentiment score in [-1, +1].
 */
function analyzeSentiment(text) {
  var tokens         = text.toLowerCase().match(/\b\w+'\w+|\b\w+\b/g) || [];
  var score          = 0;
  var negationCount  = 0;   // Counts down tokens remaining in negation window
  var intensifier    = 1.0; // Multiplier for next sentiment word

  tokens.forEach(function(token) {
    // Check negation
    if (SENTIMENT.negators.indexOf(token) !== -1) {
      negationCount = 3; // Negate the next 3 tokens
      return;
    }

    // Check intensifier
    if (SENTIMENT.intensifiers[token] !== undefined) {
      intensifier = SENTIMENT.intensifiers[token];
      return;
    }

    // Check positive words
    var posWord = SENTIMENT.positive.filter(function(w) {
      return w.term === token || text.indexOf(w.term) !== -1 && w.term.indexOf(' ') !== -1;
    })[0];

    if (posWord) {
      var contribution = posWord.score * intensifier;
      score += negationCount > 0 ? -contribution : contribution;
      intensifier  = 1.0;
      negationCount = Math.max(0, negationCount - 1);
      return;
    }

    // Check negative words
    var negWord = SENTIMENT.negative.filter(function(w) {
      return w.term === token || text.indexOf(w.term) !== -1 && w.term.indexOf(' ') !== -1;
    })[0];

    if (negWord) {
      var contribution2 = negWord.score * intensifier;
      score += negationCount > 0 ? -contribution2 : contribution2;
      intensifier  = 1.0;
      negationCount = Math.max(0, negationCount - 1);
      return;
    }

    // Non-sentiment token: decay negation window
    if (negationCount > 0) negationCount--;
    intensifier = 1.0;
  });

  // Normalise: divide by a factor proportional to text length to keep range
  var normFactor = Math.max(1, Math.log(tokens.length + 1));
  var normalised = score / normFactor;

  return Math.max(-1, Math.min(1, normalised));
}

/**
 * Returns a human-readable sentiment label.
 */
function _sentimentLabel(score) {
  if (score >=  0.2) return 'positive';
  if (score <= -0.2) return 'negative';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// VIP DETECTION
// ---------------------------------------------------------------------------

/**
 * Returns true if the sender's email or domain is in the VIP lists.
 *
 * @param {string} from  Raw From header string, e.g. "John Smith <john@co.com>"
 */
function detectVIP(from) {
  var emailMatch = from.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (!emailMatch) return false;

  var email  = emailMatch[0].toLowerCase();
  var domain = email.split('@')[1];

  if (VIP_EMAILS.indexOf(email) !== -1)  return true;
  if (VIP_DOMAINS.indexOf(domain) !== -1) return true;

  return false;
}

// ---------------------------------------------------------------------------
// SARCASM DETECTION (HEURISTIC)
// ---------------------------------------------------------------------------

/**
 * Lightweight sarcasm heuristic.
 * Flags as sarcastic if:
 *   - Positive sentiment is combined with complaint keywords, OR
 *   - Text contains sarcasm markers (e.g. "oh great", "sure", "fantastic job")
 *     paired with negative context words.
 *
 * This is intentionally conservative – false positives are worse than misses.
 */
function _detectSarcasm(text, sentiment) {
  var sarcasmPhrases = [
    'oh great',
    'oh wonderful',
    'oh fantastic',
    'what a surprise',
    'obviously',
    'clearly you',
    'thanks for nothing',
    'great job', // Only sarcastic if paired with negative context
    'well done',  // Same
    'brilliant',
  ];

  var negativeContext = ['broken', 'wrong', 'terrible', 'not working',
                         'failed', 'error', 'issue', 'problem', 'again'];

  var hasSarcasmPhrase = sarcasmPhrases.some(function(phrase) {
    return text.indexOf(phrase) !== -1;
  });

  var hasNegativeContext = negativeContext.some(function(word) {
    return text.indexOf(word) !== -1;
  });

  // If strong positive words appear alongside clear complaint keywords
  var hasComplaintKeyword = CATEGORIES.COMPLAINT.keywords.some(function(kw) {
    return text.indexOf(kw.term) !== -1;
  });

  // Sarcasm heuristic: apparently positive sentiment + complaint keywords
  if (sentiment > 0.2 && hasComplaintKeyword && hasSarcasmPhrase) return true;

  // Sarcasm marker + negative context (e.g. "oh great, it's broken again")
  if (hasSarcasmPhrase && hasNegativeContext) return true;

  return false;
}

// ---------------------------------------------------------------------------
// LANGUAGE DETECTION (LIGHTWEIGHT)
// ---------------------------------------------------------------------------

/**
 * Returns 'en' if the text appears to be English, otherwise 'unknown'.
 * Uses a frequency check of common English function words.
 * For production, replace with a proper language-detection library or API.
 */
function _detectLanguage(text) {
  var commonEnglishWords = ['the', 'is', 'are', 'was', 'have', 'has',
                            'you', 'your', 'we', 'our', 'i', 'my',
                            'this', 'that', 'for', 'with', 'from'];
  var tokens  = text.toLowerCase().split(/\s+/);
  var matches = tokens.filter(function(t) {
    return commonEnglishWords.indexOf(t) !== -1;
  }).length;

  // If >8% of tokens are common English words → English
  var ratio = tokens.length > 0 ? matches / tokens.length : 0;
  return ratio >= 0.08 ? 'en' : 'unknown';
}
