import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for SendLater &ndash; Message Scheduler.
 *
 * SendLater &ndash; Message Scheduler stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'whatsapp',
  appName: 'SendLater &ndash; Message Scheduler',
  packageId: 'in.launchgrid.whatsapp',
  storedItems: [
    'The names and phone numbers of contacts you selected for a message',
    'The text of messages you wrote, including saved templates',
    'Your schedules, repeat settings and time-zone choices',
    'Your delivery history',
    'Your safety check-in settings and chosen alert recipients',
  ],
  inAppPath:
    'Delete an individual schedule, template or history entry from its row in the app.',
  hasSubscription: true,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
