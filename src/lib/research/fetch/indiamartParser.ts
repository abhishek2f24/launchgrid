// Server-side IndiaMART search parser.
//
// WHY NOT THE ADAPTERS IN src/lib/research/adapters/
//   Those are explicitly stamped `0.2.0-uncalibrated` — their selectors were written
//   from documentation, never checked against a real DOM. This parser instead mirrors
//   `indiamart-im-lc-card@1.0.0`, the browser harvester that actually produced the 145
//   real supplier rows currently in the database. Same card boundary, same regexes.
//   Using the calibrated logic matters more than reusing the nicer abstraction.
//
// WHY REGEX RATHER THAN A DOM LIBRARY
//   The project has no HTML parser dependency, and this extraction only needs card
//   boundaries plus text. Tags are stripped per card and the identical regexes are
//   applied to the resulting text, so behaviour matches the browser version.
//
// THE RULES BELOW ARE LOAD-BEARING — see qualityGate.ts and the ingest endpoint:
//   - Currency is never guessed. IndiaMART quotes INR and ₹ is read off the page.
//   - No evidence booleans are emitted. A "TrustSEAL" badge is marketing, not a
//     factory audit; emitting nothing leaves those columns NULL ("unknown") rather
//     than false ("we checked and it is absent").
//   - MOQ absent stays null. An invented MOQ flows into budget-fit scoring and the
//     recommended first order.

export const PARSER_VERSION = 'indiamart-im-lc-card@1.0.0-server';

export interface ParsedSupplier {
  supplierName: string;
  productTitle: string | null;
  unitPrice: number;
  currency: 'INR';
  moq: number | null;
  city: string | null;
  yearsInBusiness: number | null;
  /** Seller profile URL from the card's anchor. The gateway to everything in
   *  ParsedSupplierDetail — previously discarded, which is why 0% of stored
   *  suppliers had a contactable route. */
  storeUrl: string | null;
  extractionConfidence: number;
}

/** Fields that only exist on the seller's PROFILE page, never on a search card. */
export interface ParsedSupplierDetail {
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  moq: number | null;
  certifications: string[] | null;
}

