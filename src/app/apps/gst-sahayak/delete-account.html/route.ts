import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for GST Sahayak.
 *
 * GST Sahayak stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'gst-sahayak',
  appName: 'GST Sahayak',
  packageId: 'in.launchgrid.gstsahayak',
  storedItems: [
    'Client records you added (name, GSTIN, filing scheme, checklist state)',
    'GSTIN validation history &mdash; the GSTINs you checked, stored locally',
    'Reconciliation checklist progress and calendar preferences',
    'Your selected plan and notice-draft usage counter',
  ],
  inAppPath:
    'Remove a client record, or a saved GSTIN check, from its entry in the app.',
  hasSubscription: true,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
