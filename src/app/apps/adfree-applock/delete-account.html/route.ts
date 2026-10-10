import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for AdFree AppLock.
 *
 * Everything the user creates lives on the device, so this explains on-device
 * removal. The Firebase crash/analytics data the app sends is tied only to
 * random installation IDs; serviceProviderNote says so and how to remove it
 * (corrected 10 Oct 2026 — this page used to say "Nothing ... no analytics").
 */

const HTML = buildDeletionPage({
  slug: 'adfree-applock',
  appName: 'AdFree AppLock: App Locker',
  packageId: 'com.nomadiccharts.applock',
  storedItems: [
    'Which apps you chose to lock, and your lock preferences',
    'Your PIN, pattern or password, stored only as a hash',
    'Photos and videos you moved into the encrypted vault',
    'Intruder photos and failed-attempt logs, if you enabled that feature',
  ],
  inAppPath:
    'Settings → Privacy & Data → Delete All Data removes everything at once, from inside the app.',
  hasSubscription: true,
  serviceProviderNote:
    'The app uses Google Firebase for crash reports and, unless you turn it off in Settings → Privacy, usage analytics. Google holds that data for us, tied only to random installation IDs — never your name, email, advertising ID, locked apps or files. Clearing the app’s data or reinstalling starts new IDs; to have existing Firebase data deleted, email grievance@launchgrid.in.',
  lastUpdated: '10 October 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
