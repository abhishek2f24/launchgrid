/**
 * Readers for the files Swiss-Manager and chess-results.com actually produce.
 *
 * An organiser running a tournament already has these exports; asking them to
 * retype the data into a bespoke workbook is how a tool stops being used. Both
 * the "Final ranking" list and the "Category prizes" list share one shape:
 *
 *     Bhatt Chess Academy 12th Rapid Tournament - Open   <- tournament name
 *     Final ranking                                      <- section name
 *     age group S60                                      <- category label (prizes file only)
 *     Rank | SNo. | Name |  | Rtg | Type | Gr | Pts | …  <- column header
 *     3    | 8    | …    |  | 1732| S60  |    | 4½  | …  <- one row per player
 *     group PH                                           <- the next category
 *     …
 *     Program Swiss-Manager developed and copyright …    <- footer
 *
 * So one parser reads both: a list of blocks, each with an optional label. The
 * ranking list is simply the single unlabelled block. Columns are read by
 * HEADER NAME, not position — chess-results emits different column sets
 * depending on what the organiser enabled, and the sex column's header is
 * empty, which is exactly the kind of thing position-based reading gets wrong.
 */

/** A row of cell text, as the spreadsheet displays it. */
export type SourceRow = (string | null | undefined)[];

export type RankedPlayer = {
  /** Rank in the overall tournament, as printed — not a position within the category. */
  rank: number;
  startNo: string;
  name: string;
  /** The sex column holds "F" for female players and is blank for everyone else. */
  female: boolean;
  /** 0 means unrated. */
  rating: number;
  federation: string;
  /** From a "1993/00/00" birth column; 0 when the file has none. */
  birthYear: number;
  /** Age at the end of the tournament year, 0 when the birth year is unknown. */
  age: number;
  club: string;
  type: string;
  group: string;
  points: string;
};

export type ExportBlock = {
  /** "age group S60", or null for the plain ranking list. */
  label: string | null;
  players: RankedPlayer[];
};

export type SwissManagerExport = {
  tournament: string | null;
  /** The section line under the tournament name, e.g. "Final ranking". */
  section: string | null;
  blocks: ExportBlock[];
};

/** Section names that head the list itself rather than naming a category. */
const SECTION_LINES = [
  'final ranking',
  'final ranking crosstable',
  'interim ranking',
  'interim ranking list',
  'ranking list',
  'ranking crosstable',
  'starting rank list',
  'starting rank',
  'alphabetical list',
  'player list',
];

const FOOTER_MARKERS = ['swiss-manager', 'chess-results.com', 'swiss-manager.at'];

const text = (value: string | null | undefined) => String(value ?? '').trim();

function isBlank(row: SourceRow): boolean {
  return row.every((cell) => text(cell) === '');
}

function singleCellText(row: SourceRow): string | null {
  const filled = row.map(text).filter((cell) => cell !== '');
  return filled.length === 1 ? filled[0] : null;
}

function isHeaderRow(row: SourceRow): boolean {
  return text(row[0]).toLowerCase() === 'rank';
}

function isFooter(line: string): boolean {
  const lower = line.toLowerCase();
  return FOOTER_MARKERS.some((marker) => lower.includes(marker));
}

function isSectionLine(line: string): boolean {
  return SECTION_LINES.includes(line.toLowerCase().replace(/\s+/g, ' '));
}

/** Integer, or null when the cell is not one. */
function intOrNull(value: string): number | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

type ColumnMap = {
  rank: number;
  startNo: number;
  name: number;
  sex: number;
  rating: number;
  federation: number;
  birth: number;
  club: number;
  type: number;
  group: number;
  points: number;
};

/**
 * Which column is which, from the header row. The sex column is the unnamed
 * one straight after Name, which is how both Swiss-Manager and chess-results
 * emit it.
 */
function readColumns(header: SourceRow): ColumnMap {
  const find = (...names: string[]) =>
    header.findIndex((cell) => {
      const label = text(cell).toLowerCase().replace(/\.$/, '');
      return names.includes(label);
    });

  const name = find('name');
  let sex = -1;
  if (name !== -1 && text(header[name + 1]) === '') sex = name + 1;
  const explicitSex = find('sex', 'gender', 'g');
  if (explicitSex !== -1) sex = explicitSex;

  return {
    rank: find('rank', 'rk', 'pos'),
    startNo: find('sno', 'sno', 'no', 'startno'),
    name,
    sex,
    rating: find('rtg', 'irtg', 'rating', 'ntg', 'rtgi'),
    federation: find('fed', 'federation'),
    birth: find('birth', 'byear', 'born', 'birthday'),
    club: find('club', 'team', 'city', 'district', 'state'),
    type: find('type'),
    group: find('gr', 'grp', 'group'),
    points: find('pts', 'points'),
  };
}

/**
 * Swiss-Manager leaves the Rank cell EMPTY on the second and later players of
 * a tie — they share the rank printed above them. Dropping those rows would
 * quietly lose players, and a lost player can be the one a prize should have
 * gone to, so a nameless row is the only one skipped here.
 */
