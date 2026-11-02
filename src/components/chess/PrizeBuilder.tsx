'use client';

/**
 * The prize list, typed on the page.
 *
 * One row per *category*, not per prize: choose the category once, then type
 * its prizes best-first across a row of small boxes, and the next empty box
 * appears as you fill the current one. Typing a second female amount is how
 * the organiser says there are two female prizes — there is nothing else to
 * declare and no count to set.
 *
 * It was one box per row before, and organisers typed "600,800" into it. That
 * is the correct instinct and the wrong model, so the model moved: the boxes
 * are per prize, and anything separator-shaped pasted into one box is split
 * across them on blur rather than being read as a single strange amount.
 *
 * Rating prizes get a limit box rather than their own dropdown entry, because
 * "under 1600" is only meaningful next to the other limits on the same list.
 * The band each one resolves to is shown back, so the organiser can see that
 * adding an under-1500 prize has narrowed the under-1600 prize to 1500–1599.
 */

import { Plus, X } from 'lucide-react';

import { parseAmounts } from '@/lib/chess/allocate';
import {
  type CatalogEntry,
  type CategorySpec,
  parseSpecKey,
  resolvedLabel,
  underLimits,
} from '@/lib/chess/categorySpec';
import {
  type PrizeGroup,
  filledAmounts,
  newGroup,
  withTrailingGroup,
  withTrailingSlot,
} from '@/lib/chess/prizePlan';

import { placeLabel } from './PrizeList';

/** The dropdown value that asks for a rating limit instead of naming a category. */
const UNDER_PENDING = 'under:';

function isUnderKey(key: string): boolean {
  return key === UNDER_PENDING || key.startsWith('under:');
}

function underLimitOf(key: string): string {
  return key.startsWith('under:') ? key.slice('under:'.length) : '';
}

