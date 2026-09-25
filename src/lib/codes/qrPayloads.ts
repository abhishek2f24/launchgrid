/**
 * What a QR code can point at.
 *
 * Each destination is a short form plus a function that turns the answers into
 * the string the scanner reads. This is why "UPI QR", "WhatsApp QR", "Wi-Fi QR"
 * and "Review QR" are one tool: they differ only in this file.
 *
 * The encoded strings follow the conventions phone cameras actually act on —
 * `upi://pay` opens a UPI app, `WIFI:` joins a network, `BEGIN:VCARD` offers to
 * save a contact. Getting the escaping wrong produces a code that scans to
 * gibberish, so the fiddly cases are escaped explicitly below.
 */

export type QrKind =
  | 'url'
  | 'upi'
  | 'whatsapp'
  | 'review'
  | 'phone'
  | 'email'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'text';

export interface QrField {
  id: string;
  label: string;
  placeholder?: string;
  help?: string;
  type?: 'text' | 'tel' | 'email' | 'number';
  optional?: boolean;
}

export interface QrKindSpec {
  kind: QrKind;
  label: string;
  blurb: string;
  fields: QrField[];
  build: (values: Record<string, string>) => string;
}

const get = (values: Record<string, string>, id: string) =>
  (values[id] ?? '').trim();

/** Digits only, with the country code kept if present. */
function phoneDigits(raw: string, defaultCountry = '91'): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return defaultCountry + digits;
  return digits;
}

