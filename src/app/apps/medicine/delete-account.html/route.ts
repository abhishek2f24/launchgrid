import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for MediRemind.
 *
 * MediRemind stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'medicine',
  appName: 'MediRemind',
  packageId: 'in.launchgrid.medicine',
  storedItems: [
    'The medications you added, with dosage and schedule',
    'Your reminder times and notification preferences',
    'Your dose history &mdash; what was recorded as taken or missed',
  ],
  inAppPath:
    'Delete an individual medication or dose record from its entry in the app.',
  hasSubscription: false,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
