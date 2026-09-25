#!/usr/bin/env node
/**
 * Generates TOOLS.md from the registries.
 *
 * WHY GENERATED AND NOT WRITTEN BY HAND
 *   A hand-maintained list of 47 tools is wrong within a week. This reads the
 *   same files the site renders from, so the catalogue cannot disagree with
 *   what actually ships. Re-run it after adding a tool:
 *
 *     node scripts/generate-tool-catalogue.mjs
 *
 * WHY IT PARSES SOURCE RATHER THAN IMPORTING IT
 *   The registries import React components (lucide icons) and use the `@/`
 *   path alias, neither of which plain Node resolves. Parsing the small, very
 *   regular subset of fields needed here avoids dragging a bundler into a
 *   documentation script. To keep that safe, every extraction is asserted: if a
 *   file's shape changes, this exits non-zero instead of quietly emitting a
 *   short or wrong catalogue.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(join(root, relative), 'utf8');

/** Fail loudly rather than emit a catalogue that is quietly incomplete. */
function assert(condition, message) {
  if (!condition) {
    console.error(`generate-tool-catalogue: ${message}`);
    process.exit(1);
  }
}

/** Pull `key: 'value'` out of one object literal's text. */
const str = (block, key) => {
  const match = block.match(
    new RegExp(`\\b${key}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`)
  );
  return match ? match[1].replace(/\\'/g, "'") : null;
};
const bool = (block, key) => {
  const match = block.match(new RegExp(`\\b${key}:\\s*(true|false)`));
  return match ? match[1] === 'true' : null;
};

/** Split an array literal's text into its top-level `{ ... }` object blocks. */
function objectBlocks(source) {
  const blocks = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        blocks.push(source.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return blocks;
}

/**
 * The inside of a `Record<...> = { ... }` literal.
 *
 * Needed because these declarations carry a type annotation containing its own
 * braces, so brace-matching from the declaration would return the TYPE rather
 * than the value.
 */
function recordBody(source, declaration) {
  const startIndex = source.indexOf(declaration);
  assert(startIndex !== -1, `could not find "${declaration}"`);
  const open = source.indexOf('= {', startIndex);
  assert(open !== -1, `no assignment found for "${declaration}"`);
  let depth = 0;
  for (let i = open + 2; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 3, i);
    }
  }
  assert(false, `unbalanced record for "${declaration}"`);
  return '';
}

/**
 * The text between a named array's opening bracket and its closing one.
 *
 * Anchors on `= [`, not the first `[`: a declaration like
 * `const TOOLS: Tool[] = [` carries brackets in its TYPE, and matching those
 * returns an empty body.
 */
function arrayBody(source, declaration) {
  const startIndex = source.indexOf(declaration);
  assert(startIndex !== -1, `could not find "${declaration}"`);
  const assignment = source.indexOf('= [', startIndex);
  assert(assignment !== -1, `no array assignment for "${declaration}"`);
  const open = assignment + 2;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '[') depth += 1;
    else if (source[i] === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  assert(false, `unbalanced array for "${declaration}"`);
  return '';
}

// ── read the registries ──────────────────────────────────────────────────
const toolsSrc = read('src/data/tools.ts');
const calcSrc = read('src/lib/calculators/registry.ts');
const kindsSrc = read('src/lib/documents/kinds.ts');
const genSrc = read('src/lib/generators/registry.ts');
const roadmapSrc = read('src/data/roadmap.ts');

// Bucket labels
const bucketLabels = {};
for (const block of objectBlocks(recordBody(toolsSrc, 'export const INTENT_BUCKETS'))) {
  const id = str(block, 'id');
  const label = str(block, 'label');
  const blurb = str(block, 'blurb');
  if (id && label) bucketLabels[id] = { label, blurb };
}
assert(Object.keys(bucketLabels).length >= 5, 'no intent buckets parsed');

const bucketOrder = [
  ...arrayBody(toolsSrc, 'export const BUCKET_ORDER').matchAll(/'([\w-]+)'/g),
].map((match) => match[1]);
assert(bucketOrder.length >= 5, 'no bucket order parsed');

// Curated tools
const curated = objectBlocks(arrayBody(toolsSrc, 'const CURATED_TOOLS'))
  .map((block) => ({
    slug: str(block, 'slug'),
    name: str(block, 'name'),
    short: str(block, 'shortName'),
    // Curated tools are not all under /tools — Research lives at /research and
    // the storefront at /onboarding — so the href is read, never constructed.
    href: str(block, 'href'),
    bucket: str(block, 'bucket'),
    status: str(block, 'status'),
    badge: str(block, 'badge'),
    requiresAccount: bool(block, 'requiresAccount'),
    engine: str(block, 'engine'),
    source: 'curated',
  }))
  .filter((tool) => tool.slug);
