import { inngest } from "@/inngest/client"
import crypto from "crypto"

/**
 * Dispatches an e-commerce event to the tenant's webhook subscriptions via Inngest.
 */
export async function dispatchWebhookEvent(tenantId: string, eventType: string, payload: any) {
  try {
    await inngest.send({
      name: "webhook/dispatch",
      data: {
        tenantId,
        eventType,
        payload,
        timestamp: new Date().toISOString()
      }
    })
    console.log(`[WEBHOOK_DISPATCH_QUEUED] tenant_id: ${tenantId}, event_type: ${eventType}`)
  } catch (error) {
    console.error(`[WEBHOOK_DISPATCH_QUEUE_ERROR] Failed to queue webhook event for tenant: ${tenantId}`, error)
  }
}

/**
 * Computes the SHA-256 HMAC signature of the payload using the secret key.
 */
export function calculateWebhookSignature(payload: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex")
}
