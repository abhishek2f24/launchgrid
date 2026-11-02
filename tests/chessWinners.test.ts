/**
 * The commercial guarantee of the chess winners tool: it must agree with the
 * ChessWinners desktop app on the same workbook. The worked example below is
 * section 8 of the specification, whose expected winners were produced by
 * running the original program's own Mode 1 and Mode 2 code. The quirk tests
 * pin the behaviours an organiser would otherwise discover at a prize
 * ceremony.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MODE_1,
  MODE_2,
  type Mode,
  type Row,
  assignPrizes,
  distribute,
  inputWarnings,
  readCategories,
  readPlayers,
  readTitle,
  stripRowNumber,
  winnersByCategory,
} from '../src/lib/chess/winners';

const SORT_ROWS: Row[] = [
  ['Prize', 'Prize Money'],
  ['Main_1', '10,000'],
  ['Main_2', '7,000'],
  ['Main_3', '5,000'],
  ['Below_1800', '2,000'],
  ['Below_1600', '1,500'],
  ['Un', '1,000'],
  ['U15', '1,000'],
  ['W', '1,000'],
  ['GOA_F', '500'],
  ['U11', 'Trophy'],
];

// Rank | SNo. | Title | Name | Gender | IRtg | Club | Age | Type | Gr | Pts
const RANK_ROWS: Row[] = [
  ['Rank', 'SNo.', 'Title', 'Name', 'Gender', 'IRtg', 'Club', 'Age', 'Type', 'Gr', 'Pts'],
  ['1', '1', 'GM', 'A', 'M', '2100', 'GOA', '30', '', '', '7.5'],
  ['2', '2', '', 'B', 'M', '1750', 'MH', '14', 'U15', '', '7'],
  ['3', '3', '', 'C', 'F', '1950', 'GOA', '25', '', '', '6.5'],
  ['4', '4', '', 'D', 'M', '1700', 'KA', '40', '', '', '6'],
  ['5', '5', '', 'E', 'M', '0', 'GOA', '12', 'U13', '', '5.5'],
  ['6', '6', '', 'F', 'F', '1550', 'GOA', '13', '', '', '5'],
  ['7', '7', '', 'G', 'M', '1500', 'KA', '10', 'U11', '', '4.5'],
  ['8', '8', '', 'H', 'M', '0', 'MH', '14', 'U15', '', '4'],
  ['9', '9', '', 'I', 'F', '1400', 'KA', '35', '', '', '3.5'],
  ['10', '10', '', 'J', 'F', '1300', 'GOA', '16', '', '', '3'],
];

/** name -> "category prize", for every player who won something. */
function run(sortRows: Row[], rankRows: Row[], mode: Mode) {
  const categories = readCategories(sortRows);
  const players = assignPrizes(categories, readPlayers(rankRows), mode);
  return Object.fromEntries(
    players
      .filter((p) => p.prizeMoney !== '0')
      .map((p) => [p.name, `${p.winningCategory} ${p.prizeMoney}`]),
  );
}

test('worked example, Mode 1', () => {
  assert.deepEqual(run(SORT_ROWS, RANK_ROWS, MODE_1), {
    A: 'MAIN 10000',
    B: 'MAIN 7000',
    C: 'MAIN 5000',
    D: 'Below_1800 2000',
    F: 'Below_1600 1500',
    E: 'Un 1000',
    H: 'U15 1000',
    I: 'W 1000',
    J: 'GOA_F 500',
    G: 'U11 Trophy',
  });
});

test('worked example, Mode 2', () => {
  assert.deepEqual(run(SORT_ROWS, RANK_ROWS, MODE_2), {
    A: 'MAIN 10000',
    B: 'MAIN 7000',
    C: 'MAIN 5000',
    D: 'Below_1800 2000',
    E: 'Below_1600 1500',
    H: 'Un 1000',
    F: 'U15 1000',
    I: 'W 1000',
    J: 'GOA_F 500',
    G: 'U11 Trophy',
  });
});