assert(curated.length > 0, 'no curated tools parsed');

// Calculators
const calculators = objectBlocks(arrayBody(calcSrc, 'export const CALCULATORS'))
  .map((block) => ({
    slug: str(block, 'slug'),
    href: `/tools/${str(block, 'slug')}`,
    name: str(block, 'title'),
    short: str(block, 'shortTitle'),
    bucket: str(block, 'bucket'),
    status: 'live',
    badge: str(block, 'badge'),
    requiresAccount: false,
    engine: 'calculator',
    source: 'calculator',
  }))
  .filter((tool) => tool.slug && tool.bucket);
assert(calculators.length > 0, 'no calculators parsed');

// Text generators
const generators = objectBlocks(arrayBody(genSrc, 'export const GENERATORS'))
  .map((block) => ({
    slug: str(block, 'slug'),
    href: `/tools/${str(block, 'slug')}`,
    name: str(block, 'title'),
    short: str(block, 'shortTitle'),
    bucket: str(block, 'bucket'),
    status: 'live',
    badge: str(block, 'badge'),
    requiresAccount: false,
    engine: 'generator',
    source: 'generator',
  }))
  .filter((tool) => tool.slug && tool.bucket);
assert(generators.length > 0, 'no generators parsed');

// Document kinds + their bucket map
const documentBuckets = {};
const bucketMapSrc = toolsSrc.slice(
  toolsSrc.indexOf('const DOCUMENT_BUCKETS'),
  toolsSrc.indexOf('const DOCUMENT_TOOLS')
);
for (const match of bucketMapSrc.matchAll(/'?([\w-]+)'?:\s*'([\w-]+)'/g)) {
  documentBuckets[match[1]] = match[2];
}

const documents = objectBlocks(recordBody(kindsSrc, 'export const DOCUMENT_KINDS'))
  .map((block) => {
    const kind = str(block, 'kind');
    if (!kind) return null;
    return {
      slug: `${kind}-generator`,
      href: `/tools/${kind}-generator`,
      name: str(block, 'pageTitle'),
      short: str(block, 'shortTitle'),
      bucket: documentBuckets[kind],
      status: 'live',
      badge: str(block, 'badge'),
      requiresAccount: false,
      engine: 'document',
      shape: str(block, 'shape'),
      source: 'document',
    };
  })
  .filter((tool) => tool && tool.bucket);
assert(documents.length > 0, 'no document kinds parsed');

// Roadmap
const roadmap = objectBlocks(arrayBody(roadmapSrc, 'export const ROADMAP: RoadmapItem[]'))
  .map((block) => ({
    slug: str(block, 'slug'),
    name: str(block, 'name'),
    wave: Number((block.match(/\bwave:\s*(\d)/) || [])[1]),
    engine: str(block, 'engine'),
    bucket: str(block, 'bucket'),
    cost: str(block, 'cost'),
    requiresAccount: bool(block, 'requiresAccount'),
    note: str(block, 'note'),
  }))
  .filter((item) => item.slug);
assert(roadmap.length > 0, 'no roadmap items parsed');

const pairs = (source, declaration, a, b) =>
  objectBlocks(arrayBody(source, declaration))
    .map((block) => ({ a: str(block, a), b: str(block, b) }))
    .filter((pair) => pair.a);

const collapsed = pairs(roadmapSrc, 'export const COLLAPSED', 'listed', 'becomes');
const shipped = pairs(roadmapSrc, 'export const SHIPPED', 'listed', 'shippedAs');
const declined = pairs(roadmapSrc, 'export const DECLINED', 'listed', 'reason');

// ── assemble ─────────────────────────────────────────────────────────────
const all = [...curated, ...documents, ...calculators, ...generators];
const live = all.filter((tool) => tool.status === 'live');
const planned = all.filter((tool) => tool.status === 'planned');

const byBucket = (tools) => {
  const groups = new Map(bucketOrder.map((bucket) => [bucket, []]));
  for (const tool of tools) {
    if (!groups.has(tool.bucket)) groups.set(tool.bucket, []);
    groups.get(tool.bucket).push(tool);
  }
  return groups;
};

const accountTag = (tool) => (tool.requiresAccount ? 'Account' : 'Free');
const esc = (value) => (value ?? '').replace(/\|/g, '\\|');

const lines = [];
const push = (...text) => lines.push(...text);

