import { NextResponse } from 'next/server'

/**
 * Privacy policy for the message-scheduling Android app
 * (package in.launchgrid.whatsapp).
 *
 * THE STORE NAME IS NOT "WHATSAPP" AND MUST NOT BECOME IT.
 *   Play's impersonation policy and WhatsApp LLC's trademark both bar a third-
 *   party app from carrying "WhatsApp" or "WA" in its name. The route path is
 *   /apps/whatsapp/ only because that is the package suffix; the public name
 *   lives in APP_NAME below and appears nowhere else, so changing it is a
 *   one-line edit.
 *
 * WHY THE ACCESSIBILITY SECTION IS THE LONGEST ONE
 *   Reviewers scrutinise AccessibilityService use harder than anything else in
 *   a listing, and a policy that glosses over it is the common rejection. It
 *   states the scope (two packages), the trigger (a due message), what is read
 *   (the message box and Send button), what is not (chat content), and that it
 *   is off by default. Those five facts must stay true of the app itself — if
 *   the service ever reads more, this page becomes a false statement.
 */

const APP_NAME = 'SendLater \u2013 Message Scheduler'
/** The short brand, for use inside sentences where the full store name reads badly. */
const SHORT_NAME = 'SendLater'
const PACKAGE = 'in.launchgrid.whatsapp'
const LAST_UPDATED = '25 September 2026'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — ${APP_NAME}</title>
<meta name="description" content="Privacy policy for ${APP_NAME} by LaunchGrid. All data stays on your device: no account, no servers, no analytics, no ads." />
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  .note { background: #f5f4f0; border: 1px solid rgba(26,26,24,0.12); border-radius: 10px; padding: 14px 16px; font-size: 0.95rem; }
  a { color: #0b5fff; }
  footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,26,24,0.12); color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>Privacy Policy — ${APP_NAME}</h1>
<p class="meta">Last updated: ${LAST_UPDATED} &middot; App: ${APP_NAME} (${PACKAGE}) &middot; Published by LaunchGrid, Mumbai, India</p>

<h2>1. Who we are</h2>
<p>${APP_NAME} ("the App", "${SHORT_NAME}") is published by LaunchGrid, Mumbai, India ("we", "us"). The App lets you write a message now and have it go out at a time you choose. This policy explains how the App handles your information, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

<h2>2. The short version: we collect nothing</h2>
<p>The contacts you pick, the messages you write, your schedules and your delivery history are stored only on your device. They are never uploaded to us or to any server we control &mdash; we do not operate a server that receives your data. There is no account and no sign-up. The App contains no advertising, no analytics and no tracking SDKs, and it does not use the Android advertising ID. The only third-party library that reaches the internet is Google Play Billing, which Google operates to process subscriptions.</p>

<h2>3. What the App stores (on your device only)</h2>
<ul>
  <li>The names and phone numbers of contacts you select for a message</li>
  <li>The text of the messages you write, including any templates you save</li>
  <li>Your schedules, repeat settings and time-zone choices</li>
  <li>Your delivery history (which scheduled messages were sent, and when)</li>
  <li>Your safety check-in settings and chosen alert recipients, if you use that feature</li>
</ul>
<p>This data lives in the App's private storage on your device. It is removed when you delete the individual items, clear the App's data in Android Settings, or uninstall the App.</p>

<h2>4. Contacts</h2>
<p>When you tap "Choose from contacts", Android shows its own contact picker and hands the App only the single contact you select. The App does not read your address book and does not upload your contacts anywhere.</p>

<h2>5. Accessibility service (optional, off by default)</h2>
<p>The App has two sending modes.</p>
<ul>
  <li><strong>One-tap (the default).</strong> At the time you chose, you get a notification. Tapping it opens the chat with your message already typed, and you press Send yourself. No accessibility permission is involved.</li>
  <li><strong>Automatic sending (optional).</strong> If you turn this on, the App uses Android's Accessibility service to press the Send button for you, so a message can go out while you are asleep.</li>
</ul>
<p>When automatic sending is enabled, the Accessibility service:</p>
<ul>
  <li>is restricted to the WhatsApp and WhatsApp Business apps (<code>com.whatsapp</code>, <code>com.whatsapp.w4b</code>) and does not run in any other app;</li>
  <li>acts only while a message you scheduled is due, and follows a fixed sequence you defined &mdash; open the chat, press Send;</li>
  <li>reads on-screen view identifiers solely to locate the message box and the Send button, and to confirm the message was sent;</li>
  <li>does <strong>not</strong> read, store or transmit your chats, your contacts' messages, or any other screen content;</li>
  <li>collects and shares nothing. No data obtained through the Accessibility API leaves your device.</li>
</ul>
<p class="note">Automatic sending is <strong>off by default</strong>. It is only enabled after you read an in-app explanation of exactly what the service does and tap "Agree &amp; turn on". You can switch back to one-tap sending at any time in the App's Settings, which disables the service. Note that while any accessibility service is active, some banking apps may refuse to open; this is an Android-wide security behaviour, not something the App controls.</p>

<h2>6. Notifications and alarms</h2>
<p>The App uses notifications and exact alarms only to remind you, or to send, at the time you scheduled. It requests <code>SCHEDULE_EXACT_ALARM</code>, which you grant, so that a message goes out at the exact minute you picked rather than whenever the system next wakes the App.</p>

<h2>7. Payments</h2>
<p>Subscriptions are processed by Google Play. We do not receive or store your payment details, and we never see your card or billing information. Google's privacy policy governs those transactions: <a href="https://policies.google.com/privacy">policies.google.com/privacy</a>. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period; you can manage or cancel in Google Play &rarr; Subscriptions.</p>

<h2>8. Your rights under the DPDP Act, 2023</h2>
<ul>
  <li><strong>Right to access:</strong> all your data is already on your device and visible in the App &mdash; your schedules, templates and delivery history.</li>
  <li><strong>Right to erasure:</strong> delete individual items in the App, clear the App's data in Android Settings, or uninstall the App to remove everything. Because nothing is sent to us, there is no copy elsewhere for us to delete.</li>
  <li><strong>Right to grievance redressal:</strong> write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>. We respond within 30 days.</li>
</ul>

<h2>9. Children</h2>
<p>The App is intended for users aged 18 and over. It collects no data from anyone, including children.</p>

<h2>10. Data security</h2>
<p>Data is stored in the App's sandboxed private storage, protected by Android's application isolation. The only network traffic the App generates is Google Play Billing over HTTPS. Use a device lock screen for additional protection.</p>

<h2>11. Changes to this policy</h2>
<p>Material changes will be reflected in an updated App version with a revised "Last updated" date at the top of this page.</p>

<h2>12. Third-party trademarks</h2>
<p>WhatsApp is a trademark of WhatsApp LLC. ${SHORT_NAME} is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms, Inc.</p>

<h2>13. Contact</h2>
<p>LaunchGrid, Mumbai, India &mdash; <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a> &middot; Support: <a href="mailto:support@launchgrid.in">support@launchgrid.in</a></p>

<footer>
  <p>LaunchGrid &middot; <a href="https://launchgrid.in">launchgrid.in</a></p>
</footer>
</body>
</html>
`

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
