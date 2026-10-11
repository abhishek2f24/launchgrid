import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { leadSecret, normaliseEmail, verifyUnsubscribeSig } from '@/lib/apps/leadOtp'

/**
 * One-click unsubscribe for AdFree AppLock marketing email.
 *
 * Every marketing email to this list must link here:
 *   https://launchgrid.in/api/apps/adfree-applock/unsubscribe?email=<e>&sig=<unsubscribeSig(e)>
 * The signature stops anyone from unsubscribing addresses they do not own. The
 * row is kept (the address stays verified for the in-app offer); only the
 * marketing consent is withdrawn, as the DPDP Act requires it to be on request.
 *
 * GET ONLY ASKS; POST UNSUBSCRIBES
 *   Mail security scanners open every link in a message. If GET unsubscribed,
 *   people would be removed without ever asking. So the link shows a one-button
 *   confirmation, and the change happens on POST — that button, or a mail
 *   client's RFC 8058 one-click request (List-Unsubscribe-Post), which POSTs to
 *   the same URL. Marketing mail should send both List-Unsubscribe headers.
 */

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="robots" content="noindex"></head>` +
      `<body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;line-height:1.6;color:#222"><h1 style="font-size:1.4rem">${title}</h1><p>${body}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

/** The verified address from a signed link, or null when the link is not valid. */
function addressFrom(url: URL): string | null {
  const secret = leadSecret()
  const email = normaliseEmail(url.searchParams.get('email'))
  if (!secret || !email || !verifyUnsubscribeSig(secret, email, url.searchParams.get('sig'))) return null
  return email
}

const INVALID = ['Link not valid', 'This unsubscribe link is incomplete or has been altered. Reply to any of our emails and we will remove you by hand.'] as const

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = addressFrom(url)
  if (!email) return page(INVALID[0], INVALID[1], 400)
  const action = escapeHtml(`${url.pathname}${url.search}`)
  return page(
    'Unsubscribe?',
    `Stop news and offers from LaunchGrid to <strong>${escapeHtml(email)}</strong>?</p>` +
      `<form method="post" action="${action}"><button type="submit" style="font:inherit;padding:10px 18px;border-radius:8px;border:0;background:#222;color:#fff;cursor:pointer">Unsubscribe</button></form><p style="color:#666;font-size:.9rem">Your in-app offer is not affected.`
  )
}

// The confirmation button, and RFC 8058 one-click requests from mail clients.
export async function POST(request: Request) {
  const email = addressFrom(new URL(request.url))
  if (!email) return page(INVALID[0], INVALID[1], 400)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('early_access_signups')
    .select('context')
    .eq('email', email)
    .eq('source', 'adfree-applock')
    .maybeSingle()
  if (error) {
    console.error('[APPLOCK_UNSUBSCRIBE_ERROR]', error.message)
    return page('Something went wrong', 'Please try the link again in a minute.', 500)
  }
  if (data) {
    const context = { ...(data.context ?? {}), marketing: false, unsubscribedAt: new Date().toISOString() }
    const { error: updateError } = await supabase
      .from('early_access_signups')
      .update({ context })
      .eq('email', email)
      .eq('source', 'adfree-applock')
    if (updateError) {
      console.error('[APPLOCK_UNSUBSCRIBE_ERROR]', updateError.message)
      return page('Something went wrong', 'Please try the link again in a minute.', 500)
    }
  }
  return page('You are unsubscribed', 'You will not receive any more news or offers from LaunchGrid at this address.')
}
