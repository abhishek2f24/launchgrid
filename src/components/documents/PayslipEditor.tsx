'use client';

import { Plus, Trash2 } from 'lucide-react';
import { payRow } from '@/lib/documents/defaults';
import { Field, PartyFields, Section, inputClass } from './FormKit';
import type { DocumentData, PayRow } from '@/lib/documents/types';

/**
 * The payslip form: employer, employee, then two editable lists of money rows.
 *
 * Rows are free text rather than a fixed set of components. Indian payroll
 * varies enough between a three-person shop and a factory that a hardcoded
 * Basic/HRA/DA list would be wrong for most of the people using this.
 */

function RowList({
  title,
  rows,
  onChange,
  addLabel,
}: {
  title: string;
  rows: PayRow[];
  onChange: (rows: PayRow[]) => void;
  addLabel: string;
}) {
  const setRow = (id: string, patch: Partial<PayRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const remove = (id: string) => {
    const remaining = rows.filter((row) => row.id !== id);
    // Keep at least one row so the list never becomes an empty box with no way
    // back into it.
    onChange(remaining.length ? remaining : [payRow()]);
  };

  return (
    <Section
      title={title}
      action={
        <button
          type="button"
          onClick={() => onChange([...rows, payRow()])}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {addLabel}
        </button>
      }
    >
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-end gap-3">
            <Field label="Component" className="flex-1">
              <input
                className={inputClass}
                value={row.label}
                onChange={(event) => setRow(row.id, { label: event.target.value })}
              />
            </Field>
            <Field label="Amount (₹)" className="w-32">
              <input
                className={inputClass}
                type="number"
                min={0}
                step="0.01"
                value={row.amount}
                onChange={(event) =>
                  setRow(row.id, { amount: Number(event.target.value) })
                }
              />
            </Field>
            <button
              type="button"
              onClick={() => remove(row.id)}
              className="mb-2 p-2 text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-red)] transition-colors"
              aria-label={`Remove ${row.label || 'row'}`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function PayslipEditor({
  data,
  onChange,
  profileSlot,
}: {
  data: DocumentData;
  onChange: (next: DocumentData) => void;
  profileSlot?: React.ReactNode;
}) {
  const setEmployee = <K extends keyof DocumentData['employee']>(
    key: K,
    value: DocumentData['employee'][K]
  ) => onChange({ ...data, employee: { ...data.employee, [key]: value } });

  return (
    <div className="space-y-6">
      <Section title="Your business" action={profileSlot}>
        <PartyFields
          value={data.business}
          onChange={(business) => onChange({ ...data, business })}
          idPrefix="business"
        />
      </Section>

      <Section title="Employee">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className={inputClass}
              value={data.employee.name}
              onChange={(event) => setEmployee('name', event.target.value)}
            />
          </Field>

          <Field label="Designation">
            <input
              className={inputClass}
              value={data.employee.designation}
              onChange={(event) => setEmployee('designation', event.target.value)}
            />
          </Field>

          <Field label="Employee ID">
            <input
              className={inputClass}
              value={data.employee.employeeId}
              onChange={(event) => setEmployee('employeeId', event.target.value)}
            />
          </Field>

          <Field label="PAN / UAN">
            <input
              className={`${inputClass} font-mono uppercase`}
              value={data.employee.panOrUan}
              onChange={(event) => setEmployee('panOrUan', event.target.value)}
            />
          </Field>

          <Field label="Pay period">
            <input
              className={inputClass}
              type="month"
              value={data.employee.period}
              onChange={(event) => setEmployee('period', event.target.value)}
            />
          </Field>

          <Field label="Days paid">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={31}
              value={data.employee.daysPaid}
              onChange={(event) =>
                setEmployee('daysPaid', Number(event.target.value))
              }
            />
          </Field>

          <Field label="Slip number">
            <input
              className={`${inputClass} font-mono`}
              value={data.meta.number}
              onChange={(event) =>
                onChange({ ...data, meta: { ...data.meta, number: event.target.value } })
              }
            />
          </Field>
        </div>
      </Section>

      <RowList
        title="Earnings"
        rows={data.earnings}
        onChange={(earnings) => onChange({ ...data, earnings })}
        addLabel="Add earning"
      />

      <RowList
        title="Deductions"
        rows={data.deductions}
        onChange={(deductions) => onChange({ ...data, deductions })}
        addLabel="Add deduction"
      />

      <Section title="Note">
        <Field label="Printed below net pay">
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            value={data.meta.notes}
            onChange={(event) =>
              onChange({ ...data, meta: { ...data.meta, notes: event.target.value } })
            }
            placeholder="Optional — bank account, leave balance, anything the employee should see."
          />
        </Field>
      </Section>
    </div>
  );
}
