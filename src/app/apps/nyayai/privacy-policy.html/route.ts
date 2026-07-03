import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — Nyaya</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  a { color: #0b5fff; }
</style>
</head>
<body>
<h1>Privacy Policy — Nyaya</h1>
<p class="meta">Effective date: 12 June 2026 &middot; App: Nyaya, formerly "NyayaAI" (in.launchgrid.nyayaai) &middot; Published by LaunchGrid, Mumbai, India</p>

<h2>The short version</h2>
<p>Nyaya does not transmit your legal data anywhere. The app requests internet access solely so Google Play can process subscription and one-time purchases; that permission is used only for Play Billing, never to send your matters, bookmarks or drafts anywhere.</p>

<h2>1. Data we collect</h2>
<p>None. We collect no personal data, no usage analytics, no crash reports, no advertising identifiers, no device identifiers. There are no third-party SDKs or trackers beyond Google Play Billing itself, which processes payments under Google's own privacy policy &mdash; we never see your payment details.</p>

<h2>2. Data stored on your device</h2>
<p>The app stores the following only in its private app storage on your phone, solely so the app works:</p>
<ul>
  <li>Matters you add (titles, parties, courts, case numbers, hearing dates, stage, notes)</li>
  <li>Bookmarks you star in the research library</li>
  <li>Your selected plan and the monthly draft-usage counter</li>
</ul>
<p>This data is never transmitted by the app and never leaves your device unless you yourself share it (e.g. using "Export my data" or sharing a generated draft). Android app backup is disabled (allowBackup=false), so this data is not copied to cloud backups.</p>

<h2>3. Your rights under the Digital Personal Data Protection Act, 2023</h2>
<p>Although we are not a data fiduciary for your in-app content (we never receive it), the app gives you direct, self-serve controls consistent with DPDP principles:</p>
<ul>
  <li><strong>Access / portability:</strong> Settings &rarr; "Export my data" produces a complete JSON copy of everything stored.</li>
  <li><strong>Erasure:</strong> Settings &rarr; "Erase all data" permanently deletes everything, immediately, on-device.</li>
  <li>No consent needed for processing, because no processing by us ever occurs.</li>
</ul>

<h2>4. Drafts and shared content</h2>
<p>Drafts are generated locally on your device. When you tap Copy or Share, the content goes only to the app you choose (e.g. your email or messaging app); that app's privacy policy then applies.</p>

<h2>5. Children</h2>
<p>Nyaya is a professional reference tool and is not directed at children. It collects no data from anyone, including children.</p>

<h2>6. Changes to this policy</h2>
<p>If a future version changes how the app uses network access, that version will declare it visibly in its Play listing, update this policy first, and the change will require an explicit app update that you choose to install.</p>

<h2>7. Contact / grievance</h2>
<p>Publisher: LaunchGrid, Mumbai, India.<br/>For privacy questions or grievances under the DPDP Act, 2023, write to: <a href="mailto:privacy@launchgrid.in">privacy@launchgrid.in</a></p>
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