test("'sort' rows: header and blanks skipped, commas stripped, row numbers removed", () => {
  const categories = readCategories([
    ['Prize', 'Prize Money'],
    ['   ', '500'],
    ['Main_12', '10,000'],
    ['Below_1800', '2,000'],
    ['GOA_U15', 'Trophy'],
  ]);
  assert.deepEqual(categories, [
    { category: 'Main', prize: '10000' },
    { category: 'Below_1800', prize: '2000' },
    { category: 'GOA_U15', prize: 'Trophy' },
  ]);
});

test('a bare row number is not a category (quirk 9.11)', () => {
  assert.throws(() => stripRowNumber('15'), /only a row number/);
});

test('non-player rows are skipped and a bad rating names its row (quirk 9.9)', () => {
  const players = readPlayers([
    ['Ranklist for the U15 section'],
    ['Rank', 'SNo.', 'Title', 'Name', 'Gender', 'IRtg'],
    ['1', '1', '', 'A', 'M', '1800', 'GOA', '', '', '', '5'],
  ]);
  assert.equal(players.length, 1);
  assert.equal(players[0].age, 0); // blank Age becomes 0
  assert.throws(
    () => readPlayers([['1', '1', '', 'A', 'M', 'NR']]),
    /'Ranklist' row 1: rating "NR"/,
  );
});

test('gender: only F counts as female, blank is M', () => {
  const players = readPlayers([
    ['1', '', '', 'A', 'f', '0'],
    ['2', '', '', 'B', '', '0'],
    ['3', '', '', 'C', 'W', '0'],
  ]);
  assert.deepEqual(players.map((p) => p.gender), ['f', 'M', 'M']);
});

test('Main_1 and Main_2 collapse into one output section', () => {
  const categories = readCategories(SORT_ROWS);
  const players = assignPrizes(categories, readPlayers(RANK_ROWS), MODE_1);
  const sections = winnersByCategory(categories, players);
  assert.deepEqual(
    sections.map((s) => s.heading),
    ['Main', 'Below_1800', 'Below_1600', 'Un-Rated', 'U15', 'W', 'GOA_F', 'U11'],
  );
  assert.deepEqual(sections[0].winners.map((p) => p.name), ['A', 'B', 'C']);
});

test('a category with no winners still gets a section', () => {
  const sortRows: Row[] = [['Main', '1000'], ['PC', '500']];
  const categories = readCategories(sortRows);
  const players = assignPrizes(categories, readPlayers(RANK_ROWS), MODE_1);
  const pc = winnersByCategory(categories, players).find((s) => s.heading === 'PC');
  assert.deepEqual(pc, { heading: 'PC', winners: [] });
});

test('title stops at the first cell mentioning Main, and sheet names are ignored', () => {
  assert.equal(
    readTitle('Tournament', [
      ['Goa State Championship 2026'],
      ['Panaji, 2-5 January'],
      ['Main', ' Event'],
      ['should not appear'],
    ]),
    'Goa State Championship 2026\nPanaji, 2-5 January\n Event',
  );
  assert.equal(readTitle('Ranklist', [['anything']]), null);
});

test('a player keeps only the biggest prize, and the smaller one is lost (quirk 9.5)', () => {
  const sortRows: Row[] = [['U15', '500'], ['Main', '1000']];
  const categories = readCategories(sortRows);
  const players = assignPrizes(categories, readPlayers(RANK_ROWS), MODE_1);
  assert.equal(run(sortRows, RANK_ROWS, MODE_1).A, 'MAIN 1000');
  // B held U15 500 first; A took Main 1000 but B's U15 prize is not re-awarded.
  const u15 = winnersByCategory(categories, players).find((s) => s.heading === 'U15');
  assert.deepEqual(u15!.winners.map((p) => p.name), ['B']);
  assert.equal(players.filter((p) => p.prizeMoney !== '0').length, 2);
});

test('Mode 1 rating bands can leave a prize unawarded (quirk 9.6)', () => {
  const rows: Row[] = [['1', '', '', 'A', 'M', '1500', 'GOA', '', '', '', '5']];
  const sortRows: Row[] = [['Below_1800', '2000'], ['Below_1600', '1000']];
  assert.deepEqual(run(sortRows, rows, MODE_1), { A: 'Below_1600 1000' });
  // Mode 2 has no bands, so the same player takes the bigger prize.
  assert.deepEqual(run(sortRows, rows, MODE_2), { A: 'Below_1800 2000' });
});

