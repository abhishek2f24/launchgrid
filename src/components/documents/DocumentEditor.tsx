'use client';

import { Plus, Trash2 } from 'lucide-react';
import { DOCUMENT_KINDS, GST_RATES, PAYMENT_MODES } from '@/lib/documents/kinds';
import { emptyLine } from '@/lib/documents/defaults';
import { formatAmount } from '@/lib/documents/money';
import { lineTotal } from '@/lib/documents/totals';
import { Field, PartyFields, Section, inputClass } from './FormKit';
import type { DocumentData, LineItem, TaxMode } from '@/lib/documents/types';

export function DocumentEditor({
  data,
  onChange,
  profileSlot,
}: {
  data: DocumentData;
  onChange: (next: DocumentData) => void;
  /** Save/clear controls for the stored business profile. */
  profileSlot?: React.ReactNode;
}) {
  const config = DOCUMENT_KINDS[data.kind];

  const setMeta = <K extends keyof DocumentData['meta']>(
    key: K,
    value: DocumentData['meta'][K]
  ) => onChange({ ...data, meta: { ...data.meta, [key]: value } });

  const setItem = (id: string, patch: Partial<LineItem>) =>
    onChange({
      ...data,
      items: data.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });

  const addItem = () => onChange({ ...data, items: [...data.items, emptyLine()] });

  const removeItem = (id: string) => {
    // Never leave the table with zero rows — an empty document is confusing to
    // edit and produces a blank table on the paper.
    const remaining = data.items.filter((item) => item.id !== id);
    onChange({ ...data, items: remaining.length ? remaining : [emptyLine()] });
  };

  return (
    <div className="space-y-6">
      <Section title="Your business" action={profileSlot}>
        <PartyFields
          value={data.business}
          onChange={(business) => onChange({ ...data, business })}
          idPrefix="business"
        />
      </Section>

      <Section title={config.partyLabel}>
        <PartyFields
          value={data.party}
          onChange={(party) => onChange({ ...data, party })}
          idPrefix="party"
        />
      </Section>

      <Section title="Document details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Number">
            <input
              className={`${inputClass} font-mono`}
              value={data.meta.number}
              onChange={(event) => setMeta('number', event.target.value)}
            />
          </Field>

          <Field label={config.dateLabel}>
            <input
              className={inputClass}
              type="date"
              value={data.meta.date}
              onChange={(event) => setMeta('date', event.target.value)}
            />
          </Field>

          {/* Credit notes, debit notes and receipts are meaningless without
              saying which document they act on. */}
          {config.referenceLabel && (
            <Field label={config.referenceLabel}>
              <input
                className={inputClass}
                value={data.meta.reference}
                onChange={(event) => setMeta('reference', event.target.value)}
                placeholder="e.g. INV-2026-014"
              />
            </Field>
          )}

          {config.secondDateLabel && (
            <Field label={config.secondDateLabel}>
              <input
                className={inputClass}
                type="date"
                value={data.meta.dueDate}
                onChange={(event) => setMeta('dueDate', event.target.value)}
              />
            </Field>
          )}

          {config.showPaymentMode && (
            <Field label="Payment mode">
              <select
                className={inputClass}
                value={data.meta.paymentMode}
                onChange={(event) => setMeta('paymentMode', event.target.value)}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="GST rate">
            <select
              className={inputClass}
              value={data.gstRate}
              onChange={(event) =>
                onChange({ ...data, gstRate: Number(event.target.value) })
              }
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </Field>

          <Field label="Prices are">
            <select
              className={inputClass}
              value={data.taxMode}
              onChange={(event) =>
                onChange({ ...data, taxMode: event.target.value as TaxMode })
              }
            >
              <option value="exclusive">Excluding GST</option>
              <option value="inclusive">Including GST</option>
              <option value="none">Not registered for GST</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section
        title="Items"
        action={
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add item
          </button>
        }
      >
        <ul className="space-y-4">
          {data.items.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[var(--color-mark-default)] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)]">
                  Item {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-red)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Remove</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <Field label="Description" className="col-span-2 sm:col-span-3">
                  <input
                    className={inputClass}
                    value={item.description}
                    onChange={(event) =>
                      setItem(item.id, { description: event.target.value })
                    }
                    placeholder="What are you billing for?"
                  />
                </Field>

                <Field label="HSN/SAC">
                  <input
                    className={`${inputClass} font-mono`}
                    value={item.hsn}
                    onChange={(event) => setItem(item.id, { hsn: event.target.value })}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Qty">
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="any"
                    value={item.quantity}
                    onChange={(event) =>
                      setItem(item.id, { quantity: Number(event.target.value) })
                    }
                  />
                </Field>

                <Field label="Rate (₹)">
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) =>
                      setItem(item.id, { unitPrice: Number(event.target.value) })
                    }
                  />
                </Field>
              </div>

              <p className="mt-3 text-right text-[11px] font-bold text-[var(--color-mark-ink)] font-mono">
                ₹{formatAmount(lineTotal(item))}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Notes & terms">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={data.meta.notes}
              onChange={(event) => setMeta('notes', event.target.value)}
              placeholder="Bank details, delivery notes, anything the reader needs."
            />
          </Field>
          <Field label="Terms">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={data.meta.terms}
              onChange={(event) => setMeta('terms', event.target.value)}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}
