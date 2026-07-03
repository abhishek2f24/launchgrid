import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — GST Sahayak</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  a { color: #0b5fff; }
</style>
</head>
<body>
<h1>Privacy Policy — GST Sahayak</h1>
<p class="meta">Last updated: 12 June 2026 &middot; App: GST Sahayak (in.launchgrid.gstsahayak) &middot; Published by LaunchGrid, Mumbai, India</p>

<h2>1. Who we are</h2>
<p>GST Sahayak ("the App") is published by LaunchGrid, Mumbai, India ("we", "us"). This policy explains how the App handles your information, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

<h2>2. The short version: we collect nothing</h2>
<p>The App requests internet access solely so Google Play can process subscription and one-time purchases (Google Play Billing). Your business data &mdash; clients, GSTINs, checklists &mdash; is never transmitted by the App; it is not sent to us or to any server we control. There are no analytics, no trackers, no ads SDKs, and no crash reporters. Payment processing itself is handled entirely by Google Play under Google's own privacy policy; we never see your payment details.</p>

<h2>3. What data the App stores (on your device only)</h2>
<ul>
  <li>Client records you add (name, GSTIN, filing scheme, checklist state)</li>
  <li>GSTIN validation history (the GSTINs you checked, locally)</li>
  <li>Reconciliation checklist progress and calendar preferences</li>
  <li>Your selected plan and notice-draft usage counter</li>
</ul>
<p>This data lives in the App's private storage on your device and is never transmitted anywhere by the App. We never see it. It is removed when you uninstall the App or use "Erase all data". Android's automatic cloud backup is disabled for this App.</p>

<h2>4. Your rights under the DPDP Act, 2023</h2>
<ul>
  <li><strong>Right to access:</strong> Settings &rarr; "Export my data" produces a complete JSON copy of everything the App stores, which you may share or save anywhere you choose.</li>
  <li><strong>Right to erasure:</strong> Settings &rarr; "Erase all data" permanently deletes all locally stored data after confirmation.</li>
  <li><strong>Right to grievance redressal:</strong> write to <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a>. We respond within 30 days.</li>
</ul>

<h2>5. Children</h2>
<p>The App is a professional tax-compliance tool intended for users 18 and above. It collects no data from anyone, including children.</p>

<h2>6. Third parties</h2>
<p>Google Play Billing processes payments when you purchase a paid plan; Google's own privacy policy governs that transaction. No client/business data is shared with Google or anyone else &mdash; only payment processing occurs through Google Play.</p>

<h2>7. Data security</h2>
<p>Data is stored in the App's sandboxed private storage protected by Android's application isolation. Use a device lock screen for additional protection.</p>

<h2>8. Changes to this policy</h2>
<p>Material changes will be reflected in an updated App version with a revised "Last updated" date.</p>

<h2>9. Contact</h2>
<p>LaunchGrid, Mumbai, India &mdash; <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a></p>
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
