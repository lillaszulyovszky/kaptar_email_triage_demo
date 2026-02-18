/**
 * Templates.gs
 * Auto-reply draft templates for the Kaptar Email Triage System.
 *
 * Each template function receives an `emailData` object (the analyzeEmail
 * result enriched with thread metadata) and returns an HTML string ready
 * to use as a Gmail draft body.
 *
 * Placeholders left intentionally:
 *   {{MEMBER_NAME}}   – personalised name if available, else "there"
 *   {{SENDER_NAME}}   – first name extracted from the From field
 */

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Returns an HTML draft body for the given category.
 * Falls back to a generic acknowledgement if no template exists.
 *
 * @param {string} category   Category name (matches CATEGORIES keys).
 * @param {Object} emailData  Result from analyzeEmail() + thread metadata.
 * @returns {{ subject: string, body: string }}
 */
function getTemplate(category, emailData) {
  var senderName = _extractFirstName(emailData.from);

  switch (category) {
    case 'BILLING':      return _billingTemplate(senderName, emailData);
    case 'BOOKING':      return _bookingTemplate(senderName, emailData);
    case 'COMPLAINT':    return _complaintTemplate(senderName, emailData);
    case 'INFO_REQUEST': return _infoRequestTemplate(senderName, emailData);
    case 'MEMBERSHIP':   return _membershipTemplate(senderName, emailData);
    case 'SPAM':         return null; // Never draft replies to spam
    default:             return _genericTemplate(senderName, emailData);
  }
}

// ---------------------------------------------------------------------------
// PRIVATE HELPERS
// ---------------------------------------------------------------------------

/** Extracts the first name from a "Full Name <email>" string. */
function _extractFirstName(from) {
  var nameMatch = from.match(/^([^<@]+)/);
  if (!nameMatch) return 'there';
  var parts = nameMatch[1].trim().split(/\s+/);
  return parts[0] || 'there';
}

/** Wraps body content in a consistent HTML email shell with signature. */
function _wrap(senderName, bodyContent) {
  return (
    '<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">' +
    '<p>Hi ' + senderName + ',</p>' +
    bodyContent +
    '<p>Best regards,<br>' +
    '<strong>Kaptar Team</strong><br>' +
    'Kaptar Coworking Space<br>' +
    '<a href="mailto:hello@kaptar.co">hello@kaptar.co</a> | +36 1 234 5678<br>' +
    '<a href="https://kaptar.co">kaptar.co</a></p>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// BILLING TEMPLATE
// ---------------------------------------------------------------------------
function _billingTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;
  var body = _wrap(senderName,
    '<p>Thank you for getting in touch regarding your billing enquiry.</p>' +
    '<p>We\'ve received your message and our finance team is already looking into this for you. ' +
    'You can expect a detailed response within <strong>1 business day</strong>.</p>' +
    '<p>In the meantime, here are a few quick links that may help:</p>' +
    '<ul>' +
    '<li><a href="https://kaptar.co/billing">View your billing history</a></li>' +
    '<li><a href="https://kaptar.co/invoices">Download invoices</a></li>' +
    '<li><a href="https://kaptar.co/payment-methods">Update payment details</a></li>' +
    '</ul>' +
    '<p>If your query is urgent, please call us on <strong>+36 1 234 5678</strong> ' +
    '(Mon–Fri, 9am–6pm CET) and reference your account email.</p>'
  );
  return { subject: subject, body: body };
}

// ---------------------------------------------------------------------------
// BOOKING TEMPLATE
// ---------------------------------------------------------------------------
function _bookingTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;
  var body = _wrap(senderName,
    '<p>Thanks for reaching out about a booking at Kaptar!</p>' +
    '<p>We\'d love to help you find the perfect space. Here\'s what\'s available:</p>' +
    '<table style="border-collapse: collapse; width: 100%; font-size: 13px;">' +
    '<tr style="background: #f5f5f5;">' +
    '<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Space</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Capacity</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Half-day</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Full day</th>' +
    '</tr>' +
    '<tr><td style="border: 1px solid #ddd; padding: 8px;">Focus Room</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">2–4</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€25</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€40</td></tr>' +
    '<tr style="background: #fafafa;"><td style="border: 1px solid #ddd; padding: 8px;">Board Room</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">8–12</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€60</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€100</td></tr>' +
    '<tr><td style="border: 1px solid #ddd; padding: 8px;">Event Hall</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">up to 50</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€150</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px;">€250</td></tr>' +
    '</table>' +
    '<p style="margin-top: 12px;">To book instantly, visit our <a href="https://kaptar.co/book">online booking portal</a>, ' +
    'or reply with your preferred date, time, and guest count and we\'ll confirm availability within a few hours.</p>' +
    '<p><strong>Members</strong> enjoy a 20% discount on all room bookings — just log in first.</p>'
  );
  return { subject: subject, body: body };
}