/** `WIFI:` and `MECARD`-style formats reserve these and need backslash escapes. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export const QR_KINDS: QrKindSpec[] = [
  {
    kind: 'url',
    label: 'Website link',
    blurb: 'Opens a page — your store, menu, catalogue or form.',
    fields: [
      { id: 'url', label: 'Link', placeholder: 'https://yourstore.in/menu' },
    ],
    build: (values) => {
      const url = get(values, 'url');
      if (!url) return '';
      // A bare domain scans as text on many phones rather than opening.
      return /^[a-z][\w+.-]*:/i.test(url) ? url : `https://${url}`;
    },
  },
  {
    kind: 'upi',
    label: 'UPI payment',
    blurb: 'Opens the customer’s UPI app with your details filled in.',
    fields: [
      { id: 'vpa', label: 'Your UPI ID', placeholder: 'name@okhdfcbank' },
      { id: 'name', label: 'Payee name', placeholder: 'Sharma Traders' },
      {
        id: 'amount',
        label: 'Amount',
        type: 'number',
        optional: true,
        help: 'Leave blank to let the customer enter it — right for a counter QR.',
      },
      { id: 'note', label: 'Note', optional: true, placeholder: 'Table 4' },
    ],
    build: (values) => {
      const vpa = get(values, 'vpa');
      if (!vpa) return '';

      // Built by hand rather than with URLSearchParams, which percent-encodes
      // the VPA's '@' and writes spaces as '+'. UPI apps expect the VPA raw and
      // read '+' literally, so a payee would show as "Sharma+Traders" — or the
      // code would fail to open an app at all.
      const parts = [`pa=${vpa}`];
      const name = get(values, 'name');
      if (name) parts.push(`pn=${encodeURIComponent(name)}`);
      const amount = get(values, 'amount');
      if (amount && Number(amount) > 0) parts.push(`am=${Number(amount).toFixed(2)}`);
      const note = get(values, 'note');
      if (note) parts.push(`tn=${encodeURIComponent(note)}`);
      parts.push('cu=INR');
      return `upi://pay?${parts.join('&')}`;
    },
  },
  {
    kind: 'whatsapp',
    label: 'WhatsApp chat',
    blurb: 'Opens a chat with you, optionally with a message pre-typed.',
    fields: [
      { id: 'phone', label: 'WhatsApp number', type: 'tel', placeholder: '98765 43210' },
      {
        id: 'message',
        label: 'Pre-filled message',
        optional: true,
        placeholder: 'Hi, I want to order',
      },
    ],
    build: (values) => {
      const phone = phoneDigits(get(values, 'phone'));
      if (!phone) return '';
      const message = get(values, 'message');
      return message
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${phone}`;
    },
  },
  {
    kind: 'review',
    label: 'Google review',
    blurb: 'Sends a customer straight to your review box.',
    fields: [
      {
        id: 'placeId',
        label: 'Google Place ID',
        placeholder: 'ChIJ...',
        help: 'From Google’s Place ID finder, or the "Ask for reviews" link in your Business Profile.',
      },
    ],
    build: (values) => {
      const placeId = get(values, 'placeId');
      if (!placeId) return '';
      // If they paste a full review link, use it as-is rather than nesting it.
      if (/^https?:\/\//i.test(placeId)) return placeId;
      return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
    },
  },
  {
    kind: 'phone',
    label: 'Phone call',
    blurb: 'Dials your number.',
    fields: [{ id: 'phone', label: 'Phone number', type: 'tel' }],
    build: (values) => {
      const phone = get(values, 'phone').replace(/[^\d+]/g, '');
      return phone ? `tel:${phone}` : '';
    },
  },
  {
    kind: 'email',
    label: 'Email',
    blurb: 'Opens a new email addressed to you.',
    fields: [
      { id: 'to', label: 'Email address', type: 'email' },
      { id: 'subject', label: 'Subject', optional: true },
      { id: 'body', label: 'Message', optional: true },
    ],
    build: (values) => {
      const to = get(values, 'to');
      if (!to) return '';
      const params = new URLSearchParams();
      const subject = get(values, 'subject');
      if (subject) params.set('subject', subject);
      const body = get(values, 'body');
      if (body) params.set('body', body);
      const query = params.toString();
      return query ? `mailto:${to}?${query}` : `mailto:${to}`;
    },
  },
  {
    kind: 'sms',
    label: 'SMS',
    blurb: 'Opens a text message to you.',
    fields: [
      { id: 'phone', label: 'Phone number', type: 'tel' },
      { id: 'message', label: 'Pre-filled message', optional: true },
    ],
    build: (values) => {
      const phone = get(values, 'phone').replace(/[^\d+]/g, '');
      if (!phone) return '';
      const message = get(values, 'message');
      return message ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}`;
    },
  },
  {
    kind: 'wifi',
    label: 'Wi-Fi',
    blurb: 'Joins your network without anyone reading out the password.',
    fields: [
      { id: 'ssid', label: 'Network name (SSID)' },
      { id: 'password', label: 'Password', optional: true },
      {
        id: 'security',
        label: 'Security',
        optional: true,
        placeholder: 'WPA',
        help: 'WPA covers WPA2 and WPA3. Use WEP for old routers, or leave blank for an open network.',
      },
    ],
    build: (values) => {
      const ssid = get(values, 'ssid');
      if (!ssid) return '';
      const password = get(values, 'password');
      const security = get(values, 'security').toUpperCase() || (password ? 'WPA' : 'nopass');
      return `WIFI:T:${security};S:${escapeWifi(ssid)};${
        password ? `P:${escapeWifi(password)};` : ''
      }H:false;;`;
    },
  },
  {
    kind: 'vcard',
    label: 'Contact card',
    blurb: 'Offers to save your details to the phone’s contacts.',
    fields: [
      { id: 'name', label: 'Full name' },
      { id: 'org', label: 'Business', optional: true },
      { id: 'title', label: 'Designation', optional: true },
      { id: 'phone', label: 'Phone', type: 'tel', optional: true },
      { id: 'email', label: 'Email', type: 'email', optional: true },
      { id: 'url', label: 'Website', optional: true },
      { id: 'address', label: 'Address', optional: true },
    ],
    build: (values) => {
      const name = get(values, 'name');
      if (!name) return '';
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`];
      const org = get(values, 'org');
      if (org) lines.push(`ORG:${org}`);
      const title = get(values, 'title');
      if (title) lines.push(`TITLE:${title}`);
      const phone = get(values, 'phone');
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      const email = get(values, 'email');
      if (email) lines.push(`EMAIL:${email}`);
      const url = get(values, 'url');
      if (url) lines.push(`URL:${url}`);
      const address = get(values, 'address');
      // vCard ADR has seven semicolon-separated parts; the street goes third.
      if (address) lines.push(`ADR;TYPE=WORK:;;${address.replace(/;/g, ',')};;;;`);
      lines.push('END:VCARD');
      return lines.join('\n');
    },
  },
  {
    kind: 'text',
    label: 'Plain text',
    blurb: 'Shows whatever you type. Good for batch numbers and instructions.',
    fields: [{ id: 'text', label: 'Text' }],
    build: (values) => get(values, 'text'),
  },
];

export function getQrKind(kind: QrKind): QrKindSpec {
  return QR_KINDS.find((spec) => spec.kind === kind) ?? QR_KINDS[0];
}

/** Render a module grid as SVG — vector, for print. */
export function qrToSvg(modules: boolean[][], quietZone = 4): string {
  const size = modules.length;
  const total = size + quietZone * 2;
  const paths: string[] = [];

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (modules[r][c]) paths.push(`M${c + quietZone} ${r + quietZone}h1v1h-1z`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="#ffffff"/>`,
    `<path d="${paths.join('')}" fill="#000000"/>`,
    '</svg>',
  ].join('');
}
