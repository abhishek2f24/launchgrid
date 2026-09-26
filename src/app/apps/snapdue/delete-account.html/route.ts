import { NextResponse } from 'next/server'
import {
  DELETION_PAGE_HEADERS,
  buildDeletionPage,
} from '@/lib/apps/deletionPage'

/**
 * Data-deletion page for Snapdue.
 *
 * The app has no internet permission and collects nothing, so this explains
 * on-device removal rather than offering a request form we could not action.
 */

const HTML = buildDeletionPage({
  slug: 'snapdue',
  appName: 'Snapdue: Screenshot Reminder',
  packageId: 'in.launchgrid.snapdue',
  storedItems: [
    'Your reminders: title, date/time, category, repeat setting, and any amount, merchant or location you kept',
    'Up to 2,000 characters of the text extracted from each screenshot or shared message',
    'Your settings: theme, haptics, default time, and this month’s extraction count',
  ],
  inAppPath:
    'Deleting a reminder in the app removes it immediately. To remove everything, clear Snapdue’s data in Android Settings or uninstall the app.',
  hasSubscription: true,
  lastUpdated: '26 September 2026',
})

export async function GET() {
  return new NextResponse(HTML, { headers: DELETION_PAGE_HEADERS })
}
