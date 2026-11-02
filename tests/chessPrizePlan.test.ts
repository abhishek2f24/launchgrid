/**
 * Prizes typed on the page: naming a category by rule, and the rating bands.
 *
 * The band rule is the one an organiser will notice immediately if it breaks.
 * With prizes for "under 1600" and "under 1500" on the same list, a player
 * rated 1452 belongs to the under-1500 prize and must not appear in the
 * under-1600 one — "under 1600" means 1500 to 1599. The case is taken straight
 * from a real prize list that this tool got wrong.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { type Category, allocate } from '../src/lib/chess/allocate';
import {
  buildCatalog,
  closestLimit,
  membersOf,
  parseSpecKey,
  resolvedLabel,
  specKey,
  underLimits,
} from '../src/lib/chess/categorySpec';
import { buildPrizePlan, isComplete, newRow, seedRows } from '../src/lib/chess/prizePlan';
import { matchesTournament, parseSetup } from '../src/lib/chess/savedSetup';
import type { RankedPlayer } from '../src/lib/chess/swissManager';

function player(partial: Partial<RankedPlayer> & { rank: number; name: string }): RankedPlayer {
  return {
    startNo: String(partial.rank),
    female: false,
    rating: 0,
    federation: 'IND',
    birthYear: 0,
    age: 0,
    club: '',
    type: '',
    group: '',
    points: '4',
    ...partial,
  };
}

/** One rating per band boundary that matters, plus the 1452 from the real list. */
const RANKING: RankedPlayer[] = [
  player({ rank: 1, name: 'Alpha', rating: 1894 }),
  player({ rank: 2, name: 'Bravo', rating: 1599 }),
  player({ rank: 3, name: 'Charlie', rating: 1550, type: 'S60' }),
  player({ rank: 4, name: 'Delta', rating: 1500 }),
  player({ rank: 5, name: 'Echo', rating: 1452, female: true }),
  player({ rank: 6, name: 'Foxtrot', rating: 1200 }),
  player({ rank: 7, name: 'Golf', rating: 0, group: 'Ph' }),
  player({ rank: 8, name: 'Hotel', rating: 0, female: true }),
];

const rowsFor = (pairs: [string, string][]) =>
  pairs.map(([key, amount]) => newRow(key, amount));

// ---------- the band rule ----------

test('an under band is bounded below by the next limit declared', () => {
  const limits = underLimits([
    { kind: 'under', limit: 1600 },
    { kind: 'under', limit: 1500 },
  ]);
  assert.deepEqual(limits, [1600, 1500]);

  const under1600 = membersOf({ kind: 'under', limit: 1600 }, RANKING, [], limits);
  const under1500 = membersOf({ kind: 'under', limit: 1500 }, RANKING, [], limits);

  assert.deepEqual(
    under1600.map((p) => p.name),
    ['Bravo', 'Charlie', 'Delta'],
    '1599, 1550 and 1500 are the under-1600 band',
  );
  assert.deepEqual(
    under1500.map((p) => p.name),
    ['Echo', 'Foxtrot'],
    '1452 belongs to under 1500, not under 1600',
  );
  assert.ok(
    !under1600.some((p) => p.name === 'Echo'),
    'the 1452 player must not be in the under-1600 band',
  );
});

test('a lone under prize covers everyone below it', () => {
  const limits = underLimits([{ kind: 'under', limit: 1600 }]);
  const members = membersOf({ kind: 'under', limit: 1600 }, RANKING, [], limits);
  assert.deepEqual(
    members.map((p) => p.name),
    ['Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'],
    'with no under-1500 prize declared, 1452 is in the under-1600 prize',
  );
});

test('unrated players are in no rating band', () => {
  const limits = [1600];
  const members = membersOf({ kind: 'under', limit: 1600 }, RANKING, [], limits);
  assert.ok(!members.some((p) => p.rating === 0));
});

test('closestLimit picks the smallest limit above the rating', () => {
  assert.equal(closestLimit(1452, [1600, 1500]), 1500);
  assert.equal(closestLimit(1550, [1600, 1500]), 1600);
  assert.equal(closestLimit(1894, [1600, 1500]), null);
  assert.equal(closestLimit(1499, [1500]), 1500);
});

