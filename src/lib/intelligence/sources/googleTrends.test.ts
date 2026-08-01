// Google Trends tests.
//
// Run with:  node --test src/lib/intelligence/sources/googleTrends.test.ts
//
// Parsing and derivation are pure, so none of this needs the network. The live endpoint
// is exercised separately by scripts/probe-google-trends.mjs, because an undocumented
// endpoint must never be able to fail a unit suite.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripXssiPrefix,
  extractTimeseriesToken,
  parseTimeline,
  trendDirection,
  seasonality,
  deriveTrendClaims,
  fetchTrends,
  TrendsUnavailableError,
  MIN_POINTS_FOR_TREND,
  type TimelinePoint,
} from './googleTrends.ts';

const WEEK = 7 * 86400;
const start = Math.floor(Date.UTC(2025, 7, 1) / 1000);

/** Builds a weekly series from raw values. */
const series = (values: number[]): TimelinePoint[] =>
  values.map((value, i) => ({ time: start + i * WEEK, value }));

/** A full year of weekly points, `shape` mapping week index → value. */
const year = (shape: (weekIndex: number) => number): TimelinePoint[] =>
  Array.from({ length: 53 }, (_, i) => ({ time: start + i * WEEK, value: shape(i) }));

const idFor = (p: string) => `ev_${p}`;

describe('response parsing', () => {
  it('strips the anti-hijacking prefix', () => {
    assert.equal(stripXssiPrefix(")]}'\n{\"a\":1}"), '{"a":1}');
    assert.equal(stripXssiPrefix(")]}',\n{\"a\":1}"), '{"a":1}');
  });

  it('finds the TIMESERIES widget token', () => {
    const body = ")]}'\n" + JSON.stringify({
      widgets: [
        { id: 'RELATED_QUERIES', token: 'nope', request: {} },
        { id: 'TIMESERIES', token: 'tok123', request: { time: 'today 12-m' } },
      ],
    });
    assert.deepEqual(extractTimeseriesToken(body), { token: 'tok123', request: { time: 'today 12-m' } });
  });

  it('returns null when the widget is absent rather than throwing', () => {
    assert.equal(extractTimeseriesToken(")]}'\n" + JSON.stringify({ widgets: [] })), null);
  });

  it('returns null on a non-JSON body (a soft block)', () => {
    assert.equal(extractTimeseriesToken('<html>sorry</html>'), null);
  });

  it('parses a timeline', () => {
    const body = ")]}'\n" + JSON.stringify({
      default: { timelineData: [{ time: '1700000000', value: [42] }, { time: '1700604800', value: [55] }] },
    });
    assert.deepEqual(parseTimeline(body), [
      { time: 1700000000, value: 42 },
      { time: 1700604800, value: 55 },
    ]);
  });

  it('returns [] on a shape change instead of crashing a paid report', () => {
    assert.deepEqual(parseTimeline('{"unexpected":true}'), []);
    assert.deepEqual(parseTimeline('garbage'), []);
  });
});

describe('trend direction', () => {
  it('detects a rising term', () => {
    const r = trendDirection(series([...Array(20).fill(20), ...Array(20).fill(60)]));
    assert.equal(r?.direction, 'rising');
    assert.ok(r!.changePct > 0.15);
  });

  it('detects a falling term', () => {
    const r = trendDirection(series([...Array(20).fill(80), ...Array(20).fill(30)]));
    assert.equal(r?.direction, 'falling');
  });

  it('calls small movement stable rather than a trend', () => {
    const r = trendDirection(series([...Array(20).fill(50), ...Array(20).fill(53)]));
    assert.equal(r?.direction, 'stable');
  });

  it('refuses to read a trend from too few points', () => {
    assert.equal(trendDirection(series(Array(MIN_POINTS_FOR_TREND - 1).fill(50))), null);
  });

  it('refuses when the earlier half is all zeros (no ratio exists)', () => {
    assert.equal(trendDirection(series([...Array(20).fill(0), ...Array(20).fill(40)])), null);
  });
});

describe('seasonality', () => {
  it('finds a genuine seasonal peak', () => {
    // A Diwali-shaped product: quiet all year, spikes in Oct/Nov.
    const s = seasonality(year((i) => {
      const month = new Date((start + i * WEEK) * 1000).getUTCMonth();
      return month === 9 || month === 10 ? 90 : 10;
    }));
    assert.equal(s?.seasonal, true);
    assert.ok(s!.peakMonths.includes(9) || s!.peakMonths.includes(10));
  });

  it('reports a flat product as not seasonal', () => {
    const s = seasonality(year(() => 50));
    assert.equal(s?.seasonal, false);
    assert.deepEqual(s?.peakMonths, []);
  });

  it('refuses to read seasonality from less than a year', () => {
    assert.equal(seasonality(series(Array(30).fill(50))), null);
  });
});

