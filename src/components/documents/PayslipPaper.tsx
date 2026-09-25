/**
 * The payslip renderer: earnings on the left, deductions on the right, net pay
 * below — the layout every Indian payslip uses, because that is what the bank
 * or landlord reading it expects to see.
 */

import { amountInWords, formatAmount } from '@/lib/documents/money';
import { computePayslip } from '@/lib/documents/totals';
import { stateName } from '@/lib/documents/states';
import type { DocumentData, PayRow } from '@/lib/documents/types';

function formatPeriod(period: string): string {
  if (!period) return '';
  const parsed = new Date(`${period}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return period;
  return parsed.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function PayColumn({
  heading,
  rows,
  total,
  totalLabel,
}: {
  heading: string;
  rows: PayRow[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between border-b border-neutral-300 pb-2 text-[9px] font-black uppercase tracking-widest text-neutral-400">
        <span>{heading}</span>
        <span>Amount</span>
      </div>
      <ul>
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex justify-between border-b border-neutral-100 py-2 text-[11px]"
          >
            <span className="text-neutral-700">
              {row.label || <span className="text-neutral-300">Untitled</span>}
            </span>
            <span className="font-mono text-neutral-900">
              {formatAmount(Math.round(row.amount * 100))}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between pt-2.5 text-[11px] font-black uppercase text-neutral-900">
        <span>{totalLabel}</span>
        <span className="font-mono">₹{formatAmount(total)}</span>
      </div>
    </div>
  );
}

export function PayslipPaper({ data }: { data: DocumentData }) {
  const totals = computePayslip(data.earnings, data.deductions);

  const detail = (label: string, value: string) =>
    value ? (
      <div className="flex gap-2">
        <dt className="text-neutral-500 shrink-0">{label}</dt>
        <dd className="font-semibold text-neutral-900 break-words">{value}</dd>
      </div>
    ) : null;

  const businessLocality = [
    data.business.addressLine,
    data.business.city,
    stateName(data.business.state),
    data.business.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article
      id="document-paper"
      className="bg-white text-neutral-900 border border-[var(--color-mark-default)] rounded-[1.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(26,26,24,0.04)] print:border-0 print:rounded-none print:shadow-none print:p-0"
    >
      <header className="text-center pb-5 border-b-2 border-neutral-900">
        <h2 className="font-playfair text-2xl font-extrabold tracking-tight break-words">
          {data.business.name || (
            <span className="text-neutral-300">Your business name</span>
          )}
        </h2>
        {businessLocality && (
          <p className="mt-1 text-[11px] text-neutral-600">{businessLocality}</p>
        )}
        <p className="mt-3 inline-block px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest">
          Salary slip · {formatPeriod(data.employee.period) || '—'}
        </p>
      </header>

      {/* Employee details */}
      <section className="py-5 border-b border-neutral-200">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
          {detail('Name', data.employee.name)}
          {detail('Designation', data.employee.designation)}
          {detail('Employee ID', data.employee.employeeId)}
          {detail('PAN / UAN', data.employee.panOrUan)}
          {detail('Days paid', String(data.employee.daysPaid || ''))}
          {detail('Slip no.', data.meta.number)}
        </dl>
      </section>

      {/* Earnings and deductions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6">
        <PayColumn
          heading="Earnings"
          rows={data.earnings}
          total={totals.gross}
          totalLabel="Gross earnings"
        />
        <PayColumn
          heading="Deductions"
          rows={data.deductions}
          total={totals.deductions}
          totalLabel="Total deductions"
        />
      </section>

      {/* Net pay */}
      <section className="border-t-2 border-neutral-900 pt-4 break-inside-avoid">
        <div className="flex justify-between items-baseline">
          <span className="text-[13px] font-black uppercase">Net pay</span>
          <span className="font-mono text-xl font-bold">
            ₹{formatAmount(totals.net)}
          </span>
        </div>
        <p className="mt-1.5 text-[10px] text-neutral-500 italic">
          {amountInWords(totals.net)}
        </p>
      </section>

      {data.meta.notes && (
        <p className="mt-5 text-[11px] text-neutral-600 whitespace-pre-line leading-relaxed">
          {data.meta.notes}
        </p>
      )}

      <footer className="mt-8 pt-5 border-t border-neutral-200 text-center break-inside-avoid">
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          This is a computer-generated salary slip and does not require a
          signature.
        </p>
        <p className="text-[9px] text-neutral-300 mt-1.5">
          Made with LaunchGrid · launchgrid.in
        </p>
      </footer>
    </article>
  );
}