test('a bounded band says its real range on the printed sheet', () => {
  assert.equal(resolvedLabel({ kind: 'under', limit: 1600 }, [1600, 1500]), 'Under 1600 (1500–1599)');
  assert.equal(resolvedLabel({ kind: 'under', limit: 1500 }, [1600, 1500]), 'Under 1500');
  assert.equal(resolvedLabel({ kind: 'female' }, [1600]), 'Best female');
});

// ---------- naming a category without a spreadsheet ----------

test('the catalog offers the categories the ranking list implies', () => {
  const catalog = buildCatalog(RANKING, []);
  const labels = catalog.map((entry) => entry.label);
  assert.ok(labels.includes('Overall'));
  assert.ok(labels.includes('Best female'), 'female prizes no longer need a spreadsheet name');
  assert.ok(labels.includes('Unrated'));
  assert.ok(labels.includes('Ph'), 'the Gr column is offered, so Ph is pickable');
  assert.ok(labels.includes('S60'), 'the Type column is offered too');

  assert.equal(catalog.find((entry) => entry.label === 'Best female')?.count, 2);
  assert.equal(catalog.find((entry) => entry.label === 'Unrated')?.count, 2);
});

test('the catalog leaves out categories with nobody in them', () => {
  const noWomen = RANKING.filter((p) => !p.female);
  const labels = buildCatalog(noWomen, []).map((entry) => entry.label);
  assert.ok(!labels.includes('Best female'));
});

test('a category-prizes export is offered under its own label', () => {
  const exported: Category[] = [
    { id: 'age-group-s60', label: 'age group S60', players: [RANKING[2]] },
  ];
  const catalog = buildCatalog(RANKING, exported);
  const entry = catalog.find((candidate) => candidate.label === 'age group S60');
  assert.ok(entry);
  assert.equal(entry.key, 'export:age group S60');
  assert.deepEqual(
    membersOf({ kind: 'export', label: 'age group S60' }, RANKING, exported, []).map((p) => p.name),
    ['Charlie'],
  );
});

test('spec keys survive a round trip through storage', () => {
  for (const spec of [
    { kind: 'overall' } as const,
    { kind: 'female' } as const,
    { kind: 'unrated' } as const,
    { kind: 'under', limit: 1600 } as const,
    { kind: 'token', column: 'group', value: 'Ph' } as const,
    { kind: 'export', label: 'age group S60' } as const,
  ]) {
    assert.deepEqual(parseSpecKey(specKey(spec)), spec);
  }
});

test('a half-typed rating limit is not yet a category', () => {
  assert.equal(parseSpecKey('under:'), null);
  assert.equal(parseSpecKey('under:abc'), null);
  assert.equal(isComplete(newRow('under:', '1000')), false, 'the form must not add a row yet');
  assert.equal(isComplete(newRow('under:1600', '')), false);
  assert.equal(isComplete(newRow('under:1600', '1000')), true);
});

// ---------- rows to a plan ----------

test('rows become one category per distinct choice, in the order typed', () => {
  const plan = buildPrizePlan(
    rowsFor([
      ['overall', '4500'],
      ['overall', '3500'],
      ['female', '1000'],
      ['', '800'],
    ]),
    RANKING,
    [],
  );

  assert.deepEqual(
    plan.categories.map((category) => category.label),
    ['Overall', 'Best female'],
  );
  assert.deepEqual(plan.amounts[0], { categoryId: 'overall', amounts: ['4500', '3500'] });
  assert.equal(plan.incomplete.length, 1, 'the row with no category is reported, not dropped');
});

test('the band narrows as soon as the lower prize is added', () => {
  const before = buildPrizePlan(rowsFor([['under:1600', '1000']]), RANKING, []);
  assert.equal(before.categories[0].players.length, 5);

  const after = buildPrizePlan(
    rowsFor([
      ['under:1600', '1000'],
      ['under:1500', '800'],
    ]),
    RANKING,
    [],
  );
  assert.equal(after.categories[0].label, 'Under 1600 (1500–1599)');
  assert.deepEqual(
    after.categories[0].players.map((p) => p.name),
    ['Bravo', 'Charlie', 'Delta'],
  );
});

