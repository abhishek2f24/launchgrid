'use client';

import { DOCUMENT_KINDS } from '@/lib/documents/kinds';
import { Field, PartyFields, Section, inputClass } from './FormKit';
import type { DocumentData } from '@/lib/documents/types';

/**
 * The letter form: letterhead details, addressee, the kind's merge fields, and
 * who signs it. The merge fields come from the kind config, so the eight
 * letters share this one editor.
 */
export function LetterEditor({
  data,
  onChange,
  profileSlot,
}: {
  data: DocumentData;
  onChange: (next: DocumentData) => void;
  profileSlot?: React.ReactNode;
}) {
  const config = DOCUMENT_KINDS[data.kind];
  const fields = config.letterFields ?? [];

  const setMeta = <K extends keyof DocumentData['meta']>(
    key: K,
    value: DocumentData['meta'][K]
  ) => onChange({ ...data, meta: { ...data.meta, [key]: value } });

  const setLetterValue = (id: string, value: string) =>
    onChange({ ...data, letterValues: { ...data.letterValues, [id]: value } });

  return (
    <div className="space-y-6">
      <Section title="Your letterhead" action={profileSlot}>
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

      <Section title="Letter details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Reference number">
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

          {fields.map((field) => (
            <Field
              key={field.id}
              label={field.label}
              className={field.type === 'longtext' ? 'sm:col-span-2' : ''}
            >
              {field.type === 'longtext' ? (
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  value={data.letterValues[field.id] ?? ''}
                  onChange={(event) => setLetterValue(field.id, event.target.value)}
                />
              ) : (
                <input
                  className={inputClass}
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={data.letterValues[field.id] ?? ''}
                  onChange={(event) => setLetterValue(field.id, event.target.value)}
                />
              )}
              {field.help && (
                <span className="mt-1 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                  {field.help}
                </span>
              )}
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Signature">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Signatory name">
            <input
              className={inputClass}
              value={data.meta.signatoryName}
              onChange={(event) => setMeta('signatoryName', event.target.value)}
            />
          </Field>

          <Field label="Designation">
            <input
              className={inputClass}
              value={data.meta.signatoryTitle}
              onChange={(event) => setMeta('signatoryTitle', event.target.value)}
              placeholder="e.g. Director, HR"
            />
          </Field>

          <Field label="Place">
            <input
              className={inputClass}
              value={data.meta.place}
              onChange={(event) => setMeta('place', event.target.value)}
            />
          </Field>

          <Field label="Extra note" className="sm:col-span-2">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={data.meta.notes}
              onChange={(event) => setMeta('notes', event.target.value)}
              placeholder="Optional. Printed below the letter body."
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}
