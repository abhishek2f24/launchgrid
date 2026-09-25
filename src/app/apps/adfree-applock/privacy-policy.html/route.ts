import { NextResponse } from 'next/server'

/**
 * Privacy policy for AdFree AppLock.
 *
 * Written to match the app's Play Data Safety declaration ("No data collected",
 * "No data shared with third parties") and its store description, both checked
 * on 25 September 2026. If the app's behaviour changes, this page and that
 * declaration have to move together — a policy that contradicts Data Safety is
 * a policy violation regardless of which one is right.
 *
 * PLAY CONSOLE CURRENTLY POINTS AT A PRIVATE GITHUB REPO
 *   github.com/abhishek2f24/AppLock/blob/main/PRIVACY_POLICY.md is private, so
 *   that URL returns 404 for every user and every policy reviewer. Play
 *   requires a publicly accessible policy. Console → App content → Privacy
 *   policy should be repointed at this page.
 *
 * ON ADVERTISING — UNRESOLVED CONTRADICTION, FLAGGED TO THE OWNER
 *   The GitHub policy (last updated 11 June 2026) says the free tier shows
 *   Google AdMob ads and that AdMob processes the advertising ID and IP.
 *   Everything else says the opposite: the app is called AdFree AppLock, the
 *   store listing promises "ZERO ads, ever", Play Data Safety declares no data
 *   collected, and reviews from July–September 2026 specifically praise the
 *   absence of ads. This page follows the Data Safety declaration, which is the
 *   operative one, on the basis that the June policy is stale. If the app does
 *   still serve AdMob, this page AND the Data Safety declaration are both wrong
 *   and must change together.
 *
 * Technical specifics below are taken from the owner's own policy, which is
 * more precise than the store description.
 */

const APP_NAME = 'AdFree AppLock: App Locker'
const PACKAGE = 'com.nomadiccharts.applock'
const LAST_UPDATED = '25 September 2026'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — ${APP_NAME}</title>
<meta name="description" content="Privacy policy for ${APP_NAME} by LaunchGrid. No data collected, no ads, no tracking — everything stays encrypted on your device." />
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  .note { background: #f5f4f0; border: 1px solid rgba(26,26,24,0.12); border-radius: 10px; padding: 14px 16px; }
  ul { padding-left: 1.2rem; }
  li { margin-bottom: 6px; }
  a { color: #0b5fff; }
  footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,26,24,0.12); color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>Privacy Policy — ${APP_NAME}</h1>
<p class="meta">Last updated: ${LAST_UPDATED} &middot; App: ${APP_NAME} (${PACKAGE}) &middot; Published by LaunchGrid, Mumbai, India</p>

<h2>1. Who we are</h2>
<p>${APP_NAME} ("the App") is published by LaunchGrid, Mumbai, India ("we", "us"). This policy explains how the App handles your information, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

<h2>2. The short version: we collect nothing</h2>
<p class="note">The App collects no personal data and shares none with third parties. There is no account, no sign-up, no advertising and no analytics or tracking SDK. Your lock settings, vault contents and intruder photos never leave your device, and we have no server that could receive them.</p>

<h2>3. What the App stores, on your device only</h2>
<ul>
  <li>Which apps you have chosen to lock, and your lock preferences</li>
  <li>Your PIN, pattern or password &mdash; stored as a salted hash, never as the value you typed</li>
  <li>Photos and videos you move into the vault</li>
  <li>Intruder photos and failed-attempt logs, if you enable that feature</li>
</ul>

<h2>4. How it is protected</h2>
<ul>
  <li>Credentials are hashed with PBKDF2-HMAC-SHA256 at 210,000 iterations with a random salt, and verified using constant-time comparison. We never store, and cannot recover, your actual PIN or password.</li>
  <li>Vault files and intruder photos are encrypted with AES-256-GCM, backed by the Android Keystore.</li>
  <li>All sensitive key-value settings use encrypted shared preferences.</li>
  <li>Everything sits in the App&rsquo;s sandboxed private storage, protected by Android&rsquo;s application isolation.</li>
</ul>
<p>Because your credential is not recoverable, losing it means losing access to the vault. That is the trade-off of encryption that we cannot bypass either.</p>

<h2>5. Permissions, and why each is needed</h2>
<ul>
  <li><strong>PACKAGE_USAGE_STATS</strong> (Usage Access) &mdash; detects which app has come to the foreground so the lock screen can be shown. Without it the App cannot lock anything. It is used only for that check; no usage history is recorded or transmitted.</li>
  <li><strong>SYSTEM_ALERT_WINDOW</strong> (Display over other apps) &mdash; draws the lock screen above the app being opened.</li>
  <li><strong>FOREGROUND_SERVICE</strong> &mdash; keeps the protection service running so locking does not stop when the App is in the background.</li>
  <li><strong>RECEIVE_BOOT_COMPLETED</strong> &mdash; restarts protection after the device reboots, so your apps are not left unlocked.</li>
  <li><strong>POST_NOTIFICATIONS</strong> &mdash; shows protection status and intruder alerts.</li>
  <li><strong>CAMERA (optional)</strong> &mdash; used only for the intruder selfie after a failed unlock. Photos are encrypted and stored on your device. Decline it and every other feature still works.</li>
</ul>

<h2>6. Network access</h2>
<p>The App does not send your lock credentials, locked-app list, vault files or intruder photos to any server. Those stay on your device. Network access is used only by Google services bundled with the App:</p>
<ul>
  <li><strong>Google Play Billing</strong> &mdash; processes purchases and checks subscription status.</li>
  <li><strong>Google Play Integrity</strong> &mdash; verifies the App was installed from Google Play.</li>
  <li><strong>Google Play In-App Updates</strong> &mdash; checks for and delivers updates.</li>
</ul>
<p>These are operated by Google and governed by <a href="https://policies.google.com/privacy">Google&rsquo;s privacy policy</a>. We do not receive or store your payment details.</p>

<h2>7. Advertising and analytics</h2>
<p>The App contains no advertising SDK and no analytics or tracking SDK, and does not use the Android advertising ID. This matches the App&rsquo;s Data Safety declaration on Google Play, which states that no data is collected and none is shared with third parties.</p>

<h2>8. Your rights under the DPDP Act, 2023</h2>
<ul>
  <li><strong>Access:</strong> everything the App holds is visible inside the App on your device.</li>
  <li><strong>Erasure:</strong> delete items in the App, clear the App&rsquo;s data in Android Settings, or uninstall. Nothing is held anywhere else. See the <a href="/apps/adfree-applock/delete-account.html">data deletion page</a>.</li>
  <li><strong>Grievance redressal:</strong> write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>. We respond within 30 days.</li>
</ul>

<h2>9. Children</h2>
<p>The App is intended for general audiences and collects no data from anyone, including children.</p>

<h2>10. Changes to this policy</h2>
<p>Material changes will be reflected in an updated App version with a revised "Last updated" date.</p>

<h2>11. Contact</h2>
<p>LaunchGrid, Mumbai, India &mdash; <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a> &middot; Support: <a href="mailto:support@launchgrid.in">support@launchgrid.in</a></p>

<footer>
  <p>LaunchGrid &middot; <a href="https://launchgrid.in">launchgrid.in</a> &middot; <a href="/apps/adfree-applock">About ${APP_NAME}</a></p>
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
