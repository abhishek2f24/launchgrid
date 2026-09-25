import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for Nyaya.
 *
 * Nyaya stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'nyayai',
  appName: 'Nyaya',
  packageId: 'in.launchgrid.nyayaai',
  storedItems: [
    'Matters you added (titles, parties, courts, case numbers, hearing dates, stage, notes)',
    'Bookmarks you starred in the research library',
    'Your selected plan and the monthly draft-usage counter',
  ],
  inAppPath:
    'Delete an individual matter, note or bookmark from its entry in the app. Settings &rarr; Erase all data removes everything at once.',
  hasSubscription: true,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