export function PrizeBuilder({
  groups,
  catalog,
  memberCounts,
  onChange,
  playerCount,
}: {
  groups: PrizeGroup[];
  catalog: CatalogEntry[];
  /**
   * How many players each chosen category holds, keyed by spec key. A rating
   * band is not in the catalog — its membership depends on the other rows — so
   * the counts are worked out with the plan and handed back here.
   */
  memberCounts: Record<string, number>;
  onChange: (groups: PrizeGroup[]) => void;
  playerCount: number;
}) {
  const catalogGroups = [...new Set(catalog.map((entry) => entry.group))];
  const limits = underLimits(
    groups
      .map((group) => parseSpecKey(group.categoryKey))
      .filter((spec): spec is CategorySpec => spec !== null),
  );

  const replace = (id: string, next: PrizeGroup) => {
    onChange(withTrailingGroup(groups.map((group) => (group.id === id ? next : group))));
  };

  const setAmount = (group: PrizeGroup, index: number, value: string) => {
    const amounts = [...group.amounts];
    amounts[index] = value;
    // Growing happens on every keystroke, so the next box is already waiting;
    // blanks in the middle are only tidied on blur, or clearing a box would
    // yank the one after it out from under the cursor.
    const grown = index === amounts.length - 1 && value.trim() !== '' ? [...amounts, ''] : amounts;
    replace(group.id, { ...group, amounts: grown });
  };

  /** "600,800" pasted into one box becomes two prizes; "4,500" stays one. */
  const normalise = (group: PrizeGroup, index: number) => {
    const raw = group.amounts[index] ?? '';
    const pieces = parseAmounts(raw);
    const amounts =
      pieces.length > 1
        ? [...group.amounts.slice(0, index), ...pieces, ...group.amounts.slice(index + 1)]
        : group.amounts;
    replace(group.id, withTrailingSlot({ ...group, amounts }));
  };

  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8">
      <h2 className="text-[15px] font-bold">The prizes</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c564d]">
        One row per category. Type its prizes biggest first — a box for the next prize appears as
        you fill the current one, so two amounts under <em>Best female</em> means two female
        prizes. Write an amount like <code>4500</code>, or the word <code>Trophy</code>.
      </p>

      <div className="mt-5 space-y-4">
        {groups.map((group, groupIndex) => {
          const spec = parseSpecKey(group.categoryKey);
          const band = spec?.kind === 'under' ? resolvedLabel(spec, limits) : null;
          const members = spec ? countFor(group.categoryKey, memberCounts, catalog) : null;
          const prizeCount = filledAmounts(group).length;

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-[#23201c]/10 bg-[#fcfbf9] p-4 md:grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)_32px] md:items-start md:gap-4"
            >
              <div className="space-y-1.5">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a8378]"
                  htmlFor={`category-${group.id}`}
                >
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    id={`category-${group.id}`}
                    aria-label={`Category for row ${groupIndex + 1}`}
                    value={isUnderKey(group.categoryKey) ? UNDER_PENDING : group.categoryKey}
                    onChange={(event) =>
                      replace(group.id, { ...group, categoryKey: event.target.value })
                    }
                    className="w-full rounded-xl border border-[#23201c]/15 bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#8a6f2c]"
                  >
                    <option value="">Choose a category…</option>
                    {catalogGroups.map((name) => (
                      <optgroup key={name} label={name}>
                        {catalog
                          .filter((entry) => entry.group === name)
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

                  {isUnderKey(group.categoryKey) ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Rating limit for row ${groupIndex + 1}`}
                      value={underLimitOf(group.categoryKey)}
                      onChange={(event) =>
                        replace(group.id, {
                          ...group,
                          categoryKey: `under:${event.target.value.replace(/\D/g, '')}`,
                        })
                      }
                      placeholder="1600"
                      className="w-24 shrink-0 rounded-xl border border-[#23201c]/15 bg-white px-3 py-2 text-[13px] tabular-nums outline-none transition-colors focus:border-[#8a6f2c]"
                    />
                  ) : null}
                </div>

                {band ? (
                  <p className="text-[12px] text-[#8a6f2c]">
                    {band} · {members ?? 0} player{members === 1 ? '' : 's'}
                  </p>
                ) : null}
                {!band && members === 0 ? (
                  <p className="text-[12px] text-[#a4251f]">
                    Nobody in the ranking list is in this category.
                  </p>
                ) : null}
              </div>

              <div className="mt-3 space-y-1.5 md:mt-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a8378]">
                  {prizeCount > 0
                    ? `${prizeCount} prize${prizeCount === 1 ? '' : 's'}, biggest first`
                    : 'Prize money, biggest first'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {group.amounts.map((amount, index) => (
                    <label key={index} className="block">
                      <span className="sr-only">
                        {placeLabel(index + 1)} prize for row {groupIndex + 1}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(event) => setAmount(group, index, event.target.value)}
                        onBlur={() => normalise(group, index)}
                        placeholder={index === 0 ? '4500' : placeLabel(index + 1)}
                        title={`${placeLabel(index + 1)} prize`}
                        className="w-24 rounded-xl border border-[#23201c]/15 bg-white px-3 py-2 text-[13px] tabular-nums outline-none transition-colors focus:border-[#8a6f2c]"
                      />
                    </label>
                  ))}
                </div>
                {members !== null && prizeCount > members ? (
                  <p className="text-[12px] text-[#a4251f]">
                    {prizeCount} prizes but only {members} player{members === 1 ? '' : 's'} here —
                    the last of them will have nobody left to take it.
                  </p>
                ) : null}
              </div>

              {groups.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(withTrailingGroup(groups.filter((g) => g.id !== group.id)))}
                  aria-label={`Remove row ${groupIndex + 1}`}
                  className="mt-3 flex h-9 w-8 items-center justify-center rounded-lg text-[#8a8378] transition-colors hover:bg-[#23201c]/[0.06] hover:text-[#a4251f] md:mt-7"
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
        onClick={() => onChange([...groups, newGroup()])}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#23201c]/15 px-3 py-2 text-[13px] font-semibold transition-colors hover:border-[#23201c]/35"
      >
        <Plus className="h-3.5 w-3.5" />
        Add a category
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