test('any category containing "Un" is the unrated prize (quirk 9.4)', () => {
  const rows: Row[] = [
    ['1', '', '', 'Unrated from KA', 'M', '0', 'KA', '', '', '', '5'],
    ['2', '', '', 'Union member', 'M', '1600', 'Union', '', '', '', '4'],
  ];
  assert.deepEqual(run([['Union', '500']], rows, MODE_1), { 'Unrated from KA': 'Union 500' });
});

test('a Main trophy is never awarded (quirk 9.3)', () => {
  assert.deepEqual(run([['Main', 'Trophy']], RANK_ROWS, MODE_1), {});
});

test('prize text that is neither a number nor Trophy is ignored (quirk 9.10)', () => {
  assert.deepEqual(run([['Main', 'Medal'], ['Main', 'Rs 500'], ['Main', '10000.50']], RANK_ROWS, MODE_1), {});
});

test('cash below a Trophy row stops with a clear error (quirk 9.2)', () => {
  // The original only dies once it reaches a player already holding "Trophy",
  // so the trophy winner has to be the first player the cash row considers.
  const rows: Row[] = [['1', '', '', 'A', 'M', '1200', 'KA', '10', 'U11', '', '5']];
  assert.throws(
    () => run([['U11', 'Trophy'], ['Main', '1000']], rows, MODE_1),
    /Cash prize rows must come before Trophy rows/,
  );
});

test('Mode 2 age categories without a capital U are female-only (quirk 9.1)', () => {
  const rows: Row[] = [
    ['1', '', '', 'boy aged 10', 'M', '0', 'KA', '10', '', '', '5'],
    ['2', '', '', 'girl aged 11', 'F', '0', 'KA', '11', '', '', '4'],
  ];
  assert.deepEqual(run([['M12', '500']], rows, MODE_2), { 'girl aged 11': 'M12 500' });
  assert.deepEqual(run([['U12', '500']], rows, MODE_2), { 'boy aged 10': 'U12 500' });
});

test('Mode 2 club+age reads the age after the first underscore (quirk 9.12)', () => {
  const rows: Row[] = [['1', '', '', 'A', 'F', '0', 'UP', '10', '', '', '5']];
  // The U in "UP" makes UP_F10 an open prize rather than a girls-only one.
  assert.deepEqual(run([['UP_F10', '500']], rows, MODE_2), { A: 'UP_F10 500' });
});

test('W excludes girls who are in an F age group', () => {
  const rows: Row[] = [
    ['1', '', '', 'girl in F09', 'F', '1200', 'KA', '9', 'F09', '', '5'],
    ['2', '', '', 'woman, no type', 'F', '1100', 'KA', '40', '', '', '4'],
  ];
  assert.deepEqual(run([['W', '500']], rows, MODE_1), { 'woman, no type': 'W 500' });
});

test('warnings catch the sheet problems the desktop app says nothing about', () => {
  const sortRows: Row[] = [
    ['U15', '500'],
    ['Main', '1,000'],
    ['PC', 'Medal'],
    ['Main Prize', '200'],
    ['U11', 'Trophy'],
    ['Veterans', '100'],
  ];
  const categories = readCategories(sortRows);
  const titles = inputWarnings(categories, readPlayers(RANK_ROWS), MODE_1).map((w) => w.title);
  assert.deepEqual(titles, [
    'A cash prize is listed below a Trophy',
    'Prize rows are not sorted highest first',
    '1 prize row will be ignored',
    'No player matches 1 category',
    '"Main Prize" wins money but shows an empty section',
  ]);
});

test('a clean sheet produces no warnings', () => {
  assert.deepEqual(inputWarnings(readCategories(SORT_ROWS), readPlayers(RANK_ROWS), MODE_1), []);
});

test('the award log shows a prize that went to nobody', () => {
  const categories = readCategories([
    ['Main', '1000'],
    ['PC', '500'],
    ['VC', 'Medal'],
  ]);
  const { awards } = distribute(categories, readPlayers(RANK_ROWS), MODE_1);
  assert.deepEqual(
    awards.map((a) => [a.category, a.kind, a.winner?.name ?? null]),
    [
      ['Main', 'cash', 'A'],
      ['PC', 'cash', null],
      ['VC', 'ignored', null],
    ],
  );
});
