/**
 * Prize distribution for chess tournaments — the ChessWinners rules.
 *
 * Based on ChessWinners v2.0 by Zaheer Beig (zaheer.beig@gmail.com), whose
 * BSD-style licence permits reuse provided the credit and licence text are
 * kept. They are, on /chess/about — do not remove that page, and do not use
 * the author's name to promote this tool.
 *
 * This is a FAITHFUL port, quirks included, because organisers compare our
 * output against the desktop app on the same workbook and a "better" answer
 * that disagrees is a support ticket, not an improvement. The documented
 * quirks are reported as warnings instead (see `inputWarnings`), so an
 * organiser can see that their sheet is about to behave oddly and fix the
 * sheet. Two places deviate, both because the original simply crashes:
 * a Trophy row above a cash row, and a bare numeric category, raise a clear
 * error naming the problem.
 *
 * Input rows are arrays of cell TEXT as the spreadsheet displays it. Keep
 * this module free of Excel and React imports: it is the tested core, and
 * `tests/chessWinners.test.ts` encodes the worked example and every quirk.
 */

export const MODE_1 = 'Mode 1'; // rating bands + exact age group from the Type column
export const MODE_2 = 'Mode 2'; // "under X" means anyone at or below X (lower bound 0)

export type Mode = typeof MODE_1 | typeof MODE_2;

/** One row of the 'sort' sheet: a single prize for a single winner. */
export type CategoryPrize = {
  category: string;
  /** Prize text with commas removed: "10000", "Trophy", or something ignorable. */
  prize: string;
};

export type Player = {
  rank: number;
  serialNo: string;
  name: string;
  /** "F"/"f" for female; everything else, blank included, is stored as "M". */
  gender: string;
  rating: number;
  club: string;
  age: number;
  type: string;
  disability: string;
  points: string;
  /** "0" until a prize is won, then the prize text. */
  prizeMoney: string;
  /** "" until a prize is won, then the category ("MAIN" for Main prizes). */
  winningCategory: string;
};

export type WinnerSection = {
  heading: string;
  winners: Player[];
};

export type Row = (string | null | undefined)[];

// ---------- small helpers (same behaviour as the original) ----------

/** Whole number, like Java's Integer.parseInt: optional sign, digits only, 32-bit. */
export function isNumber(text: string): boolean {
  return /^[+-]?\d+$/.test(text) && Math.abs(Number(text)) <= 2147483647;
}

function toInt(text: string): number {
  return parseInt(text, 10);
}

function eqIgnoreCase(a: string | null | undefined, b: string | null | undefined): boolean {
  return a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase();
}

/** "Below_1800" -> 1800 (keeps only the digits). */
function digitsOf(text: string): number {
  return toInt(String(text).replace(/[^0-9]/g, ''));
}

/**
 * "Main_2" -> "Main". A 1-99 number after the LAST underscore only numbers
 * duplicate rows, so it is cut off; "Below_1800" and "GOA_U15" are left alone.
 * A category that is nothing but such a number ("15") has no category left —
 * the original crashes there, so we refuse the row by name instead.
 */
export function stripRowNumber(category: string): string {
  const cut = category.lastIndexOf('_');
  const tail = category.substring(cut + 1).trim();
  if (isNumber(tail) && toInt(tail) > 0 && toInt(tail) < 100) {
    if (cut === -1) {
      throw new Error(
        `'sort' sheet: "${category}" is only a row number, not a category. ` +
          `Write the category before it, like "Main_${category}".`,
      );
    }
    return category.substring(0, cut);
  }
  return category;
}

/** All "Below_" limits in the prize list, highest first: [2000, 1800, 1600]. */
function belowLimits(categories: CategoryPrize[]): number[] {
  const limits = new Set<number>();
  for (const c of categories) {
    if (c.category.includes('Below')) limits.add(digitsOf(c.category));
  }
  return [...limits].sort((a, b) => b - a);
}

/** The smallest Below limit still above the rating — this is what makes bands bands. */
function closestLimit(rating: number, limitsHighFirst: number[]): number | null {
  let closest: number | null = null;
  for (const limit of limitsHighFirst) if (rating < limit) closest = limit;
  return closest;
}

