/**
 * The printed document.
 *
 * Pure presentation: it takes data and computed totals and renders paper. It
 * holds no state and does no arithmetic, so what appears on screen and what
 * comes out of the print dialog cannot diverge.
 *
 * Every `print:` utility here exists because the browser print dialog is the
 * PDF pipeline — see the note in DocumentWorkspace.
 */

import { DOCUMENT_KINDS } from '@/lib/documents/kinds';
import { amountInWords, formatAmount } from '@/lib/documents/money';
import { lineTotal } from '@/lib/documents/totals';
import { stateName } from '@/lib/documents/states';
import type { DocumentData, DocumentTotals, Party } from '@/lib/documents/types';

function formatDate(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Address block shared by both parties. Skips lines that are empty. */
function AddressBlock({ party }: { party: Party }) {
  const locality = [party.city, stateName(party.state)].filter(Boolean).join(', ');
  const localityLine = [locality, party.pincode].filter(Boolean).join(' - ');

  return (
    <div className="space-y-0.5 text-[11px] text-neutral-700 leading-relaxed">
      {party.name ? (
        <p className="font-bold text-neutral-900 text-[13px]">{party.name}</p>
      ) : (
        <p className="font-bold text-neutral-300 text-[13px]">—</p>
      )}
      {party.addressLine && <p>{party.addressLine}</p>}
      {localityLine && <p>{localityLine}</p>}
      {party.gstin && (
        <p className="font-mono font-semibold text-neutral-600">
          GSTIN: {party.gstin.toUpperCase()}
        </p>
      )}
      {party.phone && <p>Phone: {party.phone}</p>}
      {party.email && <p>{party.email}</p>}
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? 'flex justify-between border-t border-neutral-300 pt-2.5 text-neutral-900 text-[13px] font-black uppercase'
          : 'flex justify-between text-[11px] text-neutral-600'
      }
    >
      <span>{label}</span>
      <span className={strong ? 'font-mono text-[15px]' : 'font-mono'}>
        ₹{value}
      </span>
    </div>
  );
}

