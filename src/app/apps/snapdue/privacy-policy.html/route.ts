import { NextResponse } from 'next/server'

/**
 * Privacy policy for Snapdue: Screenshot Reminder.
 *
 * Content is the owner's own policy (effective 26 September 2026), with the
 * contact placeholder filled in. The app requests no INTERNET permission, so
 * the Play Data Safety declaration must say "No data collected" and "No data
 * shared". If a network feature is ever added, this page and that declaration
 * have to change together, before the release ships.
 */

const APP_NAME = 'Snapdue: Screenshot Reminder'
const PACKAGE = 'in.launchgrid.snapdue'
const EFFECTIVE = '26 September 2026'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Snapdue Privacy Policy</title>
<meta name="description" content="Privacy policy for ${APP_NAME} by LaunchGrid. Screenshots and text are read on your phone; the app has no internet permission, no ads and no trackers." />
<link rel="canonical" href="https://launchgrid.in/apps/snapdue/privacy-policy.html" />
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  .note { background: #f5f4f0; border: 1px solid rgba(26,26,24,0.12); border-radius: 10px; padding: 14px 16px; }
  ul { padding-left: 1.2rem; }
  li { margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  th, td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid rgba(26,26,24,0.12); }
  code { font-size: 0.8rem; color: #555; }
  a { color: #0b5fff; }
  footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,26,24,0.12); color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>Snapdue Privacy Policy</h1>
<p class="meta">${APP_NAME} (${PACKAGE}) &middot; by LaunchGrid &middot; Effective ${EFFECTIVE}</p>

<p class="note"><strong>In short:</strong> Snapdue reads your screenshots and shared text on your phone to create reminders. We don&rsquo;t have servers, and the app has no internet permission. Your screenshots, text and reminders never leave your device, we don&rsquo;t collect personal data, and there are no ads, analytics or trackers.</p>

<h2>What the app processes</h2>
<p>When you share or pick an image, or share or type text, Snapdue uses on-device text recognition (Google ML Kit, bundled model) and its own on-device rules to find dates, times, amounts, merchants and locations. This happens entirely on your phone. The original image is read once and not stored.</p>

<h2>What is stored on your device</h2>
<ul>
  <li><strong>Your reminders:</strong> title, date/time, category, repeat setting, and any amount, merchant or location you keep. Up to 2,000 characters of the extracted text are saved with a reminder so you can see where it came from.</li>
  <li><strong>Your settings:</strong> theme, haptics, default time, and a count of extractions this month (for the free plan limit).</li>
</ul>
<p>This data lives in the app&rsquo;s private storage and can only be read by Snapdue. Uninstalling the app or clearing its data deletes it permanently. Deleting a reminder in the app removes it immediately. See the <a href="/apps/snapdue/delete-account.html">data deletion page</a>.</p>

<h2>What we collect</h2>
<p>Nothing. We don&rsquo;t operate servers and don&rsquo;t receive your screenshots, text, reminders, contacts, location or identifiers. Snapdue does not request the internet permission, so it can&rsquo;t upload anything.</p>

<h2>Purchases</h2>
<p>Snapdue Pro subscriptions are handled entirely by Google Play. We never see your payment details. The app asks Google Play only whether you have an active Snapdue Pro subscription. Google&rsquo;s handling of your purchase is covered by the <a href="https://policies.google.com/privacy">Google Privacy Policy</a>.</p>

<h2>Permissions</h2>
<table>
  <thead><tr><th>Permission</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Notifications<br/><code>POST_NOTIFICATIONS</code></td><td>To show your reminders. Optional; you can deny it, but reminders won&rsquo;t alert you.</td></tr>
    <tr><td>Alarms &amp; reminders<br/><code>SCHEDULE_EXACT_ALARM</code></td><td>To alert you at the exact minute. If it&rsquo;s off, reminders may arrive a few minutes late.</td></tr>
    <tr><td>Run at startup<br/><code>RECEIVE_BOOT_COMPLETED</code></td><td>To re-schedule your reminders after the phone restarts.</td></tr>
    <tr><td>Vibration<br/><code>VIBRATE</code></td><td>For haptic feedback and notification vibration.</td></tr>
    <tr><td>Google Play billing<br/><code>BILLING</code></td><td>To offer and verify the optional Snapdue Pro subscription.</td></tr>
  </tbody>
</table>
<p>Snapdue does not request access to your photo library. When you pick a screenshot, Android&rsquo;s photo picker gives the app only the one image you choose.</p>

<h2>Children</h2>
<p>Snapdue is not directed at children under 13 and does not knowingly collect data from anyone.</p>

<h2>Changes</h2>
<p>If this policy changes, we&rsquo;ll update this page and the effective date above.</p>

<h2>Contact</h2>
<p>Questions? Email <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a>. Grievances under the DPDP Act, 2023: <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>.</p>
<p>LaunchGrid (Abhishek Maurya), Vadodara, India</p>

<footer>
  <p>LaunchGrid &middot; <a href="https://launchgrid.in">launchgrid.in</a> &middot; <a href="/apps/snapdue">About ${APP_NAME}</a></p>
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
