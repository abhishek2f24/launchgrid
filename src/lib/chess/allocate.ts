/**
 * Handing out the prize fund once the categories are known.
 *
 * The one rule that matters, and the one organisers get wrong by hand: a
 * player takes exactly one prize — the biggest they are in line for. Somebody
 * who wins 4th overall does not also collect the S60 first prize; the S60
 * prize moves down to the next veteran. Processing every prize in descending
 * order of money makes that fall out naturally, because by the time a smaller
 * prize is considered, everyone who could have taken something bigger already
 * has.
 *
 * Category membership comes from the chess-results category-prizes export
 * (see `swissManager.ts`), so this module never has to guess who counts as a
 * veteran or who is in a rating band — the tournament software already said.
 */

import type { RankedPlayer } from './swissManager';
import type { PrizeMoneyRow } from './swissManager';

export type Category = {
  /** Stable id derived from the label; used as the key in the prize form. */
  id: string;
  label: string;
  /** Members in the order the export lists them, which is their category order. */
  players: RankedPlayer[];
};

/** A player is the same person across categories; start number identifies them. */
export function playerKey(player: RankedPlayer): string {
  return player.startNo.trim() !== '' ? `sno:${player.startNo.trim()}` : `rank:${player.rank}`;
}

export function categoryId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
}

/** The amounts an organiser entered for one category, best prize first. */
export type CategoryAmounts = { categoryId: string; amounts: string[] };

export type Award = {
  categoryId: string;
  categoryLabel: string;
  /** 1 for the category's first prize, 2 for the second, and so on. */
  place: number;
  /** "4500", or "Trophy". */
  amount: string;
  winner: RankedPlayer | null;
};

export type Allocation = {
  awards: Award[];
  /** Prizes nobody was left to take — every member already held something bigger. */
  unawarded: Award[];
  byCategory: { category: Category; awards: Award[] }[];
  totalCash: number;
  /** Players who won nothing, in rank order: useful when checking a list. */
  winnersInRankOrder: Award[];
};

const CASH = /^\d+$/;

export function isCash(amount: string): boolean {
  return CASH.test(amount.trim());
}

export function amountValue(amount: string): number {
  return isCash(amount) ? Number(amount.trim()) : -1; // trophies rank below any cash
}

/** Amounts as typed: "4500, 3500 2500" or one per line, blanks ignored. */
export function parseAmounts(input: string): string[] {
  return input
    .replace(/₹/g, '')
    // A comma inside a number groups thousands; between numbers it separates
    // prizes. "4,500, 3500" has to mean two prizes, not three.
    .replace(/(\d),(?=\d{3}(\D|$))/g, '$1')
    .split(/[\s,;]+/)
    .map((piece) => piece.trim())
    .filter((piece) => piece !== '');
}

export function allocate(categories: Category[], amounts: CategoryAmounts[]): Allocation {
  const byId = new Map(categories.map((category) => [category.id, category]));

  // Declaration order is the tie-breaker, so two equal prizes are handed out
  // in the order the organiser listed them rather than at random.
  const slots: { award: Award; order: number }[] = [];
  for (const entry of amounts) {
    const category = byId.get(entry.categoryId);
    if (!category) continue;
    entry.amounts.forEach((amount, index) => {
      slots.push({
        award: {
          categoryId: category.id,
          categoryLabel: category.label,
          place: index + 1,
          amount,
          winner: null,
        },
        order: slots.length,
      });
    });
  }

  const ranked = [...slots].sort((a, b) => {
    const diff = amountValue(b.award.amount) - amountValue(a.award.amount);
    return diff !== 0 ? diff : a.order - b.order;
  });

  const taken = new Set<string>();
  for (const slot of ranked) {
    const category = byId.get(slot.award.categoryId);
    if (!category) continue;
    const winner = category.players.find((player) => !taken.has(playerKey(player)));
    if (winner) {
      taken.add(playerKey(winner));
      slot.award.winner = winner;
    }
  }

  const awards = slots.map((slot) => slot.award);
  const byCategory = categories
    .map((category) => ({
      category,
      awards: awards.filter((award) => award.categoryId === category.id),
    }))
    .filter((entry) => entry.awards.length > 0);

  const totalCash = awards
    .filter((award) => award.winner && isCash(award.amount))
    .reduce((sum, award) => sum + Number(award.amount), 0);

  return {
    awards,
    unawarded: awards.filter((award) => !award.winner),
    byCategory,
    totalCash,
    winnersInRankOrder: awards
      .filter((award) => award.winner)
      .sort((a, b) => a.winner!.rank - b.winner!.rank),
  };
}

// ---------- picking the overall category ----------

/**
 * The category every player is in. chess-results calls it "rating between 0
 * and 3000" when the organiser sets the open prize up as a rating band; a
 * plain ranking list has no label at all.
 */