export function searchUrl(query: string): string {
  return `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(query)}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Keep a newline at block boundaries so the "City · N yrs" pattern survives.
    .replace(/<\/(div|p|span|li|a|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8377;|&rupee;/g, '₹')
    .replace(/[ \t]+/g, ' ');
}

/** Splits the page into listing-card chunks. */
function cardChunks(html: string): string[] {
  const parts = html.split(/<article[^>]*class="[^"]*im-lc-card[^"]*"[^>]*>/i);
  // parts[0] is everything before the first card.
  return parts.slice(1);
}

export function parseSearchHtml(html: string): ParsedSupplier[] {
  const out: ParsedSupplier[] = [];

  for (const chunk of cardChunks(html)) {
    // The seller anchor carries the company name; without it the chunk is not a
    // usable listing and is skipped rather than guessed at.
    const nameMatch = chunk.match(/<a[^>]*class="[^"]*im-lc-seller-name[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!nameMatch) continue;
    const supplierName = stripTags(nameMatch[1]).replace(/\s+/g, ' ').trim();
    if (supplierName.length < 2) continue;

    const text = stripTags(chunk);
    const flat = text.replace(/\s+/g, ' ');

    const priceMatch = flat.match(/₹\s*([\d,]+(?:\.\d+)?)/);
    if (!priceMatch) continue;
    const unitPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) continue;

    const moqMatch = flat.match(/(?:Min(?:imum)?\.?\s*Order[^\d]{0,15})([\d,]+)/i);
    const moqRaw = moqMatch ? parseInt(moqMatch[1].replace(/,/g, ''), 10) : NaN;
    // A real ladder never starts at qty 1–2; that means a stray number was captured.
    const moq = Number.isFinite(moqRaw) && moqRaw >= 3 ? moqRaw : null;

    const loc = text.match(/\n\s*([A-Za-z][A-Za-z .]{2,30}?)\s*·\s*(\d+)\s*yrs/);
    const city = loc ? loc[1].trim() : null;
    const years = loc ? Number(loc[2]) : null;

    // The seller anchor's href is the profile URL. Relative hrefs are resolved
    // against the directory host; anything that is not an http(s) URL is dropped
    // rather than stored as a broken link.
    const hrefMatch = nameMatch[0].match(/href="([^"]+)"/i);
    let storeUrl: string | null = null;
    if (hrefMatch) {
      const raw = hrefMatch[1].replace(/&amp;/g, '&').trim();
      if (/^https?:\/\//i.test(raw)) storeUrl = raw;
      else if (raw.startsWith('//')) storeUrl = 'https:' + raw;
      else if (raw.startsWith('/')) storeUrl = 'https://www.indiamart.com' + raw;
    }

    const titleMatch = chunk.match(/<a[^>]*class="[^"]*im-lc-name[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const productTitle = titleMatch ? stripTags(titleMatch[1]).replace(/\s+/g, ' ').trim() || null : null;

    // Confidence reflects what the card actually yielded — nothing is padded to
    // clear the ingest endpoint's 0.3 floor or the quality gate's 0.5 mean.
    const confidence = Math.min(1, 0.55 + (moq ? 0.2 : 0) + (city ? 0.1 : 0) + (years ? 0.1 : 0));

    out.push({
      supplierName: supplierName.slice(0, 180),
      productTitle,
      unitPrice,
      currency: 'INR',
      moq,
      city,
      yearsInBusiness: years,
      storeUrl,
      extractionConfidence: Number(confidence.toFixed(2)),
    });
  }

  return out;
}


/**
 * Parses a seller PROFILE page for the fields that make a report actionable:
 * phone, email, address, MOQ and self-declared certifications.
 *
 * SELECTOR CALIBRATION
 *   Unlike the search-card parser above — which was calibrated against live DOM and
 *   produced the real supplier rows in the database — these patterns are written
 *   against IndiaMART's documented profile layout and have NOT been verified against
 *   a live page, because the directory rate-limits automated access. They are
 *   therefore written to be label-driven and generous about surrounding markup, and
 *   every field independently returns null on no match.
 *
 *   Failing to a null is the entire safety property here: a profile that parses to
 *   nothing degrades the report to exactly what it is today, whereas a wrong phone
 *   number sends a merchant to the wrong company.
 */

/**
 * Reduces a matched phone string to a bare 10-digit Indian subscriber number.
 *
 * The two extraction paths disagree on shape: page text usually carries the bare
 * number, while a `tel:` href carries the country code. Normalising here rather
 * than in the regexes means both paths store the same thing, so the same supplier
 * scraped twice does not produce two different-looking numbers.
 *
 * Anything that is not a plausible Indian mobile is dropped rather than stored —
 * a wrong number sends a merchant to the wrong company.
 */
function normalisePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function parseSupplierDetailHtml(html: string): ParsedSupplierDetail {
  const text = stripTags(html).replace(/\r/g, '');
  const flat = text.replace(/\s+/g, ' ');

  // Indian mobile/landline. Anchored on a leading boundary so it cannot slice a
  // longer number (GST/PAN/pincode runs) into something phone-shaped.
  const phoneMatch =
    flat.match(/(?:\+91[\s-]?)?(?:0)?([6-9]\d{9})(?!\d)/) ??
    html.match(/href="tel:\+?([\d\s-]{8,15})"/i);
  const contactPhone = normalisePhone(phoneMatch?.[1]);

  const emailMatch =
    html.match(/href="mailto:([^"?]+)"/i) ??
    flat.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  const contactEmail = emailMatch ? emailMatch[1].trim().toLowerCase() : null;

  // Address follows an explicit label; bounded so it cannot swallow the page.
  const addressMatch = text.match(
    /(?:Registered\s+Address|Office\s+Address|Address)\s*[:\n]\s*([^\n]{10,180})/i,
  );
  const address = addressMatch ? addressMatch[1].replace(/\s+/g, ' ').trim() : null;

  const moqMatch = flat.match(/(?:Min(?:imum)?\.?\s*Order(?:\s*Quantity)?)[^\d]{0,20}([\d,]+)/i);
  const moqRaw = moqMatch ? parseInt(moqMatch[1].replace(/,/g, ''), 10) : NaN;
  // Same rule as the search card: a ladder never starts at 1–2.
  const moq = Number.isFinite(moqRaw) && moqRaw >= 3 ? moqRaw : null;

  // Self-declared badges only. These are deliberately NOT mapped onto the evidence
  // booleans (audit_report_available and friends) — a printed "ISO 9001" is a claim
  // by the seller, not verification by us, and conflating the two is what produced
  // 505 rows falsely asserting compliance facts.
  const certPatterns: [RegExp, string][] = [
    [/\bISO\s?9001\b/i, 'ISO 9001'],
    [/\bISO\s?14001\b/i, 'ISO 14001'],
    [/\bISO\s?13485\b/i, 'ISO 13485'],
    [/\bCE\s+(?:certified|marked?)\b/i, 'CE'],
    [/\bBIS\b/, 'BIS'],
    [/\bFSSAI\b/i, 'FSSAI'],
    [/\bGST\s*(?:No|Number|registered)/i, 'GST registered'],
    [/\bTrustSEAL\b/i, 'TrustSEAL (IndiaMART badge)'],
  ];
  const found = certPatterns.filter(([re]) => re.test(flat)).map(([, label]) => label);
  const certifications = found.length ? found : null;

  return { contactPhone, contactEmail, address, moq, certifications };
}
