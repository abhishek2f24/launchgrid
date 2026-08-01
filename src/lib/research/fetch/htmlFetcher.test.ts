// Block-detection tests.
//
// Run with:  node --test src/lib/research/fetch/htmlFetcher.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectBlock } from './htmlFetcher.ts';

const SEARCH_URL = 'https://dir.indiamart.com/search.mp?ss=yoga+mat';
const PROFILE_URL = 'https://www.indiamart.com/vsmart-solutions/';
const big = (body: string) => `<html><body>${'filler '.repeat(400)}${body}</body></html>`;

describe('detectBlock', () => {
  it('flags a 429 as retryable', () => {
    const b = detectBlock('anything', 429, SEARCH_URL);
    assert.equal(b?.retryable, true);
  });

  it('flags a 403 as NOT retryable', () => {
    const b = detectBlock('anything', 403, SEARCH_URL);
    assert.equal(b?.retryable, false);
  });

  it('flags a CAPTCHA interstitial as not retryable', () => {
    const b = detectBlock(big('Please complete the captcha'), 200, SEARCH_URL);
    assert.ok(b);
    assert.equal(b.retryable, false);
  });

  it('flags a tiny shell response', () => {
    const b = detectBlock('<html><body>hi</body></html>', 200, SEARCH_URL);
    assert.ok(b);
    assert.match(b.message, /Shell response/);
  });

  it('passes a real search page containing listing cards', () => {
    const html = big('<article class="im-lc-card"><a class="im-lc-seller-name">Acme</a></article>');
    assert.equal(detectBlock(html, 200, SEARCH_URL), null);
  });

  // The response measured on 2026-08-01: HTTP 200, 24KB, no CAPTCHA, real-looking
  // markup — but listings for t-shirts in response to a "yoga mat" search. Every
  // generic signal passes it, which is exactly why the shape check exists.
  it('catches the real-world decoy: 200, large body, no listing markup', () => {
    const decoy = big(`
      <div>Related Searches yoga mat Plain T Shirts Polo T Shirts</div>
      <div>cotton t-shirts supplier Noida Contact Supplier</div>
      <div>Bulk t-shirts manufacturer Delhi Contact Supplier</div>
    `);
    const b = detectBlock(decoy, 200, SEARCH_URL);
    assert.ok(b, 'decoy must be detected');
    assert.match(b.message, /decoy/);
    // Retryable: a decoy is not evidence that the product has no suppliers, so the
    // customer's credit should not be returned on the first attempt.
    assert.equal(b.retryable, true);
  });

  it('does not apply search-page expectations to a supplier profile page', () => {
    const profile = big('<h1>Vsmart Solutions</h1><a href="tel:+919876543210">Call</a>');
    assert.equal(detectBlock(profile, 200, PROFILE_URL), null);
  });

  it('skips shape checks when no URL is supplied rather than guessing', () => {
    assert.equal(detectBlock(big('no cards here'), 200), null);
  });
});
