/**
 * The document engine's data model.
 *
 * ONE SCHEMA, MANY OUTPUTS
 *   An invoice, a quotation and a receipt are the same document with different
 *   labels, different legal footers and slightly different optional fields.
 *   Modelling them separately would mean three forms, three renderers and three
 *   sets of GST bugs. They share `DocumentData`; what differs lives in
 *   `kinds.ts` as presentation config.
 *
 * MONEY IS NEVER A FLOAT IN THIS MODULE
 *   Every computed amount is an integer count of paise. Rupee values entered by
 *   a human arrive as `number` at the edges (form inputs) and are converted
 *   once, in `toPaise`. Accumulating 0.1 + 0.2 across a dozen line items and a
 *   tax split is how an invoice ends up off by a rupee, which is the one defect
 *   a billing document cannot have.
 */

import type { StateCode } from './states';

/**
 * Every document the engine can produce. The tool slug is always
 * `${kind}-generator`, so this union is also the URL list.
 */
export type DocumentKind =
  // — tabular: parties, line items, totals —
  | 'invoice'
  | 'proforma-invoice'
  | 'quotation'
  | 'estimate'
  | 'purchase-order'
  | 'delivery-challan'
  | 'credit-note'
  | 'debit-note'
  | 'receipt'
  | 'rent-receipt'
  | 'payment-voucher'
  | 'expense-voucher'
  | 'work-order'
  | 'job-card'
  // — payslip: earnings against deductions —
  | 'salary-slip'
  // — letter: prose on a letterhead —
  | 'payment-reminder'
  | 'offer-letter'
  | 'appointment-letter'
  | 'experience-certificate'
  | 'employment-certificate'
  | 'internship-certificate'
  | 'relieving-letter'
  | 'increment-letter';

/**
 * What a document physically IS.
 *
 * The three shapes share the business profile, the header, the letterhead and
 * the print pipeline — and nothing else. An offer letter has no line items and
 * no GST; pretending otherwise to claim "one schema" would mean a form full of
 * fields that do not apply, which is worse than three honest renderers over one
 * set of shared parts.
 */
export type DocumentShape = 'tabular' | 'payslip' | 'letter';

/**
 * How the entered unit prices relate to tax.
 *  - exclusive: prices are pre-tax; GST is added on top (the usual B2B case)
 *  - inclusive: prices already contain GST; it is backed out for display
 *              (the usual retail/MRP case)
 *  - none:      unregistered seller, no GST charged
 */
export type TaxMode = 'exclusive' | 'inclusive' | 'none';

/** The seller. Persisted locally so the next document is pre-filled. */
export interface BusinessProfile {
  name: string;
  gstin: string;
  addressLine: string;
  city: string;
  /** Place of supply origin — decides CGST+SGST versus IGST. */
  state: StateCode | '';
  pincode: string;
  phone: string;
  email: string;
}

/** The other side: customer, prospect or payer. */
export interface Party {
  name: string;
  gstin: string;
  addressLine: string;
  city: string;
  /** Place of supply destination. Empty is treated as intra-state. */
  state: StateCode | '';
  pincode: string;
  phone: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  /** HSN (goods) or SAC (services). Optional — many small sellers omit it. */
  hsn: string;
  quantity: number;
  /** In rupees, as typed. Converted to paise before any arithmetic. */
  unitPrice: number;
}

/** A named money row on a payslip — one earning or one deduction. */
export interface PayRow {
  id: string;
  label: string;
  /** In rupees, as typed. */
  amount: number;
}

/** Employee details that only a payslip needs. */
export interface EmployeeDetails {
  name: string;
  designation: string;
  employeeId: string;
  /** yyyy-MM — the month the payslip covers. */
  period: string;
  daysPaid: number;
  panOrUan: string;
}

export interface DocumentMeta {
  /** Document number, e.g. INV-2026-014. Free text: sellers have their own series. */
  number: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  /** Invoice due date, or quotation validity. Unused on receipts. */
  dueDate: string;
  /** Receipts only: how the money arrived. */
  paymentMode: string;
  notes: string;
  terms: string;
  /**
   * The document this one refers to — the invoice a credit note adjusts, or the
   * one a payment reminder is chasing. Shown only when the kind asks for it.
   */
  reference: string;
  /** Place of signing, printed above the signatory on letters. */
  place: string;
  /** Who signs a letter, and in what capacity. */
  signatoryName: string;
  signatoryTitle: string;
}

export interface DocumentData {
  kind: DocumentKind;
  business: BusinessProfile;
  /** The counterparty, the employee, or the letter's addressee. */
  party: Party;
  /** Tabular shape only. */
  items: LineItem[];
  meta: DocumentMeta;
  /** Whole-number GST percentage applied to every line. */
  gstRate: number;
  taxMode: TaxMode;
  /** Payslip shape only. */
  earnings: PayRow[];
  deductions: PayRow[];
  employee: EmployeeDetails;
  /**
   * Letter shape only: values for the kind's merge fields, keyed by field id.
   * Strings because a letter's blanks are dates, names and free text.
   */
  letterValues: Record<string, string>;
}

/** All amounts in paise. */
export interface DocumentTotals {
  /** Pre-tax value of all lines. */
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  /** cgst + sgst + igst. */
  tax: number;
  /** Signed adjustment applied to reach a whole-rupee total. */
  roundOff: number;
  /** taxable + tax + roundOff. */
  total: number;
  /** True when IGST applies, i.e. supply crossed a state border. */
  isInterState: boolean;
}
