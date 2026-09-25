'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  Lock,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { parseCsv, type ParsedCsv } from '@/lib/reconcile/csv';
import {
  ROLE_SPECS,
  guessMapping,
  hasAnyFeeColumn,
  missingRequiredRoles,
  type ColumnMapping,
} from '@/lib/reconcile/columns';
import { FINDING_LABELS, reconcile, type Finding } from '@/lib/reconcile/checks';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  detectCurrency,
  detectDecimalConvention,
  formatCount,
  formatMoney,
  getCurrency,
  type DecimalConvention,
} from '@/lib/reconcile/currency';
import { SAMPLE_CSV, SAMPLE_FILENAME } from '@/lib/reconcile/sample';

/**
 * THE FILE NEVER LEAVES THE BROWSER.
 *
 * FileReader reads it, everything below runs on the visitor's device, and no
 * network call carries any of it. That is a privacy claim we make on the page,
 * so it has to stay literally true — nothing in this component may ever POST
 * the parsed rows anywhere, including for analytics.
 *
 * It is also why this tool is free to operate at any traffic level: the page is
 * static, and the CPU is the visitor's.
 */

/** Files above this are refused rather than freezing the tab. */
const MAX_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 50_000;

const SEVERITY_STYLES: Record<Finding['severity'], string> = {
  high: 'bg-[var(--color-mark-red)]/10 text-[var(--color-mark-red)]',
  medium: 'bg-[var(--color-mark-amber)]/10 text-[var(--color-mark-amber)]',
  low: 'bg-[var(--color-mark-subtle)] text-[var(--color-mark-subtle-text)]',
};

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function ReconcileWorkspace() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY.code);
  const [decimals, setDecimals] = useState<DecimalConvention>('dot');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadText = (text: string, name: string) => {
    const result = parseCsv(text);

    if (result.headers.length === 0 || result.rows.length === 0) {
      setError('That file has no rows this tool can read. Is it a CSV export?');
      return;
    }
    if (result.rows.length > MAX_ROWS) {
      setError(
        `That file has ${result.rows.length.toLocaleString()} rows. This tool handles up to ${MAX_ROWS.toLocaleString()} at a time — split it by month and run it again.`
      );
      return;
    }

    setError(null);
    setParsed(result);
    setMapping(guessMapping(result.headers));
    // Both are guesses from the file, and both are shown and overridable —
    // reading a European file with the English decimal convention would
    // corrupt every amount while still looking plausible.
    setCurrencyCode(detectCurrency(result.headers, result.rows) ?? DEFAULT_CURRENCY.code);
    setDecimals(detectDecimalConvention(result.rows));
    setFileName(name);
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      setError('That file is over 12 MB. Split it by month and try again.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('That file could not be read.');
    reader.onload = () => loadText(String(reader.result ?? ''), file.name);
    reader.readAsText(file);
  };

  const reset = () => {
    setParsed(null);
    setMapping({});
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const missing = useMemo(() => missingRequiredRoles(mapping), [mapping]);
  const ready = parsed !== null && missing.length === 0;

  const currency = useMemo(() => getCurrency(currencyCode), [currencyCode]);

  const result = useMemo(
    () =>
      ready && parsed
        ? reconcile(parsed.rows, mapping, { convention: decimals })
        : null,
    [ready, parsed, mapping, decimals]
  );

  const downloadFindings = () => {
    if (!result) return;
    const header = ['Row', 'Order ID', 'Date', 'Issue', `Amount to check (${currency.code})`, 'Detail'];
    const lines = [
      header.join(','),
      ...result.findings.map((finding) =>
        [
          String(finding.rowNumber),
          finding.orderId,
          finding.date,
          FINDING_LABELS[finding.type],
          finding.amountAtStake ? (finding.amountAtStake / 100).toFixed(2) : '',
          finding.detail,
        ]
          .map(csvEscape)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'settlement-findings.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // ── Upload state ────────────────────────────────────────────────────────
  if (!parsed) {
    return (
      <div className="max-w-2xl">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`rounded-[1.5rem] border-2 border-dashed p-10 text-center transition-colors ${
            dragging
              ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-subtle)]'
              : 'border-[var(--color-mark-default)] bg-white'
          }`}
        >
          <FileSpreadsheet
            className="w-8 h-8 mx-auto text-[var(--color-mark-subtle-text)]"
            aria-hidden="true"
          />
          <h2 className="mt-4 font-playfair text-xl font-bold text-[var(--color-mark-ink)]">
            Drop your payout CSV here
          </h2>
          <p className="mt-2 text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-md mx-auto">
            The settlement or payout report from Shopify, Amazon, Etsy, eBay,
            Stripe, PayPal, Meesho or Flipkart. Any CSV with an order ID, a sale
            amount and a settled amount will work.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-black transition-colors"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" /> Choose file
            </button>
            <button
              type="button"
              onClick={() => loadText(SAMPLE_CSV, SAMPLE_FILENAME)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-mark-default)] px-5 py-2.5 text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Try a sample file
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 text-xs font-semibold text-[var(--color-mark-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
            {error}
          </p>
        )}

        <p className="mt-5 flex items-start gap-2 text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          Your file is read and checked inside this browser. It is never uploaded,
          never stored, and never seen by us — you can disconnect from the
          internet after this page loads and the tool still works.
        </p>
      </div>
    );
  }

  // ── Mapping + results ───────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.25rem] p-4">
        <p className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
          {fileName}{' '}
          <span className="font-normal text-[var(--color-mark-subtle-text)]">
            · {formatCount(parsed.rows.length, currency)} rows
            {fileName === SAMPLE_FILENAME && ' · sample data, not your account'}
          </span>
        </p>
        <div className="flex items-center gap-2">
          {result && result.findings.length > 0 && (
            <button
              type="button"
              onClick={downloadFindings}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-mark-default)] px-4 py-2 text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download
              findings
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-mark-default)] px-4 py-2 text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> New file
          </button>
        </div>
      </div>

      {/* Column mapping — always visible, never silent */}
      <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
        <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)]">
          Check the columns
        </h2>
        <p className="mt-1.5 mb-5 text-[11px] text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
          Every marketplace names these differently, so these are guesses from
          your header row. Correct anything that looks wrong — the findings are
          only as good as this mapping.
        </p>

        {/* Currency and decimal convention — guessed, always shown. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-[var(--color-mark-default)]">
          <label className="block">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
              Currency
            </span>
            <select
              className="w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]"
              value={currencyCode}
              onChange={(event) => setCurrencyCode(event.target.value)}
            >
              {CURRENCIES.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.code} — {entry.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
              Display only. It does not change any of the checks.
            </span>
          </label>

          <label className="block">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
              Number format
            </span>
            <select
              className="w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]"
              value={decimals}
              onChange={(event) => setDecimals(event.target.value as DecimalConvention)}
            >
              <option value="dot">1,234.56 — dot decimal</option>
              <option value="comma">1.234,56 — comma decimal</option>
            </select>
            <span className="mt-1 block text-[10px] text-[var(--color-mark-amber)] font-semibold leading-relaxed">
              Check this against your file. The wrong choice misreads every
              amount while still looking plausible.
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_SPECS.map((spec) => (
            <label key={spec.role} className="block">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
                {spec.label}
                {spec.required && (
                  <span className="text-[var(--color-mark-red)]"> *</span>
                )}
              </span>
              <select
                className="w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]"
                value={mapping[spec.role] ?? ''}
                onChange={(event) =>
                  setMapping((current) => ({
                    ...current,
                    [spec.role]:
                      event.target.value === '' ? undefined : Number(event.target.value),
                  }))
                }
              >
                <option value="">Not in this file</option>
                {parsed.headers.map((header, index) => (
                  <option key={`${header}-${index}`} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                {spec.help}
              </span>
            </label>
          ))}
        </div>

        {missing.length > 0 && (
          <p className="mt-5 flex items-start gap-2 text-xs font-semibold text-[var(--color-mark-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
            Pick a column for: {missing.map((spec) => spec.label).join(', ')}.
          </p>
        )}

        {missing.length === 0 && !hasAnyFeeColumn(mapping) && (
          <p className="mt-5 flex items-start gap-2 text-xs font-semibold text-[var(--color-mark-amber)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
            No fee column is mapped, so the strongest check — whether each row
            adds up — cannot run.
          </p>
        )}
      </section>

      {result && (
        <>
          {/* Headline */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--color-mark-ink)] text-white rounded-[1.5rem] p-6 sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/60 mb-2">
                Worth checking
              </p>
              <p className="font-playfair text-4xl font-bold tabular-nums">
                {formatMoney(result.totalAtStake, currency)}
              </p>
              <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                across {result.findings.length}{' '}
                {result.findings.length === 1 ? 'finding' : 'findings'} in{' '}
                {formatCount(result.rowsAnalysed, currency)} rows. This is what
                looks wrong in the file — not a confirmed shortfall. Raise these
                with the marketplace and check them against your own records.
              </p>
            </div>

            <dl className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] divide-y divide-[var(--color-mark-default)]">
              <div className="p-4 flex items-baseline justify-between gap-3">
                <dt className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
                  Rows that add up
                </dt>
                <dd className="text-sm font-bold tabular-nums text-[var(--color-mark-ink)]">
                  {formatCount(result.reconciledRows, currency)}
                </dd>
              </div>
              <div className="p-4 flex items-baseline justify-between gap-3">
                <dt className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
                  Your median commission
                </dt>
                <dd className="text-sm font-bold tabular-nums text-[var(--color-mark-ink)]">
                  {result.medianCommissionPct === null
                    ? '—'
                    : `${result.medianCommissionPct.toFixed(1)}%`}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
                  Fees read as
                </dt>
                <dd className="mt-0.5 text-[11px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                  {result.convention === 'deduct'
                    ? 'positive amounts to subtract'
                    : result.convention === 'signed'
                      ? 'already-negative amounts'
                      : 'could not be determined'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Findings */}
          {result.findings.length === 0 ? (
            <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-8 text-center">
              <Check
                className="w-7 h-7 mx-auto text-[var(--color-mark-green)]"
                aria-hidden="true"
              />
              <h2 className="mt-3 font-playfair text-lg font-bold text-[var(--color-mark-ink)]">
                Nothing looks wrong in this file
              </h2>
              <p className="mt-2 text-[11px] text-[var(--color-mark-secondary)] max-w-md mx-auto leading-relaxed">
                Every row adds up, no fee sits far outside your normal rate, and
                no order ID repeats. That does not prove the marketplace paid you
                correctly — only that this file is internally consistent.
              </p>
            </section>
          ) : (
            <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] overflow-hidden">
              <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] p-6 pb-4">
                Findings
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-[var(--color-mark-default)] bg-[var(--color-mark-subtle)] text-[9px] font-black uppercase tracking-widest text-[var(--color-mark-subtle-text)]">
                      <th className="px-6 py-2.5">Order</th>
                      <th className="px-3 py-2.5">Issue</th>
                      <th className="px-3 py-2.5 text-right">To check</th>
                      <th className="px-6 py-2.5">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.findings.map((finding) => (
                      <tr
                        key={finding.id}
                        className="border-b border-[var(--color-mark-default)] last:border-0 align-top"
                      >
                        <td className="px-6 py-3">
                          <span className="block text-[11px] font-mono font-bold text-[var(--color-mark-ink)] break-all">
                            {finding.orderId || '—'}
                          </span>
                          <span className="block text-[10px] text-[var(--color-mark-subtle-text)]">
                            Row {finding.rowNumber}
                            {finding.date ? ` · ${finding.date}` : ''}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SEVERITY_STYLES[finding.severity]}`}
                          >
                            {FINDING_LABELS[finding.type]}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-[11px] font-mono font-bold text-[var(--color-mark-ink)] whitespace-nowrap">
                          {finding.amountAtStake
                            ? formatMoney(finding.amountAtStake, currency)
                            : '—'}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
                          {finding.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* What could not be checked */}
          {result.skippedChecks.length > 0 && (
            <section className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-6">
              <h2 className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-3">
                What could not be checked
              </h2>
              <ul className="space-y-2">
                {result.skippedChecks.map((skipped) => (
                  <li
                    key={skipped.name}
                    className="text-[11px] text-[var(--color-mark-secondary)] leading-relaxed"
                  >
                    <span className="font-bold text-[var(--color-mark-ink)]">
                      {skipped.name}:
                    </span>{' '}
                    {skipped.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