export function DocumentPaper({
  data,
  totals,
}: {
  data: DocumentData;
  totals: DocumentTotals;
}) {
  const config = DOCUMENT_KINDS[data.kind];
  const halfRate = data.gstRate / 2;
  const showTax = data.taxMode !== 'none' && data.gstRate > 0;

  return (
    <article
      id="document-paper"
      className="bg-white text-neutral-900 border border-[var(--color-mark-default)] rounded-[1.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(26,26,24,0.04)] print:border-0 print:rounded-none print:shadow-none print:p-0"
    >
      {/* Header — seller on the left, document identity on the right */}
      <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-neutral-200">
        <div className="min-w-0">
          <h2 className="font-playfair text-2xl font-extrabold tracking-tight break-words">
            {data.business.name || (
              <span className="text-neutral-300">Your business name</span>
            )}
          </h2>
          <div className="mt-1.5">
            <AddressBlock party={data.business} />
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="inline-block px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest">
            {config.title}
          </span>
          <dl className="mt-3 space-y-1 text-[11px]">
            <div className="flex sm:justify-end gap-2">
              <dt className="text-neutral-500">No.</dt>
              <dd className="font-mono font-bold">{data.meta.number || '—'}</dd>
            </div>
            <div className="flex sm:justify-end gap-2">
              <dt className="text-neutral-500">{config.dateLabel}</dt>
              <dd className="font-semibold">{formatDate(data.meta.date) || '—'}</dd>
            </div>
            {config.secondDateLabel && data.meta.dueDate && (
              <div className="flex sm:justify-end gap-2">
                <dt className="text-neutral-500">{config.secondDateLabel}</dt>
                <dd className="font-semibold">{formatDate(data.meta.dueDate)}</dd>
              </div>
            )}
            {config.referenceLabel && data.meta.reference && (
              <div className="flex sm:justify-end gap-2">
                <dt className="text-neutral-500">{config.referenceLabel}</dt>
                <dd className="font-mono font-semibold">{data.meta.reference}</dd>
              </div>
            )}
            {config.showPaymentMode && data.meta.paymentMode && (
              <div className="flex sm:justify-end gap-2">
                <dt className="text-neutral-500">Paid by</dt>
                <dd className="font-semibold">{data.meta.paymentMode}</dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      {/* Counterparty */}
      <section className="py-6 border-b border-neutral-200">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">
          {config.partyLabel}
        </h3>
        <AddressBlock party={data.party} />
        {totals.isInterState && (
          <p className="mt-2 text-[10px] font-semibold text-neutral-500">
            Place of supply: {stateName(data.party.state)} — inter-state supply,
            IGST applies.
          </p>
        )}
      </section>

      {/* Line items */}
      <section className="py-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-[9px] font-black uppercase tracking-widest text-neutral-400">
              <th className="pb-2 text-left">Description</th>
              <th className="pb-2 text-left w-20">HSN/SAC</th>
              <th className="pb-2 text-right w-14">Qty</th>
              <th className="pb-2 text-right w-24">Rate</th>
              <th className="pb-2 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-neutral-100 last:border-0 text-[11px] align-top break-inside-avoid"
              >
                <td className="py-3 pr-3">
                  <span className="font-semibold text-neutral-900">
                    {item.description || (
                      <span className="text-neutral-300">Item description</span>
                    )}
                  </span>
                </td>
                <td className="py-3 pr-3 font-mono text-neutral-500">
                  {item.hsn || '—'}
                </td>
                <td className="py-3 text-right font-mono">{item.quantity}</td>
                <td className="py-3 text-right font-mono">
                  {formatAmount(Math.round(item.unitPrice * 100))}
                </td>
                <td className="py-3 text-right font-mono font-bold">
                  {formatAmount(lineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="flex justify-end border-t border-neutral-200 pt-5 break-inside-avoid">
        <div className="w-full sm:w-72 space-y-2">
          <TotalRow label="Taxable value" value={formatAmount(totals.taxable)} />

          {showTax &&
            (totals.isInterState ? (
              <TotalRow
                label={`IGST (${data.gstRate}%)`}
                value={formatAmount(totals.igst)}
              />
            ) : (
              <>
                <TotalRow
                  label={`CGST (${halfRate}%)`}
                  value={formatAmount(totals.cgst)}
                />
                <TotalRow
                  label={`SGST (${halfRate}%)`}
                  value={formatAmount(totals.sgst)}
                />
              </>
            ))}

          {totals.roundOff !== 0 && (
            <TotalRow label="Rounding" value={formatAmount(totals.roundOff)} />
          )}

          <TotalRow label="Total" value={formatAmount(totals.total)} strong />
        </div>
      </section>

      <p className="mt-4 text-[10px] text-neutral-500 italic break-inside-avoid">
        {amountInWords(totals.total)}
      </p>

      {!showTax && (
        <p className="mt-2 text-[10px] font-semibold text-neutral-500">
          GST not charged on this {data.kind}.
        </p>
      )}

      {/* Notes and terms */}
      {(data.meta.notes || data.meta.terms) && (
        <section className="mt-6 pt-5 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-5 break-inside-avoid">
          {data.meta.notes && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                Notes
              </h3>
              <p className="text-[11px] text-neutral-600 whitespace-pre-line leading-relaxed">
                {data.meta.notes}
              </p>
            </div>
          )}
          {data.meta.terms && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                Terms
              </h3>
              <p className="text-[11px] text-neutral-600 whitespace-pre-line leading-relaxed">
                {data.meta.terms}
              </p>
            </div>
          )}
        </section>
      )}

      <footer className="mt-8 pt-5 border-t border-neutral-200 text-center break-inside-avoid">
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          {config.footerNote}
        </p>
        <p className="text-[9px] text-neutral-300 mt-1.5">
          Made with LaunchGrid · launchgrid.in
        </p>
      </footer>
    </article>
  );
}
