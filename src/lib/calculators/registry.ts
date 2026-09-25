/**
 * Wave 6 — finance and business calculators, as data.
 *
 * WHAT IS NOT HERE, AND WHY
 *   The source plan listed 20. Three already ship as bespoke pages (GST,
 *   Profit Margin, ROAS) and are left alone rather than migrated — rewriting a
 *   working, ranking page to save a few lines is churn, not progress. Two pairs
 *   collapse: "EMI" and "Loan" are one calculator, and so are "CAGR" and
 *   "Investment Return". That leaves the 15 below.
 *
 * ON PERISHABLE RATES
 *   Two of these touch regulated numbers that change (TDS section rates, salary
 *   deduction rules). Neither hardcodes a rate table. A table baked in today is
 *   wrong after the next Finance Act, and a confidently wrong tax number is
 *   more damaging to a small business — and to us — than no calculator at all.
 *   Both take the rate as an input and say plainly what they exclude.
 */

import {
  Banknote,
  Boxes,
  ChartLine,
  Calculator,
  Handshake,
  Landmark,
  Megaphone,
  Percent,
  Repeat,
  Scale,
  ShoppingCart,
  Target,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { divide, finite, type CalculatorDef } from './types';

export const CALCULATORS: CalculatorDef[] = [
  {
    slug: 'emi-calculator',
    title: 'EMI & Loan Calculator',
    shortTitle: 'EMI Calculator',
    description:
      'Work out the monthly instalment on a business or personal loan, and what the interest actually costs you over the full term.',
    icon: Landmark,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'principal', label: 'Loan amount', unit: '₹', defaultValue: 500000, min: 0, step: 1000 },
      { id: 'rate', label: 'Interest rate (per year)', unit: '%', defaultValue: 12, min: 0, step: 0.1 },
      { id: 'months', label: 'Tenure', unit: 'months', defaultValue: 36, min: 1, step: 1 },
    ],
    outputs: [
      { id: 'emi', label: 'Monthly EMI', format: 'inr', primary: true },
      { id: 'totalInterest', label: 'Total interest', format: 'inr' },
      { id: 'totalPayable', label: 'Total repayable', format: 'inr' },
    ],
    compute: ({ principal, rate, months }) => {
      if (months <= 0) return { emi: null, totalInterest: null, totalPayable: null };
      const monthlyRate = rate / 12 / 100;
      // A 0% loan is a straight division; the compound formula divides by zero.
      const emi =
        monthlyRate === 0
          ? principal / months
          : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
      const totalPayable = emi * months;
      return {
        emi: finite(emi),
        totalPayable: finite(totalPayable),
        totalInterest: finite(totalPayable - principal),
      };
    },
    formula:
      'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where r is the monthly rate (annual ÷ 12 ÷ 100) and n is the number of months.',
    caveat:
      'Assumes a fixed rate and equal instalments. Processing fees, insurance and prepayment charges are not included.',
    keywords: ['emi calculator', 'loan emi calculator india', 'business loan calculator', 'interest calculator'],
    useCases: ['Size a business loan', 'Compare tenure options', 'See the real cost of interest'],
  },

  {
    slug: 'marketplace-fee-calculator',
    title: 'Marketplace Fee Calculator',
    shortTitle: 'Marketplace Fees',
    description:
      'Work out what Amazon, Flipkart or Meesho actually leave you after commission, fixed fees, shipping and the GST charged on all of them.',
    icon: ShoppingCart,
    bucket: 'know-numbers',
    badge: 'Marketplace',
    fields: [
      { id: 'price', label: 'Selling price', unit: '₹', defaultValue: 999, min: 0, step: 10 },
      { id: 'commission', label: 'Commission', unit: '%', defaultValue: 15, min: 0, max: 100, step: 0.5, help: 'From your own seller agreement — category rates differ and change.' },
      { id: 'fixedFee', label: 'Fixed / closing fee', unit: '₹', defaultValue: 12, min: 0, step: 1 },
      { id: 'shipping', label: 'Shipping charged to you', unit: '₹', defaultValue: 60, min: 0, step: 5 },
      { id: 'gstOnFees', label: 'GST on marketplace fees', unit: '%', defaultValue: 18, min: 0, max: 100, step: 1, help: 'Marketplaces charge GST on their fees. Leaving it out is the most common way sellers overestimate profit.' },
      { id: 'cost', label: 'Your product cost', unit: '₹', defaultValue: 450, min: 0, step: 10 },
    ],
    outputs: [
      { id: 'profit', label: 'Profit per order', format: 'inr', primary: true },
      { id: 'payout', label: 'Marketplace pays you', format: 'inr' },
      { id: 'deducted', label: 'Total deducted', format: 'inr' },
      { id: 'margin', label: 'Margin on selling price', format: 'percent' },
      { id: 'effectiveFee', label: 'Effective deduction', format: 'percent' },
    ],
    compute: ({ price, commission, fixedFee, shipping, gstOnFees, cost }) => {
      const feesBeforeGst = (price * commission) / 100 + fixedFee + shipping;
      const deducted = feesBeforeGst * (1 + gstOnFees / 100);
      const payout = price - deducted;
      const profit = payout - cost;
      return {
        payout: finite(payout),
        deducted: finite(deducted),
        profit: finite(profit),
        margin: divide(profit * 100, price),
        effectiveFee: divide(deducted * 100, price),
      };
    },
    formula:
      'Deducted = (Price × Commission% + Fixed fee + Shipping) × (1 + GST on fees ÷ 100). Payout = Price − Deducted. Profit = Payout − Cost.',
    caveat:
      'Fee structures change every few months and vary by category, weight slab and fulfilment mode — enter the rates from your own seller agreement rather than remembered figures. Returns are not modelled here; use the RTO side of the Ad Profitability and CLV calculators for that.',
    keywords: ['marketplace fee calculator', 'amazon seller fee calculator india', 'flipkart commission calculator', 'meesho profit calculator'],
    useCases: ['Price a marketplace listing', 'Compare two marketplaces', 'Check a settlement against expectation'],
  },

  {
    slug: 'shipping-cost-calculator',
    title: 'Shipping & Volumetric Weight Calculator',
    shortTitle: 'Shipping Weight',
    description:
      'Couriers bill the greater of actual weight and box size. Find which one you are paying for, and what a smaller box would save.',
    icon: Truck,
    bucket: 'know-numbers',
    badge: 'Logistics',
    fields: [
      { id: 'length', label: 'Box length', unit: 'cm', defaultValue: 30, min: 0, step: 1 },
      { id: 'width', label: 'Box width', unit: 'cm', defaultValue: 25, min: 0, step: 1 },
      { id: 'height', label: 'Box height', unit: 'cm', defaultValue: 20, min: 0, step: 1 },
      { id: 'actualWeight', label: 'Actual weight', unit: 'kg', defaultValue: 0.5, min: 0, step: 0.05 },
      { id: 'divisor', label: 'Courier divisor', defaultValue: 5000, min: 1, step: 1, help: 'Usually 5000 in India; some couriers use 4000, which costs you more. It is on your rate card.' },
      { id: 'rate', label: 'Rate per kg', unit: '₹', defaultValue: 60, min: 0, step: 5 },
      { id: 'orders', label: 'Orders per month', defaultValue: 300, min: 0, step: 10 },
    ],
    outputs: [
      { id: 'chargeable', label: 'Chargeable weight', format: 'number', primary: true, help: 'In kg. The greater of actual and volumetric — this is what you are billed on.' },
      { id: 'volumetric', label: 'Volumetric weight', format: 'number' },
      { id: 'costPerOrder', label: 'Shipping per order', format: 'inr' },
      { id: 'airPerOrder', label: 'Paid for empty space', format: 'inr', help: 'The part of each bill that is box, not goods.' },
      { id: 'airPerMonth', label: 'Empty space per month', format: 'inr' },
    ],
    compute: ({ length, width, height, actualWeight, divisor, rate, orders }) => {
      const volumetric = divisor > 0 ? (length * width * height) / divisor : null;
      if (volumetric === null) {
        return { volumetric: null, chargeable: null, costPerOrder: null, airPerOrder: null, airPerMonth: null };
      }
      const chargeable = Math.max(actualWeight, volumetric);
      const costPerOrder = chargeable * rate;
      // Only the volumetric excess is "air" — a heavy item in a tight box has none.
      const airPerOrder = Math.max(0, chargeable - actualWeight) * rate;
      return {
        volumetric: finite(volumetric),
        chargeable: finite(chargeable),
        costPerOrder: finite(costPerOrder),
        airPerOrder: finite(airPerOrder),
        airPerMonth: finite(airPerOrder * orders),
      };
    },
    formula:
      'Volumetric weight = L × W × H ÷ divisor. Chargeable = the greater of actual and volumetric. Cost = Chargeable × Rate.',
    caveat:
      'Couriers round chargeable weight up to the next slab (often 500g), so your real bill is usually a little higher than this. Fuel surcharge, COD fees and zone-based rates are not included.',
    keywords: ['volumetric weight calculator', 'shipping cost calculator india', 'courier weight calculator', 'dimensional weight'],
    useCases: ['Find out if your box is too big', 'Compare courier divisors', 'Budget shipping per order'],
  },

  {
    slug: 'roi-calculator',
    title: 'ROI Calculator',
    description:
      'Measure the return on any spend — equipment, inventory, a campaign — as a percentage of what you put in.',
    icon: Target,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'invested', label: 'Amount invested', unit: '₹', defaultValue: 100000, min: 0, step: 1000 },
      { id: 'returned', label: 'Amount returned', unit: '₹', defaultValue: 140000, min: 0, step: 1000 },
    ],
    outputs: [
      { id: 'roi', label: 'ROI', format: 'percent', primary: true },
      { id: 'netProfit', label: 'Net gain', format: 'inr' },
      { id: 'multiple', label: 'Return multiple', format: 'ratio' },
    ],
    compute: ({ invested, returned }) => ({
      netProfit: finite(returned - invested),
      roi: divide((returned - invested) * 100, invested),
      multiple: divide(returned, invested),
    }),
    formula: 'ROI % = (Returned − Invested) ÷ Invested × 100',
    caveat:
      'This is a simple return, not annualised. Over periods longer than a year, use the CAGR calculator to compare fairly.',
    keywords: ['roi calculator', 'return on investment calculator', 'business roi'],
    useCases: ['Judge an equipment purchase', 'Compare two spends', 'Report a return'],
  },

  {
    slug: 'break-even-calculator',
    title: 'Break-even Calculator',
    description:
      'Find how many units you must sell before fixed costs are covered and the business starts making money.',
    icon: Scale,
    bucket: 'know-numbers',
    badge: 'Pricing Strategy',
    fields: [
      { id: 'fixedCosts', label: 'Fixed costs (per month)', unit: '₹', defaultValue: 50000, min: 0, step: 500, help: 'Rent, salaries, subscriptions — anything you pay whether you sell or not.' },
      { id: 'price', label: 'Selling price per unit', unit: '₹', defaultValue: 800, min: 0, step: 10 },
      { id: 'variableCost', label: 'Variable cost per unit', unit: '₹', defaultValue: 500, min: 0, step: 10, help: 'Product cost, packaging, shipping, payment fees.' },
    ],
    compute: ({ fixedCosts, price, variableCost }) => {
      const contribution = price - variableCost;
      // A price at or below variable cost never breaks even, however many you
      // sell. Saying so is the useful answer.
      if (contribution <= 0) {
        return { units: null, revenue: null, contribution: finite(contribution), contributionMargin: null };
      }
      const units = Math.ceil(fixedCosts / contribution);
      return {
        units: finite(units),
        revenue: finite(units * price),
        contribution: finite(contribution),
        contributionMargin: divide(contribution * 100, price),
      };
    },
    outputs: [
      { id: 'units', label: 'Units to break even', format: 'number', primary: true, help: 'Rounded up — you cannot sell part of a unit.' },
      { id: 'revenue', label: 'Revenue at break-even', format: 'inr' },
      { id: 'contribution', label: 'Contribution per unit', format: 'inr' },
      { id: 'contributionMargin', label: 'Contribution margin', format: 'percent' },
    ],
    formula: 'Units = Fixed costs ÷ (Price per unit − Variable cost per unit), rounded up.',
    caveat:
      'If your price is at or below your variable cost, there is no break-even point — every additional sale loses money.',
    keywords: ['break even calculator', 'break even point calculator', 'contribution margin calculator'],
    useCases: ['Set a monthly sales target', 'Test a price change', 'Decide whether to take on fixed costs'],
  },

  {
    slug: 'cash-flow-calculator',
    title: 'Cash Flow Calculator',
    description:
      'See what is left at the end of the month, and how long your cash lasts at the current rate.',
    icon: Wallet,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'opening', label: 'Cash on hand', unit: '₹', defaultValue: 200000, min: 0, step: 1000 },
      { id: 'inflow', label: 'Money in (per month)', unit: '₹', defaultValue: 150000, min: 0, step: 1000 },
      { id: 'outflow', label: 'Money out (per month)', unit: '₹', defaultValue: 180000, min: 0, step: 1000 },
    ],
    outputs: [
      { id: 'net', label: 'Net cash flow', format: 'inr', primary: true },
      { id: 'closing', label: 'Closing balance', format: 'inr' },
      { id: 'runway', label: 'Runway', format: 'months', help: 'Only shown when you are spending more than you take in.' },
    ],
    compute: ({ opening, inflow, outflow }) => {
      const net = inflow - outflow;
      const burn = outflow - inflow;
      return {
        net: finite(net),
        closing: finite(opening + net),
        // Runway is meaningless when cash is growing — null, not a huge number.
        runway: burn > 0 ? divide(opening, burn) : null,
      };
    },
    formula: 'Net = Money in − Money out. Runway = Cash on hand ÷ monthly burn, when burn is positive.',
    caveat: 'A single-month snapshot. Seasonal businesses should run it for a good month and a bad one.',
    keywords: ['cash flow calculator', 'runway calculator', 'burn rate calculator'],
    useCases: ['Check if this month works', 'Find your runway', 'Plan before a big purchase'],
  },

  {
    slug: 'revenue-calculator',
    title: 'Revenue Calculator',
    description:
      'Turn units, price and your return rate into the revenue you actually keep.',
    icon: Banknote,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'units', label: 'Units sold', defaultValue: 250, min: 0, step: 1 },
      { id: 'price', label: 'Price per unit', unit: '₹', defaultValue: 999, min: 0, step: 10 },
      { id: 'returnRate', label: 'Return rate', unit: '%', defaultValue: 8, min: 0, max: 100, step: 0.5, help: 'Share of orders that come back. Typical for Indian D2C, not a guess we make for you.' },
    ],
    outputs: [
      { id: 'net', label: 'Net revenue', format: 'inr', primary: true },
      { id: 'gross', label: 'Gross revenue', format: 'inr' },
      { id: 'lost', label: 'Lost to returns', format: 'inr' },
    ],
    compute: ({ units, price, returnRate }) => {
      const gross = units * price;
      const lost = (gross * returnRate) / 100;
      return { gross: finite(gross), lost: finite(lost), net: finite(gross - lost) };
    },
    formula: 'Gross = Units × Price. Net = Gross − (Gross × Return rate ÷ 100).',
    caveat:
      'Returns here reduce revenue only. Shipping already spent on a returned order is a separate cost this does not model.',
    keywords: ['revenue calculator', 'sales revenue calculator', 'net revenue after returns'],
    useCases: ['Forecast a month', 'See what returns really cost', 'Set a units target'],
  },

  {
    slug: 'commission-calculator',
    title: 'Commission Calculator',
    description:
      'Split a sale between commission and what reaches you, for agents, resellers and marketplace fees.',
    icon: Handshake,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'saleAmount', label: 'Sale amount', unit: '₹', defaultValue: 10000, min: 0, step: 100 },
      { id: 'commissionRate', label: 'Commission', unit: '%', defaultValue: 15, min: 0, max: 100, step: 0.5 },
      { id: 'flatFee', label: 'Fixed fee per order', unit: '₹', defaultValue: 0, min: 0, step: 10, help: 'Marketplace closing or collection fee, if any.' },
    ],
    outputs: [
      { id: 'netToYou', label: 'You receive', format: 'inr', primary: true },
      { id: 'commission', label: 'Commission', format: 'inr' },
      { id: 'effectiveRate', label: 'Effective deduction', format: 'percent' },
    ],
    compute: ({ saleAmount, commissionRate, flatFee }) => {
      const commission = (saleAmount * commissionRate) / 100;
      const deducted = commission + flatFee;
      return {
        commission: finite(commission),
        netToYou: finite(saleAmount - deducted),
        effectiveRate: divide(deducted * 100, saleAmount),
      };
    },
    formula: 'Commission = Sale × Rate ÷ 100. You receive = Sale − Commission − Fixed fee.',
    caveat:
      'Marketplace fee structures change and vary by category — enter the rate from your own seller agreement rather than a remembered figure.',
    keywords: ['commission calculator', 'marketplace fee calculator', 'reseller commission'],
    useCases: ['Price for a marketplace', 'Agree an agent rate', 'Check a settlement'],
  },

  {
    slug: 'salary-calculator',
    title: 'Salary Breakup Calculator',
    shortTitle: 'Salary Calculator',
    description:
      'Break an annual CTC into monthly components and deductions, so an offer letter says what it means.',
    icon: Users,
    bucket: 'people',
    badge: 'Payroll',
    fields: [
      { id: 'ctc', label: 'Annual CTC', unit: '₹', defaultValue: 600000, min: 0, step: 10000 },
      { id: 'basicPercent', label: 'Basic as share of CTC', unit: '%', defaultValue: 40, min: 0, max: 100, step: 1, help: 'Most Indian employers use 40–50%.' },
      { id: 'pfPercent', label: 'Employee PF on basic', unit: '%', defaultValue: 12, min: 0, max: 100, step: 0.5 },
      { id: 'professionalTax', label: 'Professional tax (per month)', unit: '₹', defaultValue: 200, min: 0, step: 10, help: 'State-specific. Zero in states that do not levy it.' },
    ],
    outputs: [
      { id: 'inHand', label: 'Monthly in-hand (before income tax)', format: 'inr', primary: true },
      { id: 'monthlyGross', label: 'Monthly gross', format: 'inr' },
      { id: 'monthlyBasic', label: 'Monthly basic', format: 'inr' },
      { id: 'monthlyPf', label: 'Monthly PF deduction', format: 'inr' },
    ],
    compute: ({ ctc, basicPercent, pfPercent, professionalTax }) => {
      const monthlyGross = ctc / 12;
      const monthlyBasic = (monthlyGross * basicPercent) / 100;
      const monthlyPf = (monthlyBasic * pfPercent) / 100;
      return {
        monthlyGross: finite(monthlyGross),
        monthlyBasic: finite(monthlyBasic),
        monthlyPf: finite(monthlyPf),
        inHand: finite(monthlyGross - monthlyPf - professionalTax),
      };
    },
    formula:
      'Monthly gross = CTC ÷ 12. Basic = Gross × Basic%. PF = Basic × PF%. In-hand = Gross − PF − Professional tax.',
    caveat:
      'Income tax is NOT included — it depends on the regime chosen, declared investments and the individual. Employer PF, gratuity and ESI treatment also vary by how a company structures CTC, so treat this as a breakup, not a payslip.',
    keywords: ['salary calculator india', 'ctc to in hand calculator', 'salary breakup calculator'],
    useCases: ['Explain an offer', 'Budget a hire', 'Check a payslip structure'],
  },

  {
    slug: 'tds-calculator',
    title: 'TDS Calculator',
    description:
      'Work out tax deducted at source on a payment, and what the payee actually receives.',
    icon: Percent,
    bucket: 'know-numbers',
    badge: 'Compliance',
    fields: [
      { id: 'amount', label: 'Payment amount', unit: '₹', defaultValue: 100000, min: 0, step: 1000 },
      { id: 'rate', label: 'TDS rate', unit: '%', defaultValue: 10, min: 0, max: 100, step: 0.1, help: 'The rate for the applicable section. Check the current rate — do not rely on memory.' },
    ],
    outputs: [
      { id: 'net', label: 'Payable to payee', format: 'inr', primary: true },
      { id: 'tds', label: 'TDS to deposit', format: 'inr' },
    ],
    compute: ({ amount, rate }) => {
      const tds = (amount * rate) / 100;
      return { tds: finite(tds), net: finite(amount - tds) };
    },
    formula: 'TDS = Payment × Rate ÷ 100. Payable = Payment − TDS.',
    caveat:
      'This deliberately does not ship a table of section rates. Rates and thresholds change with each Finance Act, and a stale built-in rate would produce a confidently wrong number. Enter the rate for your section, and confirm thresholds, surcharge and any higher rate for a missing PAN with your accountant.',
    keywords: ['tds calculator', 'tds deduction calculator', 'tds on payment india'],
    useCases: ['Deduct on a vendor payment', 'Check a deduction made on you', 'Plan a payout'],
  },

  {
    slug: 'markup-calculator',
    title: 'Markup Calculator',
    description:
      'Convert between cost, markup and margin — so you stop confusing a 50% markup with a 50% margin.',
    icon: Calculator,
    bucket: 'know-numbers',
    badge: 'Pricing Strategy',
    fields: [
      { id: 'cost', label: 'Cost price', unit: '₹', defaultValue: 500, min: 0, step: 10 },
      { id: 'markup', label: 'Markup on cost', unit: '%', defaultValue: 50, min: 0, step: 1 },
    ],
    outputs: [
      { id: 'sellingPrice', label: 'Selling price', format: 'inr', primary: true },
      { id: 'profit', label: 'Profit per unit', format: 'inr' },
      { id: 'margin', label: 'Margin on selling price', format: 'percent', help: 'Always lower than the markup. This is the number that matters.' },
    ],
    compute: ({ cost, markup }) => {
      const profit = (cost * markup) / 100;
      const sellingPrice = cost + profit;
      return {
        sellingPrice: finite(sellingPrice),
        profit: finite(profit),
        margin: divide(profit * 100, sellingPrice),
      };
    },
    formula:
      'Selling price = Cost × (1 + Markup ÷ 100). Margin % = Profit ÷ Selling price × 100.',
    caveat:
      'Markup is measured against cost; margin against the selling price. A 50% markup is a 33.3% margin — mixing them up is the most common pricing error in small retail.',
    keywords: ['markup calculator', 'markup vs margin', 'cost plus pricing calculator'],
    useCases: ['Set a markup over cost', 'Convert markup to margin', 'Check reseller pricing'],
  },

  {
    slug: 'discount-calculator',
    title: 'Discount Calculator',
    description:
      'See the discounted price, what you give away, and what the discount leaves of your margin.',
    icon: Percent,
    bucket: 'know-numbers',
    badge: 'Pricing Strategy',
    fields: [
      { id: 'mrp', label: 'Original price', unit: '₹', defaultValue: 1500, min: 0, step: 10 },
      { id: 'discount', label: 'Discount', unit: '%', defaultValue: 25, min: 0, max: 100, step: 1 },
      { id: 'cost', label: 'Your cost price', unit: '₹', defaultValue: 900, min: 0, step: 10, help: 'Optional. Enter it to see what the sale does to your margin.' },
    ],
    outputs: [
      { id: 'finalPrice', label: 'Customer pays', format: 'inr', primary: true },
      { id: 'saved', label: 'Discount given', format: 'inr' },
      { id: 'profit', label: 'Profit after discount', format: 'inr' },
      { id: 'margin', label: 'Margin after discount', format: 'percent' },
    ],
    compute: ({ mrp, discount, cost }) => {
      const saved = (mrp * discount) / 100;
      const finalPrice = mrp - saved;
      // Cost is optional: without it, margin is unknown rather than zero.
      if (!cost) {
        return { finalPrice: finite(finalPrice), saved: finite(saved), profit: null, margin: null };
      }
      const profit = finalPrice - cost;
      return {
        finalPrice: finite(finalPrice),
        saved: finite(saved),
        profit: finite(profit),
        margin: divide(profit * 100, finalPrice),
      };
    },
    formula:
      'Customer pays = Original × (1 − Discount ÷ 100). Margin % = (Price − Cost) ÷ Price × 100.',
    keywords: ['discount calculator', 'percentage off calculator', 'sale price calculator'],
    useCases: ['Price a sale', 'See margin after discount', 'Decide how deep to go'],
  },

  {
    slug: 'cagr-calculator',
    title: 'CAGR Calculator',
    description:
      'Turn a starting value, an ending value and a number of years into a single annual growth rate you can compare.',
    icon: ChartLine,
    bucket: 'know-numbers',
    badge: 'Finance',
    fields: [
      { id: 'beginValue', label: 'Starting value', unit: '₹', defaultValue: 500000, min: 0, step: 1000 },
      { id: 'endValue', label: 'Ending value', unit: '₹', defaultValue: 1200000, min: 0, step: 1000 },
      { id: 'years', label: 'Years', defaultValue: 3, min: 0, step: 0.5 },
    ],
    outputs: [
      { id: 'cagr', label: 'CAGR', format: 'percent', primary: true },
      { id: 'totalGrowth', label: 'Total growth', format: 'percent' },
      { id: 'gain', label: 'Absolute gain', format: 'inr' },
    ],
    compute: ({ beginValue, endValue, years }) => {
      // A zero or negative start has no meaningful growth rate, and neither
      // does a zero-year period.
      if (beginValue <= 0 || years <= 0) {
        return { cagr: null, totalGrowth: null, gain: finite(endValue - beginValue) };
      }
      return {
        cagr: finite((Math.pow(endValue / beginValue, 1 / years) - 1) * 100),
        totalGrowth: divide((endValue - beginValue) * 100, beginValue),
        gain: finite(endValue - beginValue),
      };
    },
    formula: 'CAGR % = ((Ending ÷ Starting) ^ (1 ÷ Years) − 1) × 100',
    caveat:
      'CAGR smooths a period into one rate. It says nothing about the volatility in between, and it is not a forecast.',
    keywords: ['cagr calculator', 'compound annual growth rate', 'investment return calculator', 'revenue growth rate'],
    useCases: ['Compare year-on-year growth', 'Report a growth rate', 'Compare two investments'],
  },

  {
    slug: 'inventory-turnover-calculator',
    title: 'Inventory Turnover Calculator',
    shortTitle: 'Inventory Turnover',
    description:
      'Find how many times your stock sells through in a year, and how many days of inventory you are holding.',
    icon: Boxes,
    bucket: 'know-numbers',
    badge: 'Operations',
    fields: [
      { id: 'cogs', label: 'Cost of goods sold (per year)', unit: '₹', defaultValue: 2400000, min: 0, step: 10000 },
      { id: 'avgInventory', label: 'Average inventory value', unit: '₹', defaultValue: 400000, min: 0, step: 10000, help: 'Roughly (opening stock + closing stock) ÷ 2, at cost.' },
    ],
    outputs: [
      { id: 'turnover', label: 'Turnover ratio', format: 'ratio', primary: true, help: 'Times per year your stock sells through.' },
      { id: 'days', label: 'Days of inventory', format: 'days' },
    ],
    compute: ({ cogs, avgInventory }) => {
      const turnover = divide(cogs, avgInventory);
      return { turnover, days: turnover === null ? null : divide(365, turnover) };
    },
    formula: 'Turnover = COGS ÷ Average inventory. Days of inventory = 365 ÷ Turnover.',
    caveat:
      'Use cost values on both sides. Mixing retail value into inventory inflates the ratio and makes slow stock look fast.',
    keywords: ['inventory turnover calculator', 'stock turnover ratio', 'days of inventory calculator'],
    useCases: ['Spot slow-moving stock', 'Plan reorder cycles', 'Free up working capital'],
  },

  {
    slug: 'cac-calculator',
    title: 'Customer Acquisition Cost Calculator',
    shortTitle: 'CAC Calculator',
    description:
      'Divide what you spend on getting customers by how many you got, to find what each one costs.',
    icon: UserPlus,
    bucket: 'get-customers',
    badge: 'Marketing',
    fields: [
      { id: 'marketingSpend', label: 'Marketing spend', unit: '₹', defaultValue: 80000, min: 0, step: 1000 },
      { id: 'salesSpend', label: 'Sales cost', unit: '₹', defaultValue: 20000, min: 0, step: 1000, help: 'Salaries, commissions and tools attributable to winning customers.' },
      { id: 'newCustomers', label: 'New customers won', defaultValue: 120, min: 0, step: 1 },
    ],
    outputs: [
      { id: 'cac', label: 'Cost per customer', format: 'inr', primary: true },
      { id: 'totalSpend', label: 'Total acquisition spend', format: 'inr' },
    ],
    compute: ({ marketingSpend, salesSpend, newCustomers }) => {
      const totalSpend = marketingSpend + salesSpend;
      return { totalSpend: finite(totalSpend), cac: divide(totalSpend, newCustomers) };
    },
    formula: 'CAC = (Marketing spend + Sales cost) ÷ New customers won',
    caveat:
      'Count only NEW customers. Including repeat buyers understates CAC, which is the most common way this number gets flattering.',
    keywords: ['cac calculator', 'customer acquisition cost calculator', 'marketing cost per customer'],
    useCases: ['Judge a channel', 'Set an ad budget', 'Compare against lifetime value'],
  },

  {
    slug: 'clv-calculator',
    title: 'Customer Lifetime Value Calculator',
    shortTitle: 'CLV Calculator',
    description:
      'Estimate what a customer is worth over the whole relationship, and whether that justifies what you pay to win one.',
    icon: Repeat,
    bucket: 'get-customers',
    badge: 'Marketing',
    fields: [
      { id: 'orderValue', label: 'Average order value', unit: '₹', defaultValue: 1200, min: 0, step: 50 },
      { id: 'ordersPerYear', label: 'Orders per year', defaultValue: 4, min: 0, step: 0.5 },
      { id: 'years', label: 'Years retained', defaultValue: 2, min: 0, step: 0.5 },
      { id: 'grossMargin', label: 'Gross margin', unit: '%', defaultValue: 45, min: 0, max: 100, step: 1 },
      { id: 'cac', label: 'Your CAC', unit: '₹', defaultValue: 800, min: 0, step: 50, help: 'Optional. Enter it to see the CLV:CAC ratio.' },
    ],
    outputs: [
      { id: 'clv', label: 'Lifetime value', format: 'inr', primary: true, help: 'Gross profit, not revenue.' },
      { id: 'revenue', label: 'Lifetime revenue', format: 'inr' },
      { id: 'ratio', label: 'CLV : CAC', format: 'ratio', help: 'Under 1 means you lose money on every customer you buy.' },
    ],
    compute: ({ orderValue, ordersPerYear, years, grossMargin, cac }) => {
      const revenue = orderValue * ordersPerYear * years;
      const clv = (revenue * grossMargin) / 100;
      return {
        revenue: finite(revenue),
        clv: finite(clv),
        ratio: cac ? divide(clv, cac) : null,
      };
    },
    formula:
      'Lifetime revenue = AOV × Orders per year × Years. CLV = Lifetime revenue × Gross margin ÷ 100.',
    caveat:
      'Margin-based, and undiscounted — money two years out is treated as worth the same as money today. Good enough for comparing channels, not for valuing a business.',
    keywords: ['clv calculator', 'customer lifetime value calculator', 'ltv cac ratio'],
    useCases: ['Decide what you can pay for a customer', 'Compare retention against acquisition', 'Justify a loyalty push'],
  },

  {
    slug: 'ad-profitability-calculator',
    title: 'Ad Profitability Calculator',
    shortTitle: 'Ad Profitability',
    description:
      'Find the ROAS you need before ads make money, and whether the campaign you are running clears it.',
    icon: Megaphone,
    bucket: 'get-customers',
    badge: 'Marketing',
    fields: [
      { id: 'adSpend', label: 'Ad spend', unit: '₹', defaultValue: 50000, min: 0, step: 1000 },
      { id: 'revenue', label: 'Revenue from ads', unit: '₹', defaultValue: 180000, min: 0, step: 1000 },
      { id: 'grossMargin', label: 'Gross margin on that revenue', unit: '%', defaultValue: 40, min: 0, max: 100, step: 1, help: 'After product cost, shipping and payment fees — before ad spend.' },
    ],
    outputs: [
      { id: 'netProfit', label: 'Profit after ad spend', format: 'inr', primary: true },
      { id: 'roas', label: 'Your ROAS', format: 'ratio' },
      { id: 'breakEvenRoas', label: 'Break-even ROAS', format: 'ratio', help: 'The ROAS below which ads lose money at this margin.' },
      { id: 'grossProfit', label: 'Gross profit before ads', format: 'inr' },
    ],
    compute: ({ adSpend, revenue, grossMargin }) => {
      const grossProfit = (revenue * grossMargin) / 100;
      return {
        grossProfit: finite(grossProfit),
        netProfit: finite(grossProfit - adSpend),
        roas: divide(revenue, adSpend),
        // At a 40% margin you need 2.5× revenue per rupee spent just to break
        // even — the number most sellers never work out.
        breakEvenRoas: divide(100, grossMargin),
      };
    },
    formula:
      'Gross profit = Revenue × Margin ÷ 100. Profit after ads = Gross profit − Ad spend. Break-even ROAS = 100 ÷ Margin %.',
    caveat:
      'Uses the revenue your ad platform attributes to itself, which platforms tend to report generously. Compare against your own order data before trusting a thin result.',
    keywords: ['ad profitability calculator', 'break even roas calculator', 'meta ads profit calculator'],
    useCases: ['Set a ROAS target', 'Kill an unprofitable campaign', 'Brief an agency'],
  },
];

export function getCalculator(slug: string): CalculatorDef | undefined {
  return CALCULATORS.find((calc) => calc.slug === slug);
}

export function calculatorSlugs(): string[] {
  return CALCULATORS.map((calc) => calc.slug);
}