export function findOverall(categories: Category[]): Category | null {
  const unlabelled = categories.find((category) => category.label === OVERALL_LABEL);
  if (unlabelled) return unlabelled;

  const bands = categories
    .map((category) => ({ category, band: ratingBand(category.label) }))
    .filter((entry) => entry.band !== null && entry.band.from === 0)
    .sort((a, b) => b.band!.to - a.band!.to);
  if (bands.length > 0 && bands[0].band!.to >= 2000) return bands[0].category;

  return categories.reduce<Category | null>(
    (best, category) => (!best || category.players.length > best.players.length ? category : best),
    null,
  );
}

export const OVERALL_LABEL = 'Overall';

/** "rating between 1400 and 1499" -> { from: 1400, to: 1499 } */
export function ratingBand(label: string): { from: number; to: number } | null {
  const match = label.toLowerCase().match(/rating\s+between\s+(\d+)\s+and\s+(\d+)/);
  return match ? { from: Number(match[1]), to: Number(match[2]) } : null;
}

// ---------- reading an organiser's own prize sheet ----------

export type PrefillResult = {
  amounts: CategoryAmounts[];
  /** Rows we would not place without guessing. The organiser is told about these. */
  unmatched: PrizeMoneyRow[];
};

/**
 * Turn an organiser's own "category, amount" sheet into the prize form.
 *
 * Their names and chess-results' labels are not the same vocabulary — "F" and
 * "best female", "S60" and "age group S60", "1".."15" and the open list. Only
 * confident matches are filled in; anything else is handed back as unmatched
 * rather than quietly attached to the wrong category, because a wrong prefill
 * is harder to notice than an empty box.
 */
export function prefillFromPrizeSheet(
  rows: PrizeMoneyRow[],
  categories: Category[],
): PrefillResult {
  const overall = findOverall(categories);
  const byCategory = new Map<string, string[]>();
  const numbered = new Map<number, string>();
  const unmatched: PrizeMoneyRow[] = [];

  for (const row of rows) {
    const name = row.category.trim();
    const place = /^\d{1,2}$/.test(name) ? Number(name) : null;
    if (place !== null && overall) {
      // "1", "2", "3" … are the overall places, in the organiser's own order.
      if (!numbered.has(place)) numbered.set(place, row.prize);
      continue;
    }
    const match = matchCategory(name, categories);
    if (!match) {
      unmatched.push(row);
      continue;
    }
    const list = byCategory.get(match.id) ?? [];
    list.push(row.prize);
    byCategory.set(match.id, list);
  }

  if (overall && numbered.size > 0) {
    const places = [...numbered.keys()].sort((a, b) => a - b);
    const list: string[] = [];
    for (let place = 1; place <= places[places.length - 1]; place += 1) {
      // A missing place would silently shift every prize below it up one.
      list.push(numbered.get(place) ?? '');
    }
    byCategory.set(overall.id, [...(byCategory.get(overall.id) ?? []), ...list]);
  }

  return {
    amounts: categories
      .filter((category) => byCategory.has(category.id))
      .map((category) => ({
        categoryId: category.id,
        amounts: (byCategory.get(category.id) ?? []).filter((amount) => amount !== ''),
      })),
    unmatched,
  };
}

const FEMALE_NAMES = ['f', 'w', 'female', 'women', 'best female', 'girl', 'girls'];
/** Indian prize sheets write the unrated prize as Un, Ur or Unrated. */
const UNRATED_NAMES = ['un', 'ur', 'unr', 'unrated', 'un-rated'];

function matchCategory(name: string, categories: Category[]): Category | null {
  const lower = name.toLowerCase();

  const exact = categories.find((category) => category.label.toLowerCase() === lower);
  if (exact) return exact;

  if (UNRATED_NAMES.includes(lower)) {
    const unrated = categories.find((category) => category.label.toLowerCase().includes('unrated'));
    if (unrated) return unrated;
  }

  if (FEMALE_NAMES.includes(lower)) {
    const female = categories.find((category) => category.label.toLowerCase().includes('female'));
    if (female) return female;
  }

  // "Below_1500" is the band that ends at 1499.
  const below = lower.match(/^(?:below|under|u)[_\s-]?(\d{3,4})$/);
  if (below) {
    const limit = Number(below[1]);
    const band = categories.find((category) => {
      const range = ratingBand(category.label);
      if (range !== null) return range.from === 0 && range.to === limit - 1;
      return category.label.toLowerCase() === `rated below ${limit}`;
    });
    if (band) return band;
  }

  // Age groups and disability codes: S60, U15, Ph, PC, VC. chess-results
  // writes them as "age group S60" / "group PH", so a word match is enough.
  if (/^[a-z]{1,3}\d{0,2}$/.test(lower)) {
    const token = categories.find((category) =>
      new RegExp(`(^|[^a-z0-9])${lower}([^a-z0-9]|$)`).test(category.label.toLowerCase()),
    );
    if (token) return token;
  }

  return null;
}
