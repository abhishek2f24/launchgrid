# First 10 — Shopify payout reconciliation

The experiment: can we get ten real Shopify merchants to run their own payout
report through LaunchGrid, and does what they see make them want it monthly?

Landing page: **`/shopify-payout-reconciliation`**

---

## One change from the reviewed draft

The review suggested offering *"send me your latest payout report and I'll run
it for free."* Strong offer, but I'd change the mechanics, for three reasons:

1. **It contradicts the landing page.** The page's headline promise is that the
   file is read in the browser and never uploaded. Asking a merchant to email
   us the file makes that promise look like marketing.
2. **It's a much bigger ask.** Emailing a financial export to a stranger is a
   far higher bar than clicking a link — and the people most likely to say yes
   are the least careful ones, which is not the ICP.
3. **It creates handling liability for us.** Once a payout file is in an inbox,
   it is our problem to store and delete.

So the offer keeps the *"a result, not software"* framing, but the merchant
runs it themselves:

> Here's a link — it runs in your browser, nothing gets uploaded, takes about a
> minute. If you'd rather go through the results together, I'm happy to hop on
> a call and walk through what it flagged.

We still give them the result. We just don't take custody of the file.

---

## ICP

Shopify merchants using **Shopify Payments**, with enough volume that a payout
report has hundreds of rows:

- US, UK, Australia or Canada
- Multiple products, established store
- Likely reconciling manually or not at all

---

## Three angles to test

Send roughly equal numbers of each. The point is to learn which framing gets a
reply, so don't mix them within one prospect.

### Angle A — Money

> Hi {{FirstName}} — I'm building LaunchGrid, a payout reconciliation tool for
> Shopify merchants.
>
> It checks a Shopify Payments payout report for duplicate deductions, unusual
> fees, and transactions that don't reconcile normally.
>
> It's free and runs entirely in your browser — nothing gets uploaded. Takes
> about a minute: {{Link}}
>
> If it flags anything, I'm happy to go through the results with you.

### Angle B — Audit

> Hi {{FirstName}} — quick question.
>
> Do you regularly reconcile your Shopify Payments payouts against your sales,
> or is that mostly left to Shopify and your accounting software?
>
> I'm testing a tool that checks payout reports for discrepancies and unusual
> deductions. Free, runs in your browser, no account: {{Link}}
>
> Genuinely curious what it finds on a real store's file.

### Angle C — Curiosity

> Hi {{FirstName}} — I'm testing something for Shopify merchants.
>
> You drop in a Shopify Payments payout report and it checks every transaction
> for duplicate deductions, unusual fees and payout mismatches. It runs in your
> browser, so the file never leaves your machine.
>
> It's free while we're validating it: {{Link}}
>
> Would love to know whether it finds anything on your store.

---

## Personalise the rest

For the first 50–100 prospects, look at the store and write one real sentence.
Generic mail at this stage teaches us nothing, because a zero reply rate could
mean the offer is wrong *or* that the mail looked like spam.

> Hi {{FirstName}},
>
> I came across {{StoreName}} — {{one specific, true observation about their
> store}}.
>
> I'm building LaunchGrid, which checks Shopify Payments payout reports for
> duplicate deductions, unusual fees and transactions that don't reconcile
> normally. Free, no signup, and it runs in your browser so the file stays on
> your machine: {{Link}}
>
> If it flags anything I'd be glad to look at it with you.

---

## What we are measuring

This matters more than the page design. It is a **diagnostic funnel**, not a
set of targets to hit.

| Stage | Count | What it tells us |
| --- | ---: | --- |
| Prospects identified | 100 | Can we reach the ICP at all? |
| Delivered | 50 | Is the contact data any good? |
| Replies | 10 | Is the problem interesting? |
| Uploaded a file | 5 | Is the offer compelling? |
| Meaningful findings | 3 | Does the product create value? |
| Want it recurring | 2 | Is there a reason to come back? |
| Paid | 1+ | Willingness to pay |

**How to read the result:**

- **Nobody uploads** → the positioning is wrong. Do not build features.
- **People upload, nobody wants it recurring** → the value is one-off. That is
  a real answer, and it means this is a lead magnet, not a product.
- **People ask "can it run automatically every payout?"** → that is the product
  signal. Build the history and monitoring layer.
- **Findings come back empty on most files** → either the checks are too
  narrow, or Shopify payouts are cleaner than marketplace payouts and Amazon
  should have been first.

That last one is the honest risk with Shopify: Shopify Payments is a payment
processor with a simple, published fee, so its payouts may reconcile cleanly.
Marketplaces with commissions, penalties and RTO charges are messier and
likelier to produce findings. If the first ten files come back clean, that is
not a failure — it is a signal to move the page to Amazon.

---

## Tracker

| # | Store | Angle | Sent | Replied | Uploaded | Findings | Wants recurring | Paid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |

---

## The question to ask anyone who uploads

Not "would you pay for this?" — people are polite. Ask:

> How do you check your payouts today, and how long does it take?

Then:

> If this ran automatically on every payout and kept the history, what would
> that be worth to you?

Their number sets the price. Ours would be a guess.
