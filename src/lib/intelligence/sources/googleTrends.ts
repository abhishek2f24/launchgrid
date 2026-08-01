// Google Trends — the first free demand evidence source.
//
// WHY THIS SOURCE FIRST
//   The V2 audit found demandScore carried 15% of the flagship score with no data source
//   at all. Keepa answers demand properly but costs ~₹5,000/month; this costs nothing.
//   It does not fill the hole — it makes a dent in it, honestly labelled.
//
// WHAT THIS IS NOT — read before using any number from here
//   Google Trends returns a RELATIVE INTEREST INDEX (0–100), normalised within the query
//   and timeframe. It is NOT search volume. An index of 68 does not mean 68 anything.
//   Two products cannot be compared unless they were queried together in one request.
//
//   This limitation is attached to every claim as an explicit assumption rather than
//   buried here, because "search interest 68" reads like a measurement of demand and a
//   merchant will treat it as one.
//
// ENDPOINT STABILITY
//   There is no official Trends API. This uses the same undocumented endpoints pytrends
//   uses: a token handshake against /trends/api/explore, then /widgetdata/multiline.
//   Google may change or rate-limit these without notice, so every failure path returns
//   an unknown claim rather than throwing — a broken source must degrade the report, not
//   break it.

import {
  known,
  unknown,
  type Claim,
  type EvidenceRef,
  type Assumption,
} from '../claim.ts';

export const TRENDS_PARSER_VERSION = 'google-trends-multiline@1.0.0';

/** Google's JSON responses are prefixed with an anti-JSON-hijacking guard. */
const XSSI_PREFIX = /^\)\]\}'?,?\n?/;

export interface TimelinePoint {
  /** Unix seconds, as Google returns it. */
  time: number;
  /** 0–100 relative interest. */
  value: number;
}

export interface TrendsSeries {
  query: string;
  geo: string;
  points: TimelinePoint[];
}

/**
 * The assumption every Trends-derived claim must carry.
 *
 * Stated as an assumption rather than reflected in confidence: we are confident in the
 * measurement (it is Google's own data), we are constrained in what it means.
 */
export const RELATIVE_INDEX_ASSUMPTION: Assumption = {
  what: 'Google Trends reports relative search interest (0–100), not search volume',
  source: 'api',
  impactIfWrong:
    'Cannot be converted to units sold or absolute demand; comparable only within this query',
};

// ---------------------------------------------------------------------------
// Parsing — pure, so it is testable without network
// ---------------------------------------------------------------------------

export function stripXssiPrefix(text: string): string {
  return text.replace(XSSI_PREFIX, '');
}

/** Pulls the TIMESERIES widget token out of an /explore response. */
export function extractTimeseriesToken(
  exploreBody: string,
): { token: string; request: unknown } | null {
  try {
    const parsed = JSON.parse(stripXssiPrefix(exploreBody)) as {
      widgets?: { id?: string; token?: string; request?: unknown }[];
    };
    const widget = parsed.widgets?.find((w) => w.id === 'TIMESERIES');
    if (!widget?.token || !widget.request) return null;
    return { token: widget.token, request: widget.request };
  } catch {
    return null;
  }
}

/**
 * Parses the timeline payload.
 *
 * Returns [] rather than throwing on anything unexpected — a shape change upstream must
 * surface as "unknown demand", never as a crash inside a paid report.
 */
