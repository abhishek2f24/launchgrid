# User data isolation report

## Scope and result

Research ownership is broadly designed correctly at the database level: `research_projects`, `product_ideas`, `research_suppliers`, score tables, cost/profitability tables, and `research_usage` have RLS enabled and scope access through `auth.uid()` or a product-idea ownership join.

## Direct User A versus User B test

| Test | Result | Risk |
|---|---|---|
| User B reads User A private idea by UUID | Empty result; no title or metadata returned | Pass |
| User B updates User A private idea by UUID | Zero rows updated | Pass |
| User A reads own idea | One row returned | Pass |

## P0 profile ownership defect

The research foreign keys reference `public.users(id)`. Fresh users created in `auth.users` were not mirrored into `public.users`; the database rejected research-project insertion. There is no observed trigger on `auth.users` to create that public profile.

This blocks normal new-user research and creates inconsistent identity state. Fix with a secure, idempotent profile trigger plus a backfill, then verify signup, email verification, password reset, and existing users.

## Public discovery

Anonymous public search now queries only `product_ideas.is_public = true` with a non-null public slug. The Mesh Laundry Bag report was explicitly published for testing. Public search returns a limited summary, not supplier details or private calculations.

This is safer than querying all research records, but it needs:

- an operator publishing workflow;
- a visible “public example/report” label;
- an audit trail for publication and revocation;
- separate report-sharing records rather than making a user-owned research row public.

## Not implemented / not testable

No durable tables/routes were found for workspace memberships, team roles, share links, exports, RFQs, sample requests, or report-level access grants. Therefore their isolation, revocation, and expiration controls cannot be certified.

## Recommended isolation model

- Every user-owned object: `workspace_id`, `created_by`, `created_at`, `updated_at`, archive state.
- Every report/share/export: explicit `access_scope`, expiry/revocation state, and a server-side authorization check.
- Public catalogue: separate curated/published report projection; never expose raw private research tables.
- Cache keys: include workspace/user identity and plan entitlement version.
