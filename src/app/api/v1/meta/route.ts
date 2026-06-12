import { NextResponse } from 'next/server'

/**
 * GET /api/v1/meta — app-version gate.
 * Mobile checks this at launch; below min_supported_version it shows a
 * force-upgrade screen. Bump min only for breaking API changes.
 */
export async function GET() {
  return NextResponse.json({
    data: {
      min_supported_version: '1.0.0',
      latest_version: '1.0.0',
      store_urls: {
        ios: 'https://apps.apple.com/app/launchgrid',
        android: 'https://play.google.com/store/apps/details?id=in.launchgrid.mobile',
      },
    },
    error: null,
  })
}
