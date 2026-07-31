# LaunchGrid + SourceIQ end-to-end user story audit

**Audit date:** 2026-07-27  
**Environment:** local Next.js application at `http://localhost:3000`, connected development Supabase project  
**Decision:** Not ready for production.

## Evidence-backed outcomes

| Persona / story | Actual result | Assessment |
|---|---|---|
| Anonymous visitor | Can search public, explicitly published reports. Mesh Laundry Bag is returned for exact and intent terms. | Partial pass. Results need a result-first layout (now implemented locally), but anonymous reports remain preview-only. |
| New user sign-up → research | A secure auth-profile trigger now creates `public.users`; a fresh account created a research project successfully. | Pass for tested database lifecycle. Browser signup/email-return flow still needs regression coverage. |
| User A private research | Owner can read their private product idea through RLS. | Pass in direct authenticated REST test. |
| User B reads/updates User A research | RLS returned 0 rows for both direct read and update attempts. No title was leaked. | Pass for tested `product_ideas` route. |
| Free report limit | Credit finalization now occurs through a transactional RPC after opportunity scoring. Three simultaneous finalization attempts resulted in exactly two completions and one server rejection. | Pass for tested free two-report boundary. Full failed-job/retry lifecycle remains to be tested. |
| Third free report | Not safely testable as a lifecycle because report completion jobs do not exist in the current flow. Current configured free limit is 5 ideas/month, while the audit brief expects 2 completed reports/month. | **P1 mismatch.** |
| Upgrade / paid checkout | Existing Razorpay webhook handles merchant storefront order capture only. It does not activate LaunchGrid plans or enforce the introductory offer. | **P0 fail.** |
| Launch research into store | `promoteResearchToProduct` creates a draft, inactive product and preserves some research metadata. It requires a tenant. It does not verify that the idea is launch-ready server-side. | **P1 fail.** Draft-only behaviour is correct; launch decision enforcement is incomplete. |
| Multiple stores | Subscription and entitlement lookup are tenant-scoped; account-level multi-store capability is not modeled end-to-end. `maybeSingle()` tenant lookups also fail when an owner has multiple tenants. | **P1 fail.** |
| Team/workspace/sharing/RFQ/sample/export | No corresponding durable workspace, membership, share-link, export, RFQ, or sample-request model was found in the merged research module. | Not implemented; must not be sold as available. |

## Tested ownership evidence

Two fresh audit users were created. A private product idea was seeded for User A through the service role solely to test RLS.

- User B GET of User A's exact product-idea UUID: HTTP 200 with zero rows.
- User B PATCH of User A's exact product-idea UUID: HTTP 200 with zero updated rows.
- User A GET of the same UUID: one row, retaining the original name.

The HTTP 200/empty response is acceptable for non-enumeration, but equivalent checks remain required for every child table, exports, store products, and future share routes.

## Required fixes before a controlled beta

1. Introduce account/workspace-level entitlements, not subscriptions attached only to a store tenant.
2. Implement a distinct LaunchGrid billing checkout and webhook path; do not reuse merchant storefront order capture.
3. Add failed-job, cancellation, retry, and browser signup lifecycle regression coverage.
4. Require a server-side launch-ready decision and explicit confirmation before promotion to a store-product draft.
5. Define only implemented plans in product copy. Do not advertise team, monitoring, RFQ, sharing, or unlimited research before enforcement exists.
