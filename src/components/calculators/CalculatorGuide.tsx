/**
 * Server-rendered explanation under every registry calculator.
 *
 * The interactive workspace is a client island; on its own a calculator page
 * is ~200 words and Google treats it as thin. This section is derived entirely
 * from the calculator's own definition — a worked example computed from its
 * default inputs, its formula and caveat as FAQ answers, and related tools — so
 * each page gets unique, accurate text without hand-written copy that can drift.
 */

import Link from 'next/link';
import type { CalculatorDef } from '@/lib/calculators/types';
import { formatResult } from '@/lib/calculators/format';
import { liveToolsInBucket } from '@/data/tools';

/** Lower-case for mid-sentence use, but keep acronyms like ROI, EMI, TDS. */
function lower(text: string): string {
  return text.replace(/\b\w+\b/g, (w) => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase()));
}

function sentence(text: string): string {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

function fieldValue(value: number, unit?: string): string {
  const n = value.toLocaleString('en-IN');
  if (unit === '₹') return `₹${n}`;
  return unit ? `${n} ${unit}` : n;
}

export function calculatorFaqs(def: CalculatorDef): { q: string; a: string }[] {
  const defaults = Object.fromEntries(def.fields.map((f) => [f.id, f.defaultValue]));
  const results = def.compute(defaults);
  const primary = def.outputs.find((o) => o.primary) ?? def.outputs[0];
  const inputs = def.fields.map((f) => `${lower(f.label)} of ${fieldValue(f.defaultValue, f.unit)}`).join(', ');
  const name = def.title.replace(/ Calculator$/, '');

  const faqs = [
    {
      q: `How do I calculate ${lower(name)}?`,
      a: `${sentence(def.formula)} For example, with ${inputs}, the ${lower(primary.label)} is ${formatResult(results[primary.id] ?? null, primary.format)}.`,
    },
    {
      q: `Is this ${lower(def.title)} free?`,
      a: `Yes. It is free, needs no account, and calculates in your browser — the numbers you enter are not sent to LaunchGrid.`,
    },
  ];
  if (def.caveat) {
    faqs.splice(1, 0, { q: `What does this ${lower(def.title)} not include?`, a: def.caveat });
  }
  return faqs;
}

export function CalculatorGuide({ def }: { def: CalculatorDef }) {
  const defaults = Object.fromEntries(def.fields.map((f) => [f.id, f.defaultValue]));
  const results = def.compute(defaults);
  const faqs = calculatorFaqs(def);
  const related = liveToolsInBucket(def.bucket)
    .filter((t) => t.slug !== def.slug)
    .slice(0, 6);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="mt-12 pt-8 border-t border-[var(--color-mark-default)] max-w-3xl space-y-10 font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="space-y-3">
        <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Worked example</h2>
        <div className="overflow-x-auto bg-white border border-[var(--color-mark-default)] rounded-2xl">
          <table className="w-full text-left text-xs">
            <tbody>
              {def.fields.map((f) => (
                <tr key={f.id} className="border-b border-[var(--color-mark-default)]">
                  <th scope="row" className="p-3 font-medium">{f.label}</th>
                  <td className="p-3 text-[var(--color-mark-ink)]">{fieldValue(f.defaultValue, f.unit)}</td>
                </tr>
              ))}
              {def.outputs.map((o) => (
                <tr key={o.id} className="border-b last:border-b-0 border-[var(--color-mark-default)] bg-[var(--color-mark-subtle)]">
                  <th scope="row" className="p-3 font-bold text-[var(--color-mark-ink)]">{o.label}</th>
                  <td className="p-3 font-bold text-[var(--color-mark-ink)]">{formatResult(results[o.id] ?? null, o.format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs">Formula: {def.formula}</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Frequently asked questions</h2>
        {faqs.map((f) => (
          <div key={f.q}>
            <h3 className="font-bold text-[var(--color-mark-ink)]">{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Related free tools</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link href={t.href} className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">{t.name}</Link>
              </li>
            ))}
          </ul>
          <p className="text-xs">
            Selling online? Read <Link href="/sell-online" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">how to sell online in India</Link>{' '}
            or <Link href="/tools/profit-margin-calculator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">calculate your product profit margin</Link>.
          </p>
        </section>
      )}
    </div>
  );
}
