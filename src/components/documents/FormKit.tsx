'use client';

/**
 * Form primitives shared by all three document editors.
 *
 * Extracted when the letter and payslip shapes arrived: three editors with
 * three private copies of the same input styling is how a product starts
 * looking like three products.
 */

import { GST_STATES, looksLikeGstin, stateCodeFromGstin } from '@/lib/documents/states';
import type { BusinessProfile, Party } from '@/lib/documents/types';

export const inputClass =
  'w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-subtle-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]';

export const labelClass =
  'block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5';

export function Field({
  label,
  children,
  hint,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10px] text-[var(--color-mark-amber)] font-semibold">
          {hint}
        </span>
      )}
    </label>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StateSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      className={inputClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select state</option>
      {GST_STATES.map((state) => (
        <option key={state.code} value={state.code}>
          {state.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Party fields, used for both the seller and the counterparty. The only
 * difference between the two is the heading, so they share one component
 * rather than two forms that drift apart.
 */
export function PartyFields<T extends BusinessProfile | Party>({
  value,
  onChange,
  idPrefix,
}: {
  value: T;
  onChange: (next: T) => void;
  idPrefix: string;
}) {
  const set = <K extends keyof T>(key: K, next: T[K]) =>
    onChange({ ...value, [key]: next });

  // A GSTIN whose state prefix contradicts the selected state is the single
  // most common way one of these documents goes out wrong, because it silently
  // flips CGST/SGST to IGST. Warn, but never block.
  const gstinState = stateCodeFromGstin(value.gstin);
  const gstinMismatch =
    value.gstin.length >= 2 && gstinState !== '' && value.state !== '' && gstinState !== value.state;
  const gstinMalformed =
    value.gstin.trim().length > 0 && !looksLikeGstin(value.gstin);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Name" className="sm:col-span-2">
        <input
          id={`${idPrefix}-name`}
          className={inputClass}
          value={value.name}
          onChange={(event) => set('name', event.target.value as T[keyof T])}
          placeholder="Business or person"
        />
      </Field>

      <Field
        label="GSTIN"
        hint={
          gstinMismatch
            ? 'This GSTIN belongs to a different state than the one selected.'
            : gstinMalformed
              ? 'That does not look like a 15-character GSTIN.'
              : undefined
        }
      >
        <input
          id={`${idPrefix}-gstin`}
          className={`${inputClass} font-mono uppercase`}
          value={value.gstin}
          onChange={(event) => set('gstin', event.target.value as T[keyof T])}
          placeholder="27ABCDE1234F1Z5"
          maxLength={15}
          autoCapitalize="characters"
        />
      </Field>

      <Field label="Phone">
        <input
          id={`${idPrefix}-phone`}
          className={inputClass}
          value={value.phone}
          onChange={(event) => set('phone', event.target.value as T[keyof T])}
          inputMode="tel"
          placeholder="98765 43210"
        />
      </Field>

      <Field label="Address" className="sm:col-span-2">
        <input
          id={`${idPrefix}-address`}
          className={inputClass}
          value={value.addressLine}
          onChange={(event) => set('addressLine', event.target.value as T[keyof T])}
          placeholder="Street, area"
        />
      </Field>

      <Field label="City">
        <input
          id={`${idPrefix}-city`}
          className={inputClass}
          value={value.city}
          onChange={(event) => set('city', event.target.value as T[keyof T])}
        />
      </Field>

      <Field label="PIN code">
        <input
          id={`${idPrefix}-pincode`}
          className={inputClass}
          value={value.pincode}
          onChange={(event) => set('pincode', event.target.value as T[keyof T])}
          inputMode="numeric"
          maxLength={6}
        />
      </Field>

      <Field label="State">
        <StateSelect
          id={`${idPrefix}-state`}
          value={value.state}
          onChange={(next) => set('state', next as T[keyof T])}
        />
      </Field>

      <Field label="Email">
        <input
          id={`${idPrefix}-email`}
          className={inputClass}
          type="email"
          value={value.email}
          onChange={(event) => set('email', event.target.value as T[keyof T])}
        />
      </Field>
    </div>
  );
}

