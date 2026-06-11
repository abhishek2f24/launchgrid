'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

export function ShareStoreCard({ storeUrl, subdomain }: { storeUrl: string; subdomain: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-[var(--color-mark-default)] bg-white shadow-sm hover:shadow-md hover:border-[var(--color-mark-strong)] transition-all duration-200 cursor-pointer"
      onClick={() => {
        if (typeof navigator !== 'undefined') {
          navigator.clipboard.writeText(storeUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
        <Share2 className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-[var(--color-mark-ink)] font-bold text-sm mb-1 font-inter">
          {copied ? 'Link Copied!' : 'Share Your Store Link'}
        </h3>
        <p className="text-[var(--color-mark-secondary)] text-xs leading-relaxed font-inter">
          Your store URL is live right now. Share it with early followers while you add products.
        </p>
      </div>
      <div className="mt-auto">
        <code className="text-[10px] text-[var(--color-mark-ink)] font-bold font-mono bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] px-2 py-1 rounded-lg truncate block">
          {subdomain}.launchgrid.in
        </code>
      </div>
    </div>
  );
}
