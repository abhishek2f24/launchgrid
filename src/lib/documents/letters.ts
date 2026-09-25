/**
 * The letter shape: prose on a letterhead, with merge fields.
 *
 * A letter is a subject, a salutation, some paragraphs and a sign-off. The
 * paragraphs carry `{{placeholders}}` that the form fills. That is the whole
 * engine — eight letters, one renderer, no per-letter code.
 *
 * ON THE WORDING
 *   These are ordinary, widely-used formulations for routine Indian workplace
 *   correspondence, written to be clear rather than clever. They are a starting
 *   point, not legal advice: an employment document that matters should be read
 *   by someone qualified before it goes out, and the page says so.
 *
 * UNFILLED FIELDS RENDER AS A RULED BLANK, NOT AS NOTHING.
 *   A half-filled letter that silently closes the gap reads as finished and
 *   goes out wrong. A visible ________ is impossible to miss.
 */

import type { DocumentKind } from './types';

export interface LetterField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'longtext';
  defaultValue?: string;
  help?: string;
}

export interface LetterBody {
  /** Re: line. May contain placeholders. */
  subject: string;
  salutation: string;
  /** Each entry is one paragraph. May contain placeholders. */
  paragraphs: string[];
  closing: string;
  fields: LetterField[];
}

/** Letter kinds only. Tabular and payslip kinds have no entry here. */
export type LetterKind = Extract<
  DocumentKind,
  | 'payment-reminder'
  | 'offer-letter'
  | 'appointment-letter'
  | 'experience-certificate'
  | 'employment-certificate'
  | 'internship-certificate'
  | 'relieving-letter'
  | 'increment-letter'
>;

const RECIPIENT = '{{party.name}}';
const COMPANY = '{{business.name}}';

