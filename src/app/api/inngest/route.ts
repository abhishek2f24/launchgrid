import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { provisionTenantStore, syncDropshipCatalog, handleAbandonedCart } from "../../../inngest/functions";

// Next.js API route that Vercel exposes to the Inngest execution engine.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    provisionTenantStore,
    syncDropshipCatalog,
    handleAbandonedCart,
  ],
});
