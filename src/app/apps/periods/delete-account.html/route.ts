import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for Know Your Cycle.
 *
 * Know Your Cycle stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'periods',
  appName: 'Know Your Cycle',
  packageId: 'in.launchgrid.periods',
  storedItems: [
    'The cycle dates you logged',
    'Any symptoms or notes you recorded',
    'Your reminder settings',
    'Any cloud backup, if you explicitly enabled it',
  ],
  inAppPath:
    'Delete an individual logged cycle or symptom entry from its record in the app.',
  hasCloudCopy: true,
  cloudCopyNote:
    'CycleCare offers an optional cloud backup that is used only when you explicitly turn it on.',
  hasSubscription: true,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