export const LETTER_BODIES: Record<LetterKind, LetterBody> = {
  'payment-reminder': {
    subject: 'Outstanding payment against invoice {{invoiceNumber}}',
    salutation: `Dear ${RECIPIENT},`,
    paragraphs: [
      `This is a reminder that invoice {{invoiceNumber}} dated {{invoiceDate}}, for {{amount}}, was due on {{dueDate}} and remains unpaid as of today.`,
      `We would be grateful if you could arrange payment by {{requestedBy}}. If the payment has already been made, please share the transaction details and ignore this reminder.`,
      `If there is a query holding up the payment, do let us know — we would rather resolve it than chase it.`,
    ],
    closing: 'Thank you for your business.',
    fields: [
      { id: 'invoiceNumber', label: 'Invoice number', type: 'text' },
      { id: 'invoiceDate', label: 'Invoice date', type: 'date' },
      { id: 'amount', label: 'Amount outstanding', type: 'text', defaultValue: '', help: 'Write it as you want it to read, e.g. ₹45,000.' },
      { id: 'dueDate', label: 'Was due on', type: 'date' },
      { id: 'requestedBy', label: 'Please pay by', type: 'date' },
    ],
  },

  'offer-letter': {
    subject: 'Offer of employment — {{designation}}',
    salutation: `Dear ${RECIPIENT},`,
    paragraphs: [
      `We are pleased to offer you the position of {{designation}} at ${COMPANY}, based at {{location}}.`,
      `Your annual cost to company will be {{ctc}}. Your expected date of joining is {{startDate}}, and you will report to {{reportingTo}}.`,
      `This offer is subject to verification of the documents and references you have provided. Detailed terms of employment will be set out in your appointment letter on joining.`,
      `Please confirm your acceptance by {{acceptBy}} by signing and returning a copy of this letter.`,
    ],
    closing: 'We look forward to having you with us.',
    fields: [
      { id: 'designation', label: 'Designation', type: 'text' },
      { id: 'ctc', label: 'Annual CTC', type: 'text', help: 'Write it as it should read, e.g. ₹6,00,000 per annum.' },
      { id: 'location', label: 'Work location', type: 'text' },
      { id: 'startDate', label: 'Date of joining', type: 'date' },
      { id: 'reportingTo', label: 'Reporting to', type: 'text' },
      { id: 'acceptBy', label: 'Accept by', type: 'date' },
    ],
  },

  'appointment-letter': {
    subject: 'Appointment as {{designation}}',
    salutation: `Dear ${RECIPIENT},`,
    paragraphs: [
      `Further to your acceptance of our offer, we confirm your appointment as {{designation}} at ${COMPANY} with effect from {{startDate}}.`,
      `You will be based at {{location}} and will report to {{reportingTo}}. Your annual cost to company is {{ctc}}.`,
      `You will be on probation for {{probation}} from the date of joining. On satisfactory completion your appointment will be confirmed in writing.`,
      `Either party may end this employment by giving {{noticePeriod}} written notice, or salary in lieu of notice.`,
      `{{additionalTerms}}`,
    ],
    closing: 'We are glad to have you on the team.',
    fields: [
      { id: 'designation', label: 'Designation', type: 'text' },
      { id: 'startDate', label: 'Effective from', type: 'date' },
      { id: 'location', label: 'Work location', type: 'text' },
      { id: 'reportingTo', label: 'Reporting to', type: 'text' },
      { id: 'ctc', label: 'Annual CTC', type: 'text' },
      { id: 'probation', label: 'Probation period', type: 'text', defaultValue: 'six months' },
      { id: 'noticePeriod', label: 'Notice period', type: 'text', defaultValue: 'one month' },
      { id: 'additionalTerms', label: 'Additional terms', type: 'longtext', help: 'Optional. Leave blank to omit this paragraph.' },
    ],
  },

  'experience-certificate': {
    subject: 'Experience certificate',
    salutation: 'To Whom It May Concern,',
    paragraphs: [
      `This is to certify that ${RECIPIENT} was employed with ${COMPANY} as {{designation}} from {{fromDate}} to {{toDate}}.`,
      `During this period, {{responsibilities}}`,
      `{{conduct}}`,
      `We wish {{pronounObject}} every success in future endeavours.`,
    ],
    closing: '',
    fields: [
      { id: 'designation', label: 'Designation held', type: 'text' },
      { id: 'fromDate', label: 'Employed from', type: 'date' },
      { id: 'toDate', label: 'Employed until', type: 'date' },
      {
        id: 'responsibilities',
        label: 'Responsibilities',
        type: 'longtext',
        defaultValue:
          'they were responsible for the duties assigned to their role and carried them out to our satisfaction.',
        help: 'Written as a continuation of "During this period, …".',
      },
      {
        id: 'conduct',
        label: 'Conduct',
        type: 'longtext',
        defaultValue: 'We found their conduct and performance during the period to be satisfactory.',
      },
      { id: 'pronounObject', label: 'Refer to them as', type: 'text', defaultValue: 'them', help: 'Used in the closing line. "them" is a safe default.' },
    ],
  },

  'employment-certificate': {
    subject: 'Certificate of employment',
    salutation: 'To Whom It May Concern,',
    paragraphs: [
      `This is to certify that ${RECIPIENT} is currently employed with ${COMPANY} as {{designation}}, and has been with us since {{sinceDate}}.`,
      `Their current annual cost to company is {{ctc}}. {{purposeLine}}`,
      `This certificate is issued at the request of the employee and does not constitute a commitment of continued employment.`,
    ],
    closing: '',
    fields: [
      { id: 'designation', label: 'Designation', type: 'text' },
      { id: 'sinceDate', label: 'Employed since', type: 'date' },
      { id: 'ctc', label: 'Annual CTC', type: 'text' },
      {
        id: 'purposeLine',
        label: 'Purpose',
        type: 'longtext',
        defaultValue: 'This certificate is issued for the employee’s personal and official use.',
        help: 'Banks and visa offices often want the purpose stated.',
      },
    ],
  },

  'internship-certificate': {
    subject: 'Internship completion certificate',
    salutation: 'To Whom It May Concern,',
    paragraphs: [
      `This is to certify that ${RECIPIENT} has successfully completed an internship with ${COMPANY} as {{role}} from {{fromDate}} to {{toDate}}.`,
      `During the internship, {{projectSummary}}`,
      `{{conduct}}`,
    ],
    closing: 'We wish them well in their studies and career.',
    fields: [
      { id: 'role', label: 'Internship role', type: 'text', defaultValue: 'an intern' },
      { id: 'fromDate', label: 'From', type: 'date' },
      { id: 'toDate', label: 'To', type: 'date' },
      {
        id: 'projectSummary',
        label: 'Project or work done',
        type: 'longtext',
        defaultValue: 'they worked on assignments relevant to their field of study under the guidance of our team.',
        help: 'Written as a continuation of "During the internship, …".',
      },
      {
        id: 'conduct',
        label: 'Conduct',
        type: 'longtext',
        defaultValue: 'We found them sincere, punctual and willing to learn.',
      },
    ],
  },

  'relieving-letter': {
    subject: 'Relieving letter',
    salutation: `Dear ${RECIPIENT},`,
    paragraphs: [
      `This is to confirm that your resignation from the position of {{designation}} at ${COMPANY} has been accepted, and you have been relieved of your duties with effect from the close of business on {{lastWorkingDay}}.`,
      `You were employed with us from {{fromDate}} to {{lastWorkingDay}}. {{duesLine}}`,
      `We thank you for your contribution during your time with us.`,
    ],
    closing: 'We wish you the best in your next role.',
    fields: [
      { id: 'designation', label: 'Designation held', type: 'text' },
      { id: 'fromDate', label: 'Employed from', type: 'date' },
      { id: 'lastWorkingDay', label: 'Last working day', type: 'date' },
      {
        id: 'duesLine',
        label: 'Settlement of dues',
        type: 'longtext',
        defaultValue: 'All dues payable to you have been settled, and no company property remains in your possession.',
        help: 'Say only what is actually true — the next employer may rely on this.',
      },
    ],
  },

  'increment-letter': {
    subject: 'Revision of compensation',
    salutation: `Dear ${RECIPIENT},`,
    paragraphs: [
      `Following our review, we are pleased to inform you that your compensation has been revised with effect from {{effectiveDate}}.`,
      `Your annual cost to company stands revised from {{previousCtc}} to {{revisedCtc}}. {{designationLine}}`,
      `This revision reflects your contribution over the past period. All other terms of your employment remain unchanged.`,
    ],
    closing: 'Congratulations, and thank you for your work.',
    fields: [
      { id: 'effectiveDate', label: 'Effective from', type: 'date' },
      { id: 'previousCtc', label: 'Previous CTC', type: 'text' },
      { id: 'revisedCtc', label: 'Revised CTC', type: 'text' },
      {
        id: 'designationLine',
        label: 'Change of designation',
        type: 'longtext',
        help: 'Optional. For example: "Your designation stands revised to Senior Engineer."',
      },
    ],
  },
};

