// Probes the LIVE Google Trends endpoint.
//
//   node scripts/probe-google-trends.mjs "yoga mat" "power bank"
//
// Kept out of the unit suite deliberately: the endpoint is undocumented and rate-limited,
// so it must never be able to fail CI. This answers the empirical question — does the
// handshake still work today, from this IP — which no fixture can.
//
// Requests are spaced deliberately. Trends rate-limits aggressively and there is no
// retry: retrying into a 429 earns a longer ban.

import { fetchTrends, deriveTrendClaims, primeSessionCookie } from '../src/lib/intelligence/sources/googleTrends.ts';

const queries = process.argv.slice(2);
if (!queries.length) queries.push('yoga mat', 'power bank', 'zxqwvbn nonsense');

// Measured: 6s spacing with a fresh prime per query still drew 429 on 3 of 4 queries.
// Priming once and reusing halves the request count, and 20s is what actually held.
const SPACING_MS = 20000;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

console.log('\nGoogle Trends live probe (geo=IN, 12 months)\n');

// One prime for the whole batch — each avoided request is one less step toward a limit.
const cookie = await primeSessionCookie(fetch, {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  'Accept-Language': 'en-IN,en;q=0.9',
});
console.log(`  session cookie: ${cookie ? 'primed' : 'NOT primed'}\n`);

for (const [i, q] of queries.entries()) {
  if (i > 0) await new Promise((r) => setTimeout(r, SPACING_MS));

  try {
    const series = await fetchTrends(q, { cookie });
    // Evidence is not persisted in a probe, so hand the deriver synthetic ids purely so
    // the claim constructors can run. Nothing here is written to the store.
    const claims = deriveTrendClaims(series, (p) => `probe_${p}`);

    const si = claims.searchInterest;
    const tr = claims.trend;
    const se = claims.seasonality;

    console.log(`  "${q}"`);
    console.log(`     points          : ${series.points.length}`);
    console.log(
      `     search interest : ${si.value ?? `UNKNOWN (${si.unknownReason})`}` +
        (si.value !== null ? `  conf ${si.confidence}` : ''),
    );
    console.log(
      `     trend           : ${
        tr.value ? `${tr.value.direction} (${(tr.value.changePct * 100).toFixed(0)}%)` : `UNKNOWN`
      }`,
    );
    console.log(
      `     seasonality     : ${
        se.value
          ? se.value.seasonal
            ? `peaks ${se.value.peakMonths.map((m) => MONTHS[m]).join(', ')} (${se.value.peakRatio}x)`
            : 'none detected'
          : 'UNKNOWN'
      }`,
    );
    console.log('');
  } catch (err) {
    console.log(`  "${q}"`);
    console.log(`     FAILED: ${err.message}${err.retryable ? ' (retryable)' : ' (not retryable)'}`);
    console.log('');
  }
}
