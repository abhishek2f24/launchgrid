'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { formatResult } from '@/lib/calculators/format';
import { getCalculator } from '@/lib/calculators/registry';
import type { CalcValues, CalculatorDef } from '@/lib/calculators/types';

/**
 * The one component that renders every calculator.
 *
 * It holds the input values and calls the definition's `compute`. Nothing here
 * knows what an EMI or a CAGR is, which is why adding the sixteenth calculator
 * costs no component work and no extra JavaScript on the wire — this chunk is
 * already cached from whichever calculator the visitor opened first.
 *
 * IT TAKES A SLUG, NOT A DEFINITION.
 *   A CalculatorDef carries a `compute` function and a `icon` component, and
 *   neither can cross the server/client boundary — React can only serialise
 *   plain data. So the server passes the slug and this component resolves the
 *   definition from the registry on the client. The registry is plain modules
 *   with pure functions, so it bundles into this one shared chunk.
 */

function initialValues(def: CalculatorDef): CalcValues {
  return Object.fromEntries(def.fields.map((field) => [field.id, field.defaultValue]));
}

export function CalculatorWorkspace({ slug }: { slug: string }) {
  // The route prerenders only known slugs (dynamicParams = false), so this
  // lookup cannot miss in practice; the throw documents the invariant rather
  // than guarding a reachable path.
  const def = getCalculator(slug);
  if (!def) throw new Error(`Unknown calculator: ${slug}`);

  return <CalculatorBody def={def} />;
}

function CalculatorBody({ def }: { def: CalculatorDef }) {
  const [values, setValues] = useState<CalcValues>(() => initialValues(def));

  // Raw input text is kept separately from the numeric values so that clearing
  // a field shows an empty box rather than snapping to 0, while `compute` still
  // always receives a number.
  const [raw, setRaw] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.fields.map((field) => [field.id, String(field.defaultValue)]))
  );

  const results = useMemo(() => def.compute(values), [def, values]);

  const handleChange = (id: string, next: string) => {
    setRaw((current) => ({ ...current, [id]: next }));
    const parsed = Number(next);
    setValues((current) => ({
      ...current,
      [id]: next.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed,
    }));
  };

  const handleReset = () => {
    setValues(initialValues(def));
    setRaw(
      Object.fromEntries(def.fields.map((field) => [field.id, String(field.defaultValue)]))
    );
  };

  const primary = def.outputs.find((output) => output.primary) ?? def.outputs[0];
  const secondary = def.outputs.filter((output) => output.id !== primary.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-8 items-start">
      {/* Inputs */}
      <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)]">
            Your numbers
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-ink)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset
          </button>
        </div>

        <div className="space-y-5">
          {def.fields.map((field) => (
            <label key={field.id} className="block">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
                {field.label}
              </span>
              <span className="relative block">
                {field.unit === '₹' && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-mark-subtle-text)]"
                  >
                    ₹
                  </span>
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  value={raw[field.id]}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 'any'}
                  onChange={(event) => handleChange(field.id, event.target.value)}
                  className={`w-full rounded-xl border border-[var(--color-mark-default)] bg-white py-2.5 text-sm font-semibold text-[var(--color-mark-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)] ${
                    field.unit === '₹' ? 'pl-7 pr-3' : 'px-3'
                  } ${field.unit && field.unit !== '₹' ? 'pr-16' : ''}`}
                />
                {field.unit && field.unit !== '₹' && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[var(--color-mark-subtle-text)]"
                  >
                    {field.unit}
                  </span>
                )}
              </span>
              {field.help && (
                <span className="mt-1.5 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                  {field.help}
                </span>
              )}
            </label>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="lg:sticky lg:top-24 space-y-4">
        <div className="bg-[var(--color-mark-ink)] text-white rounded-[1.5rem] p-6">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/60 mb-2">
            {primary.label}
          </p>
          <p className="font-playfair text-4xl font-bold tabular-nums break-words">
            {formatResult(results[primary.id] ?? null, primary.format)}
          </p>
          {primary.help && (
            <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
              {primary.help}
            </p>
          )}
          {results[primary.id] === null && (
            <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
              These inputs have no meaningful answer — check the note below.
            </p>
          )}
        </div>

        {secondary.length > 0 && (
          <dl className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] divide-y divide-[var(--color-mark-default)]">
            {secondary.map((output) => (
              <div key={output.id} className="p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[11px] font-bold text-[var(--color-mark-secondary)]">
                    {output.label}
                  </dt>
                  <dd className="text-sm font-bold tabular-nums text-[var(--color-mark-ink)]">
                    {formatResult(results[output.id] ?? null, output.format)}
                  </dd>
                </div>
                {output.help && (
                  <p className="mt-1 text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                    {output.help}
                  </p>
                )}
              </div>
            ))}
          </dl>
        )}

        <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-2">
            How this is calculated
          </h3>
          <p className="text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
            {def.formula}
          </p>
          {def.caveat && (
            <p className="mt-3 pt-3 border-t border-[var(--color-mark-default)] text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
              {def.caveat}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