function isWomenCategory(category: string, p: Player): boolean {
  return (
    eqIgnoreCase(category, 'W') &&
    eqIgnoreCase(p.gender, 'F') &&
    !p.type.includes('F') &&
    !p.type.includes('f')
  );
}

function isClubAndGenderCategory(category: string): boolean {
  return ['_M', '_F', '_m', '_f', '_U', '_u'].some((s) => category.includes(s));
}

/** U15, F07, M9 — one letter then one or two digits. */
function isAgeType(category: string): boolean {
  return /^[u,m,f,U,M,F]\d{1,2}$/.test(category);
}

/** Quirk 9.1: no capital U anywhere in the name means girls only. */
function extractGender(category: string): 'All' | 'F' {
  return /U/.test(category) ? 'All' : 'F';
}

function extractAgeFromType(text: string): number {
  if (!text) return 0;
  const rest = text.substring(1);
  return isNumber(rest) ? toInt(rest) : 0;
}

/** Quirk 9.12: the age comes from the text after the FIRST underscore. */
export function extractAgeFromClubType(category: string): number {
  if (!category || !category.includes('_')) return 0;
  return extractAgeFromType(category.split('_')[1]);
}

function ageRuleMatches(maxAge: number, categoryGender: 'All' | 'F', p: Player): boolean {
  if (p.age > maxAge) return false;
  if (categoryGender === 'F') return eqIgnoreCase(p.gender, 'F');
  return true;
}

// ---------- reading the workbook ----------

const cellOf = (row: Row, n: number): string => String(row[n] ?? '');

export function readCategories(sortRows: Row[]): CategoryPrize[] {
  const categories: CategoryPrize[] = [];
  for (const row of sortRows) {
    const a = cellOf(row, 0);
    const b = cellOf(row, 1);
    if (eqIgnoreCase(a, 'Prize') && eqIgnoreCase(b, 'Prize Money')) continue; // header row
    if (a.trim() === '') continue;
    categories.push({ category: stripRowNumber(a), prize: b.replace(/,/g, '') });
  }
  return categories;
}

export function readPlayers(rankRows: Row[]): Player[] {
  const players: Player[] = [];
  rankRows.forEach((row, i) => {
    const cell = (n: number) => cellOf(row, n);
    if (!isNumber(cell(0))) return; // titles, headers, blank lines
    if (!isNumber(cell(5))) {
      throw new Error(
        `'Ranklist' row ${i + 1}: rating "${cell(5)}" must be a whole number (use 0 for unrated)`,
      );
    }
    players.push({
      rank: toInt(cell(0)),
      serialNo: cell(1),
      // cell(2) is Title (GM, IM, ...): read by nobody, in the original either
      name: cell(3),
      gender: eqIgnoreCase(cell(4), 'F') ? cell(4) : 'M',
      rating: toInt(cell(5)),
      club: cell(6),
      age: isNumber(cell(7)) ? toInt(cell(7)) : 0,
      type: cell(8),
      disability: cell(9),
      points: cell(10),
      prizeMoney: '0',
      winningCategory: '',
    });
  });
  return players;
}

/** Title = the first sheet's top rows, up to the first cell containing "main". */
export function readTitle(firstSheetName: string, firstSheetRows: Row[]): string | null {
  if (eqIgnoreCase(firstSheetName, 'sort') || eqIgnoreCase(firstSheetName, 'ranklist')) {
    return null;
  }
  let text = '';
  for (const row of firstSheetRows) {
    let stop = false;
    for (const value of row) {
      const v = String(value ?? '');
      if (v.includes('main') || v.includes('Main') || v.includes('MAIN')) stop = true;
      else text += v;
    }
    text += '\n';
    if (stop) break;
  }
  return text.trim();
}

// ---------- the winner rules ----------

