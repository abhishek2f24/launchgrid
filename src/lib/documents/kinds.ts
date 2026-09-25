/**
 * Every document the engine produces, as configuration.
 *
 * The schema, the money maths, the letterhead and the print pipeline are
 * shared. Everything that makes one document feel like a different document is
 * here, so the next output is an entry in this file — not a build.
 *
 * SHAPES, NOT ONE UNIVERSAL FORM
 *   `tabular` documents have parties, line items and a GST total. `payslip` has
 *   earnings against deductions. `letter` is prose with merge fields. They
 *   genuinely differ, and the config says which renderer applies rather than
 *   pretending an offer letter has an HSN code.
 */

import type { DocumentKind, DocumentShape, TaxMode } from './types';
import { LETTER_BODIES, type LetterField } from './letters';

export interface KindConfig {
  kind: DocumentKind;
  shape: DocumentShape;
  /** Printed at the top right of the document. */
  title: string;
  /** Default prefix for the document number series. */
  numberPrefix: string;
  /** Heading above the other party's details. */
  partyLabel: string;
  /** Heading for the date field in the form. */
  dateLabel: string;
  /** Second date field. `null` hides it. */
  secondDateLabel: string | null;
  /** Records how money moved. */
  showPaymentMode: boolean;
  /** Label for the "against document X" field, or null to hide it. */
  referenceLabel: string | null;
  /** Starting tax mode. Vouchers and challans usually carry no GST. */
  defaultTaxMode: TaxMode;
  /** Legal/closing line printed at the foot. */
  footerNote: string;
  defaultTerms: string;
  /** Letter shape only. */
  letterFields?: LetterField[];
  /** Page <h1> and the form's own heading. */
  pageTitle: string;
  pageDescription: string;
  keywords: string[];
  useCases: string[];
  /** Grid card label when the page title is long. */
  shortTitle?: string;
  badge: string;
}

const COMPUTER_GENERATED =
  'This is a computer-generated document and does not require a signature.';