function readPlayer(
  row: SourceRow,
  columns: ColumnMap,
  year: number,
  previousRank: number,
): RankedPlayer | null {
  const at = (index: number) => (index === -1 ? '' : text(row[index]));
  const parsedRank = intOrNull(at(columns.rank));
  const name = at(columns.name);
  if (parsedRank === null && name === '') return null; // headers, labels, footers and notes
  const rank = parsedRank ?? previousRank;

  const birth = at(columns.birth);
  const birthYear = intOrNull(birth.slice(0, 4)) ?? 0;
  const rating = intOrNull(at(columns.rating).replace(/\D/g, '')) ?? 0;

  return {
    rank,
    startNo: at(columns.startNo),
    name,
    female: at(columns.sex).toLowerCase() === 'f',
    rating,
    federation: at(columns.federation),
    birthYear,
    age: birthYear > 0 && year > 0 ? year - birthYear : 0,
    club: at(columns.club),
    type: at(columns.type),
    group: at(columns.group),
    points: at(columns.points),
  };
}

/**
 * Read a Swiss-Manager / chess-results export sheet. Returns no blocks when
 * the sheet is something else entirely, which is how `detectFileKind` tells
 * these files apart from a prize-money sheet.
 */
export function parseSwissManagerExport(
  rows: SourceRow[],
  options: { year?: number } = {},
): SwissManagerExport {
  const year = options.year ?? tournamentYear(rows);
  let tournament: string | null = null;
  let section: string | null = null;
  const blocks: ExportBlock[] = [];

  let pendingLabel: string | null = null;
  let current: ExportBlock | null = null;
  let columns: ColumnMap | null = null;

  for (const row of rows) {
    if (isBlank(row)) continue;

    if (isHeaderRow(row)) {
      columns = readColumns(row);
      current = { label: pendingLabel, players: [] };
      blocks.push(current);
      pendingLabel = null;
      continue;
    }

    const line = singleCellText(row);
    if (line !== null) {
      if (isFooter(line)) {
        current = null;
        continue;
      }
      if (tournament === null && blocks.length === 0 && !isSectionLine(line)) {
        tournament = line;
        continue;
      }
      if (isSectionLine(line)) {
        if (section === null) section = line;
        continue;
      }
      pendingLabel = line; // the next header row opens this category
      current = null;
      continue;
    }

    if (current && columns) {
      const previousRank = current.players[current.players.length - 1]?.rank ?? 0;
      const player = readPlayer(row, columns, year, previousRank);
      if (player) current.players.push(player);
    }
  }

  return { tournament, section, blocks: blocks.filter((block) => block.players.length > 0) };
}

/** One row of a prize-money sheet: a category name and what it pays. */
export type PrizeMoneyRow = { category: string; prize: string };

/**
 * A two-column sheet of "category, amount" rows — the list organisers already
 * keep for their own prize table. Commas in the amount are stripped so
 * "4,500" and "4500" both read as 4500.
 */
export function parsePrizeMoney(rows: SourceRow[]): PrizeMoneyRow[] {
  const out: PrizeMoneyRow[] = [];
  for (const row of rows) {
    const category = text(row[0]);
    const prize = text(row[1]).replace(/,/g, '');
    if (category === '' || prize === '') continue;
    if (category.toLowerCase() === 'prize' && prize.toLowerCase().startsWith('prize money')) {
      continue; // header row
    }
    out.push({ category, prize });
  }
  return out;
}

export type FileKind = 'ranking' | 'category-prizes' | 'prize-money' | 'unknown';

/**
 * What kind of sheet this is. An export whose blocks are all unlabelled is a
 * ranking list; one with labelled blocks is the category-prizes list.
 */
export function detectSheetKind(rows: SourceRow[]): FileKind {
  const parsed = parseSwissManagerExport(rows);
  if (parsed.blocks.length > 0) {
    return parsed.blocks.some((block) => block.label !== null) ? 'category-prizes' : 'ranking';
  }
  const prizes = parsePrizeMoney(rows);
  const looksLikePrizes =
    prizes.length >= 2 &&
    prizes.filter((row) => /^\d+$/.test(row.prize) || /^trophy$/i.test(row.prize)).length >=
      prizes.length / 2;
  return looksLikePrizes ? 'prize-money' : 'unknown';
}

/**
 * The year the tournament was played, taken from the Swiss-Manager footer
 * ("… User:Tirthchessclub, 2025/12/11"). Used to turn a birth year into an
 * age; falls back to the current year, which is right for a file exported
 * during or just after the event.
 */
export function tournamentYear(rows: SourceRow[], now = new Date()): number {
  for (const row of rows) {
    for (const cell of row) {
      const value = text(cell);
      // Only the footer line — a player's Birth column is the same shape and
      // would otherwise make every player a newborn.
      if (!isFooter(value) && !/user:/i.test(value)) continue;
      const match = value.match(/\b(19|20)\d{2}\/\d{2}\/\d{2}\b/);
      if (match) return Number(match[0].slice(0, 4));
    }
  }
  return now.getFullYear();
}