/** Does this player qualify for this category? Checks run in the original's order. */
export function matches(
  category: string,
  p: Player,
  mode: Mode,
  limits: number[],
  isCash: boolean,
): boolean {
  if (isCash && category.includes('Main')) return true;
  if (category.includes('Below')) {
    const limit = digitsOf(category);
    if (mode === MODE_1) {
      if (p.rating !== 0 && p.rating < limit && closestLimit(p.rating, limits) === limit) {
        return true;
      }
    } else if (p.rating < limit) {
      return true;
    }
  }
  if (category.includes('Un') && p.rating === 0) return true;
  if (eqIgnoreCase(category, p.club)) return true;
  if (
    mode === MODE_2 &&
    isAgeType(category) &&
    ageRuleMatches(extractAgeFromType(category), extractGender(category), p)
  ) {
    return true;
  }
  if (eqIgnoreCase(category, p.type)) return true;
  if (eqIgnoreCase(category, p.disability)) return true;
  if (isWomenCategory(category, p)) return true;
  if (isClubAndGenderCategory(category)) {
    const cut = category.lastIndexOf('_');
    const club = category.substring(0, cut);
    const suffix = category.substring(cut + 1);
    if (eqIgnoreCase(p.club, club)) {
      if (/\d/.test(suffix)) {
        return mode === MODE_1
          ? eqIgnoreCase(suffix, p.type)
          : ageRuleMatches(extractAgeFromClubType(category), extractGender(category), p);
      }
      return eqIgnoreCase(p.gender, suffix);
    }
  }
  return false;
}

/** What happened to one row of the 'sort' sheet. */
export type Award = {
  category: string;
  prize: string;
  kind: 'cash' | 'trophy' | 'ignored';
  /** null when the row was ignored or nobody qualified — then the prize is not awarded. */
  winner: Player | null;
};

/**
 * Walk the prize rows top to bottom; each row goes to the best-ranked player
 * who qualifies and does not already hold an equal or bigger prize. Mutates
 * `players` and reports what each prize row did — which is the only way to
 * see a prize that went to nobody, since the player list cannot show it.
 */
export function distribute(
  categories: CategoryPrize[],
  players: Player[],
  mode: Mode,
): { players: Player[]; awards: Award[] } {
  const limits = belowLimits(categories);
  const awards: Award[] = [];
  for (const { category, prize } of categories) {
    const isCash = isNumber(prize);
    const isTrophy = !isCash && eqIgnoreCase(prize, 'trophy');
    if (!isCash && !isTrophy) {
      awards.push({ category, prize, kind: 'ignored', winner: null });
      continue; // any other prize text is ignored
    }
    const award: Award = { category, prize, kind: isCash ? 'cash' : 'trophy', winner: null };
    awards.push(award);
    for (const p of players) {
      if (isCash) {
        if (!isNumber(p.prizeMoney)) {
          // The original throws NumberFormatException here and dies.
          throw new Error("Cash prize rows must come before Trophy rows in the 'sort' sheet");
        }
        if (toInt(p.prizeMoney) >= toInt(prize)) continue;
      } else if (p.prizeMoney !== '0') {
        continue;
      }
      if (matches(category, p, mode, limits, isCash)) {
        p.winningCategory = isCash && category.includes('Main') ? 'MAIN' : category;
        p.prizeMoney = prize;
        award.winner = p;
        break;
      }
    }
  }
  return { players, awards };
}

/** The same distribution, when only the players' final prizes are wanted. */
export function assignPrizes(categories: CategoryPrize[], players: Player[], mode: Mode): Player[] {
  return distribute(categories, players, mode).players;
}

/** One section per distinct category, in 'sort' order; winners in ranklist order. */
export function winnersByCategory(categories: CategoryPrize[], players: Player[]): WinnerSection[] {
  const sections: WinnerSection[] = [];
  for (const category of new Set(categories.map((c) => c.category))) {
    sections.push({
      heading: eqIgnoreCase(category, 'un') ? 'Un-Rated' : category,
      winners: players.filter((p) => eqIgnoreCase(p.winningCategory, category)),
    });
  }
  return sections;
}

// ---------- warnings (ours, not the original's) ----------

export type Warning = { title: string; detail: string };

/**
 * Things about the input that will quietly change the result. The original
 * says nothing about any of these, which is how organisers end up handing out
 * the wrong prizes; we report them and still compute the same answer.
 */
