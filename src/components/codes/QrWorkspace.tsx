'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Download } from 'lucide-react';
import { QrTooLongError, drawQr, encodeQr } from '@/lib/codes/qr';
import { QR_KINDS, qrToSvg, type QrKind } from '@/lib/codes/qrPayloads';

/**
 * Everything here runs in the browser. The encoder is local, so no link,
 * UPI ID or Wi-Fi password ever reaches a server — ours or anyone else's.
 * That matters more than usual for this tool: a QR generator that calls out
 * to an image API hands every code its operator makes to a third party.
 */

const PRINT_SCALE = 12;

export function QrWorkspace() {
  const [kind, setKind] = useState<QrKind>('url');
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spec = useMemo(
    () => QR_KINDS.find((entry) => entry.kind === kind) ?? QR_KINDS[0],
    [kind]
  );

  const payload = useMemo(() => spec.build(values), [spec, values]);

  const { modules, error } = useMemo(() => {
    if (!payload) return { modules: null, error: null };
    try {
      return { modules: encodeQr(payload), error: null };
    } catch (caught) {
      return {
        modules: null,
        error:
          caught instanceof QrTooLongError
            ? caught.message
            : 'That could not be encoded.',
      };
    }
  }, [payload]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !modules) return;
    drawQr(canvas, modules, PRINT_SCALE);
  }, [modules]);

  const setValue = (id: string, value: string) =>
    setValues((current) => ({ ...current, [id]: value }));

  const download = (format: 'png' | 'svg') => {
    if (!modules) return;
    const anchor = document.createElement('a');
    const name = `qr-${kind}`;

    if (format === 'svg') {
      const blob = new Blob([qrToSvg(modules)], { type: 'image/svg+xml' });
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `${name}.svg`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `${name}.png`;
    anchor.click();
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be refused; the value is shown on screen regardless.
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[var(--color-mark-default)] bg-white px-3 py-2 text-xs text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-subtle-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-8 items-start">
      <div className="space-y-6">
        {/* Destination type */}
        <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
          <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-4">
            What should it do?
          </h2>
          <div className="flex flex-wrap gap-2">
            {QR_KINDS.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                onClick={() => {
                  setKind(entry.kind);
                  setValues({});
                }}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
                  entry.kind === kind
                    ? 'bg-[var(--color-mark-ink)] text-white'
                    : 'border border-[var(--color-mark-default)] text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--color-mark-secondary)] leading-relaxed">
            {spec.blurb}
          </p>
        </section>

        {/* Fields */}
        <section className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
          <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-4">
            Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spec.fields.map((field) => (
              <label
                key={field.id}
                className={`block ${field.id === 'message' || field.id === 'body' || field.id === 'address' ? 'sm:col-span-2' : ''}`}
              >
                <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)] mb-1.5">
                  {field.label}
                  {field.optional && (
                    <span className="font-normal normal-case tracking-normal">
                      {' '}
                      — optional
                    </span>
                  )}
                </span>
                <input
                  className={inputClass}
                  type={field.type ?? 'text'}
                  value={values[field.id] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.id, event.target.value)}
                />
                {field.help && (
                  <span className="mt-1 block text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                    {field.help}
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Output */}
      <section className="lg:sticky lg:top-24 space-y-4">
        <div className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6">
          <div className="aspect-square flex items-center justify-center bg-[var(--color-mark-subtle)] rounded-2xl overflow-hidden">
            {modules ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
                aria-label="QR code preview"
              />
            ) : (
              <p className="px-6 text-center text-[11px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                {error ?? 'Fill in the details and your code appears here.'}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 text-[11px] font-semibold text-[var(--color-mark-red)]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
              {error}
            </p>
          )}

          {modules && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => download('png')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-4 py-2 text-[11px] font-bold text-white hover:bg-black transition-colors"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> PNG
                </button>
                <button
                  type="button"
                  onClick={() => download('svg')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-mark-default)] px-4 py-2 text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> SVG
                </button>
              </div>
              <p className="mt-2 text-[10px] text-[var(--color-mark-subtle-text)] leading-relaxed">
                Use SVG for anything printed — it stays sharp at any size. PNG is
                fine on screen.
              </p>
            </>
          )}
        </div>

        {payload && (
          <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)]">
                What it scans to
              </h3>
              <button
                type="button"
                onClick={copyPayload}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3" aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-[10px] text-[var(--color-mark-secondary)] break-all leading-relaxed whitespace-pre-wrap">
              {payload}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
