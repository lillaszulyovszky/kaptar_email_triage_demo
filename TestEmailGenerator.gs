/**
 * TestEmailGenerator.gs
 * Generates and optionally sends 60 realistic test emails to validate
 * the Kaptar Email Triage System.
 *
 * Usage (from the Apps Script editor):
 *   runAnalysisOnTestEmails()  – Runs the analyser against all 60 scenarios
 *                                and prints a results table to the Logger.
 *                                No emails sent. No side effects.
 *
 *   sendTestEmailsToSelf()     – Sends all 60 emails to your own Gmail
 *                                address so you can observe live triage.
 *                                ⚠ Will create 60 real emails in your inbox!
 *
 *   runSingleScenario(index)   – Analyses scenario at the given 0-based index.
 */

// ---------------------------------------------------------------------------
// SCENARIO LIBRARY — 60 realistic coworking space emails
// ---------------------------------------------------------------------------
// Each scenario has:
//   from            – sender display name + email
//   subject         – email subject line
//   body            – plain-text body
//   expectedCategory – the correct triage result (for accuracy reporting)
// ---------------------------------------------------------------------------

function _getScenarios() {
  return [
    // ================================================================
    // BILLING (10 scenarios)
    // ================================================================
    {
      from: 'Anna Kovács <anna.kovacs@startupxyz.com>',
      subject: 'Invoice #1087 – incorrect amount',
      body: 'Hello,\n\nI received invoice #1087 for April and the total shows €450, but my monthly membership plan is €350. There appears to be an extra charge of €100 that I don\'t recognise. Could you please review and send a corrected invoice or clarify what the additional charge is for?\n\nThank you,\nAnna',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Bence Molnár <bence.m@freelancer.io>',
      subject: 'Payment confirmation needed',
      body: 'Hi there,\n\nI made a bank transfer on 3rd March for my hot desk day pass (€15). I haven\'t received a receipt or confirmation yet. Could you confirm that the payment was received?\n\nRegards, Bence',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Claire Dupont <claire@remoteagency.fr>',
      subject: 'Refund request – duplicate charge',
      body: 'Good morning,\n\nI noticed that my credit card was charged twice in February – once on the 1st and again on the 3rd, both for €200 (my Flexi membership). I believe this is a billing error and would like a refund for one of the charges. Please let me know how to proceed.\n\nBest,\nClaire',
      expectedCategory: 'BILLING',
    },
    {
      from: 'David Kim <d.kim@koreaglobal.com>',
      subject: 'VAT invoice for company expenses',
      body: 'Hello,\n\nI need a VAT invoice for my coworking subscription for Q1 2024. My company is registered for VAT and requires a proper tax document for expense reimbursement. Our VAT number is HU12345678. Could you send this to my email?\n\nThank you,\nDavid',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Eva Szabó <eva.szabo@design.hu>',
      subject: 'Late fee question',
      body: 'Hi,\n\nI see a late fee of €25 on my latest invoice. My payment was delayed because I was traveling, but I sent the transfer within the grace period mentioned in my contract. Can you waive this fee given the circumstances? I have been a member for 18 months without any previous late payments.',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Frank Weber <frank@austrian-consulting.at>',
      subject: 'Direct debit failed – what to do?',
      body: 'Hello,\n\nI received a notification that my direct debit failed this month. My bank changed my account number last week. How can I update my payment details and when will you retry the charge?\n\nFrank',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Grace Liu <grace.liu@ecommerce.sg>',
      subject: 'Annual membership pricing',
      body: 'Hi,\n\nI\'m interested in switching from monthly to an annual plan. Could you tell me the annual price for the Dedicated Desk plan and whether I\'d get a discount compared to paying monthly? I\'d also like to know if I can transfer my remaining monthly days to the new plan.\n\nThanks, Grace',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Héctor Ramírez <hector@mexicotech.mx>',
      subject: 'Re: Overdue invoice reminder',
      body: 'Hello,\n\nI received your overdue invoice reminder but I already sent the payment by bank transfer on 10 April. Please check your records. My transaction reference is TXN-20240410-8832. If you still cannot locate it, let me know and I will send a bank statement.\n\nHéctor',
      expectedCategory: 'BILLING',
    },
    {
      from: 'Isabel Ferreira <isabel.f@lisbondigital.pt>',
      subject: 'Discount code not working at checkout',
      body: 'Hi,\n\nI received a promo code KAPTAR20 from the Budapest Digital Nomad event last week, but when I try to apply it at checkout it says "invalid code". Could you check if it\'s still valid and help me apply it to my first month?\n\nThank you, Isabel',
      expectedCategory: 'BILLING',
    },
    {
      from: 'James O\'Brien <james@dublinremote.ie>',
      subject: 'Billing statement request',
      body: 'Dear team,\n\nCould you please send me a complete billing statement for the period January–March 2024? I need it for my accountant. Preferably in PDF format with all transaction dates, descriptions and amounts.\n\nKind regards,\nJames O\'Brien',
      expectedCategory: 'BILLING',
    },

    // ================================================================
    // BOOKING (10 scenarios)
    // ================================================================
    {
      from: 'Kata Horváth <kata.h@agencybudapest.hu>',
      subject: 'Board room booking for 15 people – 20 June',
      body: 'Hello,\n\nI\'d like to book your largest conference room for a full-day workshop on 20 June. We expect around 15 participants. Does your Board Room accommodate that many? Please let me know the price and how to confirm the reservation.\n\nKata',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Liam Murphy <liam.murphy@techstartup.ie>',
      subject: 'Hot desk availability next week',
      body: 'Hi,\n\nI\'m visiting Budapest from Dublin next week (Mon 24 – Fri 28 June). Do you have hot desk availability for all 5 days? I\'d prefer a spot near a window if possible. What time can I check in?\n\nLiam',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Mia Chen <mia.chen@remoteco.com>',
      subject: 'Cancelling my meeting room reservation',
      body: 'Hello,\n\nI need to cancel my Focus Room reservation for tomorrow, 18 June at 2pm. The client meeting has been postponed. Will I receive a full refund or credit? Reference number is MR-2024-0891.\n\nThanks, Mia',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Noel Bergström <noel.b@stockholmventures.se>',
      subject: 'Private office – 6-month block booking',
      body: 'Hi,\n\nMy company is expanding our Budapest operations and we\'d like to block-book a private office for 6 months (August–January). We need space for 4 people. Could you provide pricing and availability? We\'d prefer a ground-floor or easily accessible space.\n\nNoel',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Olivia Patel <olivia.p@londondesign.co.uk>',
      subject: 'Event space for product launch',
      body: 'Dear Kaptar team,\n\nWe are planning a product launch event on 5 July for approximately 40 attendees. We\'d need the event space from 6pm to 10pm, including AV equipment and a standing reception area. Is this possible? Could you send me a quote?\n\nOlivia Patel\nMarketing Director',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Péter Varga <peter.varga@budapestlaw.hu>',
      subject: 'Reschedule room booking to next Thursday',
      body: 'Hello,\n\nCould you please move my Focus Room booking from Thursday 20 June (10am–12pm) to Thursday 27 June at the same time? Booking ref: FR-2024-0445. I hope the slot is still available.\n\nThank you,\nPéter',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Quin Zhang <quin.z@shanghaitech.cn>',
      subject: 'Day pass for a group of 3',
      body: 'Hi,\n\nMy colleagues and I (3 people total) will be in Budapest on 25 June and need day passes for that day. Do you offer group rates? We\'d also need access to a printer. Please let me know how to book.\n\nQuin',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Rachel Hoffman <rachel.h@berlinfintech.de>',
      subject: 'Check-in time for tomorrow',
      body: 'Hello,\n\nI\'ve booked a hot desk for tomorrow (19 June). What time does check-in open? I have a 7:30am call and would need to be settled by then. Is early access possible?\n\nRachel',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Sam Adeyemi <sam.a@lagosglobal.ng>',
      subject: 'Capacity of Focus Room',
      body: 'Hi,\n\nWhat is the maximum capacity of your Focus Room? We\'re a team of 5 and need a quiet space for a 2-hour strategy session. If the Focus Room is too small, what\'s the next option?\n\nSam',
      expectedCategory: 'BOOKING',
    },
    {
      from: 'Tunde Fekete <tunde.fekete@marketingpro.hu>',
      subject: 'Time slot availability – Saturday 22 June',
      body: 'Hello,\n\nI know you\'re normally closed on Saturdays but I saw that you sometimes open for private bookings. Is there any availability on Saturday 22 June for a half-day workshop (9am–1pm, 8 participants)?\n\nTunde',
      expectedCategory: 'BOOKING',
    },

    // ================================================================
    // COMPLAINT (10 scenarios)
    // ================================================================
    {
      from: 'Ursula Steiner <ursula.s@viennadesign.at>',
      subject: 'Unacceptable noise levels this morning',
      body: 'I need to formally complain about the noise level in the main coworking area this morning. There was a group of 8 people having a loud meeting right next to the quiet zone, and despite asking twice, nobody from staff intervened. This is completely unacceptable when I\'m paying for a professional work environment. I expect a proper response and assurance this won\'t happen again.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Victor Russo <victor.russo@milanstudio.it>',
      subject: 'Internet has been down for 3 hours',
      body: 'This is ridiculous. The WiFi has been completely down since 9am and it\'s now noon. I have missed two important client calls because of this. Nobody at reception could tell me when it would be fixed. This is not acceptable for a coworking space that markets itself on reliable high-speed internet. I want to know what compensation will be offered for today.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Wendy Park <wendy.p@seoulcreative.kr>',
      subject: 'Dirty kitchen and toilets',
      body: 'Hello,\n\nI want to raise a complaint about the cleanliness of the shared facilities. The kitchen was filthy when I arrived this morning – dirty cups left in the sink, coffee spilled on the counter. The toilets also hadn\'t been cleaned. As a paying member I expect a clean environment. Please address this immediately.\n\nWendy',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Xavier Fontaine <xavier.f@paristech.fr>',
      subject: 'Staff member was rude to me',
      body: 'I am writing to complain about the behaviour of one of your staff members. When I arrived this morning and asked about my booking, the person at the front desk was dismissive and rude. This is not the kind of service I expect from a premium coworking space. I am considering cancelling my membership over this incident.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Yasmin Al-Rashid <yasmin@dubaistartup.ae>',
      subject: 'Projector broken – ruined my presentation',
      body: 'Dear Kaptar,\n\nYour projector in the Board Room was not working during my presentation yesterday. Despite reporting this beforehand, no one resolved the issue in time. I had to present from a tiny laptop screen to 10 clients, which was deeply unprofessional. This reflects very poorly on your facilities. I expect compensation or at minimum a free future booking.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Zoltán Papp <zoltan.papp@debrecen.hu>',
      subject: 'Worst experience – ignored for 20 minutes',
      body: 'This is the worst experience I\'ve had at any coworking space. I stood at reception for 20 minutes waiting to check in while two staff members chatted with each other. When I finally got help, I was given the wrong locker key. The whole morning was a disaster. I\'m seriously considering escalating this to consumer protection authorities.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Amy Holden <amy.holden@manchestermedia.co.uk>',
      subject: 'Re: My complaint from last week – still no response',
      body: 'I emailed you 6 days ago about a billing error and have received absolutely no response. This is completely unprofessional. I am now very unhappy with your service. If I do not hear back within 24 hours I will be contacting my bank to dispute the charge and leaving a negative review on every platform I can find. This is disgraceful customer service.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Brian Toth <brian.toth@entrepreneur.hu>',
      subject: 'Air conditioning too cold – health concern',
      body: 'Hello,\n\nI\'ve complained to staff three times this week about the air conditioning being set to an extremely low temperature. It\'s so cold I\'ve developed a sore throat. Other members have complained too. This is a health and safety issue. Please set the temperature to a comfortable level or provide alternative options.\n\nBrian',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Carol Smith <carol.s@birminghambiz.co.uk>',
      subject: 'Package lost by reception',
      body: 'Dear team,\n\nI had an important business package delivered to your address last Tuesday. Reception signed for it but now nobody can find it. This package contained client contracts worth significant value. I am appalled that something this important could be lost. I need this resolved urgently or I will pursue legal action.',
      expectedCategory: 'COMPLAINT',
    },
    {
      from: 'Dmitri Volkov <dmitri.v@moscowtech.ru>',
      subject: 'Membership cancelled without notice',
      body: 'I am furious. My membership access was cancelled this morning without any warning or communication. I had meetings scheduled and could not access the building. When I called, I was told there was a payment issue, but I never received any reminder or notice. This is completely unacceptable. I demand my access be restored immediately and an explanation for the lack of communication.',
      expectedCategory: 'COMPLAINT',
    },

    // ================================================================
    // INFO REQUEST (10 scenarios)
    // ================================================================
    {
      from: 'Elena Rossi <elena.r@milan.it>',
      subject: 'Do you offer day passes?',
      body: 'Hello,\n\nI\'ll be in Budapest for a week on business and I\'m wondering if you offer day passes without a long-term commitment. How much do they cost and what\'s included? Do I need to book in advance?\n\nThanks, Elena',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Finn Andersen <finn.a@copenhagendesign.dk>',
      subject: 'Parking information',
      body: 'Hi,\n\nI drive to work and I\'m wondering if Kaptar has dedicated parking or if there\'s a convenient car park nearby. How much does it cost? Is it safe?\n\nFinn Andersen',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Giulia Marino <giulia.m@romeagency.it>',
      subject: 'Opening hours',
      body: 'Buongiorno / Good morning,\n\nCould you please confirm your opening hours? I need to know the earliest time I can access the space and the latest I can stay. Do you have 24/7 access for any membership tier?\n\nGrazie, Giulia',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Hans Mueller <hans.m@frankfurtcorp.de>',
      subject: 'Internet speed and reliability',
      body: 'Hello,\n\nI work in video production and need reliable, fast internet for uploading large files. What is the internet speed at Kaptar? Is it dedicated or shared? Any SLA guarantees?\n\nHans',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Iris Nakamura <iris.n@tokyostartup.jp>',
      subject: 'Do you offer virtual office services?',
      body: 'Dear Kaptar team,\n\nI am setting up a European entity for my Japanese company and need a prestigious Budapest business address for mail and registration purposes. Do you provide virtual office services? What documents do you accept for company registration?\n\nIris Nakamura',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Jack O\'Connor <jack.o@galwaytech.ie>',
      subject: 'Can I bring my dog?',
      body: 'Hi,\n\nI have a very well-behaved Golden Retriever and was wondering if Kaptar is pet-friendly. I work with him beside me every day and would love to bring him along if possible.\n\nJack',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Karin Svensson <karin.s@goteborg.se>',
      subject: 'Printing and scanning facilities',
      body: 'Hello,\n\nI frequently need to print contracts and scan documents. What printing/scanning facilities does Kaptar offer? Is there a limit on pages? What\'s the cost per page above the limit?\n\nKarin',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Leo Martínez <leo.m@barcelonadesign.es>',
      subject: 'Are there showers?',
      body: 'Hola,\n\nI cycle to work and was wondering if Kaptar has shower facilities? Also, is there secure bicycle storage?\n\nLeo',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Maria Santos <maria.s@lisboafreelance.pt>',
      subject: 'How do I book a tour?',
      body: 'Hello,\n\nI\'d love to visit Kaptar before committing to a membership. How can I arrange a tour? Are there specific days/times available? Can I try working there for a day first?\n\nMaria',
      expectedCategory: 'INFO_REQUEST',
    },
    {
      from: 'Nathan Brooks <nathan.b@sydneyremote.au>',
      subject: 'What amenities are included?',
      body: 'Hi,\n\nI\'m considering a hot desk membership. Could you list all the amenities that are included? I\'m particularly interested in whether coffee, phone booths, lockers and event access are included in the base price.\n\nNathan',
      expectedCategory: 'INFO_REQUEST',
    },

    // ================================================================
    // MEMBERSHIP (10 scenarios)
    // ================================================================
    {
      from: 'Orsolya Kiss <orsolya.k@budapeststartup.hu>',
      subject: 'Upgrading from Flexi to Dedicated Desk',
      body: 'Hi,\n\nI\'ve been a Flexi member for 3 months and I\'d like to upgrade to a Dedicated Desk plan. Can I do this mid-month and if so, will my billing date change? Will there be a new contract to sign?\n\nOrsolya',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Patrick Brennan <patrick.b@dublinconsulting.ie>',
      subject: 'Cancel my membership – moving cities',
      body: 'Hello,\n\nUnfortunately I\'m moving back to Dublin next month and won\'t be able to continue my membership. I\'d like to cancel as of 1 July. Can you confirm the notice period and what my final bill will be?\n\nThank you,\nPatrick',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Rhea Patel <rhea.p@londonlaw.co.uk>',
      subject: 'Membership renewal – want to negotiate terms',
      body: 'Dear Kaptar team,\n\nMy annual membership is up for renewal next month. I\'ve been a loyal member for 2 years. I\'d like to discuss renewing but I\'m seeing better prices at a competitor. Can we schedule a call to discuss my options?\n\nRhea',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Soren Lindqvist <soren.l@stockholmlaw.se>',
      subject: 'Starting a free trial',
      body: 'Hi,\n\nI\'d like to start a free trial to evaluate whether Kaptar suits my needs. I\'m a freelance lawyer and need a professional environment and occasional meeting rooms. How do I sign up and what\'s included in the trial?\n\nSoren',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Teresa García <teresa.g@madridmedia.es>',
      subject: 'Team membership for 6 people',
      body: 'Hello,\n\nMy company is growing and we need 6 desks. Do you offer team or corporate membership packages? We need 24/7 access, dedicated desks, and regular meeting room usage. Please send pricing options.\n\nTeresa',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Umar Hassan <umar.h@karachicorp.pk>',
      subject: 'What is the notice period for terminating my contract?',
      body: 'Good morning,\n\nI signed up for a 6-month membership and I\'m now considering terminating early. What is the notice period? Are there any early termination fees?\n\nUmar Hassan',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Veronika Szabó <veronika.sz@debrecen.hu>',
      subject: 'Benefits of the Pro membership plan',
      body: 'Hello,\n\nI\'m considering the Pro plan for myself and a colleague. Could you detail all the benefits that come with it? Specifically I\'m interested in storage, guest passes, and whether it includes the event space.\n\nVeronika',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Will Turner <will.t@edinburghtech.co.uk>',
      subject: 'Pausing my membership for 2 months',
      body: 'Hi,\n\nI\'m going on sabbatical for July and August. Is it possible to pause my Dedicated Desk membership for 2 months? I\'d like to keep my desk and locker but not pay full price while I\'m away.\n\nWill',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Xiaoming Wu <xiaoming.w@beijingtech.cn>',
      subject: 'Transferring membership to a colleague',
      body: 'Hello,\n\nI\'m leaving Budapest in 3 weeks but my colleague Zhang Wei would like to take over my Dedicated Desk plan. Is membership transfer possible? Do you charge an admin fee?\n\nXiaoming',
      expectedCategory: 'MEMBERSHIP',
    },
    {
      from: 'Yael Cohen <yael.c@tel-avivdigital.il>',
      subject: 'Monthly vs annual plan – which is better value?',
      body: 'Hi,\n\nI\'m a freelance developer and I\'m not sure how long I\'ll stay in Budapest. Can you break down the total cost for monthly vs annual plans for the Flexi tier? I want to know the break-even point.\n\nYael',
      expectedCategory: 'MEMBERSHIP',
    },

    // ================================================================
    // SPAM (5 scenarios)
    // ================================================================
    {
      from: 'deals@superoffers247.com',
      subject: 'LIMITED TIME OFFER – Click here now!!!',
      body: 'Dear Friend,\n\nCONGRATULATIONS! You have been selected as a WINNER of our exclusive prize draw. Click here NOW to claim your FREE gift. Limited time offer – act now before it expires!\n\nUnsubscribe | Opt out',
      expectedCategory: 'SPAM',
    },
    {
      from: 'marketing@weightlossmiracle.net',
      subject: 'Lose 20kg in 30 days – 100% guaranteed!',
      body: 'Amazing weight loss breakthrough! 100% free trial. No obligation. Guaranteed results or your money back. Click here to claim your free bottle. Risk free offer.',
      expectedCategory: 'SPAM',
    },
    {
      from: 'prince.akin@legacy-transfer.ng',
      subject: 'Confidential Business Proposal – Inheritance',
      body: 'Dear Friend,\n\nI am Prince Akin, son of the late General Ibrahim. I have an inheritance of $45 million USD to transfer. I need a trusted partner to help me. You will receive 30% commission. This is completely risk free and legal. Please reply urgently.',
      expectedCategory: 'SPAM',
    },
    {
      from: 'earnings@workfromhomepro.biz',
      subject: 'Earn €5000/month working from home',
      body: 'Work from home and earn money fast! Make €5000 per month from home. No experience needed. Guaranteed income. Click here to learn more. Bulk email. Unsubscribe to opt out.',
      expectedCategory: 'SPAM',
    },
    {
      from: 'casino-bonus@luckyspins.com',
      subject: '500 FREE SPINS – Claim before midnight!',
      body: 'You have been selected to receive 500 FREE casino spins! Click here to claim. No deposit required. Play slots, blackjack and roulette. 18+. Gambling can be addictive.',
      expectedCategory: 'SPAM',
    },

    // ================================================================
    // EDGE CASES (15 scenarios)
    // ================================================================

    // Multi-topic: Billing + Complaint
    {
      from: 'Adam Novák <adam.n@brnotech.cz>',
      subject: 'Double charge AND broken printer',
      body: 'I am writing about two separate issues. First, I was charged twice for my invoice last month and want a refund. Second, the printer has been broken for a week and nobody has fixed it, which is completely unacceptable. I am very frustrated with the service quality.',
      expectedCategory: 'BILLING',
    },

    // Multi-topic: Booking + Info Request
    {
      from: 'Beth Carter <beth.c@brightonfreelance.co.uk>',
      subject: 'Event space enquiry and booking',
      body: 'Hello,\n\nI\'d like to find out more about your event space – what\'s the maximum capacity, does it have AV equipment, and is catering allowed? I\'m also interested in booking it for Saturday 29 June if available. Can you confirm and provide a quote?\n\nBeth',
      expectedCategory: 'BOOKING',
    },

    // Multi-topic: Membership + Billing
    {
      from: 'Carlo Bianchi <carlo.b@florencedesign.it>',
      subject: 'Upgrading plan – what will my next invoice look like?',
      body: 'Hi,\n\nI\'m planning to upgrade from Flexi (€200/month) to Dedicated Desk (€350/month) next week. My current billing cycle runs 15th–14th. Will I be charged a pro-rated amount for the remainder of the month? What will appear on my next invoice?\n\nCarlo',
      expectedCategory: 'MEMBERSHIP',
    },

    // Sarcasm: positive words + complaint context
    {
      from: 'Dan O\'Malley <dan.om@corkdigital.ie>',
      subject: 'Oh great – the wifi is down again',
      body: 'Oh wonderful, the WiFi is down again for the third time this week. Brilliant management as usual. The connection has been absolutely terrible lately and clearly nobody cares to fix it properly. What a great coworking space this is turning out to be.',
      expectedCategory: 'COMPLAINT',
    },

    // Very short email
    {
      from: 'Emi Tanaka <emi.t@osaka.jp>',
      subject: 'Invoice',
      body: 'Hi, where is my invoice for June? Thanks',
      expectedCategory: 'BILLING',
    },

    // Foreign language (Hungarian)
    {
      from: 'Ferenc Balogh <f.balogh@miskolc.hu>',
      subject: 'Számlával kapcsolatban',
      body: 'Tisztelt Kaptar Csapat,\n\nSzeretnék rákérdezni a júniusi számlámra. Nem kaptam meg a fizetési visszaigazolást, pedig utalásom teljesült. Kérem nézzenek utána.\n\nÜdvözlettel,\nBalogh Ferenc',
      expectedCategory: 'BILLING',
    },

    // Very polite cancellation (low sentiment but not complaint)
    {
      from: 'Georgia Matthews <georgia.m@londonfreelance.co.uk>',
      subject: 'Ending my membership – thank you for everything',
      body: 'Dear team,\n\nI\'m writing to give my 30-day notice to cancel my membership. I\'ve genuinely loved being part of the Kaptar community and the team has always been wonderful. Unfortunately I\'m going back to my home office to cut costs. Please confirm the cancellation process.\n\nWith gratitude,\nGeorgia',
      expectedCategory: 'MEMBERSHIP',
    },

    // Highly ambiguous: could be Billing or Membership
    {
      from: 'Hiroshi Yamamoto <h.yamamoto@kyoto.jp>',
      subject: 'Questions about upgrading and next invoice',
      body: 'Hello,\n\nIf I upgrade my membership plan this week, will it affect my current invoice? I want to understand the billing cycle for the new plan before committing. Also, is there a discount for paying 3 months upfront?\n\nHiroshi',
      expectedCategory: 'MEMBERSHIP',
    },

    // Info Request disguised as casual question
    {
      from: 'Ingrid Holm <ingrid.h@bergendesign.no>',
      subject: 'Quick question!',
      body: 'Hey, do you guys have standing desks? I have a bad back and can\'t sit all day. Also do you have any lockers for storage?\n\nIngrid',
      expectedCategory: 'INFO_REQUEST',
    },

    // VIP email (should match VIP list domain)
    {
      from: 'James Harrington <james@goldmember.com>',
      subject: 'Private office for 10 people',
      body: 'Hello,\n\nWe are evaluating Budapest as a new office location for our EMEA team. We need a private office for 10 people with enterprise-grade connectivity and dedicated IT support. Can we arrange a visit?\n\nJames Harrington\nGoldmember Corp',
      expectedCategory: 'BOOKING',
    },

    // Complaint with legal threat
    {
      from: 'Karen Walsh <karen.w@legal.ie>',
      subject: 'Legal notice – breach of contract',
      body: 'Dear Kaptar,\n\nDespite multiple attempts to resolve this billing dispute, I have received no satisfactory response. I am now engaging my solicitor and intend to pursue this through the courts if the refund of €350 is not issued within 7 days. Please be advised that this email constitutes formal notice.\n\nKaren Walsh, Solicitor',
      expectedCategory: 'COMPLAINT',
    },

    // Booking via very indirect language
    {
      from: 'Louis Chevalier <louis.c@parisfilm.fr>',
      subject: 'Would love to use your space for filming',
      body: 'Hello,\n\nI\'m a documentary filmmaker and I\'m working on a project about the European startup scene. I\'d love to schedule a half-day shoot at your coworking space – probably 5–8 crew members, some lighting equipment. Is this something you\'d be open to arranging?\n\nLouis',
      expectedCategory: 'BOOKING',
    },

    // Info request that mentions membership (but primary intent is info)
    {
      from: 'Marina Ivanova <marina.i@sofia.bg>',
      subject: 'Tell me more about Kaptar',
      body: 'Hello,\n\nI found Kaptar on Google and I\'m curious to learn more. What types of memberships do you offer and what is the pricing? Are there any hidden fees? How far are you from the city centre?\n\nMarina',
      expectedCategory: 'INFO_REQUEST',
    },

    // Spam that uses coworking language (edge case)
    {
      from: 'deals@coworkingoffers.biz',
      subject: 'Free coworking membership – claim now!',
      body: 'Congratulations! You\'ve won a FREE coworking membership. Act now – limited time offer. Click here to claim. 100% free, no obligation. Opt out to unsubscribe. Bulk email service.',
      expectedCategory: 'SPAM',
    },

    // Neutral / ambiguous email
    {
      from: 'Nils Eriksson <nils.e@malmo.se>',
      subject: 'Following up',
      body: 'Hi,\n\nJust following up on my email from last week. Did you get a chance to look into it?\n\nThanks, Nils',
      expectedCategory: 'INFO_REQUEST', // Best guess given no other context
    },
  ];
}

