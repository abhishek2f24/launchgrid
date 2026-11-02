'use client';

/**
 * The prize distribution tool. Everything happens in the browser: the
 * workbook is read with ExcelJS, the winners are decided by
 * `src/lib/chess/winners.ts`, and the result is written back out as a new
 * workbook. No upload, no account, no server route — which is also why the
 * heavy spreadsheet code is dynamically imported inside the handlers.
 */

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Columns2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trophy,
  X,
} from 'lucide-react';

import {
  MODE_1,
  MODE_2,
  type Award,
  type Mode,
  type Warning,
  type WinnerSection,
  distribute,
  inputWarnings,
  readCategories,
  readPlayers,
  readTitle,
  winnersByCategory,
} from '@/lib/chess/winners';
import {
  MissingSheetError,
  type ParsedWorkbook,
  buildSampleWorkbook,
  buildWinnerWorkbook,
  outputFileName,
  parseWorkbook,
} from '@/lib/chess/workbook';
import { LICENCE_TEXT } from '@/lib/chess/licence';

import { serif } from './ChessShell';

const TERMS_KEY = 'chessgrid.winners.terms.v1';

/**
 * Whether the licence has been accepted lives in localStorage, which is an
 * external store: reading it in an effect and calling setState would cost a
 * cascading render on every visit. `useSyncExternalStore` is the sanctioned
 * way in, and it degrades to "not accepted" when storage is blocked, so a
 * private window simply asks again.
 */
const termsListeners = new Set<() => void>();

function subscribeToTerms(onChange: () => void) {
  termsListeners.add(onChange);
  return () => termsListeners.delete(onChange);
}

function readTermsAccepted(): boolean {
  try {
    return window.localStorage.getItem(TERMS_KEY) === 'yes';
  } catch {
    return false;
  }
}

function acceptTerms() {
  try {
    window.localStorage.setItem(TERMS_KEY, 'yes');
  } catch {
    /* the session still works, it just asks again next time */
  }
  termsListeners.forEach((listener) => listener());
}

const MODE_HELP: Record<Mode, string> = {
  [MODE_1]: 'Rating and age categories have a normal upper and lower bound.',
  [MODE_2]:
    'Rating and age categories keep their upper bound but the lower bound is treated as 0. ' +
    'This matches the original program’s experimental mode, so expect surprises.',
};

type Status = { tone: 'info' | 'error' | 'ok'; text: string } | null;

