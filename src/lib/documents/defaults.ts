/** Empty-state factories. Kept out of the components so tests can use them. */

import { DOCUMENT_KINDS, suggestNumber } from './kinds';
import { LETTER_BODIES, isLetterKind } from './letters';
import type {
  BusinessProfile,
  DocumentData,
  DocumentKind,
  EmployeeDetails,
  LineItem,
  Party,
  PayRow,
} from './types';

/** Stable-enough id for a React key and nothing else. */
export function newLineId(): string {
  return `li_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyBusiness(): BusinessProfile {
  return {
    name: '',
    gstin: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
  };
}

export function emptyParty(): Party {
  return {
    name: '',
    gstin: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
  };
}

export function emptyLine(): LineItem {
  return { id: newLineId(), description: '', hsn: '', quantity: 1, unitPrice: 0 };
}

export function payRow(label = '', amount = 0): PayRow {
  return { id: newLineId(), label, amount };
}

/** Today as yyyy-mm-dd in the local timezone, which is what <input type="date"> wants. */
export function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Current month as yyyy-MM, for <input type="month">. */
export function thisMonth(): string {
  return today().slice(0, 7);
}

function emptyEmployee(): EmployeeDetails {
  return {
    name: '',
    designation: '',
    employeeId: '',
    period: thisMonth(),
    daysPaid: 30,
    panOrUan: '',
  };
}

/**
 * The standard rows an Indian payslip carries.
 *
 * Seeded as a starting point with zero amounts, not as a claim about what
 * anyone's payroll looks like — every row is renameable and removable.
 */
function defaultEarnings(): PayRow[] {
  return [
    payRow('Basic'),
    payRow('House Rent Allowance'),
    payRow('Special Allowance'),
  ];
}

function defaultDeductions(): PayRow[] {
  return [payRow('Provident Fund'), payRow('Professional Tax')];
}

function defaultLetterValues(kind: DocumentKind): Record<string, string> {
  if (!isLetterKind(kind)) return {};
  return Object.fromEntries(
    LETTER_BODIES[kind].fields.map((field) => [field.id, field.defaultValue ?? ''])
  );
}

export function emptyDocument(kind: DocumentKind): DocumentData {
  const config = DOCUMENT_KINDS[kind];
  return {
    kind,
    business: emptyBusiness(),
    party: emptyParty(),
    items: [emptyLine()],
    meta: {
      number: suggestNumber(kind),
      date: today(),
      dueDate: '',
      paymentMode: 'UPI',
      notes: '',
      terms: config.defaultTerms,
      reference: '',
      place: '',
      signatoryName: '',
      signatoryTitle: '',
    },
    gstRate: 18,
    taxMode: config.defaultTaxMode,
    earnings: defaultEarnings(),
    deductions: defaultDeductions(),
    employee: emptyEmployee(),
    letterValues: defaultLetterValues(kind),
  };
}
