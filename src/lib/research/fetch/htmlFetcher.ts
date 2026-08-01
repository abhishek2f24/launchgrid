// How the server gets supplier HTML.
//
// WHY THIS ABSTRACTION EXISTS
//   A plain server-side fetch does not work against supplier directories. Measured
//   directly: IndiaMART returns a ~1–24KB shell with no listings to automated
//   clients and HTTP 429 under sustained load; Alibaba serves a CAPTCHA page. Real
//   listings only come back over residential egress.
//
//   Rather than bake one vendor's URL format into the scraper, fulfilment depends on
//   this interface. Vendors differ only in how a target URL is wrapped, so switching
//   from ScraperAPI to Bright Data is an env change, not a rewrite — and tests can
//   inject a fake without touching the network.
//
// COST
//   Roughly ₹2–5 of proxy spend per report against a ₹1,999-for-25 pack (~₹80/report).
//   Extraction itself is deterministic parsing with no model in the loop, so the
//   marginal cost of a report is essentially the proxy fee.

export interface FetchResult {
  html: string;
  status: number;
  finalUrl: string;
  /** Which fetcher produced this, recorded on the resulting rows for provenance. */
  via: string;
}

export interface HtmlFetcher {
  readonly name: string;
  fetchHtml(url: string, opts?: { timeoutMs?: number }): Promise<FetchResult>;
}

export class BlockedError extends Error {
  // Explicit fields rather than TypeScript parameter properties: Node's
  // strip-only TS support cannot parse parameter properties, and this module
  // is exercised directly by `node --test`.
  readonly status: number;
  /** True when backing off and retrying later could plausibly succeed. */
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'BlockedError';
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Pages whose *shape* we know, so a structurally valid response can still be
 * recognised as not-the-real-thing.
 *
 * Measured 2026-08-01: a plain server GET of an IndiaMART search page returns HTTP
 * 200, 24KB, 11 script tags, no CAPTCHA — and listings for a completely different
 * product ("yoga mat" returned t-shirt suppliers in Noida). It is a decoy, not an
 * error, and every generic signal below passes it.
 *
 * A search response with no listing markup at all is therefore treated as a block
 * rather than as "this product has no suppliers".
 */
const CONTENT_EXPECTATIONS: { appliesTo: RegExp; requires: RegExp; label: string }[] = [
  {
    appliesTo: /dir\.indiamart\.com\/search/i,
    requires: /im-lc-card/,
    label: 'IndiaMART search page contained no listing markup',
  },
];

/**
 * Signals a hostile response even when the HTTP status is 200.
 *
 * `url` is optional but should be passed wherever available — without it the
 * shape-based decoy detection above cannot run.
 */
export function detectBlock(html: string, status: number, url?: string): BlockedError | null {
  if (status === 429) return new BlockedError('Rate limited by origin', 429, true);
  if (status === 403) return new BlockedError('Forbidden by origin', 403, false);
  if (status >= 500) return new BlockedError(`Origin error ${status}`, status, true);

  // Bot walls commonly return 200 with an interstitial body. Length alone is not a
  // reliable signal — check for the markers, and treat a tiny body as suspect.
  if (/captcha|slider-verify|punish\?|are you a human/i.test(html)) {
    return new BlockedError('CAPTCHA interstitial served', status, false);
  }
  if (html.length < 2000) {
    return new BlockedError(`Shell response (${html.length} bytes) — no listings rendered`, status, true);
  }

  // Retryable on purpose: a decoy is not evidence that the product has no suppliers,
  // so the worker should try again through a fresh proxy session before returning the
  // customer's credit. A genuinely empty search still ends in a refund — it just
  // costs MAX_ATTEMPTS fetches to get there, which is the price of not mistaking
  // poisoned content for a real answer.
  if (url) {
    const expectation = CONTENT_EXPECTATIONS.find((e) => e.appliesTo.test(url));
    if (expectation && !expectation.requires.test(html)) {
      return new BlockedError(`${expectation.label} — likely served a decoy`, status, true);
    }
  }

  return null;
}

/** Direct fetch. Correct for local development and tests; blocked by supplier sites in production. */
export class DirectFetcher implements HtmlFetcher {
  readonly name = 'direct';

  async fetchHtml(url: string, opts: { timeoutMs?: number } = {}): Promise<FetchResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          // A real UA is table stakes; it is not on its own an evasion measure, and
          // it does not defeat the bot walls above.
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });
      const html = await res.text();
      return { html, status: res.status, finalUrl: res.url || url, via: this.name };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Residential-proxy fetcher, configured entirely by env so no vendor is hardcoded.
 *
 *   RESEARCH_PROXY_ENDPOINT   template containing {url} and optionally {key}
 *   RESEARCH_PROXY_KEY        vendor API key
 *
 * ScraperAPI:  https://api.scraperapi.com/?api_key={key}&url={url}&country_code=in
 * Bright Data: https://api.brightdata.com/request?zone=...&url={url}
 */
export class ProxyFetcher implements HtmlFetcher {
  readonly name = 'residential-proxy';

  private readonly endpointTemplate: string;
  private readonly apiKey: string;

  constructor(endpointTemplate: string, apiKey: string) {
    this.endpointTemplate = endpointTemplate;
    this.apiKey = apiKey;
  }

  private buildUrl(target: string) {
    return this.endpointTemplate
      .replace('{url}', encodeURIComponent(target))
      .replace('{key}', encodeURIComponent(this.apiKey));
  }

  async fetchHtml(url: string, opts: { timeoutMs?: number } = {}): Promise<FetchResult> {
    const controller = new AbortController();
    // Residential proxies are slow — they really do take 30s+ on heavy pages.
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90000);
    try {
      const res = await fetch(this.buildUrl(url), { signal: controller.signal });
      const html = await res.text();
      return { html, status: res.status, finalUrl: url, via: this.name };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Picks a fetcher from env.
 *
 * Deliberately does NOT silently fall back to DirectFetcher in production: a silent
 * fallback would look like "the scraper stopped finding suppliers" while actually
 * being a config error, which is exactly the class of failure that previously let
 * bad data through unnoticed. Misconfiguration should be loud.
 */
export function getHtmlFetcher(env: NodeJS.ProcessEnv = process.env): HtmlFetcher {
  const endpoint = env.RESEARCH_PROXY_ENDPOINT;
  const key = env.RESEARCH_PROXY_KEY;

  if (endpoint && key) return new ProxyFetcher(endpoint, key);

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'RESEARCH_PROXY_ENDPOINT and RESEARCH_PROXY_KEY must be set in production — ' +
        'direct fetches are blocked by supplier sites and would deliver empty reports.',
    );
  }
  return new DirectFetcher();
}