type Result = {
  title: string | null;
  sections: WinnerSection[];
  awards: Award[];
  warnings: Warning[];
  playerCount: number;
  fileName: string;
  blob: Blob;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function WinnersTool() {
  const accepted = useSyncExternalStore(subscribeToTerms, readTermsAccepted, () => false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>(MODE_1);
  const [modeNotice, setModeNotice] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ headline: string; detail: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [parsed, setParsed] = useState<ParsedWorkbook | null>(null);
  const [comparison, setComparison] = useState<Award[][] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setComparison(null);
    setParsed(null);
    setError(null);
  };

  const onPick = (picked: File | null) => {
    reset();
    if (!picked) {
      setFile(null);
      setStatus({ tone: 'error', text: 'Excel file selection cancelled' });
      return;
    }
    setFile(picked);
    setStatus({ tone: 'info', text: `Excel file selected: ${picked.name}` });
  };

  const generate = useCallback(async () => {
    if (!file) {
      setStatus({
        tone: 'error',
        text: 'No Excel file selected or the file does not exist, please try again.',
      });
      return;
    }
    setBusy(true);
    setError(null);
    setComparison(null);
    try {
      const workbook = parsed ?? (await parseWorkbook(await file.arrayBuffer()));
      setParsed(workbook);

      const title = readTitle(workbook.firstSheetName, workbook.firstSheetRows);
      const categories = readCategories(workbook.sortRows);
      const players = readPlayers(workbook.rankRows);
      const warnings = inputWarnings(categories, players, mode);
      const { awards } = distribute(categories, players, mode);
      const sections = winnersByCategory(categories, players);
      const fileName = outputFileName();
      const blob = await buildWinnerWorkbook(sections, title);

      setResult({
        title,
        sections,
        awards,
        warnings,
        playerCount: players.length,
        fileName,
        blob,
      });
      setStatus({ tone: 'ok', text: `${fileName} generated` });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setResult(null);
      setStatus(null);
      setError({
        headline:
          e instanceof MissingSheetError
            ? message
            : 'The file could not be processed. The details below say why.',
        detail: message,
      });
    } finally {
      setBusy(false);
    }
  }, [file, mode, parsed]);

  const compare = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const workbook = parsed ?? (await parseWorkbook(await file.arrayBuffer()));
      setParsed(workbook);
      const both = [MODE_1, MODE_2].map((m) => {
        const categories = readCategories(workbook.sortRows);
        return distribute(categories, readPlayers(workbook.rankRows), m as Mode).awards;
      });
      setComparison(both);
    } catch (e) {
      setError({
        headline: 'The two modes could not be compared.',
        detail: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }, [file, parsed]);

  const sample = async () => {
    downloadBlob(await buildSampleWorkbook(), 'ChessGrid_sample_tournament.xlsx');
  };

  if (!accepted) return <Terms onAccept={acceptTerms} />;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 shadow-[0_10px_40px_rgba(35,32,28,0.06)] md:p-8">
        <Step n={1} title="Choose the tournament workbook">
          <p className="mb-4 text-[14px] leading-relaxed text-[#5c564d]">
            One .xlsx file with a <code className="rounded bg-[#23201c]/5 px-1.5 py-0.5">sort</code>{' '}
            sheet of prizes and a{' '}
            <code className="rounded bg-[#23201c]/5 px-1.5 py-0.5">Ranklist</code> sheet of final
            standings. <Link href="/chess/winners/guide" className="underline">Read the format</Link>{' '}
            or{' '}
            <button type="button" onClick={sample} className="underline">
              download a sample workbook
            </button>
            .
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(event) => onPick(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#23201c] px-4 py-2.5 text-[14px] font-semibold text-[#f7f6f3] transition-colors hover:bg-[#3a352e]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {file ? 'Choose a different file' : 'Select a file to process…'}
            </button>
            {file ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5c564d]">
                {file.name}
                <button
                  type="button"
                  aria-label="Clear the selected file"
                  onClick={() => {
                    if (inputRef.current) inputRef.current.value = '';
                    onPick(null);
                  }}
                  className="rounded-full p-0.5 hover:bg-[#23201c]/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : null}
          </div>
        </Step>

        <Step n={2} title="Pick how categories are read">
          <div className="grid gap-3 md:grid-cols-2">
            {[MODE_1, MODE_2].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option as Mode);
                  setModeNotice(option === MODE_2);
                  setResult(null);
                  setComparison(null);
                }}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  mode === option
                    ? 'border-[#23201c] bg-[#23201c]/[0.04]'
                    : 'border-[#23201c]/12 hover:border-[#23201c]/30'
                }`}
              >
                <span className="flex items-center gap-2 text-[14px] font-semibold">
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${
                      mode === option ? 'border-[5px] border-[#23201c]' : 'border-[#23201c]/30'
                    }`}
                  />
                  {option}
                  {option === MODE_1 ? (
                    <span className="rounded-full bg-[#23201c]/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5c564d]">
                      default
                    </span>
                  ) : null}
                </span>
                <span className="mt-2 block text-[13px] leading-relaxed text-[#5c564d]">
                  {MODE_HELP[option as Mode]}
                </span>
              </button>
            ))}
          </div>
          {modeNotice ? (
            <p className="mt-3 flex gap-2 rounded-xl bg-[#fdf6e3] p-3 text-[13px] leading-relaxed text-[#6b5a2a]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                In Mode 2 an age category without a capital U (M12, f09) matches girls only, by age.
                It is kept because the original program behaves this way — use U-names for open age
                prizes.
              </span>
            </p>
          ) : null}
        </Step>

        <Step n={3} title="Generate the winners list" last>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8a6f2c] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#765d22] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
              Generate winners list
            </button>
            {file ? (
              <button
                type="button"
                onClick={compare}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-[#23201c]/15 px-4 py-2.5 text-[14px] font-semibold text-[#23201c] transition-colors hover:bg-[#23201c]/[0.05] disabled:opacity-60"
              >
                <Columns2 className="h-4 w-4" />
                Compare both modes
              </button>
            ) : null}
          </div>
          {status ? (
            <p
              className={`mt-4 text-[14px] font-medium ${
                status.tone === 'error'
                  ? 'text-[#a4251f]'
                  : status.tone === 'ok'
                    ? 'text-[#2c6b45]'
                    : 'text-[#2b3f6b]'
              }`}
            >
              {status.tone === 'ok' ? (
                <CheckCircle2 className="mr-1.5 inline h-4 w-4 align-[-3px]" />
              ) : null}
              {status.text}
            </p>
          ) : null}
        </Step>
      </div>

      {error ? <ErrorPanel headline={error.headline} detail={error.detail} /> : null}
      {result ? <Results result={result} onDownload={() => downloadBlob(result.blob, result.fileName)} /> : null}
      {comparison ? <Comparison awards={comparison} /> : null}
    </div>
  );
}

