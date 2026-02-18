/**
 * Config.gs
 * Central configuration for the Kaptar Email Triage System.
 * Edit this file to customise categories, keywords, VIP lists and thresholds.
 */

// ---------------------------------------------------------------------------
// SHEET CONFIGURATION
// Replace the empty string with your Google Sheet ID after deployment.
// Find it in the Sheet URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
// ---------------------------------------------------------------------------
var SHEET_ID = ''; // <-- PASTE YOUR GOOGLE SHEET ID HERE

// ---------------------------------------------------------------------------
// GENERAL SETTINGS
// ---------------------------------------------------------------------------
var CONFIG = {
  // Maximum number of email threads to process in one trigger run.
  // Keeps execution time within Apps Script's 6-minute limit.
  MAX_EMAILS_PER_RUN: 50,

  // Minimum confidence score (0–1) required to auto-generate a draft reply.
  CONFIDENCE_THRESHOLD: 0.8,

  // Gmail label applied to every thread after triage (creates it if missing).
  PROCESSED_LABEL: 'Kaptar/Processed',

  // Label applied when a draft reply was auto-generated.
  DRAFT_CREATED_LABEL: 'Kaptar/DraftCreated',

  // Label applied to VIP emails.
  VIP_LABEL: 'Kaptar/VIP',

  // Label applied when sentiment score is below URGENT_SENTIMENT_THRESHOLD.
  URGENT_LABEL: 'Kaptar/Urgent',

  // Sentiment score below this value triggers the Urgent label.
  // Range: -1 (very negative) to +1 (very positive).
  URGENT_SENTIMENT_THRESHOLD: -0.4,

  // Number of hours to look back for unprocessed emails on each run.
  LOOKBACK_HOURS: 2,

  // Tab names inside the Google Sheet.
  SHEETS: {
    LOG:       'Email Log',
    DASHBOARD: 'Dashboard',
  },

  // Set to true to skip sending / draft creation and only log.
  DRY_RUN: false,
};

// ---------------------------------------------------------------------------
// VIP CLIENT LIST
// Emails from these addresses receive the VIP label and are flagged in the log.
// ---------------------------------------------------------------------------
var VIP_EMAILS = [
  'ceo@bigcorporate.com',
  'founder@startupxyz.com',
  'john.smith@enterprise.com',
  'sarah.jones@premiumclient.com',
  'cto@techgiant.com',
  // Add more VIP addresses here
];

// ---------------------------------------------------------------------------
// VIP DOMAIN LIST
// Any sender from these domains is treated as VIP regardless of full address.
// ---------------------------------------------------------------------------
var VIP_DOMAINS = [
  'goldmember.com',
  'platinumpartner.org',
  // Add partner / enterprise domains here
];

