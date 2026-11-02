/**
 * The prize list as the organiser types it, turned into something allocatable.
 *
 * On the page a prize list is a flat sequence of rows — pick a category, type
 * an amount — because that is how it is written on paper and read out at the
 * ceremony. `allocate()` wants it grouped by category, with each category's
 * prizes in order. This module is the join between the two, and it is where
 * the rating bands get resolved: the set of "under" limits is only knowable
 * once every row has been entered, so no single row can work out its own
 * membership.
 */

import type { Category, CategoryAmounts } from './allocate';
import {
  type CategorySpec,
  membersOf,
  parseSpecKey,
  resolvedLabel,
  specKey,
  underLimits,
} from './categorySpec';
import type { RankedPlayer } from './swissManager';

export type PrizeRow = {
  /** Stable across re-renders and reorderings; not meaningful to the plan. */
  id: string;
  /** A `specKey`, or '' while the organiser has not chosen a category yet. */
  categoryKey: string;
  /** "4500", or "Trophy". Free text, validated when the plan is built. */
  amount: string;
};

export type PrizePlan = {
  categories: Category[];
  amounts: CategoryAmounts[];
  /** Rows that are not yet a prize — no category, or no amount. */
  incomplete: PrizeRow[];
};

export function newRow(categoryKey = '', amount = ''): PrizeRow {
  return { id: `row-${Math.random().toString(36).slice(2, 10)}`, categoryKey, amount };
}

/**
 * A row counts once it names a category we can resolve and an amount. The
 * category check is not just "not empty": picking "Under…" from the dropdown
 * leaves a half-built key until the limit is typed, and a half-built row must
 * not be treated as a prize.
 */
export function isComplete(row: PrizeRow): boolean {
  return row.amount.trim() !== '' && parseSpecKey(row.categoryKey) !== null;
}

/**
 * Build the plan from the rows.
 *
 * Row order is kept, and it matters twice: it decides each category's 1st,
 * 2nd, 3rd prize, and `allocate()` uses it to break ties between two prizes of
 * the same amount.
 */
export function buildPrizePlan(
  rows: PrizeRow[],
  ranking: RankedPlayer[],
  exportCategories: Category[],
): PrizePlan {
  const complete = rows.filter(isComplete);
  const specs: { row: PrizeRow; spec: CategorySpec }[] = [];
  for (const row of complete) {
    const spec = parseSpecKey(row.categoryKey);
    if (spec) specs.push({ row, spec });
  }

  // Every declared limit, before any membership is worked out: "under 1600"
  // only means 1500–1599 once the under-1500 row exists.
  const limits = underLimits(specs.map((entry) => entry.spec));

  const categories: Category[] = [];
  const amounts = new Map<string, string[]>();
  for (const { row, spec } of specs) {
    const key = specKey(spec);
    if (!amounts.has(key)) {
      amounts.set(key, []);
      categories.push({
        // The spec key is already unique and stable, and two different rating
        // bands must not collapse into one category.
        id: key,
        label: resolvedLabel(spec, limits),
        players: membersOf(spec, ranking, exportCategories, limits),
      });
    }
    amounts.get(key)!.push(row.amount.trim());
  }

  return {
    categories,
    amounts: categories.map((category) => ({
      categoryId: category.id,
      amounts: amounts.get(category.id) ?? [],
    })),
    incomplete: rows.filter((row) => !isComplete(row)),
  };
}

/**
 * Seed rows from an organiser's own prize sheet, where they dropped one in.
 *
 * Amounts the sheet could not place keep their money and lose their category,
 * so they arrive as a row with the dropdown open rather than as a warning the
 * organiser has to act on somewhere else.
 */
export function seedRows(
  amounts: CategoryAmounts[],
  exportCategories: Category[],
  unmatchedAmounts: string[],
): PrizeRow[] {
  const labelById = new Map(exportCategories.map((category) => [category.id, category.label]));
  const rows: PrizeRow[] = [];

  for (const entry of amounts) {
    const label = labelById.get(entry.categoryId);
    if (label === undefined) continue;
    const key = keyForImportedCategory(label);
    for (const amount of entry.amounts) {
      if (amount.trim() !== '') rows.push(newRow(key, amount.trim()));
    }
  }
  for (const amount of unmatchedAmounts) {
    if (amount.trim() !== '') rows.push(newRow('', amount.trim()));
  }

  return rows;
}

/**
 * The spec key for a category that came out of a file. `importFiles` derives a
 * few categories itself ("Unrated", "Rated below 1500"); those have a rule of
 * their own here, so they map onto it rather than being carried twice.
 */
export function keyForImportedCategory(label: string): string {
  const lower = label.toLowerCase();
  if (lower === 'overall') return specKey({ kind: 'overall' });
  if (lower === 'unrated') return specKey({ kind: 'unrated' });
  const below = lower.match(/^rated below (\d{3,4})$/);
  if (below) return specKey({ kind: 'under', limit: Number(below[1]) });
  return specKey({ kind: 'export', label });
}
