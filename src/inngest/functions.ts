import { inngest } from "./client";

/**
 * Queue 1: High-Priority Store Generation
 * Triggered right after the 15-second synchronous onboarding step.
 */
export const provisionTenantStore = inngest.createFunction(
  {
    id: "provision-tenant-store",
    retries: 3,
    triggers: [{ event: "tenant/provision.start" }]
  },
  async ({ event, step }) => {
    // 1. AI Brand Generation (with Graceful Fallback on Failure/Timeout)
    const brandAssets = await step.run("generate-ai-brand", async () => {
      try {
        // Simulate potential GPT-4o timeouts or API errors
        if (Math.random() > 0.8) {
          throw new Error("GPT-4o API timeout/failure");
        }
        await new Promise(r => setTimeout(r, 1500));
        return { 
          logoUrl: "/mock-logo.png", 
          primaryColor: "#4F46E5", 
          tagline: "Your destination for premium items."
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[PROVISION_WARNING] AI Branding failed: ${message}. Using default placeholders.`);
        return { 
          logoUrl: null, // Will fall back to business name initials in UI
          primaryColor: "#6366f1", // Default premium Indigo
          tagline: `Welcome to ${event.data.businessName}.` 
        };
      }
    });

    // 2. Dropship Catalog Import (with Graceful Fallback)
    const catalogResult = await step.run("import-catalog", async () => {
      try {
        if (Math.random() > 0.9) {
          throw new Error("GlowRoad supplier API rate limited");
        }
        await new Promise(r => setTimeout(r, 2000));
        return { success: true, itemsImported: 50 };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[PROVISION_WARNING] Catalog import failed: ${message}. Using mock products.`);
        return { success: false, itemsImported: 0 };
      }
    });

    // 3. SEO Foundation
    await step.run("generate-seo", async () => {
      return { success: true };
    });

    // 4. Finalize DB state (Triggers Supabase Realtime WebSocket)
    await step.run("finalize-provisioning", async () => {
      // Logic to finalize database, insert default products if catalogResult.success is false
      return { status: "complete" };
    });

    return { success: true, brandAssets, catalogResult };
  }
);

/**
 * Queue 2: Scheduled Dropship Syncs
 * Keeps the global catalog fresh. Runs at 2:00 AM IST.
 */
export const syncDropshipCatalog = inngest.createFunction(
  {
    id: "sync-dropship-catalog",
    triggers: [{ cron: "TZ=Asia/Kolkata 0 2 * * *" }]
  },
  async ({ step }) => {
    await step.run("fetch-supplier-inventory", async () => {
      // Fetch latest CSV/API from GlowRoad/Robu
      return { syncedCount: 10500 };
    });
  }
);

/**
 * Queue 3: Time-Delayed Marketing (Abandoned Cart)
 * Triggered on checkout initiate. Cancelled if payment succeeds.
 */
export const handleAbandonedCart = inngest.createFunction(
  { 
    id: "handle-abandoned-cart",
    triggers: [{ event: "cart/abandoned.start" }],
    cancelOn: [
      {
        event: "cart/payment.captured",
        timeout: "24h",
        match: "data.provisionalOrderId", // Only cancel if the order IDs match
      }
    ]
  },
  async ({ event, step }) => {
    // 1. Wait 15 minutes
    await step.sleep("wait-15-mins", "15m");
    
    // 2. Send First Email
    await step.run("send-recovery-email", async () => {
      // Call Resend API
      return { sentTo: event.data.customerEmail };
    });

    // 3. Wait another 45 mins (Total 1 hr)
    await step.sleep("wait-45-mins", "45m");

    // 4. Send WhatsApp Reminder
    await step.run("send-whatsapp-1", async () => {
      // Call Wati/Interakt API
      return { sentTo: event.data.customerPhone };
    });

    // 5. Wait 23 hours (Total 24 hrs)
    await step.sleep("wait-23-hours", "23h");

    // 6. Send Final WhatsApp with 10% Discount
    await step.run("send-whatsapp-discount", async () => {
      return { success: true, discountApplied: 10 };
    });
  }
);