function Step({
  n,
  title,
  children,
  last,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? '' : 'mb-8 border-b border-[#23201c]/8 pb-8'}>
      <h2 className="mb-3 flex items-center gap-2.5 text-[15px] font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#23201c] text-[11px] font-bold text-[#f7f6f3]">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Terms({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 shadow-[0_10px_40px_rgba(35,32,28,0.06)] md:p-8">
      <h2 className={`${serif} text-2xl font-bold`}>Terms and conditions</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#5c564d]">
        This tool implements the prize rules of ChessWinners v2.0 by Zaheer Beig. Its licence
        travels with it, so please read it once before you use the tool.
      </p>
      <pre className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#f3f1ec] p-5 text-[12.5px] leading-relaxed text-[#3b3730]">
        {LICENCE_TEXT}
      </pre>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-2 rounded-xl bg-[#23201c] px-5 py-2.5 text-[14px] font-semibold text-[#f7f6f3] transition-colors hover:bg-[#3a352e]"
        >
          Accept and continue
          <ArrowRight className="h-4 w-4" />
        </button>
        <Link
          href="/chess"
          className="text-[14px] font-medium text-[#5c564d] underline hover:text-[#23201c]"
        >
          Decline — you must accept the terms to use this tool
        </Link>
      </div>
    </div>
  );
}

function ErrorPanel({ headline, detail }: { headline: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-[#a4251f]/25 bg-[#fdf3f2] p-6">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#8d1f1a]">
        <AlertTriangle className="h-4.5 w-4.5" />
        {headline}
      </h2>
      <details className="mt-3">
        <summary className="cursor-pointer text-[13px] font-medium text-[#8d1f1a]">
          Technical details
        </summary>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-xl bg-white/70 p-3 text-[12px] text-[#5c564d]">
          {detail}
        </pre>
      </details>
    </div>
  );
}

function Results({ result, onDownload }: { result: Result; onDownload: () => void }) {
  const unawarded = useMemo(
    () => result.awards.filter((a) => a.kind !== 'ignored' && !a.winner),
    [result.awards],
  );
  const awarded = result.awards.filter((a) => a.winner).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#2c6b45]/25 bg-[#f1f8f3] p-6">
        <div>
          <h2 className="text-[15px] font-bold text-[#1f4f33]">Winners list ready</h2>
          <p className="mt-1 text-[13px] text-[#3c6b52]">
            {awarded} of {result.awards.filter((a) => a.kind !== 'ignored').length} prizes awarded
            across {result.playerCount} players.
            {unawarded.length > 0
              ? ` ${unawarded.length} prize${unawarded.length > 1 ? 's' : ''} matched nobody.`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1f4f33] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#19402a]"
        >
          <Download className="h-4 w-4" />
          Download {result.fileName}
        </button>
      </div>

      {result.warnings.length > 0 ? (
        <div className="rounded-3xl border border-[#b8860b]/25 bg-[#fdf9ef] p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#6b5a2a]">
            <AlertTriangle className="h-4.5 w-4.5" />
            {result.warnings.length} thing{result.warnings.length > 1 ? 's' : ''} to check in your
            sheet
          </h2>
          <p className="mt-1.5 text-[13px] text-[#6b5a2a]/80">
            The winners above still follow the original rules exactly. These are the places where
            those rules will surprise you.
          </p>
          <ul className="mt-4 space-y-3">
            {result.warnings.map((warning) => (
              <li key={warning.title} className="text-[13px] leading-relaxed">
                <span className="font-semibold text-[#5a4a20]">{warning.title}</span>
                <span className="block text-[#6b5a2a]/90">{warning.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {unawarded.length > 0 ? (
        <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6">
          <h2 className="text-[15px] font-bold">Prizes that matched nobody</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unawarded.map((award, i) => (
              <li
                key={`${award.category}-${i}`}
                className="rounded-full bg-[#23201c]/[0.05] px-3 py-1 text-[13px]"
              >
                {award.category} · {award.prize}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8">
        {result.title ? (
          <h2 className={`${serif} mb-6 whitespace-pre-line text-center text-xl font-bold leading-snug`}>
            {result.title}
          </h2>
        ) : null}
        <div className="space-y-8">
          {result.sections.map((section) => (
            <SectionTable key={section.heading} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTable({ section }: { section: WinnerSection }) {
  return (
    <section>
      <h3 className="rounded-t-xl bg-[#23201c] px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-[#f7f6f3]">
        {section.heading}
      </h3>
      {section.winners.length === 0 ? (
        <p className="rounded-b-xl border border-t-0 border-[#23201c]/10 px-4 py-4 text-[13px] text-[#8a8378]">
          No winner in this category.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-b-xl border border-t-0 border-[#23201c]/10">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f3f1ec] text-left text-[11px] uppercase tracking-wider text-[#5c564d]">
                {['#', 'Name', 'Rank', 'Gender', 'Rating', 'Club', 'Age', 'Type', 'Points', 'Prize'].map(
                  (header) => (
                    <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {section.winners.map((player, i) => (
                <tr key={`${player.rank}-${player.name}`} className="border-t border-[#23201c]/8">
                  <td className="px-3 py-2 text-[#8a8378]">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{player.name}</td>
                  <td className="px-3 py-2">{player.rank}</td>
                  <td className="px-3 py-2">{player.gender}</td>
                  <td className="px-3 py-2">{player.rating === 0 ? 'Unrated' : player.rating}</td>
                  <td className="px-3 py-2">{player.club}</td>
                  <td className="px-3 py-2">{player.age || ''}</td>
                  <td className="px-3 py-2">{player.type}</td>
                  <td className="px-3 py-2">{player.points}</td>
                  <td className="px-3 py-2 font-semibold">{player.prizeMoney}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Comparison({ awards }: { awards: Award[][] }) {
  const [one, two] = awards;
  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8">
      <h2 className="text-[15px] font-bold">Mode 1 against Mode 2</h2>
      <p className="mt-1.5 text-[13px] text-[#5c564d]">
        Rows where the two modes disagree are marked. Neither column has been downloaded — generate
        with the mode you want.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f3f1ec] text-left text-[11px] uppercase tracking-wider text-[#5c564d]">
              {['Prize row', 'Amount', 'Mode 1', 'Mode 2'].map((header) => (
                <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {one.map((award, i) => {
              const a = award.winner?.name ?? (award.kind === 'ignored' ? 'ignored row' : 'nobody');
              const b = two[i]?.winner?.name ?? (two[i]?.kind === 'ignored' ? 'ignored row' : 'nobody');
              const differs = a !== b;
              return (
                <tr
                  key={`${award.category}-${i}`}
                  className={`border-t border-[#23201c]/8 ${differs ? 'bg-[#fdf9ef]' : ''}`}
                >
                  <td className="px-3 py-2 font-medium">{award.category}</td>
                  <td className="px-3 py-2">{award.prize}</td>
                  <td className="px-3 py-2">{a}</td>
                  <td className="px-3 py-2">
                    {b}
                    {differs ? (
                      <span className="ml-2 rounded-full bg-[#b8860b]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b5a2a]">
                        differs
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