// ---------------------------------------------------------------------------
// CATEGORY DEFINITIONS
// Each category contains:
//   keywords  – array of { term, weight } objects.
//               Weights amplify or reduce a term's contribution to the score.
//   threshold – minimum raw score before the category is considered a match.
//   priority  – tie-breaking order (lower = higher priority).
// ---------------------------------------------------------------------------
var CATEGORIES = {

  // ---- BILLING -----------------------------------------------------------
  BILLING: {
    priority: 1,
    threshold: 2,
    keywords: [
      { term: 'invoice',          weight: 3 },
      { term: 'payment',          weight: 3 },
      { term: 'bill',             weight: 2.5 },
      { term: 'billing',          weight: 3 },
      { term: 'charge',           weight: 2 },
      { term: 'receipt',          weight: 2.5 },
      { term: 'refund',           weight: 3 },
      { term: 'overcharge',       weight: 3 },
      { term: 'transaction',      weight: 2 },
      { term: 'credit card',      weight: 2.5 },
      { term: 'direct debit',     weight: 2.5 },
      { term: 'bank transfer',    weight: 2 },
      { term: 'outstanding balance', weight: 3 },
      { term: 'late fee',         weight: 3 },
      { term: 'subscription fee', weight: 2.5 },
      { term: 'monthly fee',      weight: 2 },
      { term: 'annual fee',       weight: 2 },
      { term: 'price',            weight: 1 },
      { term: 'cost',             weight: 1 },
      { term: 'pricing',          weight: 1.5 },
      { term: 'discount',         weight: 1.5 },
      { term: 'promo code',       weight: 2 },
      { term: 'vat',              weight: 2 },
      { term: 'tax',              weight: 1.5 },
      { term: 'overdue',          weight: 2.5 },
      { term: 'statement',        weight: 2 },
    ],
  },

  // ---- BOOKING -----------------------------------------------------------
  BOOKING: {
    priority: 2,
    threshold: 2,
    keywords: [
      { term: 'book',             weight: 2.5 },
      { term: 'booking',          weight: 3 },
      { term: 'reservation',      weight: 3 },
      { term: 'reserve',          weight: 2.5 },
      { term: 'schedule',         weight: 2 },
      { term: 'appointment',      weight: 2 },
      { term: 'conference room',  weight: 3 },
      { term: 'meeting room',     weight: 3 },
      { term: 'event space',      weight: 2.5 },
      { term: 'desk',             weight: 2 },
      { term: 'hot desk',         weight: 3 },
      { term: 'private office',   weight: 2.5 },
      { term: 'day pass',         weight: 3 },
      { term: 'availability',     weight: 2 },
      { term: 'available',        weight: 1.5 },
      { term: 'cancel',           weight: 2 },
      { term: 'cancellation',     weight: 2.5 },
      { term: 'reschedule',       weight: 2.5 },
      { term: 'check in',         weight: 2 },
      { term: 'check out',        weight: 2 },
      { term: 'access',           weight: 1 },
      { term: 'capacity',         weight: 1.5 },
      { term: 'time slot',        weight: 2 },
      { term: 'block',            weight: 1.5 },
    ],
  },

  // ---- COMPLAINT ---------------------------------------------------------
  COMPLAINT: {
    priority: 1, // Same high priority as Billing – urgency matters
    threshold: 2,
    keywords: [
      { term: 'complaint',        weight: 3 },
      { term: 'complain',         weight: 3 },
      { term: 'unhappy',          weight: 2.5 },
      { term: 'dissatisfied',     weight: 2.5 },
      { term: 'disappointed',     weight: 2.5 },
      { term: 'unacceptable',     weight: 3 },
      { term: 'disgrace',         weight: 3 },
      { term: 'awful',            weight: 2.5 },
      { term: 'terrible',         weight: 2.5 },
      { term: 'horrible',         weight: 2.5 },
      { term: 'worst',            weight: 2.5 },
      { term: 'broken',           weight: 1.5 },
      { term: 'not working',      weight: 2 },
      { term: 'doesn\'t work',    weight: 2 },
      { term: 'issue',            weight: 1 },
      { term: 'problem',          weight: 1 },
      { term: 'noise',            weight: 1.5 },
      { term: 'dirty',            weight: 2 },
      { term: 'unprofessional',   weight: 2.5 },
      { term: 'rude',             weight: 2.5 },
      { term: 'ignored',          weight: 2 },
      { term: 'no response',      weight: 2 },
      { term: 'refund',           weight: 1.5 },
      { term: 'compensation',     weight: 2.5 },
      { term: 'report',           weight: 1 },
      { term: 'escalate',         weight: 2.5 },
      { term: 'legal',            weight: 2.5 },
      { term: 'lawyer',           weight: 3 },
      { term: 'sue',              weight: 3 },
    ],
  },

  // ---- INFO REQUEST ------------------------------------------------------
  INFO_REQUEST: {
    priority: 3,
    threshold: 1.5,
    keywords: [
      { term: 'information',      weight: 1.5 },
      { term: 'info',             weight: 1.5 },
      { term: 'question',         weight: 1.5 },
      { term: 'enquiry',          weight: 2 },
      { term: 'inquiry',          weight: 2 },
      { term: 'wondering',        weight: 1.5 },
      { term: 'could you tell',   weight: 2 },
      { term: 'can you tell',     weight: 2 },
      { term: 'would like to know', weight: 2 },
      { term: 'do you offer',     weight: 2 },
      { term: 'do you have',      weight: 1.5 },
      { term: 'what are',         weight: 1 },
      { term: 'what is',          weight: 1 },
      { term: 'how do',           weight: 1 },
      { term: 'how much',         weight: 1.5 },
      { term: 'opening hours',    weight: 2.5 },
      { term: 'hours',            weight: 1 },
      { term: 'location',         weight: 1.5 },
      { term: 'address',          weight: 1.5 },
      { term: 'parking',          weight: 2 },
      { term: 'wifi',             weight: 2 },
      { term: 'internet',         weight: 1.5 },
      { term: 'amenities',        weight: 2 },
      { term: 'facilities',       weight: 2 },
      { term: 'tour',             weight: 1.5 },
      { term: 'visit',            weight: 1 },
      { term: 'trial',            weight: 1.5 },
    ],
  },

  // ---- MEMBERSHIP --------------------------------------------------------
  MEMBERSHIP: {
    priority: 2,
    threshold: 2,
    keywords: [
      { term: 'membership',       weight: 3 },
      { term: 'member',           weight: 2.5 },
      { term: 'plan',             weight: 1.5 },
      { term: 'subscribe',        weight: 2 },
      { term: 'subscription',     weight: 2.5 },
      { term: 'upgrade',          weight: 2 },
      { term: 'downgrade',        weight: 2 },
      { term: 'cancel membership', weight: 3 },
      { term: 'terminate',        weight: 2.5 },
      { term: 'renewal',          weight: 2.5 },
      { term: 'renew',            weight: 2 },
      { term: 'join',             weight: 1.5 },
      { term: 'sign up',          weight: 2 },
      { term: 'sign-up',          weight: 2 },
      { term: 'trial period',     weight: 2.5 },
      { term: 'free trial',       weight: 2.5 },
      { term: 'contract',         weight: 2 },
      { term: 'agreement',        weight: 1.5 },
      { term: 'notice period',    weight: 2.5 },
      { term: 'monthly plan',     weight: 2.5 },
      { term: 'annual plan',      weight: 2.5 },
      { term: 'coworking',        weight: 1.5 },
      { term: 'dedicated desk',   weight: 2.5 },
      { term: 'flexi desk',       weight: 2.5 },
      { term: 'virtual office',   weight: 2.5 },
      { term: 'benefits',         weight: 1 },
      { term: 'perks',            weight: 1 },
    ],
  },

  // ---- SPAM --------------------------------------------------------------
  SPAM: {
    priority: 5, // Lowest priority – only wins if nothing else matches
    threshold: 2,
    keywords: [
      { term: 'click here',       weight: 2.5 },
      { term: 'unsubscribe',      weight: 2 },
      { term: 'opt out',          weight: 2 },
      { term: 'limited time offer', weight: 3 },
      { term: 'act now',          weight: 3 },
      { term: 'free money',       weight: 3 },
      { term: 'winner',           weight: 2.5 },
      { term: 'congratulations',  weight: 1.5 },
      { term: 'earn money',       weight: 2.5 },
      { term: 'work from home',   weight: 2 },
      { term: 'make money',       weight: 2.5 },
      { term: 'guaranteed',       weight: 1.5 },
      { term: '100% free',        weight: 3 },
      { term: 'no obligation',    weight: 2.5 },
      { term: 'risk free',        weight: 2 },
      { term: 'weight loss',      weight: 3 },
      { term: 'casino',           weight: 3 },
      { term: 'lottery',          weight: 3 },
      { term: 'nigeria',          weight: 2.5 },
      { term: 'prince',           weight: 1.5 },
      { term: 'inheritance',      weight: 2 },
      { term: 'pharmaceutical',   weight: 2 },
      { term: 'viagra',           weight: 3 },
      { term: 'enlarge',          weight: 3 },
      { term: 'dear friend',      weight: 2 },
      { term: 'bulk email',       weight: 3 },
    ],
  },
};