// ---------------------------------------------------------------------------
// COMPLAINT TEMPLATE
// ---------------------------------------------------------------------------
function _complaintTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;
  var urgencyNote = emailData.isVIP
    ? '<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">' +
      '<strong>Your account has been flagged for priority handling.</strong> ' +
      'A senior team member will be in touch within 2 hours.</p>'
    : '';

  var body = _wrap(senderName,
    '<p>Thank you for contacting us and for taking the time to share your experience.</p>' +
    '<p>We\'re truly sorry to hear that things didn\'t meet your expectations. ' +
    'This is not the standard of service we pride ourselves on, and we take your feedback very seriously.</p>' +
    urgencyNote +
    '<p>A member of our team will review your message and be in touch within <strong>4 business hours</strong> ' +
    'with a resolution or update.</p>' +
    '<p>In the meantime, if you\'d prefer to speak with someone directly, please call ' +
    '<strong>+36 1 234 5678</strong> and ask for our Member Experience team.</p>' +
    '<p>We genuinely appreciate you giving us the opportunity to make this right.</p>'
  );
  return { subject: subject, body: body };
}

// ---------------------------------------------------------------------------
// INFO REQUEST TEMPLATE
// ---------------------------------------------------------------------------
function _infoRequestTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;
  var body = _wrap(senderName,
    '<p>Thanks for your interest in Kaptar Coworking Space!</p>' +
    '<p>Here\'s a quick overview of what we offer:</p>' +
    '<ul>' +
    '<li><strong>Hot desks</strong> – from €15/day or €200/month</li>' +
    '<li><strong>Dedicated desks</strong> – from €350/month (24/7 access)</li>' +
    '<li><strong>Private offices</strong> – from €600/month (2–10 people)</li>' +
    '<li><strong>Virtual office</strong> – from €50/month (business address + mail handling)</li>' +
    '<li><strong>Meeting rooms</strong> – bookable by the hour</li>' +
    '</ul>' +
    '<p><strong>What\'s included for all members:</strong></p>' +
    '<ul>' +
    '<li>High-speed fibre internet (500 Mbps up/down)</li>' +
    '<li>Unlimited tea, coffee &amp; filtered water</li>' +
    '<li>Access to community events and workshops</li>' +
    '<li>On-site printing (10 pages/day free)</li>' +
    '<li>24/7 secure access (Dedicated &amp; Private plans)</li>' +
    '</ul>' +
    '<p><strong>Location:</strong> Kaptar, Paulay Ede utca 12, Budapest 1061 ' +
    '(<a href="https://kaptar.co/find-us">map &amp; directions</a>)<br>' +
    '<strong>Hours:</strong> Mon–Fri 8am–8pm | Sat 10am–4pm | 24/7 for members</p>' +
    '<p>We\'d love to show you around — <a href="https://kaptar.co/tour">book a free tour</a> ' +
    'or just pop in during opening hours.</p>'
  );
  return { subject: subject, body: body };
}

// ---------------------------------------------------------------------------
// MEMBERSHIP TEMPLATE
// ---------------------------------------------------------------------------
function _membershipTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;

  // Detect whether this looks like a cancellation request
  var isCancellation = emailData.bodySnippet
    ? (emailData.bodySnippet.toLowerCase().indexOf('cancel') !== -1 ||
       emailData.bodySnippet.toLowerCase().indexOf('terminate') !== -1 ||
       emailData.bodySnippet.toLowerCase().indexOf('leaving') !== -1)
    : false;

  var specificContent = isCancellation
    ? '<p>We\'re sad to hear you\'re considering leaving Kaptar. ' +
      'Before we process anything, we\'d love to understand if there\'s anything we can do to ' +
      'improve your experience — sometimes a plan change or a quick chat with our team resolves things.</p>' +
      '<p>If you\'d still like to proceed, please be aware of our <strong>30-day notice period</strong>. ' +
      'Your membership will remain active until the end of that period and no further charges will be made afterwards.</p>' +
      '<p>A member of our team will be in touch within 1 business day to confirm next steps.</p>'
    : '<p>We\'re thrilled you\'re interested in becoming part of the Kaptar community!</p>' +
      '<p>Here\'s a summary of our membership plans:</p>' +
      '<ul>' +
      '<li><strong>Flexi (Hot Desk)</strong> – €200/month · 5 days/week access · 2 hrs meeting room/month</li>' +
      '<li><strong>Regular (Dedicated Desk)</strong> – €350/month · 24/7 access · 5 hrs meeting room/month</li>' +
      '<li><strong>Pro (Private Office)</strong> – from €600/month · 24/7 · 10 hrs meeting room/month · storage</li>' +
      '<li><strong>Virtual</strong> – €50/month · business address · mail scanning · 4 hrs drop-in/month</li>' +
      '</ul>' +
      '<p>All plans include a <strong>7-day free trial</strong>. No credit card required to start.</p>' +
      '<p><a href="https://kaptar.co/join">Start your free trial →</a></p>';

  var body = _wrap(senderName,
    '<p>Thank you for getting in touch about your Kaptar membership.</p>' +
    specificContent +
    '<p>Feel free to reply if you have any questions — we\'re happy to help.</p>'
  );
  return { subject: subject, body: body };
}

// ---------------------------------------------------------------------------
// GENERIC FALLBACK TEMPLATE
// ---------------------------------------------------------------------------
function _genericTemplate(senderName, emailData) {
  var subject = 'Re: ' + emailData.subject;
  var body = _wrap(senderName,
    '<p>Thank you for getting in touch with Kaptar.</p>' +
    '<p>We\'ve received your message and will get back to you as soon as possible, ' +
    'typically within <strong>1 business day</strong>.</p>' +
    '<p>If your matter is urgent, please call us on <strong>+36 1 234 5678</strong> ' +
    '(Mon–Fri, 9am–6pm CET).</p>'
  );
  return { subject: subject, body: body };
}