export function inputWarnings(
  categories: CategoryPrize[],
  players: Player[],
  mode: Mode,
): Warning[] {
  const warnings: Warning[] = [];

  const cashRows = categories.filter((c) => isNumber(c.prize));
  const firstTrophy = categories.findIndex(
    (c) => !isNumber(c.prize) && eqIgnoreCase(c.prize, 'trophy'),
  );
  const cashAfterTrophy =
    firstTrophy !== -1 && categories.slice(firstTrophy + 1).some((c) => isNumber(c.prize));
  if (cashAfterTrophy) {
    warnings.push({
      title: 'A cash prize is listed below a Trophy',
      detail:
        'Move every cash row above the Trophy rows. The desktop program crashes on this; ' +
        'here it stops with an error.',
    });
  }

  for (let i = 1; i < cashRows.length; i += 1) {
    if (toInt(cashRows[i].prize) > toInt(cashRows[i - 1].prize)) {
      warnings.push({
        title: 'Prize rows are not sorted highest first',
        detail:
          `Row "${cashRows[i].category} ${cashRows[i].prize}" is bigger than the row above it. ` +
          'A player who takes a small prize first and a bigger one later keeps only the bigger ' +
          'one, and the small prize is then awarded to nobody.',
      });
      break;
    }
  }

  const ignored = categories.filter(
    (c) => !isNumber(c.prize) && !eqIgnoreCase(c.prize, 'trophy'),
  );
  if (ignored.length > 0) {
    warnings.push({
      title: `${ignored.length} prize row${ignored.length > 1 ? 's' : ''} will be ignored`,
      detail:
        `The prize column must be a whole number or "Trophy". Ignored: ` +
        ignored.map((c) => `${c.category} = "${c.prize}"`).join(', ') + '.',
    });
  }

  const limits = belowLimits(categories);
  const unmatched = categories.filter(
    (c) =>
      (isNumber(c.prize) || eqIgnoreCase(c.prize, 'trophy')) &&
      !players.some((p) => matches(c.category, p, mode, limits, isNumber(c.prize))),
  );
  const unmatchedNames = [...new Set(unmatched.map((c) => c.category))];
  if (unmatchedNames.length > 0) {
    warnings.push({
      title: `No player matches ${unmatchedNames.length} categor${unmatchedNames.length > 1 ? 'ies' : 'y'}`,
      detail:
        `Nobody in the Ranklist qualifies for: ${unmatchedNames.join(', ')}. ` +
        'Category names must match the Club, Type and Gr columns exactly (F07, not F7).',
    });
  }

  const outOfOrder = players.findIndex((p, i) => i > 0 && p.rank < players[i - 1].rank);
  if (outOfOrder !== -1) {
    warnings.push({
      title: 'The Ranklist is not in rank order',
      detail:
        `Rank ${players[outOfOrder].rank} appears after rank ${players[outOfOrder - 1].rank}. ` +
        'Players are taken in row order, so an unsorted sheet gives the wrong winners.',
    });
  }

  const mainTrophy = categories.filter(
    (c) => c.category.includes('Main') && eqIgnoreCase(c.prize, 'trophy'),
  );
  if (mainTrophy.length > 0) {
    warnings.push({
      title: 'A "Main" Trophy is never awarded',
      detail:
        'The Main rule only applies to cash prizes. Give the trophy a category that matches ' +
        'a Club, Type or Gr value instead.',
    });
  }

  const oddMain = categories.filter(
    (c) => c.category.includes('Main') && !eqIgnoreCase(c.category, 'Main') && isNumber(c.prize),
  );
  if (oddMain.length > 0) {
    warnings.push({
      title: `"${oddMain[0].category}" wins money but shows an empty section`,
      detail:
        'Main winners are recorded as "MAIN", so only a category spelled exactly "Main" lists ' +
        'them in the output. Rename it to Main, Main_1, Main_2 and so on.',
    });
  }

  const falseUn = categories.filter(
    (c) => c.category.includes('Un') && !eqIgnoreCase(c.category, 'Un'),
  );
  if (falseUn.length > 0) {
    warnings.push({
      title: `"${falseUn[0].category}" is treated as the unrated prize`,
      detail:
        'Any category containing "Un" is checked against unrated players first, so a club ' +
        'named "Union" can be won by an unrated player from another club.',
    });
  }

  if (mode === MODE_2) {
    const girlsOnly = categories.filter(
      (c) => isAgeType(c.category) && extractGender(c.category) === 'F',
    );
    if (girlsOnly.length > 0) {
      warnings.push({
        title: `"${girlsOnly[0].category}" is female-only in Mode 2`,
        detail:
          'In Mode 2 an age category without a capital U matches girls only, by age. Boys can ' +
          'still win it through an exact Type match. Use U-names for open age prizes.',
      });
    }
  }

  return warnings;
}
