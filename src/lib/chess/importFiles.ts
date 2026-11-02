/**
 * Turning the files an organiser drops in into a prize plan.
 *
 * The organiser has three things, in whatever combination they kept:
 *   - the chess-results "Category prizes" export: who is in each category,
 *     already ranked, but truncated to the places chess-results printed;
 *   - the chess-results ranking list: every player, with Type, Gr and rating;
 *   - their own prize sheet: category name and amount, one row per prize.
 *
 * None of those alone is enough, and none of them is in our vocabulary, so
 * this module reconciles them: it reads each file, extends the truncated
 * category lists from the full ranking, invents the categories an organiser's
 * prize sheet implies but chess-results never printed (unrated, "Below_1500"),
 * and fills in the prize amounts where the match is certain. Where it is not
 * certain it says so instead of guessing — a wrong prefill is much harder to
 * notice than an empty box.
 */

import {
  type Category,
  type CategoryAmounts,
  OVERALL_LABEL,
  categoryId,
  prefillFromPrizeSheet,
  ratingBand,
} from './allocate';
import { type LoadedSheet, readSheets } from './readSheet';
import {
  type PrizeMoneyRow,
  type RankedPlayer,
  type SourceRow,
  detectSheetKind,
  parsePrizeMoney,
  parseSwissManagerExport,
  tournamentYear,
} from './swissManager';

export type RecognisedKind =
  | 'ranking'
  | 'category-prizes'
  | 'prize-money'
  | 'chesswinners-workbook'
  | 'unknown';

export type RecognisedFile = {
  fileName: string;
  kind: RecognisedKind;
  /** One line for the user: what we found in it. */
  detail: string;
};

export type LegacyWorkbook = { sortRows: SourceRow[]; rankRows: SourceRow[]; titleSheet: LoadedSheet };

export type ImportResult = {
  files: RecognisedFile[];
  tournament: string | null;
  categories: Category[];
  amounts: CategoryAmounts[];
  ranking: RankedPlayer[];
  /** Prize rows we would not place without guessing. */
  unmatched: PrizeMoneyRow[];
  /** Things the organiser should know, in plain words. */
  notes: string[];
  /** Set when a ChessWinners-format workbook was dropped instead. */
  legacy: LegacyWorkbook | null;
};

export async function importFiles(
  files: { name: string; data: ArrayBuffer }[],
): Promise<ImportResult> {
  const recognised: RecognisedFile[] = [];
  let tournament: string | null = null;
  let categorySheet: SourceRow[] | null = null;
  let rankingSheet: SourceRow[] | null = null;
  let prizeRows: PrizeMoneyRow[] = [];
  let legacy: LegacyWorkbook | null = null;
  let legacyFile: RecognisedFile | null = null;

  for (const file of files) {
    const sheets = await readSheets(file.data);

    // A ChessWinners workbook carries both halves: a prize list and a player
    // list. Which half we want depends on what else was dropped in, so hold
    // on to it and decide once every file has been read.
    const sort = sheets.find((sheet) => sheet.name.toLowerCase() === 'sort');
    const rank = sheets.find((sheet) => sheet.name.toLowerCase() === 'ranklist');
    if (sort && rank) {
      legacy = { sortRows: sort.rows, rankRows: rank.rows, titleSheet: sheets[0] };
      legacyFile = { fileName: file.name, kind: 'chesswinners-workbook', detail: '' };
      recognised.push(legacyFile);
      continue;
    }

    let kind: RecognisedKind = 'unknown';
    let detail = 'not recognised — is it a chess-results export or a prize list?';
    for (const sheet of sheets) {
      const sheetKind = detectSheetKind(sheet.rows);
      if (sheetKind === 'unknown') continue;
      const parsed = parseSwissManagerExport(sheet.rows);
      tournament = tournament ?? parsed.tournament;
      if (sheetKind === 'category-prizes') {
        categorySheet = sheet.rows;
        kind = 'category-prizes';
        detail = `${parsed.blocks.length} categories`;
      } else if (sheetKind === 'ranking') {
        rankingSheet = sheet.rows;
        kind = 'ranking';
        detail = `${parsed.blocks[0]?.players.length ?? 0} players`;
      } else {
        const rows = parsePrizeMoney(sheet.rows);
        prizeRows = prizeRows.concat(rows);
        kind = 'prize-money';
        detail = `${rows.length} prizes`;
      }
      break;
    }
    recognised.push({ fileName: file.name, kind, detail });
  }

  const hasChessResults = categorySheet !== null || rankingSheet !== null;
  if (legacy && !hasChessResults) {
    legacyFile!.detail = "a ChessWinners workbook with 'sort' and 'Ranklist' sheets";
    return {
      files: recognised,
      tournament,
      categories: [],
      amounts: [],
      ranking: [],
      unmatched: [],
      notes: [],
      legacy,
    };
  }

  if (legacy) {
    // Alongside a chess-results export, the workbook is useful for its prize
    // list; its Ranklist sheet is a pasted copy of the export we already have.
    const rows = parsePrizeMoney(legacy.sortRows);
    prizeRows = prizeRows.concat(rows);
    if (!rankingSheet) rankingSheet = legacy.rankRows;
    legacyFile!.kind = 'prize-money';
    legacyFile!.detail = `${rows.length} prizes, from its 'sort' sheet`;
    legacy = null;
  }

  const year = tournamentYear(categorySheet ?? rankingSheet ?? []);
  const ranking = rankingSheet
    ? (parseSwissManagerExport(rankingSheet, { year }).blocks[0]?.players ?? [])
    : [];

  let categories = buildCategories(categorySheet, year);
  const notes: string[] = [];

  // Extend first: a chess-results category list is truncated to the places it
  // printed, so whether a category covers the whole field can only be judged
  // after the ranking has filled it back in.
  if (ranking.length > 0 && categories.length > 0) {
    categories = categories.map((category) => extendFromRanking(category, ranking, notes));
  }
  categories = withOverall(categories, ranking);

  const { amounts, unmatched, extraCategories, prefillNotes } = planPrizes(
    categories,
    prizeRows,
    ranking,
  );
  categories = [...categories, ...extraCategories];
  notes.push(...prefillNotes);

  return {
    files: recognised,
    tournament,
    categories,
    amounts,
    ranking,
    unmatched,
    notes,
    legacy: null,
  };
}

