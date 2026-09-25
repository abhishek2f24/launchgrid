'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { getGenerator } from '@/lib/generators/registry';
import type { GeneratorDef } from '@/lib/generators/registry';

/**
 * Renders every text generator. Takes a slug rather than a definition, because
 * a GeneratorDef carries a `generate` function and an icon component, and
 * neither can cross the server/client boundary.
 */
export function GeneratorWorkspace({ slug }: { slug: string }) {
  const def = getGenerator(slug);
  if (!def) throw new Error(`Unknown generator: ${slug}`);
  return <GeneratorBody def={def} />;
}

function initialValues(def: GeneratorDef): Record<string, string> {
  return Object.fromEntries(
    def.fields.map((field) => [field.id, field.defaultValue ?? ''])
  );
}

function GeneratorBody({ def }: { def: GeneratorDef }) {
  const [values, setValues] = useState(() => initialValues(def));
  const [batch, setBatch] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Live generators recompute as you type. On-demand ones must not run during
  // render at all — they use randomness, which would differ between the
  // server's HTML and the client's first paint.
  const live = useMemo(
    () => (def.mode === 'live' ? def.generate(values) : []),
    [def, values]
  );
  const results = def.mode === 'live' ? live : batch;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard can be refused; the value is on screen either way.
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-subtle-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] gap-8 items-start">
      <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
        <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-5">
          Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {def.fields.map((field) => (
            <label key={field.id} className="block">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
                {field.label}
              </span>
              <input
                className={inputClass}
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.id] ?? ''}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  }))
                }
              />
              {field.help && (
                <span className="mt-1 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                  {field.help}
                </span>
              )}
            </label>
          ))}
        </div>

        {def.mode === 'onDemand' && (
          <button
            type="button"
            onClick={() => setBatch(def.generate(values))}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-black transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />{' '}
            {def.actionLabel ?? 'Generate'}
          </button>
        )}
      </section>

      <section className="lg:sticky lg:top-24 space-y-4">
        <div className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)]">
              Result{results.length > 1 ? 's' : ''}
            </h2>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => copy(results.join('\n'), '__all')}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
              >
                {copied === '__all' ? (
                  <Check className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3" aria-hidden="true" />
                )}
                {copied === '__all' ? 'Copied' : 'Copy all'}
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <p className="text-[11px] text-[var(--color-mark-subtle-text)] leading-relaxed">
              {def.mode === 'onDemand'
                ? 'Fill in the details and press the button.'
                : 'Fill in the details and your result appears here.'}
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <li
                  key={`${result}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-xl bg-[var(--color-mark-subtle)] px-3 py-2"
                >
                  <span className="font-mono text-[11px] text-[var(--color-mark-ink)] break-all leading-relaxed">
                    {result}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(result, String(index))}
                    className="shrink-0 text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-ink)] transition-colors"
                    aria-label={`Copy ${result}`}
                  >
                    {copied === String(index) ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-2">
            Worth knowing
          </h3>
          <p className="text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
            {def.note}
          </p>
        </div>
      </section>
    </div>
  );
}
