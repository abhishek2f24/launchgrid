// Research credit packs.
//
// THE MODEL
//   Credits buy research. Subscription buys the storefront. They are deliberately
//   separate purchases with separate lifecycles: a merchant researching products has
//   not necessarily decided to launch a store, and someone running a store does not
//   need research every month. Credits therefore never expire with a plan and belong
//   to the ACCOUNT, not the person who bought them.
//
// PRICES ARE IN PAISE — Razorpay's unit. Storing rupees here and multiplying at the
// call site is how off-by-100 charges happen.

export interface CreditPack {
  id: string;
  credits: number;
  pricePaise: number;
  label: string;
  /** Shown as the per-report price so the saving is legible. */
  perReportRupees: number;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'research_25',
    credits: 25,
    pricePaise: 199_900, // ₹1,999
    label: '25 research reports',
    perReportRupees: 80,
    popular: true,
  },
  {
    id: 'research_5',
    credits: 5,
    pricePaise: 49_900, // ₹499
    label: '5 research reports',
    perReportRupees: 100,
  },
  {
    id: 'research_100',
    credits: 100,
    pricePaise: 699_900, // ₹6,999
    label: '100 research reports',
    perReportRupees: 70,
  },
];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export const rupees = (paise: number) => Math.round(paise / 100);

/**
 * Credits granted on signup.
 *
 * These buy ON-DEMAND research only — reading an existing catalogue report is free,
 * so a new account can explore the whole catalogue without spending anything. That
 * split is what makes the number generous without being expensive: each credit is
 * ~₹2–5 of residential-proxy spend, and only a genuinely uncovered product uses one.
 */
export const WELCOME_RESEARCH_CREDITS = 5