describe('claims', () => {
  it('derives interest, trend and seasonality from a healthy series', () => {
    const points = year((i) => 30 + (i % 5));
    const c = deriveTrendClaims({ query: 'yoga mat', geo: 'IN', points }, idFor);

    assert.ok(c.searchInterest.value !== null);
    assert.equal(c.searchInterest.unit, 'index_0_100');
    assert.ok(c.trend.value !== null);
    assert.ok(c.seasonality.value !== null);
  });

  it('ALWAYS attaches the relative-index assumption', () => {
    // "Search interest 68" reads like demand. It is not, and every claim must say so.
    const c = deriveTrendClaims({ query: 'yoga mat', geo: 'IN', points: year(() => 40) }, idFor);
    assert.ok(
      c.searchInterest.assumptions.some((a) => /not search volume/i.test(a.what)),
      'searchInterest must declare it is an index, not volume',
    );
  });

  it('returns UNKNOWN — never zero — when Trends has no data', () => {
    const c = deriveTrendClaims({ query: 'zxqwvbn', geo: 'IN', points: [] }, idFor);
    assert.equal(c.searchInterest.value, null);
    assert.equal(c.searchInterest.coverage, 0);
    assert.match(c.searchInterest.unknownReason!, /no data/i);
  });

  it('returns UNKNOWN for an all-zero series, not "nobody searches this"', () => {
    // Reporting 0 would assert absence of demand. Google reporting nothing only means
    // volume is below its threshold — a much weaker statement.
    const c = deriveTrendClaims({ query: 'obscure', geo: 'IN', points: year(() => 0) }, idFor);
    assert.equal(c.searchInterest.value, null);
    assert.match(c.searchInterest.unknownReason!, /too low/i);
  });

  it('reports unknown trend on a short series while still giving current interest', () => {
    const c = deriveTrendClaims({ query: 'new thing', geo: 'IN', points: series([40, 42, 38, 45]) }, idFor);
    assert.ok(c.searchInterest.value !== null, 'current interest is still readable');
    assert.equal(c.trend.value, null);
    assert.match(c.trend.unknownReason!, /data points/i);
  });

  it('falls back to unknown when evidence was not persisted', () => {
    // A claim may never cite evidence that does not exist.
    const c = deriveTrendClaims({ query: 'yoga mat', geo: 'IN', points: year(() => 40) }, () => null);
    assert.equal(c.searchInterest.value, null);
  });
});

describe('fetch failure handling', () => {
  const res = (status: number, body = '') =>
    ({ ok: status >= 200 && status < 300, status, text: async () => body }) as Response;

  it('marks a 429 retryable and does not retry internally', async () => {
    let calls = 0;
    const fetchImpl = (async () => { calls++; return res(429); }) as unknown as typeof fetch;
    await assert.rejects(
      () => fetchTrends('yoga mat', { fetchImpl, cookie: 'NID=test' }),
      (e: TrendsUnavailableError) => e.retryable === true,
    );
    assert.equal(calls, 1, 'retrying into a 429 earns a longer ban');
  });

  it('marks an unparseable explore response NOT retryable', async () => {
    const fetchImpl = (async () => res(200, '<html>blocked</html>')) as unknown as typeof fetch;
    await assert.rejects(
      () => fetchTrends('yoga mat', { fetchImpl, cookie: 'NID=test' }),
      (e: TrendsUnavailableError) => e.retryable === false,
    );
  });

  it('completes the two-step handshake', async () => {
    const explore = ")]}'\n" + JSON.stringify({ widgets: [{ id: 'TIMESERIES', token: 't', request: {} }] });
    const timeline = ")]}'\n" + JSON.stringify({ default: { timelineData: [{ time: '1700000000', value: [64] }] } });
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return res(200, urls.length === 1 ? explore : timeline);
    }) as unknown as typeof fetch;

    const out = await fetchTrends('yoga mat', { fetchImpl, cookie: 'NID=test' });
    assert.equal(urls.length, 2);
    assert.match(urls[0], /\/explore\?/);
    assert.match(urls[1], /widgetdata\/multiline/);
    assert.deepEqual(out.points, [{ time: 1700000000, value: 64 }]);
  });

  it('defaults to India', async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return res(200, ")]}'\n" + JSON.stringify({ widgets: [] }));
    }) as unknown as typeof fetch;
    await fetchTrends('yoga mat', { fetchImpl, cookie: 'NID=test' }).catch(() => {});
    assert.match(decodeURIComponent(urls[0]), /"geo":"IN"/);
  });
});

describe('session priming', () => {
  // Measured 2026-08-01: a cold client gets 429 on its very first request. Trends is not
  // rate limiting us — it wants the NID cookie a browser picks up on first page view.
  it('primes a cookie before the handshake and sends it', async () => {
    const urls: string[] = [];
    const sent: (string | undefined)[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      urls.push(url);
      sent.push((init?.headers as Record<string, string>)?.Cookie);
      if (urls.length === 1) {
        return {
          ok: true, status: 200, text: async () => '',
          headers: { getSetCookie: () => ['NID=abc; Path=/; HttpOnly'] },
        } as unknown as Response;
      }
      return {
        ok: true, status: 200,
        text: async () => ")]}'\n" + JSON.stringify({ widgets: [] }),
      } as Response;
    }) as unknown as typeof fetch;

    await fetchTrends('yoga mat', { fetchImpl }).catch(() => {});

    assert.match(urls[0], /trends\.google\.com\/trends\/\?geo=IN/, 'primes first');
    assert.equal(sent[0], undefined, 'priming request carries no cookie');
    assert.equal(sent[1], 'NID=abc', 'handshake reuses the primed cookie');
  });

  it('skips priming when a cookie is supplied, saving a request per batch', async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return { ok: true, status: 200, text: async () => ")]}'\n" + JSON.stringify({ widgets: [] }) } as Response;
    }) as unknown as typeof fetch;

    await fetchTrends('yoga mat', { fetchImpl, cookie: 'NID=reused' }).catch(() => {});
    assert.equal(urls.length, 1);
    assert.match(urls[0], /\/explore\?/);
  });

  it('still attempts the request if priming fails', async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      if (n === 1) throw new Error('network down');
      return { ok: true, status: 200, text: async () => ")]}'\n" + JSON.stringify({ widgets: [] }) } as Response;
    }) as unknown as typeof fetch;

    // Surfaces Google's own outcome, not an error of our own making.
    await assert.rejects(() => fetchTrends('yoga mat', { fetchImpl }), /TIMESERIES/);
    assert.equal(n, 2);
  });
});
