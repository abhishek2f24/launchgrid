/**
 * emails.ts — All transactional email dispatch
 * Uses Resend for delivery. Falls back to console.log if RESEND_API_KEY is missing.
 */

import { Resend } from 'resend'

const FROM = process.env.FROM_EMAIL || 'hello@launchgrid.in'
const BRAND = 'LaunchGrid'

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY not set — falling back to console log')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// ─── Trial expiry emails — Day 5 nudge and Day 6 final warning ───────────────
// Trial is 7 days. Cron fires at 30-min intervals; we detect by trial_expires_at
// being ≤ 48h away (type: 'day5') or ≤ 24h away (type: 'day6').

export async function sendTrialEmail(
  to: string,
  businessName: string,
  subdomain: string,
  hoursLeft: number,
  type: 'day5' | 'day6'
) {
  const storeUrl = `https://${subdomain}.launchgrid.in`
  const upgradeUrl = `https://launchgrid.in/dashboard`

  const subject = type === 'day5'
    ? `2 days left — ${businessName} trial ending soon`
    : `Last 24 hours — ${businessName} archives tomorrow`

  const htmlBody = type === 'day5'
    ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
        <h2 style="margin-top:0;">Your 7-day trial ends in 2 days.</h2>
        <p>You built <strong>${businessName}</strong> from scratch. Your store is live at <a href="${storeUrl}">${storeUrl}</a>.</p>
        <p>In <strong>${hoursLeft} hours</strong> your store will be archived. Your products, domain, and all data are preserved — but customers won't be able to buy.</p>
        <p>Upgrade now to keep selling for <strong>₹999/month</strong>.</p>
        <p><a href="${upgradeUrl}" style="background:#1a1a18;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Keep My Store Live →</a></p>
        <p style="font-size:12px;color:#999;margin-top:32px;">You received this because you started a free trial on ${BRAND}.</p>
      </div>`
    : `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
        <h2 style="margin-top:0;">Last 24 hours.</h2>
        <p><strong>${businessName}</strong> archives tomorrow if you don't upgrade.</p>
        <p>Your store has been live for 6 days. Real people have visited it. Don't let that momentum go — upgrade in the next 24 hours to keep everything.</p>
        <p><a href="${upgradeUrl}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Upgrade Now — ₹999/mo →</a></p>
        <p style="font-size:12px;color:#999;margin-top:32px;">You received this because you started a free trial on ${BRAND}.</p>
      </div>`

  const resend = getResend()
  if (!resend) {
    console.log(`[EMAIL trial_${type}] To: ${to} | Subject: ${subject}`)
    return { success: true }
  }

  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to,
    subject,
    html: htmlBody,
  })

  if (error) {
    console.error('[EMAIL_SEND_ERROR]', error)
    return { success: false, error }
  }

  return { success: true }
}

// ─── Welcome email after setup completion ─────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  businessName: string,
  subdomain: string
) {
  const dashboardUrl = 'https://launchgrid.in/dashboard'
  const storeUrl = `https://${subdomain}.launchgrid.in`

  const subject = `🚀 Your store is live — here's how to make your first sale`

  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
    <h2 style="margin-top:0;">Welcome to ${BRAND}, ${businessName}! 🎉</h2>
    <p>Your store is live at <a href="${storeUrl}">${storeUrl}</a>.</p>
    <p>Here's your 3-step launch checklist:</p>
    <ol style="line-height:2;">
      <li>Add your first product from the <a href="${dashboardUrl}/products">Products</a> tab</li>
      <li>Share your store link on WhatsApp, Instagram, and anywhere your customers are</li>
      <li>Watch orders come in from your <a href="${dashboardUrl}">Dashboard</a></li>
    </ol>
    <p>You have a <strong>7-day free trial</strong>. Your store is fully functional — add real products and drive real traffic.</p>
    <p><a href="${dashboardUrl}" style="background:#1a1a18;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Go to Dashboard →</a></p>
    <p style="font-size:12px;color:#999;margin-top:32px;">Questions? Reply to this email — we read every one.</p>
  </div>`

  const resend = getResend()
  if (!resend) {
    console.log(`[EMAIL welcome] To: ${to} | Business: ${businessName}`)
    return { success: true }
  }

  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[WELCOME_EMAIL_ERROR]', error)
    return { success: false, error }
  }

  return { success: true }
}

// ─── Support contact email ────────────────────────────────────────────────────

export async function sendSupportEmail(params: {
  fromName: string
  fromEmail: string
  message: string
}) {
  const { fromName, fromEmail, message } = params
  const supportInbox = process.env.SUPPORT_EMAIL || 'support@launchgrid.in'

  const resend = getResend()
  if (!resend) {
    console.log(`[EMAIL support] From: ${fromEmail} | Message: ${message.substring(0, 80)}`)
    return { success: true }
  }

  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to: supportInbox,
    replyTo: fromEmail,
    subject: `Support request from ${fromName}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
      <h3 style="margin-top:0;">New Support Request</h3>
      <p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
      <hr style="border:none;border-top:1px solid #eee;"/>
      <p style="white-space:pre-wrap;">${message}</p>
    </div>`,
  })

  if (error) {
    console.error('[SUPPORT_EMAIL_ERROR]', error)
    return { success: false, error }
  }

  // Auto-reply to sender
  await resend.emails.send({
    from: `${BRAND} Support <${FROM}>`,
    to: fromEmail,
    subject: `We received your message — ${BRAND} Support`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin-top:0;">Got it, ${fromName}!</h2>
      <p>We received your message and will get back to you within 24 hours.</p>
      <p>Here's what you sent:</p>
      <blockquote style="border-left:3px solid #8b5cf6;padding-left:16px;color:#555;white-space:pre-wrap;">${message}</blockquote>
      <p style="font-size:12px;color:#999;margin-top:32px;">${BRAND} · support@launchgrid.in</p>
    </div>`,
  }).catch(() => {}) // best-effort auto-reply

  return { success: true }
}
