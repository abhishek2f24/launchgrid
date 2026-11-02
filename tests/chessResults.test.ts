/**
 * The chess-results path: reading what Swiss-Manager exports, and sharing the
 * prize fund out one prize per player.
 *
 * The fixtures copy the real shape of a chess-results export — the unnamed sex
 * column, the blank Rank cell on the second player of a tie, the per-category
 * blocks, the Swiss-Manager footer — with invented names. Every quirk pinned
 * here was found in a real tournament file, not imagined.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  type SourceRow,
  detectSheetKind,
  parsePrizeMoney,
  parseSwissManagerExport,
  tournamentYear,
} from '../src/lib/chess/swissManager';
import {
  type Category,
  allocate,
  categoryId,
  findOverall,
  parseAmounts,
  prefillFromPrizeSheet,
  ratingBand,
} from '../src/lib/chess/allocate';

const FOOTER: SourceRow[] = [
  ['Program Swiss-Manager developed and copyright © by DI.Heinz Herzog, 1130 Vienna Jodlgasse 7/4/10,'],
  ['Mail:h.herzog@swiss-manager.at,homepage http://swiss-manager.at, User:Someclub, 2025/12/11'],
  ['Details on this tournament can be found on http://chess-results.com'],
];

const RANKING_ROWS: SourceRow[] = [
  ['Example Rapid Tournament - Open'],
  ['Final ranking'],
  ['Rank', 'SNo.', 'Name', '', 'Rtg', 'FED', 'Birth', 'Type', 'Gr', 'Pts', 'BH/C1'],
  ['1', '1', 'Alpha', '', '1894', 'IND', '1993/00/00', '', '', '4½', '16'],
  ['2', '3', 'Bravo', '', '1825', 'IND', '2012/00/00', '', '', '4½', '12½'],
  ['3', '8', 'Charlie', '', '1732', 'IND', '1965/00/00', 'S60', '', '4½', '11'],
  ['4', '10', 'Delta', 'F', '1712', 'IND', '2013/00/00', '', '', '4', '13½'],
  ['5', '28', 'Echo', '', '1485', 'IND', '1958/00/00', 'S60', '', '4', '11'],
  // A tie: Swiss-Manager leaves the Rank cell empty on the second player.
  ['', '29', 'Foxtrot', 'F', '0', 'IND', '', '', 'Ph', '4', '11'],
  ['7', '31', 'Golf', '', '1445', 'IND', '2018/00/00', '', '', '3½', '11½'],
  ...FOOTER,
];

const CATEGORY_ROWS: SourceRow[] = [
  ['Example Rapid Tournament - Open'],
  ['Final ranking'],
  ['age group S60'],
  ['Rank', 'SNo.', 'Name', '', 'Rtg', 'Type', 'Gr', 'Pts'],
  ['3', '8', 'Charlie', '', '1732', 'S60', '', '4½'],
  ['5', '28', 'Echo', '', '1485', 'S60', '', '4'],
  ['best female'],
  ['Rank', 'SNo.', 'Name', '', 'Rtg', 'Type', 'Gr', 'Pts'],
  ['4', '10', 'Delta', 'F', '1712', '', '', '4'],
  ['', '29', 'Foxtrot', 'F', '0', '', 'Ph', '4'],
  ['rating between 0 and 3000'],
  ['Rank', 'SNo.', 'Name', '', 'Rtg', 'Type', 'Gr', 'Pts'],
  ['1', '1', 'Alpha', '', '1894', '', '', '4½'],
  ['2', '3', 'Bravo', '', '1825', '', '', '4½'],
  ['3', '8', 'Charlie', '', '1732', 'S60', '', '4½'],
  ...FOOTER,
];

test('a ranking export reads as one unlabelled block', () => {
  const parsed = parseSwissManagerExport(RANKING_ROWS);
  assert.equal(parsed.tournament, 'Example Rapid Tournament - Open');
  assert.equal(parsed.section, 'Final ranking');
  assert.equal(parsed.blocks.length, 1);
  assert.equal(parsed.blocks[0].label, null);
  assert.deepEqual(
    parsed.blocks[0].players.map((p) => p.name),
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'],
  );
});

test('a player tied on rank keeps the rank printed above them', () => {
  const [block] = parseSwissManagerExport(RANKING_ROWS).blocks;
  const foxtrot = block.players.find((p) => p.name === 'Foxtrot')!;
  assert.equal(foxtrot.rank, 5); // the blank Rank cell means "same as Echo"
  assert.equal(foxtrot.startNo, '29');
});

test('columns are read by header name, not position', () => {
  const [block] = parseSwissManagerExport(RANKING_ROWS).blocks;
  const charlie = block.players.find((p) => p.name === 'Charlie')!;
  assert.equal(charlie.rating, 1732);
  assert.equal(charlie.type, 'S60');
  assert.equal(charlie.federation, 'IND');
  assert.equal(charlie.birthYear, 1965);
  assert.equal(charlie.points, '4½');
  assert.equal(charlie.female, false);
  // The sex column has an EMPTY header and sits right after Name.
  assert.equal(block.players.find((p) => p.name === 'Delta')!.female, true);
});

test('an unrated player reads as rating 0, not as a missing row', () => {
  const [block] = parseSwissManagerExport(RANKING_ROWS).blocks;
  assert.equal(block.players.find((p) => p.name === 'Foxtrot')!.rating, 0);
});

test('age comes from the birth year and the export date', () => {
  assert.equal(tournamentYear(RANKING_ROWS), 2025);
  const [block] = parseSwissManagerExport(RANKING_ROWS).blocks;
  assert.equal(block.players.find((p) => p.name === 'Bravo')!.age, 2025 - 2012);
  // No birth year means no age, rather than an age of 2025.
  assert.equal(block.players.find((p) => p.name === 'Foxtrot')!.age, 0);
});

test('a category export reads as one labelled block per category', () => {
  const parsed = parseSwissManagerExport(CATEGORY_ROWS);
  assert.deepEqual(
    parsed.blocks.map((block) => [block.label, block.players.length]),
    [
      ['age group S60', 2],
      ['best female', 2],
      ['rating between 0 and 3000', 3],
    ],
  );
});

test('the Swiss-Manager footer is not mistaken for a category', () => {
  const labels = parseSwissManagerExport(CATEGORY_ROWS).blocks.map((block) => block.label);
  assert.ok(!labels.some((label) => label?.includes('Swiss-Manager')));
});

test('file kinds are told apart', () => {
  assert.equal(detectSheetKind(RANKING_ROWS), 'ranking');
  assert.equal(detectSheetKind(CATEGORY_ROWS), 'category-prizes');
  assert.equal(
    detectSheetKind([['Prize', 'Prize Money'], ['1', '4500'], ['F', '1000']]),
    'prize-money',
  );
  assert.equal(detectSheetKind([['hello', 'world'], ['a', 'b']]), 'unknown');
});

test('prize sheets skip the header and strip thousands separators', () => {
  assert.deepEqual(
    parsePrizeMoney([
      ['Prize', 'Prize Money'],
      ['1', '4,500'],
      ['', ''],
      ['S60', '1000'],
    ]),
    [
      { category: '1', prize: '4500' },
      { category: 'S60', prize: '1000' },
    ],
  );
});

test('amounts are typed however an organiser types them', () => {
  assert.deepEqual(parseAmounts('4500, 3500 2500\n2000;₹1,500'), [
    '4500',
    '3500',
    '2500',
    '2000',
    '1500',
  ]);
  assert.deepEqual(parseAmounts('   '), []);
});

// ---------- the one rule that matters ----------

function categoriesFrom(rows: SourceRow[]): Category[] {
  return parseSwissManagerExport(rows).blocks.map((block) => ({
    id: categoryId(block.label ?? 'Overall'),
    label: block.label ?? 'Overall',
    players: block.players,
  }));
}

test('a player who wins a bigger prize drops out of the other categories', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const allocation = allocate(categories, [
    { categoryId: 'rating-between-0-and-3000', amounts: ['4500', '3500', '2500'] },
    { categoryId: 'age-group-s60', amounts: ['1000'] },
    { categoryId: 'best-female', amounts: ['1000'] },
  ]);
  const won = allocation.awards.map((a) => [a.categoryId, a.place, a.winner?.name ?? null]);
  assert.deepEqual(won, [
    ['rating-between-0-and-3000', 1, 'Alpha'],
    ['rating-between-0-and-3000', 2, 'Bravo'],
    ['rating-between-0-and-3000', 3, 'Charlie'],
    // Charlie took the 2500, so the veterans' prize moves down to Echo.
    ['age-group-s60', 1, 'Echo'],
    ['best-female', 1, 'Delta'],
  ]);
  assert.equal(allocation.totalCash, 4500 + 3500 + 2500 + 1000 + 1000);
});

test('a prize nobody is left for is reported, not silently dropped', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const allocation = allocate(categories, [
    { categoryId: 'best-female', amounts: ['1000', '800', '700'] },
  ]);
  assert.deepEqual(
    allocation.awards.map((a) => a.winner?.name ?? null),
    ['Delta', 'Foxtrot', null],
  );
  assert.equal(allocation.unawarded.length, 1);
  assert.equal(allocation.unawarded[0].place, 3);
});

test('the biggest prize is handed out first, whatever order the form is in', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const allocation = allocate(categories, [
    { categoryId: 'age-group-s60', amounts: ['1000'] },
    { categoryId: 'rating-between-0-and-3000', amounts: ['4500'] },
  ]);
  // The 4500 is settled first even though the S60 row was entered first, so
  // Alpha takes it; the veterans' prize then goes to the top veteran left.
  assert.equal(allocation.awards[0].winner?.name, 'Charlie');
  assert.equal(allocation.awards[1].winner?.name, 'Alpha');
});

test('equal prizes are handed out in the order they were listed', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const allocation = allocate(categories, [
    { categoryId: 'best-female', amounts: ['1000'] },
    { categoryId: 'rating-between-0-and-3000', amounts: ['1000'] },
  ]);
  assert.deepEqual(
    allocation.awards.map((a) => a.winner?.name),
    ['Delta', 'Alpha'],
  );
});

test('trophies are handed out after every cash prize', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const allocation = allocate(categories, [
    { categoryId: 'rating-between-0-and-3000', amounts: ['Trophy'] },
    { categoryId: 'age-group-s60', amounts: ['1000'] },
  ]);
  // Charlie takes the cash first; the trophy then goes to the top player left.
  assert.deepEqual(
    allocation.awards.map((a) => [a.amount, a.winner?.name]),
    [
      ['Trophy', 'Alpha'],
      ['1000', 'Charlie'],
    ],
  );
});

// ---------- matching an organiser's own prize sheet ----------

test('the open category is found however it is labelled', () => {
  assert.equal(findOverall(categoriesFrom(CATEGORY_ROWS))?.label, 'rating between 0 and 3000');
  assert.deepEqual(ratingBand('rating between 1400 and 1499'), { from: 1400, to: 1499 });
  assert.equal(ratingBand('age group S60'), null);
});

test('a prize sheet fills the form in: numbers are places, names are categories', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const { amounts, unmatched } = prefillFromPrizeSheet(
    [
      { category: '1', prize: '4500' },
      { category: '2', prize: '3500' },
      { category: 'S60', prize: '1000' },
      { category: 'S60', prize: '800' },
      { category: 'F', prize: '1000' },
      { category: 'Veterans trophy', prize: 'Trophy' },
    ],
    categories,
  );
  assert.deepEqual(amounts, [
    { categoryId: 'age-group-s60', amounts: ['1000', '800'] },
    { categoryId: 'best-female', amounts: ['1000'] },
    { categoryId: 'rating-between-0-and-3000', amounts: ['4500', '3500'] },
  ]);
  // Nothing is guessed: a name we cannot place is handed back.
  assert.deepEqual(unmatched, [{ category: 'Veterans trophy', prize: 'Trophy' }]);
});

test('a "Below_1500" prize matches the band that ends at 1499', () => {
  const categories: Category[] = [
    { id: 'band', label: 'rating between 0 and 1499', players: [] },
    { id: 'derived', label: 'Rated below 1600', players: [] },
  ];
  const { amounts } = prefillFromPrizeSheet(
    [
      { category: 'Below_1500', prize: '1000' },
      { category: 'Below_1600', prize: '800' },
    ],
    categories,
  );
  assert.deepEqual(amounts, [
    { categoryId: 'band', amounts: ['1000'] },
    { categoryId: 'derived', amounts: ['800'] },
  ]);
});

test('Un, Ur and Unrated all mean the unrated prize', () => {
  const categories: Category[] = [{ id: 'unrated', label: 'Unrated', players: [] }];
  const { amounts, unmatched } = prefillFromPrizeSheet(
    [
      { category: 'Un', prize: '1500' },
      { category: 'Ur', prize: '1200' },
      { category: 'Unrated', prize: '1000' },
    ],
    categories,
  );
  assert.deepEqual(amounts, [{ categoryId: 'unrated', amounts: ['1500', '1200', '1000'] }]);
  assert.deepEqual(unmatched, []);
});

test('a gap in the numbered places does not shift the prizes below it', () => {
  const categories = categoriesFrom(CATEGORY_ROWS);
  const { amounts } = prefillFromPrizeSheet(
    [
      { category: '1', prize: '4500' },
      { category: '3', prize: '2500' },
    ],
    categories,
  );
  // 2nd place is missing from the sheet, so 2500 must stay the third prize.
  const overall = amounts.find((entry) => entry.categoryId === 'rating-between-0-and-3000');
  assert.deepEqual(overall?.amounts, ['4500', '2500']);
});
