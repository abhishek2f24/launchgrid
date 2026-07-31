# Product-to-store flow audit

## Current implemented path

`Product Idea → Research records → promoteResearchToProduct() → inactive store product draft`

The promotion action correctly creates an inactive product draft and carries:

- product title;
- target retail price (or a derived fallback);
- selected supplier metadata;
- landed-cost metadata;
- link back to the research idea.

## Missing or unsafe transitions

| Transition | Required behaviour | Current assessment |
|---|---|---|
| Idea → report | Collect evidence; mark completion; consume one credit atomically | Missing completion model; credit is consumed on idea creation |
| Report → final specification | User reviews improved specification and claims | Final-product-spec workflow is not persisted as a separate entity |
| Report → store draft | Require launch-ready decision, entitlement, owned target store, and explicit confirmation | Draft creation exists, but launch-ready is not server-enforced |
| Draft → publish | Confirm price, cost, supplier, inventory, images, shipping, compliance, returns, and payment setup | Store product remains inactive initially, but publish confirmation/provenance audit is not established in this flow |
| Research updates → live product | Never overwrite live commercial data automatically | Current promotion is one-way metadata copy; retain this separation and add explicit provenance fields |

## Required validation before draft creation

1. Caller owns the chosen store/workspace.
2. Product idea is in a launch-ready state from a server-side calculation.
3. Paid/free entitlement allows the destination store/product.
4. Every imported field has provenance: research estimate, supplier-confirmed, user-edited, or missing.
5. Compliance blockers prevent publication, not merely display a warning.

## Failure handling

- If store setup is incomplete, retain the research report and create no live product.
- If a draft insert fails, do not mark the research idea promoted.
- Use one transaction or a compensating rollback for product insert + research-link update.
- Preserve the research snapshot used for a draft, so later recalculation does not silently alter commercial listings.