// ---------------------------------------------------------------------------
// SENTIMENT WORD LISTS
// Used by the sentiment analyser in Analyzer.gs.
// ---------------------------------------------------------------------------
var SENTIMENT = {
  positive: [
    { term: 'great',        score: 0.6 },
    { term: 'excellent',    score: 0.8 },
    { term: 'amazing',      score: 0.8 },
    { term: 'wonderful',    score: 0.7 },
    { term: 'fantastic',    score: 0.8 },
    { term: 'love',         score: 0.7 },
    { term: 'happy',        score: 0.6 },
    { term: 'pleased',      score: 0.5 },
    { term: 'satisfied',    score: 0.5 },
    { term: 'helpful',      score: 0.5 },
    { term: 'thank',        score: 0.4 },
    { term: 'thanks',       score: 0.4 },
    { term: 'appreciate',   score: 0.5 },
    { term: 'good',         score: 0.4 },
    { term: 'nice',         score: 0.4 },
    { term: 'perfect',      score: 0.7 },
    { term: 'recommend',    score: 0.6 },
    { term: 'outstanding',  score: 0.8 },
    { term: 'impressed',    score: 0.6 },
    { term: 'smooth',       score: 0.4 },
  ],
  negative: [
    { term: 'terrible',     score: -0.8 },
    { term: 'awful',        score: -0.8 },
    { term: 'horrible',     score: -0.8 },
    { term: 'worst',        score: -0.9 },
    { term: 'hate',         score: -0.8 },
    { term: 'furious',      score: -0.9 },
    { term: 'angry',        score: -0.7 },
    { term: 'upset',        score: -0.6 },
    { term: 'disappointed', score: -0.6 },
    { term: 'frustrated',   score: -0.7 },
    { term: 'unacceptable', score: -0.8 },
    { term: 'disgrace',     score: -0.9 },
    { term: 'disgusted',    score: -0.9 },
    { term: 'incompetent',  score: -0.8 },
    { term: 'useless',      score: -0.7 },
    { term: 'broken',       score: -0.5 },
    { term: 'faulty',       score: -0.5 },
    { term: 'wrong',        score: -0.4 },
    { term: 'bad',          score: -0.5 },
    { term: 'poor',         score: -0.5 },
    { term: 'pathetic',     score: -0.8 },
    { term: 'ridiculous',   score: -0.7 },
    { term: 'outrageous',   score: -0.8 },
    { term: 'wasted',       score: -0.5 },
    { term: 'rude',         score: -0.7 },
    { term: 'ignored',      score: -0.6 },
  ],
  // Negation words flip the sign of the next sentiment word
  negators: ['not', 'no', 'never', "don't", "doesn't", "didn't",
             "won't", "wouldn't", "can't", "couldn't", "isn't", "aren't"],
  // Intensifiers multiply the sentiment score of the next word
  intensifiers: {
    'very':        1.5,
    'extremely':   2.0,
    'incredibly':  2.0,
    'absolutely':  1.8,
    'totally':     1.5,
    'completely':  1.5,
    'utterly':     1.8,
    'really':      1.3,
    'quite':       1.2,
    'rather':      1.1,
    'somewhat':    0.8,
    'slightly':    0.7,
    'barely':      0.6,
  },
};
