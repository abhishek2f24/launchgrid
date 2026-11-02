/**
 * Keeping the prize list across a page refresh.
 *
 * An organiser sets the prizes up once and then spends the afternoon coming
 * back to the page as results firm up — a refresh that wiped the list made the
 * tool feel disposable. So the rows are kept in this browser's localStorage and
 * nowhere else: it is the organiser's own machine, there is no account to put
 * them in, and nothing here is uploaded.
 *
 * The saved list is tagged with the tournament name it was typed for, because
 * the same laptop runs the next event too and inheriting last month's prizes
 * silently would be worse than starting empty.
 */

import { type PrizeRow, isComplete } from './prizePlan';

const KEY = 'chessgrid.winners.setup.v1';

export type SavedSetup = {
  /** The tournament the rows were entered for, as the export named it. */
  tournament: string | null;
  rows: PrizeRow[];
  /** ISO timestamp, shown to the organiser so they know how old it is. */
  savedAt: string;
};

/**
 * Storage is absent in a private window, full on a shared machine, and throws
 * rather than returning null in both cases, so every call here is guarded: a
 * failure to remember is never a failure to work.
 */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveSetup(tournament: string | null, rows: PrizeRow[]): void {
  const store = storage();
  if (!store) return;
  const keep = rows.filter(isComplete);
  try {
    if (keep.length === 0) {
      store.removeItem(KEY);
      return;
    }
    const setup: SavedSetup = { tournament, rows: keep, savedAt: new Date().toISOString() };
    store.setItem(KEY, JSON.stringify(setup));
  } catch {
    // A quota error must not take the page down with it.
  }
}

export function clearSetup(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** Whatever is in storage, if it still looks like a setup we wrote. */
export function readSetup(): SavedSetup | null {
  const store = storage();
  if (!store) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return parseSetup(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Exported for its own sake: this is the only place that trusts data from
 * outside the program, and an older or hand-edited value must come back as
 * null rather than as a half-built row the form then renders.
 */
export function parseSetup(value: unknown): SavedSetup | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.rows)) return null;

  const rows: PrizeRow[] = [];
  for (const entry of record.rows) {
    if (typeof entry !== 'object' || entry === null) continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.categoryKey !== 'string' || typeof row.amount !== 'string') continue;
    const id = typeof row.id === 'string' && row.id !== '' ? row.id : `row-${rows.length}`;
    rows.push({ id, categoryKey: row.categoryKey, amount: row.amount });
  }
  if (rows.length === 0) return null;

  return {
    tournament: typeof record.tournament === 'string' ? record.tournament : null,
    rows,
    savedAt: typeof record.savedAt === 'string' ? record.savedAt : '',
  };
}

/**
 * Whether a saved setup belongs to the files just dropped in. An unnamed
 * export cannot be told apart, so it is offered rather than refused.
 */
export function matchesTournament(setup: SavedSetup, tournament: string | null): boolean {
  if (!setup.tournament || !tournament) return true;
  return setup.tournament.trim().toLowerCase() === tournament.trim().toLowerCase();
}
