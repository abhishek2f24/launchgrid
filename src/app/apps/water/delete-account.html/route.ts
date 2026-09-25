import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for Hydrate.
 *
 * Hydrate stores everything on-device, so this explains how to remove it
 * rather than offering a request form — see the note in deletionPage.ts.
 */

const HTML = buildDeletionPage({
  slug: 'water',
  appName: 'Hydrate',
  packageId: 'in.launchgrid.water',
  storedItems: [
    'Your daily hydration goal and unit preference',
    'Your intake log &mdash; what you recorded drinking, and when',
    'Your reminder schedule',
  ],
  hasSubscription: false,
  lastUpdated: '25 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