// ---------------------------------------------------------------------------
// ANALYSIS RUNNER (no side effects)
// ---------------------------------------------------------------------------

/**
 * Runs the analyser against all 60 test scenarios and prints a results
 * table to the Apps Script Logger. Does not send emails or write to Sheets.
 *
 * Read the output via: View → Logs in the Apps Script editor.
 */
function runAnalysisOnTestEmails() {
  var scenarios = _getScenarios();
  var correct   = 0;
  var total     = scenarios.length;
  var results   = [];

  scenarios.forEach(function(scenario, index) {
    var mockMessage = _buildMockMessage(scenario);
    var analysis    = analyzeEmail(mockMessage);

    var isCorrect = analysis.category === scenario.expectedCategory;
    if (isCorrect) correct++;

    results.push({
      index:    index + 1,
      subject:  scenario.subject.substring(0, 50),
      expected: scenario.expectedCategory,
      got:      analysis.category,
      conf:     (analysis.confidence * 100).toFixed(0) + '%',
      ok:       isCorrect ? 'PASS' : 'FAIL',
    });
  });

  // Print header
  Logger.log('=== KAPTAR EMAIL TRIAGE — TEST RESULTS ===');
  Logger.log(
    _pad('#',   4) + ' ' +
    _pad('Subject',  52) + ' ' +
    _pad('Expected', 14) + ' ' +
    _pad('Got',      14) + ' ' +
    _pad('Conf', 6) + ' ' +
    'Result'
  );
  Logger.log('-'.repeat(110));

  results.forEach(function(r) {
    Logger.log(
      _pad(String(r.index), 4) + ' ' +
      _pad(r.subject,  52) + ' ' +
      _pad(r.expected, 14) + ' ' +
      _pad(r.got,      14) + ' ' +
      _pad(r.conf, 6) + ' ' +
      r.ok
    );
  });

  Logger.log('-'.repeat(110));
  var accuracy = Math.round((correct / total) * 1000) / 10;
  Logger.log('ACCURACY: ' + correct + '/' + total + ' (' + accuracy + '%)');
  Logger.log('Target: >85% | ' + (accuracy >= 85 ? '✓ PASSING' : '✗ BELOW TARGET'));
}

