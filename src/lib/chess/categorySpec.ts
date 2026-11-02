/**
 * Naming a prize category on the page instead of in a spreadsheet.
 *
 * An organiser's prize list is a handful of lines — "1st 4500, best female
 * 1000, under 1600 800" — and making them build a workbook first, in a
 * vocabulary that has to match ours, was the thing that did not work. So a
 * category is described here as a *rule* over the ranking list, the rule is
 * picked from a dropdown, and the only files still needed are the ones
 * Swiss-Manager already gave them.
 *
 * The rule that matters most, and the one organisers mean without saying it:
 * **rating prizes are bands, not thresholds.** With prizes for "under 1600"
 * and "under 1500" declared, a player rated 1452 is in the under-1500 prize
 * only — "under 1600" means 1500 to 1599. A threshold reading would put them
 * in both and let the lower-rated player take the bigger prize, which is not
 * how any tournament is run. `closestLimit` below is what makes a band a band,
 * and it is deliberately the same rule `winners.ts` applies in Mode 1 so the
 * two paths through this tool cannot disagree.
 */

import { type Category, OVERALL_LABEL } from './allocate';
import type { RankedPlayer } from './swissManager';

export type CategorySpec =
  /** Everybody who played: the open prizes. */
  | { kind: 'overall' }
  | { kind: 'female' }
  | { kind: 'unrated' }
  /** A rating prize. Bounded below by the next-lower limit the organiser declared. */
  | { kind: 'under'; limit: number }
  /** A value of the ranking list's Type or Gr column: S60, Ph, U11, a club code. */
  | { kind: 'token'; column: 'type' | 'group'; value: string }
  /** A category block the chess-results "Category prizes" export already named. */
  | { kind: 'export'; label: string };

// ---------- keys ----------

/**
 * Specs travel through the form state, the saved setup and the award rows as
 * strings, so the key has to survive a round trip through localStorage.
 */
export function specKey(spec: CategorySpec): string {
  switch (spec.kind) {
    case 'overall':
      return 'overall';
    case 'female':
      return 'female';
    case 'unrated':
      return 'unrated';
    case 'under':
      return `under:${spec.limit}`;
    case 'token':
      return `${spec.column}:${spec.value}`;
    case 'export':
      return `export:${spec.label}`;
  }
}

export function parseSpecKey(key: string): CategorySpec | null {
  if (key === 'overall') return { kind: 'overall' };
  if (key === 'female') return { kind: 'female' };
  if (key === 'unrated') return { kind: 'unrated' };

  const cut = key.indexOf(':');
  if (cut === -1) return null;
  const head = key.slice(0, cut);
  const rest = key.slice(cut + 1);
  if (rest === '') return null;

  if (head === 'under') {
    const limit = Number(rest);
    return Number.isInteger(limit) && limit > 0 ? { kind: 'under', limit } : null;
  }
  if (head === 'type' || head === 'group') return { kind: 'token', column: head, value: rest };
  if (head === 'export') return { kind: 'export', label: rest };
  return null;
}

// ---------- labels ----------

/** What the dropdown shows: the organiser's own words for the prize. */
export function specLabel(spec: CategorySpec): string {
  switch (spec.kind) {
    case 'overall':
      return OVERALL_LABEL;
    case 'female':
      return 'Best female';
    case 'unrated':
      return 'Unrated';
    case 'under':
      return `Under ${spec.limit}`;
    case 'token':
      return spec.value;
    case 'export':
      return spec.label;
  }
}

/**
 * What goes on the printed sheet. A bounded rating prize says its real range,
 * because "Under 1600" on a list that also has an under-1500 prize is exactly
 * the ambiguity that gets queried at the ceremony.
 */
export function resolvedLabel(spec: CategorySpec, limitsHighFirst: number[]): string {
  if (spec.kind !== 'under') return specLabel(spec);
  const floor = nextLimitBelow(spec.limit, limitsHighFirst);
  return floor === null
    ? `Under ${spec.limit}`
    : `Under ${spec.limit} (${floor}–${spec.limit - 1})`;
}

// ---------- rating bands ----------