export function parseTimeline(multilineBody: string): TimelinePoint[] {
  try {
    const parsed = JSON.parse(stripXssiPrefix(multilineBody)) as {
      default?: { timelineData?: { time?: string; value?: number[] }[] };
    };
    const rows = parsed.default?.timelineData ?? [];
    return rows
      .map((r) => ({ time: Number(r.time), value: Number(r.value?.[0]) }))
      .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/** Below this many points the series cannot support a trend or seasonality read. */
export const MIN_POINTS_FOR_TREND = 26; // ~6 months of weekly data
export const MIN_POINTS_FOR_SEASONALITY = 52; // a full year

export type TrendDirection = 'rising' | 'stable' | 'falling';

/** ±15% between adjacent halves is the band below which weekly noise dominates. */
export const TREND_CHANGE_THRESHOLD = 0.15;

export function trendDirection(points: TimelinePoint[]): { direction: TrendDirection; changePct: number } | null {
  if (points.length < MIN_POINTS_FOR_TREND) return null;

  const half = Math.floor(points.length / 2);
  const mean = (xs: TimelinePoint[]) => xs.reduce((a, b) => a + b.value, 0) / (xs.length || 1);
  const earlier = mean(points.slice(0, half));
  const later = mean(points.slice(half));

  // An earlier mean of zero cannot produce a meaningful ratio.
  if (earlier <= 0) return null;

  const changePct = (later - earlier) / earlier;
  const direction: TrendDirection =
    changePct > TREND_CHANGE_THRESHOLD ? 'rising'
      : changePct < -TREND_CHANGE_THRESHOLD ? 'falling'
        : 'stable';

  return { direction, changePct: Number(changePct.toFixed(3)) };
}

/** A month must exceed the annual mean by this much to count as a genuine peak. */
export const SEASONAL_PEAK_RATIO = 1.4;

export function seasonality(
  points: TimelinePoint[],
): { seasonal: boolean; peakMonths: number[]; peakRatio: number } | null {
  if (points.length < MIN_POINTS_FOR_SEASONALITY) return null;

  const byMonth = new Map<number, number[]>();
  for (const p of points) {
    const month = new Date(p.time * 1000).getUTCMonth();
    byMonth.set(month, [...(byMonth.get(month) ?? []), p.value]);
  }
  if (byMonth.size < 12) return null;

  const monthMeans = [...byMonth.entries()].map(([m, vals]) => ({
    month: m,
    mean: vals.reduce((a, b) => a + b, 0) / vals.length,
  }));

  const overall = monthMeans.reduce((a, b) => a + b.mean, 0) / monthMeans.length;
  if (overall <= 0) return null;

  const peaks = monthMeans.filter((m) => m.mean / overall >= SEASONAL_PEAK_RATIO);
  const peakRatio = Math.max(...monthMeans.map((m) => m.mean)) / overall;

  return {
    seasonal: peaks.length > 0,
    peakMonths: peaks.map((p) => p.month).sort((a, b) => a - b),
    peakRatio: Number(peakRatio.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

/**
 * Confidence in a Trends observation.
 *
 * Deliberately below the 0.95 that `api` normally earns: the endpoint is undocumented
 * and can change shape without notice, and the series is a sampled index rather than a
 * census. The *meaning* limitation (relative, not absolute) is carried as an assumption,
 * not as reduced confidence — those are different things and conflating them would make
 * the number look shakier than it is.
 */
export const TRENDS_CONFIDENCE = 0.75;

function evidenceRef(id: string, predicate: string, value: unknown, observedAt: string): EvidenceRef {
  return {
    id,
    predicate,
    value,
    method: 'api',
    confidence: TRENDS_CONFIDENCE,
    observedAt,
    ttlDays: 14,
    parserVersion: TRENDS_PARSER_VERSION,
  };
}

export interface TrendClaims {
  searchInterest: Claim<number>;
  trend: Claim<{ direction: TrendDirection; changePct: number }>;
  seasonality: Claim<{ seasonal: boolean; peakMonths: number[]; peakRatio: number }>;
}

/**
 * Derives claims from a series. `evidenceIdFor` maps a predicate to the id of the
 * evidence row already persisted for it, so claims cite real stored observations rather
 * than inventing references.
 */
export function deriveTrendClaims(
  series: TrendsSeries,
  evidenceIdFor: (predicate: string) => string | null,
  observedAt = new Date().toISOString(),
): TrendClaims {
  const { query, points } = series;

  // An empty series and an all-zero series both mean "Google has too little data for
  // this term". That is UNKNOWN, never zero interest — reporting 0 would read as
  // "nobody searches this", a much stronger claim than we can make.
  const hasSignal = points.length > 0 && points.some((p) => p.value > 0);

  if (!hasSignal) {
    const reason =
      points.length === 0
        ? 'Google Trends returned no data for this term'
        : 'Search volume too low for Google Trends to report';
    return {
      searchInterest: unknown('search_interest', TRENDS_PARSER_VERSION, reason),
      trend: unknown('trend_direction', TRENDS_PARSER_VERSION, reason),
      seasonality: unknown('seasonality', TRENDS_PARSER_VERSION, reason),
    };
  }

  const idOr = (p: string) => evidenceIdFor(p);

  // --- current interest ---
  const recent = points.slice(-4);
  const latest = Math.round(recent.reduce((a, b) => a + b.value, 0) / recent.length);
  const siId = idOr('search_interest');
  const searchInterest = siId
    ? known<number>({
        predicate: 'search_interest',
        value: latest,
        unit: 'index_0_100',
        evidence: [evidenceRef(siId, 'search_interest', latest, observedAt)],
        expectedEvidenceCount: 1,
        derivedBy: TRENDS_PARSER_VERSION,
        assumptions: [RELATIVE_INDEX_ASSUMPTION],
      })
    : unknown<number>('search_interest', TRENDS_PARSER_VERSION, 'Evidence not persisted');

  // --- direction ---
  const dir = trendDirection(points);
  const trId = idOr('trend_direction');
  const trend = dir && trId
    ? known({
        predicate: 'trend_direction',
        value: dir,
        evidence: [evidenceRef(trId, 'trend_direction', dir, observedAt)],
        expectedEvidenceCount: 1,
        derivedBy: TRENDS_PARSER_VERSION,
        assumptions: [RELATIVE_INDEX_ASSUMPTION],
      })
    : unknown<{ direction: TrendDirection; changePct: number }>(
        'trend_direction',
        TRENDS_PARSER_VERSION,
        `Need ${MIN_POINTS_FOR_TREND}+ data points to read a trend; have ${points.length}`,
      );

  // --- seasonality ---
  const seas = seasonality(points);
  const seId = idOr('seasonality');
  const seasonalityClaim = seas && seId
    ? known({
        predicate: 'seasonality',
        value: seas,
        evidence: [evidenceRef(seId, 'seasonality', seas, observedAt)],
        expectedEvidenceCount: 1,
        derivedBy: TRENDS_PARSER_VERSION,
        assumptions: [
          RELATIVE_INDEX_ASSUMPTION,
          {
            what: 'Seasonality inferred from a single year of data',
            source: 'inferred',
            impactIfWrong: 'One unusual year (a launch, a news spike) can look like a season',
          },
        ],
      })
    : unknown<{ seasonal: boolean; peakMonths: number[]; peakRatio: number }>(
        'seasonality',
        TRENDS_PARSER_VERSION,
        `Need a full year (${MIN_POINTS_FOR_SEASONALITY}+ points) to read seasonality; have ${points.length}`,
      );

  return { searchInterest, trend, seasonality: seasonalityClaim };
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export interface FetchTrendsOptions {
  geo?: string;
  timeframe?: string;
  timeoutMs?: number;
  /** Injected in tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /**
   * Reuse a previously primed cookie. Worth passing across a batch: one priming request
   * serves many queries, and every avoided request is one less step toward a real
   * rate limit.
   */
  cookie?: string;
}

/**
 * Fetches the session cookie Trends expects before it will serve its API.
 *
 * Returns '' on any failure rather than throwing — if priming fails the caller should
 * still attempt the request and surface Google's own status, not an error of our making.
 */
export async function primeSessionCookie(
  doFetch: typeof fetch,
  headers: Record<string, string>,
): Promise<string> {
  try {
    const res = await doFetch('https://trends.google.com/trends/?geo=IN', { headers });
    const raw = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter((c): c is string => !!c);
    return raw.map((c) => c.split(';')[0]).join('; ');
  } catch {
    return '';
  }
}

export class TrendsUnavailableError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'TrendsUnavailableError';
    this.retryable = retryable;
  }
}

/**
 * Two-step handshake: /explore returns widget tokens, /widgetdata/multiline returns the
 * series. Both are undocumented.
 *
 * Rate limiting is real and aggressive — Trends returns 429 readily. Callers must space
 * requests out; there is deliberately no retry loop here, because retrying into a 429 is
 * how an IP gets a longer ban.
 */
export async function fetchTrends(
  query: string,
  opts: FetchTrendsOptions = {},
): Promise<TrendsSeries> {
  const geo = opts.geo ?? 'IN';
  const timeframe = opts.timeframe ?? 'today 12-m';
  const doFetch = opts.fetchImpl ?? fetch;
  const hl = 'en-IN';
  const tz = -330; // IST

  const baseHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
    'Accept-Language': 'en-IN,en;q=0.9',
  };

  // Trends rejects a cold client with 429 on the very first request — measured, not
  // assumed. It is not rate limiting in the usual sense: it wants the NID session cookie
  // a browser picks up on its first page view. Priming it is the ordinary browser flow,
  // and it turns an immediate 429 into a 200.
  const cookie = opts.cookie ?? (await primeSessionCookie(doFetch, baseHeaders));
  const headers = cookie ? { ...baseHeaders, Cookie: cookie } : baseHeaders;

  const exploreReq = {
    comparisonItem: [{ keyword: query, geo, time: timeframe }],
    category: 0,
    property: '',
  };
  const exploreUrl =
    `https://trends.google.com/trends/api/explore?hl=${hl}&tz=${tz}` +
    `&req=${encodeURIComponent(JSON.stringify(exploreReq))}`;

  const exploreRes = await doFetch(exploreUrl, { headers });
  if (exploreRes.status === 429) {
    throw new TrendsUnavailableError('Google Trends rate limited (429)', true);
  }
  if (!exploreRes.ok) {
    throw new TrendsUnavailableError(`Trends explore failed (${exploreRes.status})`, exploreRes.status >= 500);
  }

  const widget = extractTimeseriesToken(await exploreRes.text());
  if (!widget) {
    // Shape change or a soft block. Not retryable — retrying an unparseable response
    // just burns requests toward a rate limit.
    throw new TrendsUnavailableError('No TIMESERIES widget in Trends response', false);
  }

  const dataUrl =
    `https://trends.google.com/trends/api/widgetdata/multiline?hl=${hl}&tz=${tz}` +
    `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`;

  const dataRes = await doFetch(dataUrl, { headers });
  if (dataRes.status === 429) {
    throw new TrendsUnavailableError('Google Trends rate limited (429)', true);
  }
  if (!dataRes.ok) {
    throw new TrendsUnavailableError(`Trends timeline failed (${dataRes.status})`, dataRes.status >= 500);
  }

  return { query, geo, points: parseTimeline(await dataRes.text()) };
}
