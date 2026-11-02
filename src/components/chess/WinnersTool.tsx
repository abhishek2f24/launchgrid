'use client';

/**
 * Prize distribution, from the files an organiser already has.
 *
 * Everything runs in the browser: the tournament file is read, the prizes are
 * worked out and the result is written back out without anything being
 * uploaded. The two heavy spreadsheet libraries are dynamically imported
 * inside `src/lib/chess/`, so this page stays light until a file is dropped.
 *
 * The flow is deliberately two steps — drop the exports, check the amounts —
 * because that is all an organiser has: chess-results already decided who is
 * in which category, and the only thing it does not know is the money.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Printer,
  RotateCcw,
  Trophy,
} from 'lucide-react';

import {
  type Category,
  type CategoryAmounts,
  allocate,
  isCash,
  parseAmounts,
} from '@/lib/chess/allocate';
import { type ImportResult, importFiles } from '@/lib/chess/importFiles';
import { legacySections } from '@/lib/chess/legacyAdapter';
import { buildSampleWorkbook } from '@/lib/chess/sampleWorkbook';
import {
  MODE_1,
  MODE_2,
  type Mode,
  distribute,
  readCategories,
  readPlayers,
  readTitle,
  winnersByCategory,
} from '@/lib/chess/winners';
import { type PrizeSection, buildWinnerWorkbook, outputFileName } from '@/lib/chess/workbook';

import { PrizeList, RankingTable, money } from './PrizeList';

const KIND_LABELS: Record<string, string> = {
  'category-prizes': 'Category prizes',
  ranking: 'Ranking list',
  'prize-money': 'Prize list',
  'chesswinners-workbook': 'ChessWinners workbook',
  unknown: 'Not recognised',
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
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [amountsText, setAmountsText] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>(MODE_1);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [error, setError] = useState<{ headline: string; detail: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await importFiles(
        await Promise.all(
          files.map(async (file) => ({ name: file.name, data: await file.arrayBuffer() })),
        ),
      );
      setImported(result);
      setAmountsText(
        Object.fromEntries(
          result.amounts.map((entry) => [entry.categoryId, entry.amounts.join(', ')]),
        ),
      );
    } catch (e) {
      setImported(null);
      setError({
        headline: 'That file could not be read.',
        detail: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = () => {
    setImported(null);
    setAmountsText({});
    setError(null);
    setShowRanking(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Results follow the amounts as they are typed: an organiser adjusting a
  // prize wants to see who it moves to, not to press a button each time.
  const result = useMemo(() => {
    if (!imported) return null;

    if (imported.legacy) {
      try {
        const { sortRows, rankRows, titleSheet } = imported.legacy;
        const categories = readCategories(sortRows);
        const players = readPlayers(rankRows);
        const { awards } = distribute(categories, players, mode);
        const { sections } = legacySections(winnersByCategory(categories, players), awards);
        const totalCash = awards
          .filter((award) => award.winner && isCash(award.prize))
          .reduce((sum, award) => sum + Number(award.prize), 0);
        return {
          sections,
          totalCash,
          tournament: readTitle(titleSheet.name, titleSheet.rows) ?? imported.tournament,
          problem: null as string | null,
        };
      } catch (e) {
        return {
          sections: [] as PrizeSection[],
          totalCash: 0,
          tournament: imported.tournament,
          problem: e instanceof Error ? e.message : String(e),
        };
      }
    }

    const amounts: CategoryAmounts[] = imported.categories.map((category) => ({
      categoryId: category.id,
      amounts: parseAmounts(amountsText[category.id] ?? ''),
    }));
    const allocation = allocate(imported.categories, amounts);
    return {
      sections: allocation.byCategory.map<PrizeSection>((entry) => ({
        label: entry.category.label,
        awards: entry.awards,
      })),
      totalCash: allocation.totalCash,
      tournament: imported.tournament,
      problem: null,
    };
  }, [imported, amountsText, mode]);

  const download = async () => {
    if (!result) return;
    const fileName = outputFileName();
    downloadBlob(
      await buildWinnerWorkbook(result.sections, result.tournament, {
        includeLegacyCredit: Boolean(imported?.legacy),
      }),
      fileName,
    );
  };

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <DropZone
          dragging={dragging}
          busy={busy}
          onDragChange={setDragging}
          onFiles={load}
          inputRef={inputRef}
          hasFiles={Boolean(imported)}
        />
      </div>

      {error ? (
        <div className="rounded-3xl border border-[#a4251f]/25 bg-[#fdf3f2] p-6 print:hidden">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#8d1f1a]">
            <AlertTriangle className="h-4 w-4" />
            {error.headline}
          </h2>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-[12px] text-[#5c564d]">
            {error.detail}
          </pre>
        </div>
      ) : null}

      {imported ? (
        <div className="space-y-6 print:hidden">
          <FileChips imported={imported} onReset={reset} />
          {imported.legacy ? (
            <LegacyControls mode={mode} onMode={setMode} />
          ) : (
            <PrizeForm
              categories={imported.categories}
              amountsText={amountsText}
              onChange={(id, value) => setAmountsText((prev) => ({ ...prev, [id]: value }))}
            />
          )}
          {imported.notes.length > 0 ? <Notes notes={imported.notes} /> : null}
        </div>
      ) : null}

      {result?.problem ? (
        <div className="rounded-3xl border border-[#a4251f]/25 bg-[#fdf3f2] p-6 text-[14px] text-[#8d1f1a] print:hidden">
          {result.problem}
        </div>
      ) : null}

      {result && result.sections.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#2c6b45]/25 bg-[#f1f8f3] p-6 print:hidden">
            <div>
              <h2 className="text-[15px] font-bold text-[#1f4f33]">
                {money(String(result.totalCash))} across{' '}
                {result.sections.reduce(
                  (count, section) => count + section.awards.filter((a) => a.winner).length,
                  0,
                )}{' '}
                prizes
              </h2>
              <p className="mt-1 text-[13px] text-[#3c6b52]">
                Nobody appears twice — each player keeps the biggest prize they are in line for.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f4f33] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#19402a]"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1f4f33]/30 px-4 py-2.5 text-[14px] font-semibold text-[#1f4f33] transition-colors hover:bg-[#1f4f33]/[0.06]"
              >
                <Download className="h-4 w-4" />
                Excel
              </button>
            </div>
          </div>

          <PrizeList
            sections={result.sections}
            tournament={result.tournament}
            totalCash={result.totalCash}
          />

          {imported && imported.ranking.length > 0 ? (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[13px] font-medium text-[#5c564d] print:hidden">
                <input
                  type="checkbox"
                  checked={showRanking}
                  onChange={(event) => setShowRanking(event.target.checked)}
                  className="h-4 w-4 accent-[#23201c]"
                />
                Show and print the full ranking as well
              </label>
              {showRanking ? <RankingTable players={imported.ranking} /> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function DropZone({
  dragging,
  busy,
  onDragChange,
  onFiles,
  inputRef,
  hasFiles,
}: {
  dragging: boolean;
  busy: boolean;
  onDragChange: (value: boolean) => void;
  onFiles: (files: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  hasFiles: boolean;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragChange(true);
      }}
      onDragLeave={() => onDragChange(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDragChange(false);
        onFiles([...event.dataTransfer.files]);
      }}
      className={`rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? 'border-[#8a6f2c] bg-[#8a6f2c]/[0.06]' : 'border-[#23201c]/15 bg-white'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        multiple
        className="hidden"
        onChange={(event) => onFiles([...(event.target.files ?? [])])}
      />
      <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#8a6f2c]/12 text-[#8a6f2c]">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />}
      </span>
      <h2 className="mt-4 text-[15px] font-bold">
        {hasFiles ? 'Add or replace files' : 'Drop your chess-results exports here'}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-[#5c564d]">
        The <strong>Category prizes</strong> export says who is in each category and the{' '}
        <strong>Final ranking</strong> export fills those lists out. Add your own prize sheet
        (category and amount) and the amounts are filled in for you. .xls and .xlsx both work.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#23201c] px-4 py-2.5 text-[14px] font-semibold text-[#f7f6f3] transition-colors hover:bg-[#3a352e]"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Choose files
      </button>
      <p className="mt-3 text-[12px] text-[#8a8378]">
        Nothing is uploaded — the files are read inside your browser.{' '}
        <Link href="/chess/winners/guide" className="underline">
          Which files do I need?
        </Link>
      </p>
    </div>
  );
}

function FileChips({ imported, onReset }: { imported: ImportResult; onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {imported.files.map((file) => (
        <span
          key={file.fileName}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] ${
            file.kind === 'unknown'
              ? 'bg-[#fdf3f2] text-[#8d1f1a]'
              : 'bg-[#23201c]/[0.06] text-[#3b3730]'
          }`}
          title={file.fileName}
        >
          <strong>{KIND_LABELS[file.kind]}</strong>
          <span className="text-[#8a8378]">{file.detail}</span>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#5c564d] hover:bg-[#23201c]/[0.06]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Start over
      </button>
    </div>
  );
}

function PrizeForm({
  categories,
  amountsText,
  onChange,
}: {
  categories: Category[];
  amountsText: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="rounded-2xl bg-[#fdf9ef] p-4 text-[13px] text-[#6b5a2a]">
        No categories were found. Add the <strong>Category prizes</strong> or{' '}
        <strong>Final ranking</strong> export from chess-results.
      </p>
    );
  }

  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8">
      <h2 className="text-[15px] font-bold">Prize money</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c564d]">
        One line per category, biggest prize first: <code>4500, 3500, 2500</code>. Write{' '}
        <code>Trophy</code> for a trophy. Leave a category blank if it has no prize. The winners
        below update as you type.
      </p>
      <div className="mt-5 space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-center">
            <label htmlFor={`amounts-${category.id}`} className="text-[13px]">
              <span className="font-semibold">{category.label}</span>
              <span className="ml-2 text-[12px] text-[#8a8378]">
                {category.players.length} player{category.players.length === 1 ? '' : 's'}
              </span>
            </label>
            <input
              id={`amounts-${category.id}`}
              type="text"
              inputMode="numeric"
              value={amountsText[category.id] ?? ''}
              onChange={(event) => onChange(category.id, event.target.value)}
              placeholder="e.g. 1000, 800, 700"
              className="w-full rounded-xl border border-[#23201c]/15 bg-[#fcfbf9] px-3 py-2 text-[13px] tabular-nums outline-none transition-colors focus:border-[#8a6f2c]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Notes({ notes }: { notes: string[] }) {
  return (
    <div className="rounded-3xl border border-[#b8860b]/25 bg-[#fdf9ef] p-6">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#6b5a2a]">
        <Info className="h-4 w-4" />
        Check these before you print
      </h2>
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#6b5a2a]">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function LegacyControls({ mode, onMode }: { mode: Mode; onMode: (mode: Mode) => void }) {
  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6">
      <h2 className="text-[15px] font-bold">ChessWinners workbook mode</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c564d]">
        This workbook has <code>sort</code> and <code>Ranklist</code> sheets, so the prizes are
        worked out with the ChessWinners rules, quirks included, to match the desktop program. The
        rules are those of ChessWinners v2.0 by Zaheer Beig —{' '}
        <Link href="/chess/about" className="underline">
          licence and credit
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[MODE_1, MODE_2].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onMode(option as Mode)}
            className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors ${
              mode === option
                ? 'border-[#23201c] bg-[#23201c]/[0.05]'
                : 'border-[#23201c]/15 hover:border-[#23201c]/35'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[#8a8378]">
        Mode 1 reads rating categories as bands and age groups from the Type column. Mode 2 treats
        “under X” as anyone at or below X.{' '}
        <button
          type="button"
          onClick={async () =>
            downloadBlob(await buildSampleWorkbook(), 'ChessGrid_sample_workbook.xlsx')
          }
          className="underline"
        >
          Download a sample workbook
        </button>
        .
      </p>
    </div>
  );
}