/** Every declared "under" limit, highest first: [2000, 1800, 1600]. */
export function underLimits(specs: CategorySpec[]): number[] {
  const limits = new Set<number>();
  for (const spec of specs) if (spec.kind === 'under') limits.add(spec.limit);
  return [...limits].sort((a, b) => b - a);
}

/**
 * The smallest declared limit still above this rating — the band the player
 * actually belongs to. This is what stops a 1452 appearing in the under-1600
 * prize when an under-1500 prize exists.
 */
export function closestLimit(rating: number, limitsHighFirst: number[]): number | null {
  let closest: number | null = null;
  for (const limit of limitsHighFirst) if (rating < limit) closest = limit;
  return closest;
}

/** The lowest rating the band covers, or null when it is the lowest band declared. */
function nextLimitBelow(limit: number, limitsHighFirst: number[]): number | null {
  const below = limitsHighFirst.filter((other) => other < limit);
  return below.length > 0 ? Math.max(...below) : null;
}

// ---------- membership ----------

/**
 * Who is in this category, in ranking order.
 *
 * `exportCategories` are the blocks the chess-results "Category prizes" export
 * named, already filled out from the ranking list by `importFiles`. Where the
 * tournament software has spoken we repeat it rather than re-deriving it.
 */
export function membersOf(
  spec: CategorySpec,
  ranking: RankedPlayer[],
  exportCategories: Category[],
  limitsHighFirst: number[],
): RankedPlayer[] {
  switch (spec.kind) {
    case 'overall':
      return ranking;
    case 'female':
      return ranking.filter((player) => player.female);
    case 'unrated':
      return ranking.filter((player) => player.rating === 0);
    case 'under':
      // Unrated players are not "under 1600" — they have no rating to compare.
      return ranking.filter(
        (player) =>
          player.rating > 0 &&
          player.rating < spec.limit &&
          closestLimit(player.rating, limitsHighFirst) === spec.limit,
      );
    case 'token': {
      const wanted = spec.value.toLowerCase();
      return ranking.filter((player) => player[spec.column].toLowerCase() === wanted);
    }
    case 'export': {
      const match = exportCategories.find((category) => category.label === spec.label);
      return match ? match.players : [];
    }
  }
}

// ---------- the catalog the dropdown offers ----------

export type CatalogEntry = {
  key: string;
  spec: CategorySpec;
  label: string;
  /** How many players the rule picks out, so an empty category is obvious. */
  count: number;
  /** Heading the option sits under in the dropdown. */
  group: string;
};

/**
 * Every category an organiser can pick without typing anything: the blocks
 * chess-results named, plus the rules we can read off the ranking list.
 *
 * Rating prizes are not here — they need a limit, so the form asks for it.
 */
export function buildCatalog(ranking: RankedPlayer[], exportCategories: Category[]): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const seen = new Set<string>();
  const add = (spec: CategorySpec, group: string, players: RankedPlayer[]) => {
    const key = specKey(spec);
    if (seen.has(key) || players.length === 0) return;
    seen.add(key);
    entries.push({ key, spec, label: specLabel(spec), count: players.length, group });
  };

  if (ranking.length > 0) add({ kind: 'overall' }, 'Everyone', ranking);

  for (const category of exportCategories) {
    // The export's own "everybody" block is the overall list under another name.
    if (category.label === OVERALL_LABEL) {
      add({ kind: 'overall' }, 'Everyone', category.players);
      continue;
    }
    add({ kind: 'export', label: category.label }, 'From your category-prizes file', category.players);
  }

  add({ kind: 'female' }, 'From the ranking list', ranking.filter((player) => player.female));
  add({ kind: 'unrated' }, 'From the ranking list', ranking.filter((player) => player.rating === 0));

  for (const column of ['type', 'group'] as const) {
    const values = [...new Set(ranking.map((player) => player[column].trim()).filter(Boolean))];
    values.sort((a, b) => a.localeCompare(b));
    for (const value of values) {
      add(
        { kind: 'token', column, value },
        'From the ranking list',
        ranking.filter((player) => player[column].trim() === value),
      );
    }
  }

  return entries;
}
