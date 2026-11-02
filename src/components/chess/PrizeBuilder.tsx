'use client';

/**
 * The prize list, typed on the page.
 *
 * One row per prize, in the order they will be read out: pick the category,
 * type the amount, and the next blank row appears by itself. That is the whole
 * interaction, and it replaced asking organisers to prepare a spreadsheet in a
 * vocabulary this tool could recognise — which is where it kept failing, on
 * exactly the categories every Indian tournament has: best female, Ph, unrated.
 *
 * Rating prizes get a limit box rather than their own dropdown entry, because
 * "under 1600" is only meaningful next to the other limits on the same list.
 * The band each one resolves to is shown back, so the organiser can see that
 * adding an under-1500 prize has narrowed the under-1600 prize to 1500–1599.
 */

import { Plus, X } from 'lucide-react';

import {
  type CatalogEntry,
  type CategorySpec,
  parseSpecKey,
  resolvedLabel,
  underLimits,
} from '@/lib/chess/categorySpec';
import { type PrizeRow, isComplete, newRow } from '@/lib/chess/prizePlan';

/** The dropdown value that asks for a rating limit instead of naming a category. */
const UNDER_PENDING = 'under:';

function isUnderKey(key: string): boolean {
  return key === UNDER_PENDING || key.startsWith('under:');
}

function underLimitOf(key: string): string {
  return key.startsWith('under:') ? key.slice('under:'.length) : '';
}

/**
 * Keep exactly one blank row at the end: finishing the last row is what makes
 * the next one appear, so there is never an empty form and never a stray blank
 * in the middle of the list.
 */
export function withTrailingBlank(rows: PrizeRow[]): PrizeRow[] {
  const last = rows[rows.length - 1];
  return last && !isComplete(last) ? rows : [...rows, newRow()];
}

export function PrizeBuilder({
  rows,
  catalog,
  memberCounts,
  onChange,
  playerCount,
}: {
  rows: PrizeRow[];
  catalog: CatalogEntry[];
  /**
   * How many players each chosen category holds, keyed by spec key. A rating
   * band is not in the catalog — its membership depends on the other rows — so
   * the counts are worked out with the plan and handed back here.
   */
  memberCounts: Record<string, number>;
  onChange: (rows: PrizeRow[]) => void;
  playerCount: number;
}) {
  const groups = [...new Set(catalog.map((entry) => entry.group))];
  const limits = underLimits(
    rows
      .map((row) => parseSpecKey(row.categoryKey))
      .filter((spec): spec is CategorySpec => spec !== null),
  );

  const update = (id: string, patch: Partial<PrizeRow>) => {
    onChange(
      withTrailingBlank(rows.map((row) => (row.id === id ? { ...row, ...patch } : row))),
    );
  };

  const remove = (id: string) => {
    const kept = rows.filter((row) => row.id !== id);
    onChange(withTrailingBlank(kept));
  };

  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8">
      <h2 className="text-[15px] font-bold">The prizes</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c564d]">
        One row per prize, biggest first within each category. Write an amount like{' '}
        <code>4500</code>, or the word <code>Trophy</code>. The winners below update as you type,
        and a new row appears as soon as you finish this one.
      </p>

      <div className="mt-5 space-y-2">
        <div className="hidden gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#8a8378] md:grid md:grid-cols-[minmax(0,1fr)_120px_32px]">
          <span>Category</span>
          <span>Amount</span>
          <span />
        </div>

        {rows.map((row, index) => {
          const spec = parseSpecKey(row.categoryKey);
          const band = spec?.kind === 'under' ? resolvedLabel(spec, limits) : null;
          const members = spec ? countFor(row.categoryKey, memberCounts, catalog) : null;

          return (
            <div key={row.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_32px] md:items-start">
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <select
                    aria-label={`Category for prize ${index + 1}`}
                    value={isUnderKey(row.categoryKey) ? UNDER_PENDING : row.categoryKey}
                    onChange={(event) => update(row.id, { categoryKey: event.target.value })}
                    className="w-full rounded-xl border border-[#23201c]/15 bg-[#fcfbf9] px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#8a6f2c]"
                  >
                    <option value="">Choose a category…</option>
                    {groups.map((group) => (
                      <optgroup key={group} label={group}>
                        {catalog
                          .filter((entry) => entry.group === group)
                          .map((entry) => (
                            <option key={entry.key} value={entry.key}>
                              {entry.label} ({entry.count})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                    <optgroup label="Rating prize">
                      <option value={UNDER_PENDING}>Under a rating…</option>
                    </optgroup>
                  </select>

                  {isUnderKey(row.categoryKey) ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Rating limit for prize ${index + 1}`}
                      value={underLimitOf(row.categoryKey)}
                      onChange={(event) =>
                        update(row.id, {
                          categoryKey: `under:${event.target.value.replace(/\D/g, '')}`,
                        })
                      }
                      placeholder="1600"
                      className="w-24 shrink-0 rounded-xl border border-[#23201c]/15 bg-[#fcfbf9] px-3 py-2 text-[13px] tabular-nums outline-none transition-colors focus:border-[#8a6f2c]"
                    />
                  ) : null}
                </div>

                {band ? (
                  <p className="px-1 text-[12px] text-[#8a6f2c]">
                    {band} · {members ?? 0} player{members === 1 ? '' : 's'}
                  </p>
                ) : null}
                {!band && members !== null && members === 0 ? (
                  <p className="px-1 text-[12px] text-[#a4251f]">
                    Nobody in the ranking list is in this category.
                  </p>
                ) : null}
              </div>

              <input
                type="text"
                inputMode="numeric"
                aria-label={`Amount for prize ${index + 1}`}
                value={row.amount}
                onChange={(event) => update(row.id, { amount: event.target.value })}
                placeholder="4500"
                className="w-full rounded-xl border border-[#23201c]/15 bg-[#fcfbf9] px-3 py-2 text-[13px] tabular-nums outline-none transition-colors focus:border-[#8a6f2c]"
              />

              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={`Remove prize ${index + 1}`}
                  className="flex h-9 w-8 items-center justify-center rounded-lg text-[#8a8378] transition-colors hover:bg-[#23201c]/[0.06] hover:text-[#a4251f]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange([...rows, newRow()])}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#23201c]/15 px-3 py-2 text-[13px] font-semibold transition-colors hover:border-[#23201c]/35"
      >
        <Plus className="h-3.5 w-3.5" />
        Add a prize
      </button>

      <p className="mt-4 text-[12px] text-[#8a8378]">
        The number beside each category is how many of the {playerCount} players are in it. A
        player only ever takes their biggest prize, so a category with few players can run out.
      </p>
    </div>
  );
}

function countFor(
  key: string,
  memberCounts: Record<string, number>,
  catalog: CatalogEntry[],
): number | null {
  const counted = memberCounts[key];
  if (counted !== undefined) return counted;
  return catalog.find((candidate) => candidate.key === key)?.count ?? null;
}