/**
 * Analyses a single test scenario by its 0-based index.
 * Useful for debugging a specific failing case.
 */
function runSingleScenario(index) {
  var scenarios = _getScenarios();
  if (index < 0 || index >= scenarios.length) {
    Logger.log('Index out of range. Valid: 0–' + (scenarios.length - 1));
    return;
  }

  var scenario    = scenarios[index];
  var mockMessage = _buildMockMessage(scenario);
  var analysis    = analyzeEmail(mockMessage);

  Logger.log('=== Scenario ' + (index + 1) + ' ===');
  Logger.log('From:     ' + scenario.from);
  Logger.log('Subject:  ' + scenario.subject);
  Logger.log('Expected: ' + scenario.expectedCategory);
  Logger.log('Got:      ' + analysis.category + ' (' + (analysis.confidence * 100).toFixed(1) + '%)');
  Logger.log('Secondary:' + (analysis.secondaryCategory || 'none'));
  Logger.log('Sentiment:' + analysis.sentimentLabel + ' (' + analysis.sentiment + ')');
  Logger.log('VIP:      ' + analysis.isVIP);
  Logger.log('Urgent:   ' + analysis.isUrgent);
  Logger.log('Sarcastic:' + analysis.isSarcastic);
  Logger.log('All scores:');
  Object.keys(analysis.allScores).forEach(function(cat) {
    var s = analysis.allScores[cat];
    Logger.log('  ' + _pad(cat, 14) + ' raw=' + s.raw + ' norm=' + s.normalised +
               ' matched=[' + s.matched.join(', ') + ']');
  });
}

