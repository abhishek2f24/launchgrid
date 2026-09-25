'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FileText, Printer, RotateCcw, Save } from 'lucide-react';
import { DocumentEditor } from './DocumentEditor';
import { DocumentPaper } from './DocumentPaper';
import { LetterEditor } from './LetterEditor';
import { LetterPaper } from './LetterPaper';
import { PayslipEditor } from './PayslipEditor';
import { PayslipPaper } from './PayslipPaper';
import { DOCUMENT_KINDS, documentSlug } from '@/lib/documents/kinds';
import { emptyDocument } from '@/lib/documents/defaults';
import { computePayslip, computeTotals } from '@/lib/documents/totals';
import { formatAmount } from '@/lib/documents/money';
import {
  loadBusinessProfile,
  saveBusinessProfile,
  stashHandoff,
  takeHandoff,
} from '@/lib/documents/storage';
import type { DocumentData, DocumentKind } from '@/lib/documents/types';

/**
 * THE PDF PIPELINE IS THE BROWSER'S PRINT DIALOG.
 *
 * No PDF library is bundled. `window.print()` against print-scoped CSS gives
 * correct Devanagari and Tamil glyph rendering, selectable text, real A4
 * pagination and a "Save as PDF" destination on every current browser — for
 * zero kilobytes of JavaScript and zero server cost. A client-side renderer
 * would add a few hundred KB to a page whose whole promise is that it loads
 * instantly, and a server-side one would put CPU on the free tier, which is the
 * cost profile we specifically set out to avoid.
 *
 * The trade-off is real and accepted: the visitor passes through the browser's
 * print dialog rather than getting a direct file download, and page margins are
 * theirs to control. Revisit if that friction shows up in drop-off.
 */
const PRINT_STYLES = `
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #ffffff !important; }
  /* Hide the app chrome without unmounting it: visibility rather than display
     keeps the paper's layout intact, which display:none on ancestors would
     collapse. */
  body * { visibility: hidden !important; }
  #document-paper, #document-paper * { visibility: visible !important; }
  #document-paper {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
  }
}
`;

/**
 * Kinds that can become an invoice once the customer says yes. Vouchers,
 * letters and payslips have no such path, so they do not offer one.
 */
const CONVERTS_TO_INVOICE: DocumentKind[] = [
  'quotation',
  'estimate',
  'proforma-invoice',
];

function actionClass(variant: 'primary' | 'ghost') {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold transition-colors disabled:opacity-50';
  return variant === 'primary'
    ? `${base} bg-[var(--color-mark-ink)] text-white hover:bg-black`
    : `${base} border border-[var(--color-mark-default)] text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] hover:border-[var(--color-mark-strong)]`;
}

export function DocumentWorkspace({ kind }: { kind: DocumentKind }) {
  const config = DOCUMENT_KINDS[kind];
  const router = useRouter();

  const [data, setData] = useState<DocumentData>(() => emptyDocument(kind));
  const [savedProfile, setSavedProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore on mount only.
  //
  // Browser storage is an external system that does not exist during server
  // render, so seeding `data` from it in the state initialiser would make the
  // client's first render disagree with the server's HTML and break hydration.
  // Reading it after mount and writing the result into state is the correct
  // sequence here; the set-state-in-effect rule is disabled for exactly that
  // reason, and the effect runs once per `kind`, so there is no render cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const handoff = takeHandoff();
    if (handoff) {
      // A converted document keeps the parties and the items, but must not
      // inherit the source document's number, dates or terms — an invoice
      // numbered QTN-2026-001 is worse than no help at all.
      const fresh = emptyDocument(kind);
      setData({
        ...fresh,
        business: handoff.business,
        party: handoff.party,
        items: handoff.items,
        gstRate: handoff.gstRate,
        taxMode: handoff.taxMode,
      });
      return;
    }

    const profile = loadBusinessProfile();
    if (profile) {
      setData((current) => ({ ...current, business: profile }));
    }
  }, [kind]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const totals = useMemo(
    () =>
      computeTotals({
        items: data.items,
        gstRate: data.gstRate,
        taxMode: data.taxMode,
        sellerState: data.business.state,
        buyerState: data.party.state,
      }),
    [data]
  );

  const payslip = useMemo(
    () => computePayslip(data.earnings, data.deductions),
    [data.earnings, data.deductions]
  );

  /** The one figure worth showing in the action bar, if there is one. */
  const headlineAmount =
    config.shape === 'tabular'
      ? totals.total
      : config.shape === 'payslip'
        ? payslip.net
        : null;

  const flash = (set: (value: boolean) => void) => {
    set(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => set(false), 2000);
  };

  const handleSaveProfile = () => {
    if (saveBusinessProfile(data.business)) flash(setSavedProfile);
  };

  const handleReset = () => setData(emptyDocument(kind));

  const handleConvertToInvoice = () => {
    if (stashHandoff(data)) router.push(`/tools/${documentSlug('invoice')}`);
  };

  /**
   * A text summary for WhatsApp. Deliberately not "send the PDF on WhatsApp" —
   * a browser cannot attach the printed file to a chat, and claiming otherwise
   * would be a promise the tool breaks. This copies the details; the seller
   * attaches the PDF they just saved.
   */
  const handleCopySummary = async () => {
    const recipient =
      config.shape === 'payslip' ? data.employee.name : data.party.name;

    const lines = [
      `${config.title} ${data.meta.number}`,
      data.business.name && `From: ${data.business.name}`,
      recipient && `To: ${recipient}`,
      headlineAmount !== null && `Amount: ₹${formatAmount(headlineAmount)}`,
      config.secondDateLabel &&
        data.meta.dueDate &&
        `${config.secondDateLabel}: ${data.meta.dueDate}`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      flash(setCopied);
    } catch {
      // Clipboard access can be refused; the details are on screen either way.
    }
  };

  const profileSlot = (
    <button
      type="button"
      onClick={handleSaveProfile}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
    >
      {savedProfile ? (
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Save className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      {savedProfile ? 'Saved to this browser' : 'Save for next time'}
    </button>
  );

  const editor =
    config.shape === 'letter' ? (
      <LetterEditor data={data} onChange={setData} profileSlot={profileSlot} />
    ) : config.shape === 'payslip' ? (
      <PayslipEditor data={data} onChange={setData} profileSlot={profileSlot} />
    ) : (
      <DocumentEditor data={data} onChange={setData} profileSlot={profileSlot} />
    );

  const paper =
    config.shape === 'letter' ? (
      <LetterPaper data={data} />
    ) : config.shape === 'payslip' ? (
      <PayslipPaper data={data} />
    ) : (
      <DocumentPaper data={data} totals={totals} />
    );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.25rem] p-4">
        {headlineAmount !== null ? (
          <p className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
            {config.shape === 'payslip' ? 'Net pay' : 'Total'}{' '}
            <span className="font-mono text-sm text-[var(--color-mark-ink)]">
              ₹{formatAmount(headlineAmount)}
            </span>
          </p>
        ) : (
          <p className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
            {config.title}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleReset} className={actionClass('ghost')}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Start over
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className={actionClass('ghost')}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy summary'}
          </button>

          {CONVERTS_TO_INVOICE.includes(kind) && (
            <button
              type="button"
              onClick={handleConvertToInvoice}
              className={actionClass('ghost')}
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Convert to
              invoice
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className={actionClass('primary')}
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-start">
        {editor}

        {/* Live paper. Sticky on wide screens so edits are visible as they are made. */}
        <div className="lg:sticky lg:top-24">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-3">
            Preview
          </p>
          {paper}
        </div>
      </div>
    </>
  );
}
