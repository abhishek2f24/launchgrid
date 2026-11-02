/**
 * The prize list as the organiser types it, turned into something allocatable.
 *
 * A prize list is written one category at a time — "female: 1000, 800" — not
 * one prize at a time, so that is the shape here: a group is a category and
 * the amounts under it, best first. The form gives each group a fresh empty
 * slot as the last one is filled, which is how the organiser tells us there
 * are two female prizes rather than one: they type the second amount.
 *
 * That ordering is load-bearing twice over. Within a group it decides which
 * prize is 1st and which is 2nd, and across groups it is what `allocate()`
 * uses to break a tie between two prizes of the same amount.
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

export type PrizeGroup = {
  /** Stable across re-renders; not meaningful to the plan. */
  id: string;
  /** A `specKey`, or '' while the organiser has not chosen a category yet. */
  categoryKey: string;
  /** Amounts in prize order, best first. May hold blanks while being typed. */
  amounts: string[];
};

export type PrizePlan = {
  categories: Category[];
  amounts: CategoryAmounts[];
  /** Groups that are not yet a prize — no category, or no amount typed. */
  incomplete: PrizeGroup[];
};

let counter = 0;

export function newGroup(categoryKey = '', amounts: string[] = ['']): PrizeGroup {
  counter += 1;
  return { id: `group-${counter}-${Math.random().toString(36).slice(2, 8)}`, categoryKey, amounts };
}

/** The amounts actually typed, in order, with the empty trailing slots dropped. */
export function filledAmounts(group: PrizeGroup): string[] {
  return group.amounts.map((amount) => amount.trim()).filter((amount) => amount !== '');
}

/**
 * A group counts once it names a category we can resolve and holds at least
 * one amount. The category check is not just "not empty": picking "Under…"
 * leaves a half-built key until the limit is typed, and a half-built group
 * must not be treated as a prize.
 */
export function isComplete(group: PrizeGroup): boolean {
  return parseSpecKey(group.categoryKey) !== null && filledAmounts(group).length > 0;
}

/**
 * Keep exactly one empty slot at the end of a group, so finishing a prize is
 * what offers the next one. A blank in the middle is dropped — it came from
 * clearing a box, and leaving it would silently shift every prize below it up
 * a place.
 */
export function withTrailingSlot(group: PrizeGroup): PrizeGroup {
  return { ...group, amounts: [...filledAmounts(group), ''] };
}

/** The same, for the list of groups: one blank group waiting at the end. */
export function withTrailingGroup(groups: PrizeGroup[]): PrizeGroup[] {
  const last = groups[groups.length - 1];
  return last && !isComplete(last) ? groups : [...groups, newGroup()];
}

/**
 * Build the plan from the groups.
 *
 * Two groups naming the same category are merged, in the order they appear, so
 * an organiser who adds a second "Best female" row further down gets 3rd and
 * 4th female prizes rather than a duplicate category.
 */
export function buildPrizePlan(
  groups: PrizeGroup[],
  ranking: RankedPlayer[],
  exportCategories: Category[],
): PrizePlan {
  const resolved: { spec: CategorySpec; amounts: string[] }[] = [];
  for (const group of groups) {
    const spec = parseSpecKey(group.categoryKey);
    const amounts = filledAmounts(group);
    if (spec && amounts.length > 0) resolved.push({ spec, amounts });
  }

  // Every declared limit, before any membership is worked out: "under 1600"
  // only means 1500–1599 once the under-1500 prize exists.
  const limits = underLimits(resolved.map((entry) => entry.spec));

  const categories: Category[] = [];
  const amounts = new Map<string, string[]>();
  for (const entry of resolved) {
    const key = specKey(entry.spec);
    if (!amounts.has(key)) {
      amounts.set(key, []);
      categories.push({
        // The spec key is already unique and stable, and two different rating
        // bands must not collapse into one category.
        id: key,
        label: resolvedLabel(entry.spec, limits),
        players: membersOf(entry.spec, ranking, exportCategories, limits),
      });
    }
    amounts.get(key)!.push(...entry.amounts);
  }

  return {
    categories,
    amounts: categories.map((category) => ({
      categoryId: category.id,
      amounts: amounts.get(category.id) ?? [],
    })),
    incomplete: groups.filter((group) => !isComplete(group)),
  };
}

/**
 * Seed groups from an organiser's own prize sheet, where they dropped one in.
 *
 * Amounts the sheet could not place keep their money and lose their category,
 * so they arrive as a group with the dropdown open rather than as a warning
 * the organiser has to act on somewhere else.
 */
export function seedGroups(
  amounts: CategoryAmounts[],
  exportCategories: Category[],
  unmatchedAmounts: string[],
): PrizeGroup[] {
  const labelById = new Map(exportCategories.map((category) => [category.id, category.label]));
  const groups: PrizeGroup[] = [];

  for (const entry of amounts) {
    const label = labelById.get(entry.categoryId);
    if (label === undefined) continue;
    const typed = entry.amounts.map((amount) => amount.trim()).filter((amount) => amount !== '');
    if (typed.length === 0) continue;
    groups.push(newGroup(keyForImportedCategory(label), typed));
  }
  for (const amount of unmatchedAmounts) {
    if (amount.trim() !== '') groups.push(newGroup('', [amount.trim()]));
  }

  return groups;
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