// ---------------------------------------------------------------------------
// SEND TEST EMAILS TO SELF (creates real Gmail messages)
// ---------------------------------------------------------------------------

/**
 * sendTestEmailsToSelf()
 *
 * Sends all 60 test scenario emails to your own Gmail address so the live
 * triage trigger can process them.
 *
 * ⚠ WARNING: This creates 60 real emails in your inbox. Run only in a
 *   test / development Gmail account, not in production.
 *
 * Emails are sent in batches with a short delay to avoid Gmail rate limits.
 */
function sendTestEmailsToSelf() {
  var myEmail   = Session.getActiveUser().getEmail();
  var scenarios = _getScenarios();
  var batchSize = 10;
  var delay     = 2000; // ms between batches

  Logger.log('Sending ' + scenarios.length + ' test emails to: ' + myEmail);

  scenarios.forEach(function(scenario, index) {
    GmailApp.sendEmail(
      myEmail,
      '[TEST] ' + scenario.subject,
      scenario.body,
      {
        from:    myEmail,
        replyTo: scenario.from.match(/<(.+)>/)[1] || myEmail,
        name:    scenario.from.replace(/<.+>/, '').trim(),
      }
    );

    // Brief pause every batchSize emails
    if ((index + 1) % batchSize === 0) {
      Logger.log('Sent ' + (index + 1) + '/' + scenarios.length + '...');
      Utilities.sleep(delay);
    }
  });

  Logger.log('All ' + scenarios.length + ' test emails sent to ' + myEmail);
}

// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

/** Creates a minimal mock GmailMessage from a scenario object. */
function _buildMockMessage(scenario) {
  return {
    getFrom:    function() { return scenario.from; },
    getSubject: function() { return scenario.subject; },
    getBody:    function() { return scenario.body; },
    getId:      function() { return 'mock-' + Math.random().toString(36).slice(2); },
  };
}

/** Left-pads a string to exactly `len` characters. */
function _pad(str, len) {
  var s = String(str);
  if (s.length >= len) return s.substring(0, len);
  return s + ' '.repeat(len - s.length);
}
