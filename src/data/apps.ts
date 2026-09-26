/**
 * SINGLE SOURCE OF TRUTH for the LaunchGrid app catalogue.
 *
 * Drives /apps, every /apps/<slug> page, the sitemap and the structured data.
 * Adding an app means adding one entry here plus its assets under
 * public/apps/<slug>/.
 *
 * ON METRICS — READ THIS BEFORE FILLING THEM IN
 *   `rating`, `ratingCount` and `installs` must be the REAL figures from the
 *   Play Console, or left undefined. They are not decoration: when a rating is
 *   present the page emits schema.org `aggregateRating`, which Google treats
 *   as a factual claim. A made-up rating is a structured-data policy violation
 *   and earns a manual action — which would bury these pages rather than rank
 *   them. This codebase already had one invented aggregateRating (4.9 from
 *   "142 reviews", with no review system behind it); it was removed for
 *   exactly this reason. Undefined is always safe: the page simply omits the
 *   block.
 *
 * ON DESCRIPTIONS
 *   Everything below is written from each app's own privacy policy, which is
 *   the only authoritative source in this repo. Check each against its live
 *   Play listing before pushing for indexing — a store listing and a landing
 *   page that describe different products is a bad search result and a worse
 *   first impression.
 */

import {
  Baby,
  BellRing,
  Lock,
  Droplets,
  MessageSquare,
  Pill,
  Scale,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type AppPlatform = 'android' | 'ios';

export interface AppFaq {
  question: string;
  answer: string;
}

export interface AppEntry {
  /** URL segment: /apps/<slug>. Matches the existing privacy-policy.html path. */
  slug: string;
  /** Store name, exactly as published. */
  name: string;
  /** One line under the title. Should read as a benefit, not a category. */
  tagline: string;
  /** Two or three sentences for the page intro and the meta description. */
  description: string;
  packageId: string;
  platforms: AppPlatform[];
  icon: LucideIcon;
  /** Short category label for the directory card. */
  category: string;
  /** What the app does. Each should be verifiable in the app itself. */
  features: string[];
  /** Answers real search queries; also emits FAQPage structured data. */
  faqs: AppFaq[];
  keywords: string[];
  /** Absent until the app is actually published — no badge is rendered without it. */
  playStoreUrl?: string;
  appStoreUrl?: string;
  /** Path to the privacy policy. All seven already have one. */
  privacyPolicyUrl: string;
  /** Every app has one. Play expects a deletion route alongside the policy. */
  deleteAccountUrl?: string;
  /**
   * Built, but never submitted to Play. The page says so in plain words
   * instead of showing a download button that goes nowhere.
   */
  unreleased?: boolean;
  /** REAL Play Console figures only. See the note at the top of this file. */
  rating?: number;
  ratingCount?: number;
  installs?: string;
  /** Free, or the paid entry point. */
  price: string;
  /**
   * The app's actual data handling, in one or two sentences.
   *
   * MUST MATCH THE APP'S PLAY DATA SAFETY DECLARATION. This was previously a
   * sentence hardcoded into the page template claiming every app kept
   * everything on-device. That is true of GST Sahayak and false of Kinly and
   * CycleCare, both of which declare data collection on Play. A privacy claim
   * on a public page that contradicts the same app's Data Safety section is
   * wrong on its face and is a Play policy risk.
   */
  privacySummary: string;
  /** Whether the free tier shows ads. Checked against the store listing. */
  hasAds: boolean;
  /** Sitemap priority. */
  priority: number;
}

export const APPS: AppEntry[] = [
  {
    slug: 'adfree-applock',
    name: 'AdFree AppLock: App Locker',
    tagline: 'Lock any app. No ads, ever.',
    description:
      'AdFree AppLock locks any app behind a fingerprint, PIN, pattern or password, hides private photos in an AES-256 vault, and photographs whoever gets the PIN wrong. No ads, no tracking, and Play Data Safety declares no data collected.',
    packageId: 'com.nomadiccharts.applock',
    platforms: ['android'],
    icon: Lock,
    category: 'Privacy & security',
    features: [
      'Lock any app with fingerprint, PIN (4–12 digits), pattern or password',
      'Randomised keypad so nobody reads your PIN over your shoulder',
      'Intruder selfie: a silent front-camera photo on a wrong PIN',
      'AES-256 encrypted photo and video vault, hidden from the gallery',
      'Fake crash screen, hidden notification content, uninstall protection',
      'Auto-lock newly installed apps, and quick templates for Social, Finance and Messaging',
    ],
    faqs: [
      {
        question: 'Does AdFree AppLock show ads?',
        answer:
          'No — that is the point of it. There are no ads, no tracking SDKs and no data collection. Google Play Data Safety declares no data collected and none shared with third parties.',
      },
      {
        question: 'Where are my locked photos stored?',
        answer:
          'In an AES-256 encrypted vault on your own device, using the Android Keystore. They never leave the phone. Your PIN or password is hashed with PBKDF2 at 210,000 iterations, not stored.',
      },
      {
        question: 'Why does it need Usage Access and Display Over Apps?',
        answer:
          'Usage Access lets the app detect which app has come to the foreground so it can show the lock screen; Display Over Apps draws that lock screen. Both are core to locking apps at all. Camera access is optional and used only for the intruder selfie.',
      },
      {
        question: 'Can I use a longer PIN?',
        answer:
          'Yes. PINs can be 4 to 12 digits, so 6 is supported. You can also use a pattern or a full password instead.',
      },
    ],
    keywords: [
      'app lock without ads',
      'applock fingerprint lock',
      'photo vault app android',
      'intruder selfie app lock',
      'ad free app locker',
    ],
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.nomadiccharts.applock',
    privacyPolicyUrl: '/apps/adfree-applock/privacy-policy.html',
    deleteAccountUrl: '/apps/adfree-applock/delete-account.html',
    // Real figures from the public Play listing, checked 25 Sep 2026.
    rating: 3.5,
    ratingCount: 54,
    // `installs` deliberately left unset: Play shows "10K+", which is a bucket,
    // and a landing page that quotes it invites the comparison with apps that
    // have millions. The rating is the useful signal here.
    price: 'Free with in-app purchases',
    hasAds: false,
    privacySummary:
      'Nothing leaves the device. Play Data Safety declares no data collected and none shared. Credentials are hashed with PBKDF2 (210,000 iterations) and vault files encrypted with Android Keystore AES-256.',
    priority: 1.0,
  },

  {
    slug: 'gst-sahayak',
    name: 'GST Sahayak – Offline GST App',
    tagline: 'Keep every client’s GST filing on track.',
    description:
      'GST Sahayak is a compliance workspace for Indian tax practitioners and business owners. Track clients, validate GSTINs, work through reconciliation checklists, and keep filing deadlines visible — all stored on your device, with nothing sent to a server.',
    packageId: 'in.launchgrid.gstsahayak',
    platforms: ['android'],
    icon: ShieldCheck,
    category: 'Tax & compliance',
    features: [
      'Client records with GSTIN, filing scheme and checklist state',
      'GSTIN validation, checked and stored locally',
      'Reconciliation checklists and a filing calendar',
      'Export everything as JSON, or erase it all in one tap',
      'No account, no ads, no analytics — data never leaves the device',
    ],
    faqs: [
      {
        question: 'Does GST Sahayak upload my client data anywhere?',
        answer:
          'No. Client records, GSTINs and checklist progress are stored in the app’s private storage on your device. The app has no server that receives them, and Android’s automatic cloud backup is disabled for it.',
      },
      {
        question: 'Do I need an account to use it?',
        answer:
          'No. There is no sign-up and no login. Paid plans are purchased through Google Play, which handles payment entirely — we never see your card details.',
      },
      {
        question: 'Can I get my data out?',
        answer:
          'Yes. Settings → Export my data produces a complete JSON copy of everything the app stores, which you can save or share anywhere.',
      },
    ],
    keywords: [
      'gst filing app',
      'gst compliance app india',
      'gstin validator app',
      'gst practitioner app',
      'gst reconciliation checklist',
    ],
    privacyPolicyUrl: '/apps/gst-sahayak/privacy-policy.html',
    deleteAccountUrl: '/apps/gst-sahayak/delete-account.html',
    price: 'Free with Premium',
    hasAds: false,
    privacySummary:
      'Works fully offline. Play Data Safety declares no data collected and none shared — client records, GSTINs and checklists stay in the app’s private storage on your device.',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=in.launchgrid.gstsahayak',
    priority: 0.8,
  },

  {
    slug: 'kinly',
    name: 'Kinly: Family Calendar',
    tagline: 'One place for everything your family is juggling.',
    description:
      'Kinly is a shared family organiser: a calendar everyone can see, tasks that get assigned, shopping lists that update live, and expenses that stay settled. Built so a household stops coordinating across four different chat threads.',
    packageId: 'in.launchgrid.kinly',
    platforms: ['android'],
    icon: Users,
    category: 'Family & organisation',
    features: [
      'Shared family calendar',
      'Tasks and chores, assigned to whoever owns them',
      'Live shopping lists',
      'Shared expenses and settling up',
      'Real-time sync across every family member’s device',
      'Free with ads; Plus and Premium remove them and raise storage limits',
    ],
    faqs: [
      {
        question: 'How many people can share a Kinly family?',
        answer:
          'Kinly is built for a household — parents, children and anyone else who needs to see the same calendar and lists.',
      },
      {
        question: 'Can I delete my account and data?',
        answer:
          'Yes. There is a dedicated deletion page, and you can also request deletion from inside the app.',
      },
    ],
    keywords: [
      'family organiser app',
      'shared family calendar app',
      'family shopping list app',
      'household task app',
      'family expense sharing',
    ],
    privacyPolicyUrl: '/apps/kinly/privacy-policy.html',
    deleteAccountUrl: '/apps/kinly/delete-account.html',
    price: 'Free with Plus and Premium',
    hasAds: true,
    privacySummary:
      'Kinly syncs across your family’s devices, so it does hold an account and shared family data on a server. Play Data Safety lists Personal info, Financial info and six other types, encrypted in transit and never shared with third parties. You can request deletion at any time.',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=in.launchgrid.kinly',
    priority: 0.8,
  },

  {
    slug: 'nyayai',
    name: 'Nyaya',
    tagline: 'A working reference for your legal matters.',
    description:
      'Nyaya is a professional reference and matter-tracking tool for legal practitioners. Keep matters, parties, courts, case numbers and hearing dates in order, bookmark what you need from the research library, and draft from templates — with every record held on your own device.',
    packageId: 'in.launchgrid.nyayaai',
    // Built but never submitted to Play (confirmed by the owner, 25 Sep 2026).
    // Kept deliberately for a future release. `unreleased` makes the page say
    // so plainly rather than implying a launch is imminent.
    unreleased: true,
    platforms: ['android'],
    icon: Scale,
    category: 'Legal & professional',
    features: [
      'Matters with parties, courts, case numbers, hearing dates and stage',
      'Notes against each matter',
      'Bookmarks in the research library',
      'Draft generation with a monthly allowance',
      'Export as JSON, or erase everything on-device in one tap',
    ],
    faqs: [
      {
        question: 'Is my case data sent anywhere?',
        answer:
          'No. Nyaya does not transmit your legal data. The app requests internet access solely so Google Play can process purchases; that permission is never used to send your matters anywhere.',
      },
      {
        question: 'Is Nyaya legal advice?',
        answer:
          'No. It is a professional reference and organisation tool. It does not provide legal advice and is not a substitute for a qualified lawyer’s judgement.',
      },
    ],
    keywords: [
      'legal case management app india',
      'advocate diary app',
      'court case tracker app',
      'legal matter management',
    ],
    privacyPolicyUrl: '/apps/nyayai/privacy-policy.html',
    deleteAccountUrl: '/apps/nyayai/delete-account.html',
    price: 'Free with paid plans',
    hasAds: false,
    privacySummary:
      'Nyaya does not transmit your legal data. Matters, notes and bookmarks stay in the app’s private storage on your device; the only network use is Google Play Billing.',
    priority: 0.8,
  },

  {
    slug: 'whatsapp',
    name: 'SendLater – Message Scheduler',
    tagline: 'Write it now. Send it at exactly the right minute.',
    description:
      'SendLater schedules messages from your own number — midnight birthday wishes, morning reminders, payment follow-ups. Tap a notification to send, or turn on automatic sending and let it go out while you sleep. Everything stays on your phone.',
    packageId: 'in.launchgrid.whatsapp',
    platforms: ['android'],
    icon: MessageSquare,
    category: 'Productivity',
    features: [
      'Schedule a message to the exact minute',
      'Repeat daily, weekly, monthly or yearly',
      'Send to several people, each greeted by first name',
      'Send at the recipient’s local time, in any time zone',
      'Daily safety check-in that alerts family if you do not respond',
      'Optional automatic sending, off by default',
    ],
    faqs: [
      {
        question: 'Does the app read my chats?',
        answer:
          'No. In automatic mode the accessibility service only locates the message box and Send button, and only while a message you scheduled is due. It does not read, store or transmit chat content.',
      },
      {
        question: 'Do I have to turn on automatic sending?',
        answer:
          'No. The default is one-tap: you get a notification at the time you chose, and tapping it opens the chat with your message ready to send. Automatic sending is off until you explicitly enable it.',
      },
      {
        question: 'Is this made by WhatsApp?',
        answer:
          'No. SendLater is published by LaunchGrid and is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms, Inc. WhatsApp is a trademark of WhatsApp LLC.',
      },
    ],
    keywords: [
      'message scheduler app',
      'schedule messages android',
      'send later app',
      'birthday message scheduler',
      'auto message scheduler',
    ],
    privacyPolicyUrl: '/apps/whatsapp/privacy-policy.html',
    deleteAccountUrl: '/apps/whatsapp/delete-account.html',
    price: 'Free with Pro subscription',
    hasAds: false,
    privacySummary:
      'Contacts, message text, schedules and delivery history stay in the app’s private storage on your device. No account, no analytics, no advertising ID.',
    priority: 0.9,
  },

  {
    slug: 'medicine',
    name: 'MediRemind',
    tagline: 'Never lose track of a dose.',
    description:
      'MediRemind is a medication organiser: schedule what you take and when, get reminded on time, and keep a record of what was actually taken. A consumer organiser, not a clinical system — and everything stays on your device.',
    packageId: 'in.launchgrid.medicine',
    // Built but never submitted to Play (confirmed by the owner, 25 Sep 2026).
    // Kept deliberately for a future release. `unreleased` makes the page say
    // so plainly rather than implying a launch is imminent.
    unreleased: true,
    platforms: ['android'],
    icon: Pill,
    category: 'Health & reminders',
    features: [
      'Medication schedules with reminders',
      'A record of doses taken and missed',
      'Guidance written for consumers, not clinicians',
      'Works entirely offline — no account, no upload',
    ],
    faqs: [
      {
        question: 'Is MediRemind a medical device?',
        answer:
          'No. It is a consumer medication organiser, not a clinical system, diagnostic product or medical device, and it is not a substitute for professional medical advice.',
      },
      {
        question: 'Is my health data uploaded?',
        answer:
          'No. Your medications and dose history stay in the app’s private storage on your device.',
      },
    ],
    keywords: [
      'medicine reminder app',
      'medication tracker app',
      'pill reminder app india',
      'dose reminder offline',
    ],
    privacyPolicyUrl: '/apps/medicine/privacy-policy.html',
    deleteAccountUrl: '/apps/medicine/delete-account.html',
    price: 'Free',
    hasAds: false,
    privacySummary:
      'Medications, reminders and dose history stay in the app’s private storage on your device.',
    priority: 0.7,
  },

  {
    slug: 'periods',
    name: 'CycleCare: Period Tracker',
    tagline: 'Understand your cycle, privately.',
    description:
      'CycleCare logs your periods, flow, symptoms and moods, and shows what your own history suggests about the weeks ahead. Core tracking is local-first and needs no account; cloud backup exists only if you switch it on.',
    packageId: 'in.launchgrid.periods',
    platforms: ['android'],
    icon: Baby,
    category: 'Health & reminders',
    features: [
      'Period logging and cycle history',
      'Estimates based on your own recorded cycles',
      'Reminders for upcoming dates',
      'Local-first: no account needed for core tracking',
      'Optional cloud backup, off unless you turn it on',
      'Free version carries ads away from logging screens; Premium is ad-free',
    ],
    faqs: [
      {
        question: 'Can I use it as contraception?',
        answer:
          'No. Fertility estimates are based on cycle history. They cannot confirm ovulation and must not be used as contraception or as a guarantee of conception.',
      },
      {
        question: 'Where is my cycle data stored?',
        answer:
          'Cycle logging is local-first, so it stays on your phone unless you explicitly turn on cloud backup. You can export or delete everything from inside the app at any time.',
      },
    ],
    keywords: [
      'period tracker app private',
      'offline period tracker',
      'menstrual cycle tracker india',
      'period tracker no account',
    ],
    privacyPolicyUrl: '/apps/periods/privacy-policy.html',
    deleteAccountUrl: '/apps/periods/delete-account.html',
    price: 'Free with ads; Premium removes them',
    hasAds: true,
    privacySummary:
      'Cycle logging is local-first and needs no account. Cloud backup exists but is used only when you explicitly enable it. Play Data Safety lists Personal info, Health and fitness, and Device or other IDs, encrypted in transit and not shared with third parties; sensitive cycle details are not used to personalise ads. You can export or delete your data from inside the app.',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=in.launchgrid.periods',
    priority: 0.7,
  },

  {
    slug: 'snapdue',
    name: 'Snapdue: Screenshot Reminder',
    tagline: 'Screenshot it. Snapdue reminds you.',
    description:
      'Snapdue turns screenshots and shared text into reminders. Share a bill, ticket or message and it finds the date, time, amount and place on your phone, then alerts you at the right minute. No internet permission, no ads, no trackers.',
    packageId: 'in.launchgrid.snapdue',
    // Owner has not shared a Play listing yet. Add playStoreUrl (and drop
    // `unreleased`) once it is live.
    unreleased: true,
    platforms: ['android'],
    icon: BellRing,
    category: 'Health & reminders',
    features: [
      'Share a screenshot or text and get a reminder with the date and time filled in',
      'Finds dates, times, amounts, merchants and locations on your phone with on-device text recognition',
      'Exact-minute alerts, re-scheduled automatically after a restart',
      'Repeating reminders and categories',
      'Picks one screenshot through the Android photo picker, with no access to your photo library',
      'No internet permission, no ads, no analytics',
    ],
    faqs: [
      {
        question: 'Does Snapdue upload my screenshots?',
        answer:
          'No. Snapdue does not request the internet permission, so it cannot upload anything. Text recognition runs on your phone with a bundled Google ML Kit model, and the original image is read once and not stored.',
      },
      {
        question: 'What kind of screenshots can it turn into reminders?',
        answer:
          'Anything with a date or time in it: bills and due dates, tickets and bookings, appointment messages, event invites. It also picks up amounts, merchants and locations when they are there, and you can keep or remove them before saving.',
      },
      {
        question: 'Why does it need the Alarms & reminders permission?',
        answer:
          'So the alert arrives at the exact minute you set. If you turn it off, reminders still work but may arrive a few minutes late.',
      },
      {
        question: 'Is Snapdue free?',
        answer:
          'Yes. The free plan has a monthly limit on screenshot extractions, and Snapdue Pro is an optional subscription handled by Google Play. There are no ads in either version.',
      },
    ],
    keywords: [
      'screenshot reminder app',
      'bill due date reminder app',
      'turn screenshot into reminder',
      'reminder app no internet permission',
      'offline reminder app android',
    ],
    privacyPolicyUrl: '/apps/snapdue/privacy-policy.html',
    deleteAccountUrl: '/apps/snapdue/delete-account.html',
    price: 'Free with optional Snapdue Pro subscription',
    hasAds: false,
    privacySummary:
      'Nothing leaves the device: Snapdue has no internet permission and no servers. Screenshots are read on the phone with a bundled ML Kit model and not stored; reminders and settings live in the app’s private storage. No ads, analytics or trackers.',
    priority: 0.8,
  },

  {
    slug: 'water',
    name: 'Hydrate',
    tagline: 'Drink enough water, without thinking about it.',
    description:
      'Hydrate is a local-only hydration companion. Set a daily goal, log a glass in one tap, and get nudged when you are behind. No sign-up, no ads, no tracking — the whole app works offline.',
    packageId: 'in.launchgrid.water',
    // Built but never submitted to Play (confirmed by the owner, 25 Sep 2026).
    // Kept deliberately for a future release. `unreleased` makes the page say
    // so plainly rather than implying a launch is imminent.
    unreleased: true,
    platforms: ['android', 'ios'],
    icon: Droplets,
    category: 'Health & reminders',
    features: [
      'Daily goal with one-tap logging',
      'Reminders through the day',
      'No account needed — nothing to sign up for',
      'Completely ad-free, with no advertising ID',
      'Works offline on iOS and Android',
    ],
    faqs: [
      {
        question: 'Do I need an account?',
        answer:
          'No. You do not need to sign up, log in or create an account to use Hydrate.',
      },
      {
        question: 'Are there ads?',
        answer:
          'No. Hydrate is entirely ad-free, with no advertising trackers and no advertising ID.',
      },
    ],
    keywords: [
      'water reminder app',
      'hydration tracker app',
      'drink water reminder offline',
      'water intake tracker no ads',
    ],
    privacyPolicyUrl: '/apps/water/privacy-policy.html',
    deleteAccountUrl: '/apps/water/delete-account.html',
    price: 'Free',
    hasAds: false,
    privacySummary:
      'Entirely local. No account, no ads, no advertising ID — your goal and intake log never leave the device.',
    priority: 0.7,
  },
];

/**
 * Published apps first, then the rest.
 *
 * A directory that leads with drafts sends its best traffic to pages with no
 * download button. Within each group the registry order is kept.
 */
export function appsForDisplay(): AppEntry[] {
  const published = APPS.filter((app) => app.playStoreUrl);
  const unpublished = APPS.filter((app) => !app.playStoreUrl);
  return [...published, ...unpublished];
}

export function getApp(slug: string): AppEntry | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function appSlugs(): string[] {
  return APPS.map((app) => app.slug);
}

/** Directory grouping. Order is the order the categories appear on /apps. */
export function appsByCategory(): { category: string; apps: AppEntry[] }[] {
  const groups = new Map<string, AppEntry[]>();
  for (const app of appsForDisplay()) {
    const existing = groups.get(app.category);
    if (existing) existing.push(app);
    else groups.set(app.category, [app]);
  }
  return [...groups.entries()].map(([category, apps]) => ({ category, apps }));
}
