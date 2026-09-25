import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for AdFree AppLock.
 *
 * Play Data Safety declares no data collected, so this explains on-device
 * removal rather than offering a request form we could not action.
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
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