export function isLetterKind(kind: DocumentKind): kind is LetterKind {
  return kind in LETTER_BODIES;
}

/** What a placeholder becomes when its field is empty. */
const BLANK = '__________';

const PLACEHOLDER = /\{\{([\w.]+)\}\}/g;

export interface LetterContext {
  values: Record<string, string>;
  businessName: string;
  partyName: string;
}

function substitute(template: string, context: LetterContext): string {
  return template.replace(PLACEHOLDER, (_match, key: string) => {
    if (key === 'business.name') return context.businessName || BLANK;
    if (key === 'party.name') return context.partyName || BLANK;
    const value = context.values[key];
    return value && value.trim() !== '' ? value.trim() : BLANK;
  });
}

export interface RenderedLetter {
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
}

export function renderLetter(
  kind: LetterKind,
  context: LetterContext
): RenderedLetter {
  const body = LETTER_BODIES[kind];
  return {
    subject: substitute(body.subject, context),
    salutation: substitute(body.salutation, context),
    // A paragraph whose only content was an optional, unfilled field is dropped
    // rather than printed as a lone row of underscores.
    paragraphs: body.paragraphs
      .map((paragraph) => ({ raw: paragraph, text: substitute(paragraph, context) }))
      .filter(({ raw, text }) => !(isSinglePlaceholder(raw) && text === BLANK))
      .map(({ text }) => text),
    closing: substitute(body.closing, context),
  };
}

/** True when a paragraph is nothing but one placeholder, e.g. "{{conduct}}". */
function isSinglePlaceholder(paragraph: string): boolean {
  return /^\{\{[\w.]+\}\}$/.test(paragraph.trim());
}
