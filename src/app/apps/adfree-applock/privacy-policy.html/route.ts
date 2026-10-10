import { NextResponse } from 'next/server'

/**
 * Privacy policy for AdFree AppLock.
 *
 * CORRECTED 10 OCTOBER 2026 — FIREBASE IS DISCLOSED
 *   The 25 September version said "no analytics SDK" and "we collect nothing",
 *   matching a "No data collected" Data Safety declaration. Both were wrong: the
 *   app has shipped Firebase Analytics, Crashlytics, Remote Config and Cloud
 *   Messaging throughout (see app/build.gradle.kts in the AppLock repo). Play
 *   checks bundled SDKs against Data Safety, so that mismatch was a live policy
 *   risk. This page now describes what those SDKs send, and the Data Safety form
 *   is updated to match. The app's own PRIVACY_POLICY.md (4 Oct) already did.
 *
 *   The rule stands: if the app's behaviour changes, this page and the Data
 *   Safety declaration move together, before the release ships.
 *
 * PLAY CONSOLE CURRENTLY POINTS AT A PRIVATE GITHUB REPO
 *   github.com/abhishek2f24/AppLock/blob/main/PRIVACY_POLICY.md is private, so
 *   that URL returns 404 for every user and every policy reviewer. Play
 *   requires a publicly accessible policy. Console → App content → Privacy
 *   policy should be repointed at this page.
 *
 * ON ADVERTISING — RESOLVED
 *   An earlier policy (11 June 2026) described Google AdMob on the free tier.
 *   AdMob has since been REMOVED from the app; the owner confirmed this on
 *   25 September 2026. That is why the app is named AdFree AppLock, why the
 *   listing promises "ZERO ads, ever", why Play Data Safety declares no data
 *   collected, and why reviews from July onwards praise the absence of ads.
 *   This page is the current, authoritative policy.
 *
 *   If advertising is ever reintroduced, this page and the Play Data Safety
 *   declaration must change together and BEFORE the release ships — an
 *   advertising ID is collected data, and shipping ads against a "no data
 *   collected" declaration is a suspension-grade mismatch.
 *
 * Technical specifics below are taken from the owner's own policy, which is
 * more precise than the store description.
 */

const APP_NAME = 'AdFree AppLock: App Locker'
const PACKAGE = 'com.nomadiccharts.applock'
const LAST_UPDATED = '10 October 2026'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — ${APP_NAME}</title>
<meta name="description" content="Privacy policy for ${APP_NAME} by LaunchGrid. No ads and no account; your lock settings, vault and intruder photos stay encrypted on your device. Explains the Firebase crash reporting and optional analytics the app uses." />
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
<p class="meta">Last updated: ${LAST_UPDATED} &middot; App: ${APP_NAME} (${PACKAGE}) &middot; Published by LaunchGrid (Abhishek Maurya), Vadodara, India</p>

<h2>1. Who we are</h2>
<p>${APP_NAME} ("the App") is published by LaunchGrid (Abhishek Maurya), Vadodara, India ("we", "us"). This policy explains how the App handles your information, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

<h2>2. The short version</h2>
<p class="note">There is no account, no sign-up and <strong>no ads</strong>. Your lock credentials, the list of apps you lock, your vault files and your intruder photos <strong>never leave your device</strong>, and we have no server that could receive them. The App does use Google&rsquo;s Firebase services for crash reports, optional usage analytics, remote settings and optional announcements; those receive limited technical data described in <a href="#analytics">section 7</a>, never any of the things above. We do not sell data or track you across other apps or websites.</p>

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
  <li><strong>Google Play In-App Updates and In-App Review</strong> &mdash; checks for updates and shows Google&rsquo;s rating prompt.</li>
  <li><strong>Firebase Crashlytics, Analytics, Remote Config and Cloud Messaging</strong> &mdash; described in <a href="#analytics">section 7</a>.</li>
</ul>
<p>These are operated by Google and governed by <a href="https://policies.google.com/privacy">Google&rsquo;s privacy policy</a> and the <a href="https://firebase.google.com/support/privacy">Firebase privacy information</a>. We do not receive or store your payment details.</p>

<h2 id="analytics">7. Advertising, analytics and crash reports</h2>
<p class="note"><strong>The App contains no advertising</strong> and no advertising SDK, and it does not use the Android advertising ID (the permission is removed from the App). There is no ad-supported tier.</p>
<p>The App uses these Google Firebase services. None of them receives your credentials, locked-app list, vault files, intruder photos or notification content.</p>
<ul>
  <li><strong>Firebase Crashlytics</strong> &mdash; when the App crashes it sends the crash stack trace, the App&rsquo;s state at the time, device model and OS version, and a random Crashlytics installation ID, so the crash can be fixed.</li>
  <li><strong>Firebase Analytics</strong> &mdash; usage events such as which setup step was reached, whether a permission was granted, and whether the trial converted. Events carry no app names, file names or content (a count of chosen apps is sent only as a range such as &ldquo;2&ndash;3&rdquo;). They are identified by a random app-instance ID, not your name, email or advertising ID, and Google derives approximate location (country or city) from your connection. <strong>You can turn analytics off in Settings &rarr; Privacy.</strong></li>
  <li><strong>Firebase Remote Config</strong> &mdash; fetches app settings (for example a required minimum version). Sends country and language code, time zone, OS and app version, and a Firebase installation ID.</li>
  <li><strong>Firebase Cloud Messaging</strong> &mdash; delivers optional &ldquo;News and updates&rdquo; notifications, using a Firebase installation ID and messaging token. <strong>You can turn announcements off in Settings.</strong></li>
</ul>
<p>This data is encrypted in transit, processed by Google as our service provider, and not shared with anyone else. The Data Safety section of the App&rsquo;s Google Play listing declares the same data.</p>
<p>An earlier version of this policy described Google AdMob on a free tier; AdMob was removed from the App entirely. A later version (25 September 2026) said the App had no analytics SDK and collected no data, which was incorrect: the Firebase services above were already included. This version corrects that.</p>

<h2>8. Your rights under the DPDP Act, 2023</h2>
<ul>
  <li><strong>Access:</strong> everything the App holds is visible inside the App on your device.</li>
  <li><strong>Erasure:</strong> delete items in the App, clear the App&rsquo;s data in Android Settings, or uninstall &mdash; your vault, photos and settings are held nowhere else. Analytics and crash data are tied only to random installation IDs; clearing the App&rsquo;s data or reinstalling starts new ones, and you can ask us to delete what Firebase holds by writing to the address below. See the <a href="/apps/adfree-applock/delete-account.html">data deletion page</a>.</li>
  <li><strong>Objection:</strong> turn off analytics and announcements in the App&rsquo;s Settings at any time.</li>
  <li><strong>Grievance redressal:</strong> write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>. We respond within 30 days.</li>
</ul>

<h2>9. Children</h2>
<p>The App is intended for general audiences and is not directed at children. It collects only the limited technical data described in section 7, from anyone.</p>

<h2>10. Changes to this policy</h2>
<p>Material changes will be reflected in an updated App version with a revised "Last updated" date.</p>

<h2>11. Contact</h2>
<p>LaunchGrid (Abhishek Maurya), Vadodara, India &mdash; <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a> &middot; Support: <a href="mailto:support@launchgrid.in">support@launchgrid.in</a></p>

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