function buildCategories(categorySheet: SourceRow[] | null, year: number): Category[] {
  const categories: Category[] = [];

  if (categorySheet) {
    const parsed = parseSwissManagerExport(categorySheet, { year });
    for (const block of parsed.blocks) {
      const label = openLabel(block.label);
      categories.push({ id: categoryId(label), label, players: block.players });
    }
  }

  return dedupe(categories);
}

/**
 * Organisers set the open prize up as a rating band covering everybody, so
 * chess-results labels it "rating between 0 and 3000". Nobody prints that on a
 * prize list.
 */
function openLabel(label: string | null): string {
  if (label === null) return OVERALL_LABEL;
  const band = ratingBand(label);
  return band && band.from === 0 && band.to >= 2500 ? OVERALL_LABEL : label;
}

/** With only a ranking list, the tournament itself is the one honest category. */
function withOverall(categories: Category[], ranking: RankedPlayer[]): Category[] {
  if (ranking.length === 0) return categories;
  const coversEveryone = categories.some((category) => category.players.length >= ranking.length);
  if (coversEveryone) return categories;
  return [
    { id: categoryId(OVERALL_LABEL), label: OVERALL_LABEL, players: ranking },
    ...categories,
  ];
}

function dedupe(categories: Category[]): Category[] {
  const seen = new Set<string>();
  return categories.filter((category) => {
    if (seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}

/**
 * chess-results prints only as many players per category as the organiser set
 * prize ranks for. With one prize per player, those lists run out: five of the
 * six veterans can end up holding bigger prizes and the sixth S60 prize then
 * goes to nobody, even though a seventh veteran played. Where the label says
 * what the category means, the full ranking fills the list back in.
 */
function extendFromRanking(
  category: Category,
  ranking: RankedPlayer[],
  notes: string[],
): Category {
  const predicate = categoryPredicate(category.label, category.players);
  if (!predicate) {
    notes.push(
      `"${category.label}" is only as deep as your category-prizes export (${category.players.length} players), ` +
        'because its rule could not be read from the label. If a prize there goes to nobody, that is why.',
    );
    return category;
  }

  const known = new Set(category.players.map((player) => player.startNo || `#${player.rank}`));
  const extra = ranking.filter(
    (player) => predicate(player) && !known.has(player.startNo || `#${player.rank}`),
  );
  if (extra.length === 0) return category;

  return {
    ...category,
    players: [...category.players, ...extra].sort((a, b) => a.rank - b.rank),
  };
}

/** What the chess-results label means, where it means something checkable. */
function categoryPredicate(
  label: string,
  members: RankedPlayer[],
): ((player: RankedPlayer) => boolean) | null {
  const lower = label.toLowerCase();

  if (label === OVERALL_LABEL) return () => true;

  const band = ratingBand(label);
  if (band) return (player) => player.rating >= band.from && player.rating <= band.to;

  if (lower.includes('female') || lower.includes('women') || lower.includes('girl')) {
    return (player) => player.female;
  }

  // "age group S60" and "group PH" name a value of the Type or Gr column, and
  // the players already in the block tell us which column that is.
  const token = lower.replace(/^(age\s+)?group\s+/, '').trim();
  if (token !== '' && members.length > 0) {
    if (members.every((player) => player.type.toLowerCase() === token)) {
      return (player) => player.type.toLowerCase() === token;
    }
    if (members.every((player) => player.group.toLowerCase() === token)) {
      return (player) => player.group.toLowerCase() === token;
    }
  }

  return null;
}

/**
 * Match the organiser's prize sheet to the categories, and invent the ones
 * their sheet clearly implies but chess-results never printed.
 */
function planPrizes(
  categories: Category[],
  prizeRows: PrizeMoneyRow[],
  ranking: RankedPlayer[],
): {
  amounts: CategoryAmounts[];
  unmatched: PrizeMoneyRow[];
  extraCategories: Category[];
  prefillNotes: string[];
} {
  if (prizeRows.length === 0) {
    return { amounts: [], unmatched: [], extraCategories: [], prefillNotes: [] };
  }

  const extraCategories: DerivedCategory[] = [];
  const prefillNotes: string[] = [];
  const first = prefillFromPrizeSheet(prizeRows, categories);

  if (ranking.length > 0 && first.unmatched.length > 0) {
    for (const category of derivedCategories(first.unmatched, ranking)) {
      if (categories.some((existing) => existing.id === category.id)) continue;
      extraCategories.push(category);
      prefillNotes.push(
        `Your prize sheet asks for "${category.sourceName}" prizes, which your category-prizes export does not ` +
          `contain. "${category.label}" was built from the ranking list instead — check it before printing.`,
      );
    }
  }

  const all: Category[] = [...categories, ...extraCategories];
  const second = prefillFromPrizeSheet(prizeRows, all);

  if (second.unmatched.length > 0) {
    prefillNotes.push(
      `${second.unmatched.length} prize row${second.unmatched.length > 1 ? 's' : ''} could not be matched to a ` +
        'category. Add those amounts yourself, to the right category.',
    );
  }

  return {
    amounts: second.amounts,
    unmatched: second.unmatched,
    // `sourceName` is only used for the note above; the form wants a plain Category.
    extraCategories: extraCategories.map((category) => ({
      id: category.id,
      label: category.label,
      players: category.players,
    })),
    prefillNotes,
  };
}

type DerivedCategory = Category & { sourceName: string };

/**
 * Categories implied by prize names that chess-results did not print:
 * "Un"/"Ur"/"Unrated" prizes, and "Below_1500" style rating prizes whose
 * bounds do not line up with the bands the export used.
 */
function derivedCategories(
  unmatched: PrizeMoneyRow[],
  ranking: RankedPlayer[],
): DerivedCategory[] {
  const derived: DerivedCategory[] = [];
  const add = (category: DerivedCategory) => {
    if (!derived.some((existing) => existing.id === category.id)) derived.push(category);
  };

  for (const row of unmatched) {
    const name = row.category.trim();
    const lower = name.toLowerCase();

    if (['un', 'ur', 'unr', 'unrated'].includes(lower)) {
      const players = ranking.filter((player) => player.rating === 0);
      if (players.length > 0) {
        add({
          id: categoryId('Unrated'),
          label: 'Unrated',
          players,
          sourceName: name,
        });
      }
      continue;
    }

    const below = lower.match(/^(?:below|under|u)[_\s-]?(\d{3,4})$/);
    if (below) {
      const limit = Number(below[1]);
      // Unrated players are not "below 1500" — they have no rating to compare.
      const players = ranking.filter((player) => player.rating > 0 && player.rating < limit);
      if (players.length > 0) {
        add({
          id: categoryId(`Rated below ${limit}`),
          label: `Rated below ${limit}`,
          players,
          sourceName: name,
        });
      }
    }
  }

  return derived;
}
