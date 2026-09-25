/**
 * The letter renderer: letterhead, addressee, subject, prose, signature block.
 *
 * Pure presentation. The substitution happens in lib/documents/letters.ts, so
 * what is on screen and what prints are the same string.
 */

import { DOCUMENT_KINDS } from '@/lib/documents/kinds';
import { renderLetter, type LetterKind } from '@/lib/documents/letters';
import { stateName } from '@/lib/documents/states';
import type { DocumentData } from '@/lib/documents/types';

function formatDate(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function LetterPaper({ data }: { data: DocumentData }) {
  const config = DOCUMENT_KINDS[data.kind];
  const letter = renderLetter(data.kind as LetterKind, {
    values: data.letterValues,
    businessName: data.business.name,
    partyName: data.party.name,
  });

  const businessLocality = [
    data.business.addressLine,
    data.business.city,
    stateName(data.business.state),
    data.business.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  const partyLocality = [
    data.party.addressLine,
    data.party.city,
    stateName(data.party.state),
    data.party.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article
      id="document-paper"
      className="bg-white text-neutral-900 border border-[var(--color-mark-default)] rounded-[1.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgba(26,26,24,0.04)] print:border-0 print:rounded-none print:shadow-none print:p-0"
    >
      {/* Letterhead */}
      <header className="text-center pb-5 border-b-2 border-neutral-900">
        <h2 className="font-playfair text-2xl font-extrabold tracking-tight break-words">
          {data.business.name || (
            <span className="text-neutral-300">Your business name</span>
          )}
        </h2>
        {businessLocality && (
          <p className="mt-1 text-[11px] text-neutral-600">{businessLocality}</p>
        )}
        <p className="mt-0.5 text-[11px] text-neutral-600">
          {[data.business.phone, data.business.email].filter(Boolean).join(' · ')}
        </p>
      </header>

      {/* Reference and date */}
      <div className="flex justify-between items-start gap-4 pt-6 text-[11px]">
        <span className="font-mono font-semibold">
          {data.meta.number ? `Ref: ${data.meta.number}` : ''}
        </span>
        <span className="font-semibold">{formatDate(data.meta.date)}</span>
      </div>

      {/* Addressee */}
      <div className="mt-6 text-[11px] leading-relaxed">
        <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
          {config.partyLabel}
        </p>
        <p className="font-bold text-[13px] text-neutral-900">
          {data.party.name || <span className="text-neutral-300">Recipient name</span>}
        </p>
        {partyLocality && <p className="text-neutral-700">{partyLocality}</p>}
      </div>

      {/* Subject */}
      <p className="mt-6 text-[12px] font-bold text-neutral-900">
        Subject: {letter.subject}
      </p>

      {/* Body */}
      <div className="mt-5 space-y-3.5 text-[12px] leading-[1.9] text-neutral-800">
        <p>{letter.salutation}</p>
        {letter.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-justify">
            {paragraph}
          </p>
        ))}
        {letter.closing && <p>{letter.closing}</p>}
      </div>

      {data.meta.notes && (
        <p className="mt-5 text-[11px] leading-relaxed text-neutral-700 whitespace-pre-line">
          {data.meta.notes}
        </p>
      )}

      {/* Signature block — kept whole across a page break */}
      <div className="mt-12 break-inside-avoid">
        <p className="text-[12px] text-neutral-800">Yours sincerely,</p>
        <div className="mt-10">
          <p className="text-[12px] font-bold text-neutral-900 border-t border-neutral-400 pt-1.5 inline-block min-w-52">
            {data.meta.signatoryName || (
              <span className="text-neutral-300">Signatory name</span>
            )}
          </p>
          {data.meta.signatoryTitle && (
            <p className="text-[11px] text-neutral-600">{data.meta.signatoryTitle}</p>
          )}
          <p className="text-[11px] text-neutral-600">{data.business.name}</p>
          {data.meta.place && (
            <p className="mt-2 text-[11px] text-neutral-500">Place: {data.meta.place}</p>
          )}
        </div>
      </div>

      <footer className="mt-10 pt-4 border-t border-neutral-200 text-center break-inside-avoid">
        <p className="text-[9px] text-neutral-300">
          Made with LaunchGrid · launchgrid.in
        </p>
      </footer>
    </article>
  );
}