test('the 1452 player takes the under-1500 prize, not the under-1600 one', () => {
  const plan = buildPrizePlan(
    rowsFor([
      ['overall', '4500'],
      ['under:1600', '1000'],
      ['under:1500', '800'],
    ]),
    RANKING,
    [],
  );
  const allocation = allocate(plan.categories, plan.amounts);

  const under1600 = allocation.awards.find((award) => award.categoryId === 'under:1600');
  const under1500 = allocation.awards.find((award) => award.categoryId === 'under:1500');
  assert.equal(under1600?.winner?.name, 'Bravo', '1599 is the best player under 1600');
  assert.equal(under1500?.winner?.name, 'Echo', 'the 1452 player wins the under-1500 prize');
  assert.equal(allocation.totalCash, 6300);
});

test('a player still takes only their biggest prize across bands', () => {
  // Bravo is 2nd overall, so the under-1600 prize moves down to Charlie.
  const plan = buildPrizePlan(
    rowsFor([
      ['overall', '4500'],
      ['overall', '3500'],
      ['under:1600', '1000'],
    ]),
    RANKING,
    [],
  );
  const allocation = allocate(plan.categories, plan.amounts);
  assert.equal(
    allocation.awards.find((award) => award.categoryId === 'under:1600')?.winner?.name,
    'Charlie',
  );
});

test('two rows for the same band are that band’s 1st and 2nd prize', () => {
  const plan = buildPrizePlan(
    rowsFor([
      ['under:1600', '1000'],
      ['under:1600', '800'],
    ]),
    RANKING,
    [],
  );
  assert.equal(plan.categories.length, 1);
  const allocation = allocate(plan.categories, plan.amounts);
  assert.deepEqual(
    allocation.awards.map((award) => [award.place, award.winner?.name]),
    [
      [1, 'Bravo'],
      [2, 'Charlie'],
    ],
  );
});

// ---------- seeding from a prize sheet that was dropped in anyway ----------

test('an unplaceable amount arrives as a row with no category', () => {
  const rows = seedRows(
    [{ categoryId: 'overall', amounts: ['4500', '3500'] }],
    [{ id: 'overall', label: 'Overall', players: RANKING }],
    ['1000'],
  );
  assert.deepEqual(
    rows.map((row) => [row.categoryKey, row.amount]),
    [
      ['overall', '4500'],
      ['overall', '3500'],
      ['', '1000'],
    ],
  );
});

test('a derived "Rated below 1500" category seeds a real rating band', () => {
  const rows = seedRows(
    [{ categoryId: 'rated-below-1500', amounts: ['800'] }],
    [{ id: 'rated-below-1500', label: 'Rated below 1500', players: [] }],
    [],
  );
  assert.equal(rows[0].categoryKey, 'under:1500');
});

// ---------- what gets remembered ----------

test('a saved setup is only restored for the tournament it was typed for', () => {
  const setup = { tournament: 'Example Rapid - Open', rows: [newRow('overall', '4500')], savedAt: '' };
  assert.equal(matchesTournament(setup, 'Example Rapid - Open'), true);
  assert.equal(matchesTournament(setup, 'example rapid - open'), true);
  assert.equal(matchesTournament(setup, 'Other Event 2026'), false);
  assert.equal(matchesTournament(setup, null), true, 'an unnamed export is offered, not refused');
});

test('a damaged saved setup comes back as nothing', () => {
  assert.equal(parseSetup(null), null);
  assert.equal(parseSetup({ rows: 'nope' }), null);
  assert.equal(parseSetup({ rows: [] }), null);
  assert.equal(parseSetup({ rows: [{ categoryKey: 'overall' }] }), null, 'no amount, no row');

  const good = parseSetup({
    tournament: 'X',
    rows: [{ id: 'r1', categoryKey: 'overall', amount: '4500' }],
    savedAt: '2026-11-02T10:00:00.000Z',
  });
  assert.equal(good?.rows.length, 1);
  assert.equal(good?.rows[0].amount, '4500');
});
