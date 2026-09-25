'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/**
 * The demand signal.
 *
 * Sends an email address, a source, and two counts — never anything from the
 * uploaded file. See the note in /api/early-access: this is the only network
 * call the landing page makes, so it is the only place the "stays in your
 * browser" promise could be broken.
 */
export function EarlyAccessForm({
  source,
  rowsAnalysed,
  findingsCount,
}: {
  source: string;
  rowsAnalysed?: number;
  findingsCount?: number;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage(null);

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, rowsAnalysed, findingsCount }),
      });
      const data = await response.json();
      if (data.ok) {
        setState('done');
      } else {
        setState('error');
        setMessage(data.error ?? 'Could not save that. Try again.');
      }
    } catch {
      setState('error');
      setMessage('Could not reach the server. Try again.');
    }
  };

  if (state === 'done') {
    return (
      <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-mark-green)]">
        <Check className="w-4 h-4" aria-hidden="true" />
        You&rsquo;re on the list. We&rsquo;ll be in touch before anything is charged.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@yourstore.com"
            className="w-full rounded-full border border-[var(--color-mark-default)] bg-white px-4 py-2.5 text-xs text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-subtle-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mark-ink)]/20 focus:border-[var(--color-mark-ink)]"
          />
        </label>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-black transition-colors disabled:opacity-60"
        >
          {state === 'sending' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          )}
          Join early access
        </button>
      </div>
      {message && (
        <p className="mt-2 text-[11px] font-semibold text-[var(--color-mark-red)]">
          {message}
        </p>
      )}
    </form>
  );
}
