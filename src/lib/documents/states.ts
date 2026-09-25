/**
 * Indian states and union territories with their GST state codes.
 *
 * The code is the first two digits of a GSTIN, which is what makes this list
 * worth carrying rather than using free-text state names: it lets a GSTIN be
 * checked against the state the seller selected, and it makes the place-of-
 * supply comparison exact instead of a lowercase string match that treats
 * "Delhi" and "New Delhi" as different states.
 */

export const GST_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
] as const;

export type StateCode = (typeof GST_STATES)[number]['code'];

const NAME_BY_CODE = new Map<string, string>(
  GST_STATES.map((state) => [state.code, state.name])
);

export function stateName(code: string): string {
  return NAME_BY_CODE.get(code) ?? '';
}

export function isStateCode(value: string): value is StateCode {
  return NAME_BY_CODE.has(value);
}

/**
 * The state a GSTIN belongs to, or '' when the string is not long enough to
 * tell. This does NOT validate the GSTIN — it only reads the state prefix.
 */
export function stateCodeFromGstin(gstin: string): string {
  const prefix = gstin.trim().slice(0, 2);
  return isStateCode(prefix) ? prefix : '';
}

/**
 * Shape check for a GSTIN: 2-digit state code, 10-character PAN, entity digit,
 * a literal 'Z', and a checksum character.
 *
 * Deliberately a format check, not a checksum verification. A wrong-looking
 * GSTIN is worth warning about; a checksum failure on a legitimately unusual
 * registration would block someone from making an invoice, which is worse than
 * letting a typo through on a document they are about to read themselves.
 */
const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function looksLikeGstin(gstin: string): boolean {
  return GSTIN_SHAPE.test(gstin.trim().toUpperCase());
}