push(
  '# LaunchGrid tool catalogue',
  '',
  '> Generated from the registries by `node scripts/generate-tool-catalogue.mjs`.',
  '> Do not edit by hand — edit the source below and re-run it.',
  '>',
  '> - Live tools: `src/data/tools.ts`, `src/lib/documents/kinds.ts`, `src/lib/calculators/registry.ts`',
  '> - Backlog: `src/data/roadmap.ts`',
  '',
  '## Where things stand',
  '',
  '| | Count |',
  '| --- | ---: |',
  `| Live now | **${live.length}** |`,
  `| Planned, already in the registry | ${planned.length} |`,
  `| On the roadmap (Waves 3–5) | ${roadmap.length} |`,
  `| **Total once the roadmap ships** | **${live.length + planned.length + roadmap.length}** |`,
  '',
  'Engines carry most of the weight: a document, a calculator and a QR destination',
  'are configuration entries, not builds. That is why the totals are far below the',
  'original ~120 item count while covering the same ground.',
  ''
);

push('## Live', '');
for (const [bucket, tools] of byBucket(live)) {
  if (tools.length === 0) continue;
  const meta = bucketLabels[bucket] ?? { label: bucket, blurb: '' };
  push(`### ${meta.label} (${tools.length})`, '', `_${meta.blurb}_`, '');
  push('| Tool | Access | Engine | URL |', '| --- | --- | --- | --- |');
  for (const tool of tools) {
    push(
      `| ${esc(tool.short ?? tool.name)} | ${accountTag(tool)} | ${tool.engine ?? '—'} | \`${tool.href ?? `/tools/${tool.slug}`}\` |`
    );
  }
  push('');
}

if (planned.length > 0) {
  push(
    '## Planned — in the registry, not yet built',
    '',
    'These have entries in `src/data/tools.ts` with `status: \'planned\'`. They are',
    'deliberately **not rendered** on the site: a grid that advertises what does not',
    'exist converts worse than a smaller grid that is entirely true.',
    '',
    '| Tool | Engine | Bucket |',
    '| --- | --- | --- |'
  );
  for (const tool of planned) {
    push(
      `| ${esc(tool.short ?? tool.name)} | ${tool.engine ?? '—'} | ${bucketLabels[tool.bucket]?.label ?? tool.bucket} |`
    );
  }
  push('');
}

push('## Roadmap — Waves 3 to 5', '');
push(
  '`cost` is the column that decides sequencing. **Free** runs in the visitor’s',
  'browser and costs nothing to serve, like everything shipped so far.',
  '**Metered** spends money on every use and cannot sit on a free tier without a',
  'hard cap.',
  ''
);
for (const wave of [3, 4, 5]) {
  const items = roadmap.filter((item) => item.wave === wave);
  if (items.length === 0) continue;
  const titles = { 3: 'Selling on marketplaces', 4: 'Images', 5: 'Marketing' };
  push(`### Wave ${wave} — ${titles[wave]} (${items.length})`, '');
  for (const item of items) {
    const tags = [
      item.cost === 'metered' ? '**metered**' : 'free',
      item.requiresAccount ? 'account' : 'no account',
      item.engine ? `${item.engine} engine` : 'standalone',
    ].join(' · ');
    push(`- **${item.name}** — ${tags}`);
    if (item.note) push(`  <br>${item.note}`);
  }
  push('');
}

if (shipped.length > 0) {
  push(
    '## Shipped from the roadmap',
    '',
    '| Originally listed | Shipped as |',
    '| --- | --- |'
  );
  for (const pair of shipped) push(`| ${esc(pair.a)} | ${esc(pair.b)} |`);
  push('');
}

push(
  '## Collapsed into engines',
  '',
  'Listed in the original waves, but not separate builds. Recorded so the',
  'catalogue reads as deduplicated rather than incomplete.',
  '',
  '| Originally listed | Where it went |',
  '| --- | --- |'
);
for (const pair of collapsed) push(`| ${esc(pair.a)} | ${esc(pair.b)} |`);
push('');

push('## Declined', '', '| Item | Why not |', '| --- | --- |');
for (const pair of declined) push(`| ${esc(pair.a)} | ${esc(pair.b)} |`);
push('');

push(
  '## Known gaps',
  '',
  '- The storefront invoice (`src/app/store/[slug]/invoice/[orderId]`) still computes',
  '  its own GST split in floats, separate from `src/lib/documents/totals.ts`. Unifying',
  '  needs a state-name→GST-code resolution step; getting it wrong would silently flip',
  '  CGST/SGST to IGST on live invoices.',
  '- No billing exists, so nothing is gated. The natural first paywall is the findings',
  '  table and CSV export in the settlement reconciliation tool.',
  ''
);

writeFileSync(join(root, 'TOOLS.md'), `${lines.join('\n')}\n`);

console.log(
  `TOOLS.md written — ${live.length} live, ${planned.length} planned, ${roadmap.length} on the roadmap.`
);
console.log(
  'Cross-check: the homepage headline should read the same number of live tools.\n' +
    'If it does not, a registry exists that this script does not read.'
);
