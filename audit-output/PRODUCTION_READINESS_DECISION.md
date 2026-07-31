# Production readiness decision

## Decision: Not ready

### Remaining P0 launch blocker

1. **Billing activation absent:** Razorpay webhook processes merchant store orders, not LaunchGrid subscription purchases or introductory-offer activation.

### Remediated and verified in this pass

- Auth users are now mirrored to `public.users` through a secure database trigger; a fresh account could create its first research project.
- Research credits are finalized only when an opportunity report completes. A concurrent three-request test produced two completions and one server-side limit rejection for a free account.

### P1 findings

- Free entitlement definition differs between audit requirements and current implementation.
- Account-level/multi-store entitlement model is incomplete; subscriptions are tenant-scoped.
- Promotion to store draft lacks server-side launch-ready gating.
- Team, workspace, sharing, export, RFQ, sample, monitoring, and audit-log promises are not implemented.
- Public-report publishing needs an operator workflow, revocation, and audit log.
- Product terminology remains ambiguous between research idea, report, draft, and live store product.

## Readiness assessment

| Area | Status |
|---|---|
| Research RLS on tested private idea | Pass |
| New-user journey | Fail |
| Billing/entitlements | Fail |
| Research → store safety | Partial |
| Store ownership model | Partial |
| Team/share/workspace | Not implemented |
| Public discovery privacy boundary | Partial |

## Estimated remediation

**Critical beta path:** 2–4 engineering weeks with tests: identity trigger/backfill, report-job lifecycle, transactional usage, account entitlements, subscription checkout/webhook, promotion validation, end-to-end browser coverage.  
**Business plan path:** additional 4–8 weeks for workspace roles, sharing/export controls, RFQ/sample workflows, batch jobs, monitoring, and audit logs.