export const DOCUMENT_KINDS: Record<DocumentKind, KindConfig> = {
  // ─────────────────────────── tabular ───────────────────────────
  invoice: {
    kind: 'invoice',
    shape: 'tabular',
    title: 'TAX INVOICE',
    numberPrefix: 'INV',
    partyLabel: 'Bill To',
    dateLabel: 'Invoice date',
    secondDateLabel: 'Due date',
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'exclusive',
    footerNote: 'This is a computer-generated tax invoice and does not require a signature.',
    defaultTerms: 'Payment due within 15 days of the invoice date.',
    pageTitle: 'GST Invoice Generator',
    shortTitle: 'Invoice',
    badge: 'Compliance',
    pageDescription:
      'Create a GST-compliant tax invoice with correct CGST, SGST and IGST splitting. Fill it in and download it as a PDF — free, no account, and nothing you type leaves your browser.',
    keywords: ['gst invoice generator', 'invoice format india', 'free invoice maker', 'tax invoice template'],
    useCases: ['Issue a one-off invoice', 'CGST/SGST/IGST splitting', 'Download as PDF'],
  },

  'proforma-invoice': {
    kind: 'proforma-invoice',
    shape: 'tabular',
    title: 'PROFORMA INVOICE',
    numberPrefix: 'PI',
    partyLabel: 'Bill To',
    dateLabel: 'Date',
    secondDateLabel: 'Valid until',
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'exclusive',
    footerNote:
      'This proforma invoice is issued in advance of supply. It is not a tax invoice and no tax credit may be claimed against it.',
    defaultTerms: 'Goods will be dispatched on receipt of advance payment.',
    pageTitle: 'Proforma Invoice Generator',
    shortTitle: 'Proforma Invoice',
    badge: 'Sales',
    pageDescription:
      'Issue a proforma invoice ahead of supply, so a buyer can arrange payment or an import licence before goods move.',
    keywords: ['proforma invoice format', 'proforma invoice generator', 'pro forma invoice india'],
    useCases: ['Request an advance payment', 'Support an import formality', 'Confirm an order before dispatch'],
  },

  quotation: {
    kind: 'quotation',
    shape: 'tabular',
    title: 'QUOTATION',
    numberPrefix: 'QTN',
    partyLabel: 'Quotation For',
    dateLabel: 'Quotation date',
    secondDateLabel: 'Valid until',
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'exclusive',
    footerNote:
      'This quotation is an offer, not a demand for payment. Prices are valid until the date shown above.',
    defaultTerms: 'Prices are valid until the date shown. Delivery timelines confirmed on order.',
    pageTitle: 'Quotation Generator',
    shortTitle: 'Quotation',
    badge: 'Sales',
    pageDescription:
      'Send a professional priced quote with your business details, GST and terms. Free, works in your browser, and converts straight into an invoice when the customer accepts.',
    keywords: ['quotation format', 'quotation generator india', 'price quote template'],
    useCases: ['Quote a new customer', 'Attach terms and validity', 'Convert an accepted quote to an invoice'],
  },

  estimate: {
    kind: 'estimate',
    shape: 'tabular',
    title: 'ESTIMATE',
    numberPrefix: 'EST',
    partyLabel: 'Estimate For',
    dateLabel: 'Estimate date',
    secondDateLabel: 'Valid until',
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote:
      'Figures shown are an estimate. Final charges may vary with actual work done or materials used.',
    defaultTerms: 'Estimate only. Final billing will reflect actual work carried out.',
    pageTitle: 'Estimate Generator',
    shortTitle: 'Estimate',
    badge: 'Sales',
    pageDescription:
      'Give a customer an approximate cost before work starts, with the scope written down and the caveat stated.',
    keywords: ['estimate format', 'cost estimate generator', 'estimate template india'],
    useCases: ['Price a repair job', 'Scope work before starting', 'Set expectations on cost'],
  },

  'purchase-order': {
    kind: 'purchase-order',
    shape: 'tabular',
    title: 'PURCHASE ORDER',
    numberPrefix: 'PO',
    partyLabel: 'Vendor',
    dateLabel: 'Order date',
    secondDateLabel: 'Delivery by',
    showPaymentMode: false,
    referenceLabel: 'Against quotation',
    defaultTaxMode: 'exclusive',
    footerNote:
      'Please confirm acceptance of this order. Quote the purchase order number on your invoice and delivery documents.',
    defaultTerms: 'Payment 30 days from receipt of goods in acceptable condition.',
    pageTitle: 'Purchase Order Generator',
    shortTitle: 'Purchase Order',
    badge: 'Procurement',
    pageDescription:
      'Place a written order with a supplier — what you want, at what price, delivered by when.',
    keywords: ['purchase order format', 'po generator india', 'purchase order template'],
    useCases: ['Order stock from a supplier', 'Lock a quoted price', 'Create a paper trail for procurement'],
  },

  'delivery-challan': {
    kind: 'delivery-challan',
    shape: 'tabular',
    title: 'DELIVERY CHALLAN',
    numberPrefix: 'DC',
    partyLabel: 'Deliver To',
    dateLabel: 'Challan date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: 'Against order',
    // Goods moving without a sale — job work, samples, branch transfers —
    // travel on a challan that carries quantities, not a tax charge.
    defaultTaxMode: 'none',
    footerNote:
      'Goods described above have been dispatched. Please acknowledge receipt on the duplicate copy.',
    defaultTerms: 'Goods once dispatched are transported at the consignee’s risk.',
    pageTitle: 'Delivery Challan Generator',
    shortTitle: 'Delivery Challan',
    badge: 'Logistics',
    pageDescription:
      'Send goods with a challan listing what was dispatched and to whom — for job work, samples, branch transfers or deliveries billed later.',
    keywords: ['delivery challan format', 'delivery challan generator', 'challan format india'],
    useCases: ['Move goods for job work', 'Send samples', 'Deliver now and bill later'],
  },

  'credit-note': {
    kind: 'credit-note',
    shape: 'tabular',
    title: 'CREDIT NOTE',
    numberPrefix: 'CN',
    partyLabel: 'Issued To',
    dateLabel: 'Credit note date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: 'Against invoice',
    defaultTaxMode: 'exclusive',
    footerNote:
      'This credit note reduces the amount due against the invoice referenced above.',
    defaultTerms: 'Credit adjustable against future invoices or refundable on request.',
    pageTitle: 'Credit Note Generator',
    shortTitle: 'Credit Note',
    badge: 'Compliance',
    pageDescription:
      'Reduce what a customer owes after a return, a shortfall or an overcharge, with the original invoice referenced.',
    keywords: ['credit note format', 'credit note generator india', 'gst credit note'],
    useCases: ['Process a return', 'Correct an overcharge', 'Record a post-sale discount'],
  },

  'debit-note': {
    kind: 'debit-note',
    shape: 'tabular',
    title: 'DEBIT NOTE',
    numberPrefix: 'DN',
    partyLabel: 'Issued To',
    dateLabel: 'Debit note date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: 'Against invoice',
    defaultTaxMode: 'exclusive',
    footerNote:
      'This debit note increases the amount due against the invoice referenced above.',
    defaultTerms: 'Amount payable along with the referenced invoice.',
    pageTitle: 'Debit Note Generator',
    shortTitle: 'Debit Note',
    badge: 'Compliance',
    pageDescription:
      'Raise the amount due on an earlier invoice — an undercharge, extra goods supplied, or a price revision.',
    keywords: ['debit note format', 'debit note generator india', 'gst debit note'],
    useCases: ['Correct an undercharge', 'Bill for extra supply', 'Apply a price revision'],
  },

  receipt: {
    kind: 'receipt',
    shape: 'tabular',
    title: 'PAYMENT RECEIPT',
    numberPrefix: 'RCP',
    partyLabel: 'Received From',
    dateLabel: 'Payment date',
    secondDateLabel: null,
    showPaymentMode: true,
    referenceLabel: 'Against invoice',
    defaultTaxMode: 'exclusive',
    footerNote: 'This receipt acknowledges the payment described above. No signature is required.',
    defaultTerms: '',
    pageTitle: 'Payment Receipt Generator',
    shortTitle: 'Receipt',
    badge: 'Compliance',
    pageDescription:
      'Acknowledge a cash, UPI or bank payment with a numbered receipt carrying your business details. Free, no account, download as PDF.',
    keywords: ['payment receipt generator', 'receipt format india', 'cash receipt template'],
    useCases: ['Confirm cash or UPI payment', 'Numbered receipt trail', 'Send as PDF'],
  },

  'rent-receipt': {
    kind: 'rent-receipt',
    shape: 'tabular',
    title: 'RENT RECEIPT',
    numberPrefix: 'RR',
    partyLabel: 'Received From (Tenant)',
    dateLabel: 'Receipt date',
    secondDateLabel: null,
    showPaymentMode: true,
    referenceLabel: 'Period',
    defaultTaxMode: 'none',
    footerNote:
      'Received with thanks the rent for the period stated above.',
    defaultTerms: '',
    pageTitle: 'Rent Receipt Generator',
    shortTitle: 'Rent Receipt',
    badge: 'Property',
    pageDescription:
      'Produce a rent receipt with landlord details, period and amount — the format employers ask for against an HRA claim.',
    keywords: ['rent receipt generator', 'rent receipt format for hra', 'house rent receipt india'],
    useCases: ['Support an HRA claim', 'Give a tenant a monthly receipt', 'Keep a rent record'],
  },

  'payment-voucher': {
    kind: 'payment-voucher',
    shape: 'tabular',
    title: 'PAYMENT VOUCHER',
    numberPrefix: 'PV',
    partyLabel: 'Paid To',
    dateLabel: 'Voucher date',
    secondDateLabel: null,
    showPaymentMode: true,
    referenceLabel: 'Against bill',
    defaultTaxMode: 'none',
    footerNote: COMPUTER_GENERATED,
    defaultTerms: '',
    pageTitle: 'Payment Voucher Generator',
    shortTitle: 'Payment Voucher',
    badge: 'Accounts',
    pageDescription:
      'Record money paid out — to whom, for what, by which mode — as an internal voucher your books can reference.',
    keywords: ['payment voucher format', 'payment voucher generator', 'cash payment voucher'],
    useCases: ['Record a vendor payment', 'Document petty cash out', 'Attach to a bill'],
  },

  'expense-voucher': {
    kind: 'expense-voucher',
    shape: 'tabular',
    title: 'EXPENSE VOUCHER',
    numberPrefix: 'EV',
    partyLabel: 'Claimed By',
    dateLabel: 'Voucher date',
    secondDateLabel: null,
    showPaymentMode: true,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: COMPUTER_GENERATED,
    defaultTerms: 'Supporting bills to be attached for every line claimed.',
    pageTitle: 'Expense Voucher Generator',
    shortTitle: 'Expense Voucher',
    badge: 'Accounts',
    pageDescription:
      'Itemise a reimbursement claim — travel, materials, petty cash — for approval and for your books.',
    keywords: ['expense voucher format', 'expense claim form', 'reimbursement voucher india'],
    useCases: ['Claim travel reimbursement', 'Record petty cash spend', 'Route an expense for approval'],
  },

  'work-order': {
    kind: 'work-order',
    shape: 'tabular',
    title: 'WORK ORDER',
    numberPrefix: 'WO',
    partyLabel: 'Contractor / Vendor',
    dateLabel: 'Order date',
    secondDateLabel: 'Complete by',
    showPaymentMode: false,
    referenceLabel: 'Against quotation',
    defaultTaxMode: 'exclusive',
    footerNote:
      'Work is to be carried out as scoped above. Any variation requires written approval before it is undertaken.',
    defaultTerms: 'Payment on satisfactory completion and handover.',
    pageTitle: 'Work Order Generator',
    shortTitle: 'Work Order',
    badge: 'Operations',
    pageDescription:
      'Commission work in writing — the scope, the rate, and the date it has to be finished by.',
    keywords: ['work order format', 'work order generator', 'work order template india'],
    useCases: ['Commission a contractor', 'Scope a service job', 'Agree a completion date'],
  },

  'job-card': {
    kind: 'job-card',
    shape: 'tabular',
    title: 'JOB CARD',
    numberPrefix: 'JC',
    partyLabel: 'Customer',
    dateLabel: 'Job date',
    secondDateLabel: 'Promised by',
    showPaymentMode: false,
    referenceLabel: 'Item / vehicle',
    defaultTaxMode: 'exclusive',
    footerNote:
      'Item accepted for the work listed above. The workshop is not responsible for articles left inside.',
    defaultTerms: 'Estimate only. Additional work will be confirmed before it is carried out.',
    pageTitle: 'Job Card Generator',
    shortTitle: 'Job Card',
    badge: 'Operations',
    pageDescription:
      'Open a job card at intake — what came in, what is being done to it, and when it is promised back.',
    keywords: ['job card format', 'job card generator', 'workshop job card template'],
    useCases: ['Log a repair at intake', 'List work and parts', 'Promise a delivery date'],
  },

  // ─────────────────────────── payslip ───────────────────────────
  'salary-slip': {
    kind: 'salary-slip',
    shape: 'payslip',
    title: 'SALARY SLIP',
    numberPrefix: 'SAL',
    partyLabel: 'Employee',
    dateLabel: 'Issue date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: COMPUTER_GENERATED,
    defaultTerms: '',
    pageTitle: 'Salary Slip Generator',
    shortTitle: 'Salary Slip',
    badge: 'Payroll',
    pageDescription:
      'Produce a monthly payslip with earnings, deductions and net pay — the document employees need for a loan, a visa or a new job.',
    keywords: ['salary slip format', 'payslip generator india', 'salary slip template', 'pay slip format'],
    useCases: ['Issue a monthly payslip', 'Support an employee loan application', 'Keep a payroll record'],
  },

  // ─────────────────────────── letters ───────────────────────────
  'payment-reminder': {
    kind: 'payment-reminder',
    shape: 'letter',
    title: 'PAYMENT REMINDER',
    numberPrefix: 'REM',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['payment-reminder'].fields,
    pageTitle: 'Payment Reminder Letter Generator',
    shortTitle: 'Payment Reminder',
    badge: 'Accounts',
    pageDescription:
      'Chase an overdue invoice in writing — firm, polite, and specific about the amount and the date.',
    keywords: ['payment reminder letter format', 'overdue payment letter', 'payment follow up letter india'],
    useCases: ['Chase an overdue invoice', 'Escalate politely before a call', 'Keep a written record'],
  },

  'offer-letter': {
    kind: 'offer-letter',
    shape: 'letter',
    title: 'OFFER LETTER',
    numberPrefix: 'OFR',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['offer-letter'].fields,
    pageTitle: 'Offer Letter Generator',
    shortTitle: 'Offer Letter',
    badge: 'HR',
    pageDescription:
      'Make a job offer in writing — role, salary, start date and the acceptance deadline, on your letterhead.',
    keywords: ['offer letter format', 'job offer letter template india', 'offer letter generator'],
    useCases: ['Offer a role to a candidate', 'State CTC and start date', 'Set an acceptance deadline'],
  },

  'appointment-letter': {
    kind: 'appointment-letter',
    shape: 'letter',
    title: 'APPOINTMENT LETTER',
    numberPrefix: 'APT',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['appointment-letter'].fields,
    pageTitle: 'Appointment Letter Generator',
    shortTitle: 'Appointment Letter',
    badge: 'HR',
    pageDescription:
      'Confirm an appointment after the offer is accepted, with designation, reporting line and probation stated.',
    keywords: ['appointment letter format', 'appointment letter template india', 'joining letter format'],
    useCases: ['Confirm a hire on joining', 'State probation terms', 'Record the reporting line'],
  },

  'experience-certificate': {
    kind: 'experience-certificate',
    shape: 'letter',
    title: 'EXPERIENCE CERTIFICATE',
    numberPrefix: 'EXP',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['experience-certificate'].fields,
    pageTitle: 'Experience Certificate Generator',
    shortTitle: 'Experience Certificate',
    badge: 'HR',
    pageDescription:
      'Certify what someone did and for how long — the letter a former employee needs for their next role.',
    keywords: ['experience certificate format', 'work experience letter india', 'experience letter template'],
    useCases: ['Certify a former employee', 'Confirm tenure and role', 'Support a job application'],
  },

  'employment-certificate': {
    kind: 'employment-certificate',
    shape: 'letter',
    title: 'EMPLOYMENT CERTIFICATE',
    numberPrefix: 'EMP',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['employment-certificate'].fields,
    pageTitle: 'Employment Certificate Generator',
    shortTitle: 'Employment Certificate',
    badge: 'HR',
    pageDescription:
      'Confirm that someone currently works with you, with designation and salary — for a bank, a landlord or a visa office.',
    keywords: ['employment certificate format', 'employment verification letter india', 'job certificate format'],
    useCases: ['Support a loan application', 'Confirm employment for a visa', 'Verify current employment'],
  },

  'internship-certificate': {
    kind: 'internship-certificate',
    shape: 'letter',
    title: 'INTERNSHIP CERTIFICATE',
    numberPrefix: 'INT',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['internship-certificate'].fields,
    pageTitle: 'Internship Certificate Generator',
    shortTitle: 'Internship Certificate',
    badge: 'HR',
    pageDescription:
      'Certify an internship — the project, the duration and the conduct — for a student’s college submission.',
    keywords: ['internship certificate format', 'internship completion certificate', 'intern certificate template'],
    useCases: ['Close out an internship', 'Support a college submission', 'Record the project worked on'],
  },

  'relieving-letter': {
    kind: 'relieving-letter',
    shape: 'letter',
    title: 'RELIEVING LETTER',
    numberPrefix: 'REL',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['relieving-letter'].fields,
    pageTitle: 'Relieving Letter Generator',
    shortTitle: 'Relieving Letter',
    badge: 'HR',
    pageDescription:
      'Release an employee formally on their last working day, confirming dues are settled — what their next employer will ask for.',
    keywords: ['relieving letter format', 'relieving letter template india', 'resignation relieving letter'],
    useCases: ['Release a resigning employee', 'Confirm the last working day', 'Close out an exit'],
  },

  'increment-letter': {
    kind: 'increment-letter',
    shape: 'letter',
    title: 'INCREMENT LETTER',
    numberPrefix: 'INC',
    partyLabel: 'To',
    dateLabel: 'Date',
    secondDateLabel: null,
    showPaymentMode: false,
    referenceLabel: null,
    defaultTaxMode: 'none',
    footerNote: '',
    defaultTerms: '',
    letterFields: LETTER_BODIES['increment-letter'].fields,
    pageTitle: 'Increment Letter Generator',
    shortTitle: 'Increment Letter',
    badge: 'HR',
    pageDescription:
      'Tell an employee their revised salary in writing, with the effective date and the new figure stated plainly.',
    keywords: ['increment letter format', 'salary increment letter india', 'appraisal letter template'],
    useCases: ['Communicate an appraisal outcome', 'State the revised CTC', 'Record the effective date'],
  },
};

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Card', 'Other'] as const;

/** Slabs a small Indian seller actually picks from. */
export const GST_RATES = [0, 5, 12, 18, 28] as const;

/** Every kind, in a stable order — used to generate routes and tool entries. */
export const DOCUMENT_KIND_LIST = Object.keys(DOCUMENT_KINDS) as DocumentKind[];

/** The tool slug for a kind. One rule, so routes and the registry cannot drift. */
export function documentSlug(kind: DocumentKind): string {
  return `${kind}-generator`;
}

export function kindFromSlug(slug: string): DocumentKind | undefined {
  return DOCUMENT_KIND_LIST.find((kind) => documentSlug(kind) === slug);
}

/**
 * A starting document number: PREFIX-YYYY-001.
 *
 * Deliberately a suggestion, not an enforced series. Sellers have their own
 * numbering that has to stay continuous across whatever they used before this
 * tool, and silently renumbering their books would be worse than no help.
 */
export function suggestNumber(kind: DocumentKind, date = new Date()): string {
  return `${DOCUMENT_KINDS[kind].numberPrefix}-${date.getFullYear()}-001`;
}
