/**
 * Data-deletion pages for the local-only apps.
 *
 * WHY THESE DO NOT COPY KINLY'S PAGE
 *   Kinly has accounts and a server, so its deletion page is an email request
 *   we action within 30 days. The six apps here have neither. Reusing that
 *   wording would tell someone to email us to delete data we never received —
 *   misleading on the page, and a support queue for requests we cannot action
 *   because there is nothing on our side to delete.
 *
 *   Play's Data Safety section requires a route to deletion, not a server-side
 *   one. For an app that stores everything on-device, the honest and compliant
 *   answer is: here is exactly how to remove it, and we hold nothing.
 *
 * WHY A SHARED BUILDER
 *   Six pages with the same structure and different specifics is a template
 *   plus config, not six files to keep in sync. What differs per app is the
 *   list of what gets removed and whether a subscription needs cancelling.
 */

export interface DeletionPageConfig {
  slug: string;
  appName: string;
  packageId: string;
  /** What the app stores, in the user's words. Shown as "what gets removed". */
  storedItems: string[];
  /** In-app path to delete individual records, when one exists. */
  inAppPath?: string;
  /** True when the app sells a Play subscription that survives uninstalling. */
  hasSubscription: boolean;
  lastUpdated: string;
}

const STYLE = `
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  .note { background: #f5f4f0; border: 1px solid rgba(26,26,24,0.12); border-radius: 10px; padding: 14px 16px; }
  ol, ul { padding-left: 1.2rem; }
  li { margin-bottom: 6px; }
  a { color: #0b5fff; }
  footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,26,24,0.12); color: #666; font-size: 0.85rem; }
`

export function buildDeletionPage(config: DeletionPageConfig): string {
  const {
    appName,
    packageId,
    storedItems,
    inAppPath,
    hasSubscription,
    lastUpdated,
  } = config

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Delete Your Data — ${appName}</title>
<meta name="description" content="How to delete your ${appName} data. Everything is stored on your device — there is no account, and no copy on our servers." />
<style>${STYLE}</style>
</head>
<body>
<h1>Delete Your ${appName} Data</h1>
<p class="meta">Last updated: ${lastUpdated} &middot; App: ${appName} (${packageId}) &middot; Published by LaunchGrid, Mumbai, India</p>

<h2>There is no account to delete</h2>
<p class="note"><strong>${appName} has no sign-up, no login and no server of ours that receives your data.</strong> Everything the app stores is held in its private storage on your own device. That means there is no copy on our side for us to delete &mdash; deleting it on your phone deletes it everywhere.</p>

<h2>What the app stores</h2>
<ul>
${storedItems.map((item) => `  <li>${item}</li>`).join('\n')}
</ul>

<h2>How to delete it</h2>
<ol>
${inAppPath ? `  <li><strong>Delete individual records in the app.</strong> ${inAppPath}</li>` : ''}
  <li><strong>Clear all app data.</strong> Open Android <em>Settings &rarr; Apps &rarr; ${appName} &rarr; Storage &rarr; Clear data</em>. This removes everything listed above and returns the app to a fresh install.</li>
  <li><strong>Or uninstall the app.</strong> Removing ${appName} deletes its private storage along with it.</li>
</ol>
<p>Either of the last two steps is permanent and immediate. We are not involved in it, and we receive no notification &mdash; because we never had the data.</p>
${
  hasSubscription
    ? `
<h2>Cancelling a subscription</h2>
<p>Deleting your data does <strong>not</strong> cancel a paid subscription, and neither does uninstalling the app. Subscriptions are managed by Google Play: open <em>Play Store &rarr; Profile &rarr; Payments &amp; subscriptions &rarr; Subscriptions</em>, select ${appName}, and cancel there. Cancel at least 24 hours before the renewal date to avoid being charged for the next period.</p>
<p>Google holds your purchase and billing records, not us. Their handling is covered by <a href="https://policies.google.com/privacy">Google's privacy policy</a>.</p>`
    : ''
}

<h2>What we hold about you</h2>
<p>Nothing. ${appName} contains no analytics, no advertising and no tracking SDKs, and it does not use the Android advertising ID.${
    hasSubscription
      ? ' The only network traffic it generates is Google Play Billing, which Google operates; we never see your payment details.'
      : ''
  } There is no profile, no usage record and no backup of your content on any system we control.</p>

<h2>Questions</h2>
<p>If something here is unclear, or you believe we hold data about you, write to <a href="mailto:grievance@launchgrid.in?subject=${encodeURIComponent(`${appName} data deletion question`)}">grievance@launchgrid.in</a>. We respond within 30 days, as required by the Digital Personal Data Protection Act, 2023.</p>

<h2>Privacy policy</h2>
<p>The full policy for ${appName} is at <a href="/apps/${config.slug}/privacy-policy.html">launchgrid.in/apps/${config.slug}/privacy-policy.html</a>.</p>

<footer>
  <p>LaunchGrid, Mumbai, India &middot; <a href="https://launchgrid.in">launchgrid.in</a> &middot; <a href="/apps/${config.slug}">About ${appName}</a></p>
</footer>
</body>
</html>
`
}

/** Standard headers for every deletion page. */
export const DELETION_PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const
