import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — Kinly</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  a { color: #0b5fff; }
</style>
</head>
<body>
<h1>Privacy Policy — Kinly</h1>
<p class="meta">Last updated: 5 July 2026 &middot; App: Kinly (in.launchgrid.kinly) &middot; Published by LaunchGrid (Abhishek Maurya), Vadodara, India</p>

<h2>1. Who we are</h2>
<p>Kinly ("the App") is a shared family organizer &mdash; calendar, tasks, shopping lists, expenses, and related family-coordination tools &mdash; published by LaunchGrid (Abhishek Maurya), Vadodara, India ("we", "us"). This policy explains how the App collects, uses, and protects your information, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

<h2>2. What the App is, in short</h2>
<p>Unlike a single-user tool, Kinly is built around a shared family account: the data you and your family members add is synced to our servers (hosted on Supabase) so everyone in the family sees the same up-to-date calendar, tasks, expenses, and other content in real time. This section explains exactly what that includes.</p>

<h2>3. Information we collect</h2>
<ul>
  <li><strong>Account information:</strong> your email address and password, or your Google/Facebook profile (name, email, profile photo) if you sign in that way, or your phone number if you sign in via OTP.</li>
  <li><strong>Family content you and your family create:</strong> calendar events, tasks, shopping lists, expenses and settle-up notes, activity history, family member names/roles/avatar photos, shared whiteboard drawings, "Moments" countdowns, bills/EMI reminders, photos and documents you upload to the shared family album/vault, and family group chat messages.</li>
  <li><strong>Device push-notification token:</strong> used solely to deliver notifications about family activity (e.g. a new task or event) to your device via Firebase Cloud Messaging.</li>
  <li><strong>Basic diagnostic/technical data:</strong> standard mobile-app crash and performance signals from Firebase, and (for users on the free, ad-supported tier) advertising identifiers used by Google AdMob to serve ads.</li>
</ul>
<p>We do not collect this data to build an advertising profile of you beyond what Google AdMob independently requires to serve ads to free-tier users (see Section 6). We do not sell your data to anyone.</p>

<h2>4. How we use this information</h2>
<ul>
  <li>To operate the App's core features: syncing your family's calendar, tasks, shopping, expenses, photos, documents, chat, and other content across every family member's device in real time.</li>
  <li>To send you notifications about family activity (new events, tasks assigned to you, chat messages, bill/Moment reminders).</li>
  <li>To authenticate you and keep your family's data separate from other families' data.</li>
  <li>To enforce free-plan usage limits (e.g. photo/storage quotas) and to manage paid subscription entitlements, if you purchase one.</li>
  <li>To diagnose crashes and improve app reliability.</li>
</ul>

<h2>5. Where your data is stored</h2>
<p>Family content and account records are stored in a Supabase-hosted Postgres database and Supabase Storage (for photos/documents/avatars), access-controlled so that only members of your own family can read or write your family's data. Push-notification delivery uses Firebase Cloud Messaging (Google).</p>

<h2>6. Advertising (free plan only)</h2>
<p>Free-tier users may see ads served by Google AdMob. AdMob may use advertising identifiers to serve and measure ads, governed by Google's own privacy policy. Ads are removed entirely on paid Plus/Premium plans. We do not share your family's calendar, task, expense, chat, or photo content with AdMob or any advertiser.</p>

<h2>7. Payments</h2>
<p>Subscription purchases (Plus/Premium plans) are processed by Google Play Billing under Google's own privacy policy; we never see or store your payment card details.</p>

<h2>8. Sharing with other family members</h2>
<p>By design, anything you add inside a family (events, tasks, expenses, chat messages, photos not marked private, etc.) is visible to every member of that same family. Documents and bills can optionally be marked "Private," in which case only you can see them. Leaving a family removes your access to that family's data going forward.</p>

<h2>9. Your rights under the DPDP Act, 2023</h2>
<ul>
  <li><strong>Right to access:</strong> you can view all your family's data directly within the App at any time.</li>
  <li><strong>Right to correction/erasure:</strong> you can edit or delete individual items (events, tasks, photos, etc.) directly in the App. To request full account deletion, write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a> and we will erase your account and personal data within 30 days, except where we are legally required to retain records.</li>
  <li><strong>Right to grievance redressal:</strong> write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>. We respond within 30 days.</li>
</ul>

<h2>10. Children</h2>
<p>Kinly is intended for use by adults coordinating family logistics; family "child" member profiles may be added by an adult family admin for coordination purposes only (e.g. assigning them a chore), but the App is not directed at, and does not knowingly collect account credentials directly from, children under 18.</p>

<h2>11. Data security</h2>
<p>Data in transit is encrypted (HTTPS/TLS). Access to your family's data is restricted at the database level to authenticated members of that family. No system is 100% secure, but we take reasonable technical and organizational measures to protect your information.</p>

<h2>12. Changes to this policy</h2>
<p>Material changes will be reflected here with a revised "Last updated" date.</p>

<h2>13. Contact</h2>
<p>LaunchGrid (Abhishek Maurya), Vadodara, India &mdash; <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a></p>
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
