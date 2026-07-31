# Pricing and limits recommendation

## Do not ship the current billing claims

Current plan data and marketing copy are inconsistent. The audit brief expects two completed free reports; current code uses five product-idea creations/month. Paid plan names, pricing, and limits were recently changed in configuration but are not backed by account-level billing checkout or a subscription webhook.

## Recommended beta plans

| Plan | Price | Research | Stores | Store products | Notes |
|---|---:|---|---:|---:|---|
| Free | ₹0 | 2 **completed** reports/month | 1 | 5 | Basic evidence, branded sharing, manual refresh |
| Pro | ₹1,999/month | 25 completed reports/month subject to fair use | 1 | 100 | Full supplier/cost/profitability, draft store builder, one custom domain |
| Business | ₹9,999/month | High volume with enforced fair-use ceiling | 5 | 500 | Only after team, roles, batch processing, audit logs, and multi-store architecture are implemented |

## Credit definition

A report credit is consumed only once an asynchronous research job reaches a durable `completed` state with a usable recommendation. It is not consumed by:

- validation failures;
- failed or cancelled collection;
- opening, exporting, sharing, or recalculating an existing report;
- supplier edits;
- creating a store draft.

Reruns and refreshes need their own clearly priced/limited policy.

## Enforcement requirements

1. One transaction/RPC reserves and finalizes usage; never select then increment in application code.
2. Account/workspace entitlement is evaluated server-side for every paid action.
3. Limits include a reset date and current usage in the UI.
4. “Unlimited” is replaced by a documented fair-use ceiling, rate limit, and abuse review process.
5. Downgrade preserves completed reports and drafts but disables only future paid actions.

## Upgrade moments

Best: third completed report, advanced supplier comparison, monitoring, private export/share, additional store/domain, team invite.  
Avoid: before first report has value, blocking completed reports, or blocking compliance remediation.
