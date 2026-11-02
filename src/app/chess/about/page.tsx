import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, serif } from '@/components/chess/ChessShell';
import { LICENCE_TEXT } from '@/lib/chess/licence';

export const metadata: Metadata = {
  title: 'About ChessGrid and its licence',
  description:
    'ChessGrid is a free browser rebuild of chess tournament tools by LaunchGrid. The prize winners tool is based on ChessWinners v2.0 by Zaheer Beig, used under its licence.',
  alternates: { canonical: 'https://chess.launchgrid.in/about' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <PageHeader eyebrow="About" title="Credit, licence and what this is">
        <p>
          ChessGrid is a small set of free tools for chess tournament organisers, built and run by{' '}
          <a href="https://launchgrid.in" className="underline">
            LaunchGrid
          </a>
          . Nothing here needs an account, and no tournament file is uploaded anywhere — the
          spreadsheets are read and written inside your own browser.
        </p>
      </PageHeader>

      <section className="mb-10">
        <h2 className={`${serif} mb-3 text-xl font-bold`}>The prize winners tool</h2>
        <p className="text-[14px] leading-relaxed text-[#3b3730]">
          Its rules are those of <strong>ChessWinners v2.0, developed by Zaheer Beig</strong>, whose
          licence permits a rebuild like this one. It is a faithful port: where the original
          behaves oddly — unrated players excluded from rating bands, a “Main” trophy never
          awarded, age categories without a capital U matching girls only in Mode 2 — this tool
          behaves the same way, so that an organiser who checks our winners list against the
          desktop program sees the same names. Rather than quietly improve the rules, the tool
          warns you when your sheet is about to be affected by one of them. Two cases differ: a
          cash prize below a trophy row, and a category that is nothing but a row number, stop with
          a clear message instead of crashing.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#3b3730]">
          ChessGrid is not endorsed by, affiliated with or supported by Zaheer Beig. Please do not
          ask him about this website — report anything wrong with it to{' '}
          <a href="mailto:support@launchgrid.in" className="underline">
            support@launchgrid.in
          </a>
          .
        </p>
      </section>

      <section className="mb-10">
        <h2 className={`${serif} mb-3 text-xl font-bold`}>Licence notice</h2>
        <pre className="overflow-auto whitespace-pre-wrap rounded-2xl border border-[#23201c]/10 bg-white p-5 text-[12.5px] leading-relaxed text-[#3b3730]">
          {LICENCE_TEXT}
        </pre>
      </section>

      <section>
        <h2 className={`${serif} mb-3 text-xl font-bold`}>Start here</h2>
        <p className="text-[14px] leading-relaxed text-[#3b3730]">
          <Link href="/chess/winners" className="underline">
            Open the prize winners tool
          </Link>{' '}
          or read the{' '}
          <Link href="/chess/winners/guide" className="underline">
            workbook format guide
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
