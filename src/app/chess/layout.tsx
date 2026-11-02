import type { Metadata } from 'next';

import { ChessShell } from '@/components/chess/ChessShell';

/**
 * chess.launchgrid.in. `src/proxy.ts` rewrites that host onto these /chess
 * routes, so every path here is reachable at both
 * chess.launchgrid.in/winners and launchgrid.in/chess/winners; the canonical
 * URL on each page points at the subdomain.
 */
export const metadata: Metadata = {
  title: {
    default: 'ChessGrid — free tools for chess tournament organisers',
    template: '%s | ChessGrid',
  },
  description:
    'Free browser tools for chess arbiters and organisers. Distribute tournament prizes from a Swiss-Manager ranklist without installing anything.',
  alternates: { canonical: 'https://chess.launchgrid.in' },
  openGraph: {
    title: 'ChessGrid — free tools for chess tournament organisers',
    description:
      'Free browser tools for chess arbiters and organisers. Your tournament file never leaves your computer.',
    url: 'https://chess.launchgrid.in',
    siteName: 'ChessGrid',
    type: 'website',
  },
};

export default function ChessLayout({ children }: { children: React.ReactNode }) {
  return <ChessShell>{children}</ChessShell>;
}
