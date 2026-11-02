import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/chess/ChessShell';
import { WinnersTool } from '@/components/chess/WinnersTool';

export const metadata: Metadata = {
  title: 'Chess prize winners from a ranklist',
  description:
    'Decide which player wins each prize in a chess tournament. Upload your chess-results category prizes and ranking exports, type the prize money, print the list. One prize per player. Free, in your browser.',
  alternates: { canonical: 'https://chess.launchgrid.in/winners' },
  openGraph: {
    title: 'Chess prize winners from a ranklist | ChessGrid',
    description:
      'Upload your chess-results exports, type the prize money, print the prize list. One prize per player.',
    url: 'https://chess.launchgrid.in/winners',
    siteName: 'ChessGrid',
    type: 'website',
  },
};

export default function WinnersPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
      <PageHeader eyebrow="Prize distribution" title="Who wins which prize">
        <p>
          Drop in the exports you already downloaded from chess-results, type the prize money, and
          print the list. A player can win only one prize — the biggest they are in line for — so
          whoever takes 4th overall drops out of the veterans’ list and that prize moves down.
          Doing that by hand across rating bands, age groups and trophies is how the wrong name
          gets read out at the ceremony.{' '}
          <Link href="/chess/winners/guide" className="underline">
            Which files do I need?
          </Link>
        </p>
      </PageHeader>
      <WinnersTool />
    </div>
  );
}
