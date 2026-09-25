/**
 * Remembering the seller's own details between documents.
 *
 * WHY LOCALSTORAGE AND NOT AN ACCOUNT
 *   The point of the free document tools is that someone searching "gst invoice
 *   generator" can produce an invoice without signing up. Asking for an account
 *   before the first document defeats that. Saving the business profile locally
 *   gives the returning-visitor benefit ("your details are already filled in")
 *   at zero friction, and the prompt to create an account can come later, once
 *   the tool has already been useful.
 *
 * WHAT THIS IS NOT
 *   Not a sync mechanism and not a backup. It lives in one browser, never
 *   reaches the server, and is expected to come back empty — private windows,
 *   cleared site data and blocked storage all return nothing or throw. Every
 *   read and write is guarded, and the tools render correctly with no stored
 *   profile at all.
 *
 * Only the seller's own profile is persisted. Customer details and line items
 * are deliberately not kept: a shared or family computer should not surface the
 * last customer's name and phone number to whoever opens the tool next.
 */

import { emptyBusiness } from './defaults';
import type { BusinessProfile, DocumentData } from './types';

const PROFILE_KEY = 'launchgrid.documents.business.v1';

export function loadBusinessProfile(): BusinessProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BusinessProfile>;
    if (!parsed || typeof parsed !== 'object') return null;

    // Merge over a fresh empty profile so a stored object written by an older
    // version, or hand-edited, can never leave a field undefined.
    const base = emptyBusiness();
    return {
      ...base,
      ...Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === 'string')
      ),
    } as BusinessProfile;
  } catch {
    return null;
  }
}

export function saveBusinessProfile(profile: BusinessProfile): boolean {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearBusinessProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Nothing to do — the caller resets its own state regardless.
  }
}

/**
 * Handing a draft from one document tool to another — the "convert this
 * accepted quotation into an invoice" path.
 *
 * sessionStorage, not localStorage: this is a single hand-off across one
 * navigation, and it carries customer details, so it should not outlive the
 * browser session. The receiving page consumes it once and clears it.
 */
const HANDOFF_KEY = 'launchgrid.documents.handoff.v1';

export function stashHandoff(data: DocumentData): boolean {
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Reads and removes the pending hand-off, if there is one. */
export function takeHandoff(): DocumentData | null {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(HANDOFF_KEY);

    const parsed = JSON.parse(raw) as DocumentData;
    // Shape check rather than trust: this came from storage, which a user or
    // another tab can have written anything into.
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.items) ||
      typeof parsed.business !== 'object' ||
      typeof parsed.party !== 'object' ||
      typeof parsed.meta !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
