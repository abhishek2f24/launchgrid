import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Delete Your Account — Kinly</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  a { color: #0b5fff; }
  .btn { display: inline-block; margin-top: 8px; padding: 10px 18px; background: #0b5fff; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
  ul { padding-left: 1.2rem; }
</style>
</head>
<body>
<h1>Delete Your Kinly Account</h1>
<p class="meta">App: Kinly (in.launchgrid.kinly) &middot; Published by LaunchGrid (Abhishek Maurya), Vadodara, India</p>

<h2>How to request deletion</h2>
<p>To request deletion of your Kinly account and associated personal data, send an email to <a href="mailto:grievance@launchgrid.in?subject=Kinly%20account%20deletion%20request">grievance@launchgrid.in</a> from the email address registered on your account (or including your registered phone number, if you signed in with phone).</p>
<a class="btn" href="mailto:grievance@launchgrid.in?subject=Kinly%20account%20deletion%20request&body=Please%20delete%20my%20Kinly%20account%20and%20associated%20data.%0A%0AAccount%20email%2Fphone%3A%20">Email us to request deletion</a>

<h2>What gets deleted</h2>
<ul>
  <li>Your account credentials and profile (name, avatar photo, role)</li>
  <li>Calendar events, tasks, shopping items, expenses, and activity history you created</li>
  <li>Photos and documents you uploaded to any shared family album/vault</li>
  <li>Chat messages you sent, and whiteboard/Moments/Bills entries you created</li>
  <li>Your push-notification device token and notification preferences</li>
</ul>
<p>If you're the only member of a family, deleting your account also removes the family's shared data described above. If your family has other members, your personal account and profile are deleted, but content you didn't personally create that other family members still need (e.g. shared expenses/events other members added) is retained for them, consistent with how the app's data is shared within a family.</p>

<h2>Timeline</h2>
<p>We process deletion requests within 30 days, except where we're legally required to retain certain records for a longer period (e.g. billing/tax records for completed subscription payments).</p>

<h2>In-app alternative</h2>
<p>You can also leave a family at any time from <strong>More &rarr; Family &amp; profile &rarr; Leave family</strong> inside the app, which immediately removes your access to that family's data. This does not delete your account entirely — use the email request above for full account deletion.</p>

<h2>Contact</h2>
<p>LaunchGrid (Abhishek Maurya), Vadodara, India &mdash; <a href="mailto:grievance@launchgrid.in">grievance@launchgrid.in</a></p>
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
