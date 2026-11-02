import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/chess/ChessShell';
import { WinnersTool } from '@/components/chess/WinnersTool';

export const metadata: Metadata = {
  title: 'Chess prize winners from a ranklist',
  description:
    'Decide which player wins each prize in a chess tournament. Upload one Excel workbook with a sort sheet and a Ranklist sheet; get a formatted winners list back. Free, in your browser.',
  alternates: { canonical: 'https://chess.launchgrid.in/winners' },
  openGraph: {
    title: 'Chess prize winners from a ranklist | ChessGrid',
    description:
      'Upload your prize list and final ranklist, get the winners under the one-prize-per-player rule.',
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
          A player can win only one prize — the biggest they qualify for. Work that out by hand
          across rating bands, age groups, club prizes and trophies and you will get it wrong at the
          ceremony. Give this your workbook instead.{' '}
          <Link href="/chess/winners/guide" className="underline">
            What the file must look like
          </Link>
          .
        </p>
      </PageHeader>
      <WinnersTool />
    </div>
  );
}
