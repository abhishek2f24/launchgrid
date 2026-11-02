import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, serif } from '@/components/chess/ChessShell';

export const metadata: Metadata = {
  title: 'Which files the prize winners tool needs',
  description:
    'How to export the Final ranking and Category prizes lists from chess-results.com, how to enter the prize money on the page, and how prizes are shared out one per player.',
  alternates: { canonical: 'https://chess.launchgrid.in/winners/guide' },
};

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <PageHeader eyebrow="Usage guide" title="Which files you need">
        <p>
          Everything comes from the tournament software you already use. Nothing has to be retyped,
          and nothing is uploaded — the files are read inside your browser.
        </p>
      </PageHeader>

      <Section title="1. Final ranking — the only file you need">
        <p>
          On your tournament’s page on <strong>chess-results.com</strong>, choose{' '}
          <em>Final ranking</em> (or <em>Interim ranking</em> while the event is still running)
          and use the Excel button to download it. Drop that in and you are ready to type the
          prizes.
        </p>
        <p>
          Everything the prize list needs is in that one file: the order of play, each player’s
          rating, the sex column, and the Type and Gr columns your software puts the veterans and
          the PH players in. So the tool can offer <em>Best female</em>, <em>Unrated</em>,{' '}
          <em>S60</em>, <em>Ph</em> and any rating band without you naming them anywhere.
        </p>
      </Section>

      <Section title="2. Category prizes — optional">
        <p>
          The same page, <em>Category prizes</em>. Add it and every category block your software
          printed is offered by its own name as well, which is worth doing when a category is one
          only you know the rule for — a club prize, or a hand-picked list.
        </p>
        <p>
          chess-results prints only as many players per category as it has prize ranks for. Those
          short lists run out once one prize per player is enforced, so the ranking list is used to
          fill them back in.
        </p>
      </Section>

      <Section title="3. The prize money — typed on this page">
        <p>
          There is no prize sheet to prepare. Each prize is one row: choose the category from the
          dropdown, type the amount, and the next row appears by itself. Write{' '}
          <code>Trophy</code> instead of an amount for a trophy.
        </p>
        <p className="mt-3">
          The list is kept in this browser, so a refresh or a closed laptop lid does not lose it.
          It is tagged with the tournament name it was typed for, so next month’s event starts
          empty rather than inheriting this one’s prizes. Nothing is sent anywhere.
        </p>
        <p className="mt-3">
          If you already keep a two-column prize sheet, you can still drop it in and the rows are
          filled in from it. Anything it cannot place arrives as a row with the amount set and the
          category left for you to choose.
        </p>
      </Section>

      <Section title="Rating prizes are bands, not cut-offs">
        <p>
          This is the one thing worth reading twice. If your list has prizes for{' '}
          <em>under 1600</em> and <em>under 1500</em>, then <strong>under 1600 means 1500 to
          1599</strong> — a player rated 1452 is in the under-1500 prize only, and does not appear
          in the under-1600 list at all.
        </p>
        <p className="mt-3">
          That is how tournaments are actually run: the bands sit next to each other rather than
          nesting, so the strongest player in each band wins its prize. The tool shows the range
          back to you — <code>Under 1600 (1500–1599)</code> — so you can see a band narrow the
          moment you add a lower prize. A single <em>under 1600</em> prize with nothing beneath it
          covers everyone below 1600, as you would expect. Unrated players are never in a rating
          band; give them their own <em>Unrated</em> prize.
        </p>
      </Section>

      <Section title="How the prizes are shared out">
        <p>
          Every prize in the tournament is ordered by its value, biggest first, and handed to the
          best-placed player in its category who has not already won something. That one rule is
          what organisers mean by “one prize per player”, and it has consequences worth knowing
          before the ceremony:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Whoever takes a place in the open prizes disappears from every other list, so the
            veterans’ first prize can go to the second or third veteran.
          </li>
          <li>
            A category can run out of players. The tool prints “not awarded” rather than quietly
            dropping the prize, so you can decide what to do with the money.
          </li>
          <li>
            Two prizes of the same amount are handed out in the order you listed them.
          </li>
        </ul>
        <p className="mt-3">
          Check the result on screen, then print it or download the Excel file.
        </p>
      </Section>

      <Section title="Already have a ChessWinners workbook?">
        <p>
          Drop it in and it is used as-is. A workbook with <code>sort</code> and{' '}
          <code>Ranklist</code> sheets is worked out with the ChessWinners rules — rating bands,
          <code>Main</code>, <code>Un</code>, <code>W</code>, club and age categories, Mode 1 and
          Mode 2 — reproduced faithfully, quirks included, so the answers match the desktop
          program. See <Link href="/chess/about" className="underline">About</Link> for the credit
          and licence.
        </p>
        <p className="mt-3">
          If you drop that workbook in <em>alongside</em> a chess-results export, its{' '}
          <code>sort</code> sheet is read as your prize sheet instead, and the categories come from
          chess-results.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className={`${serif} mb-3 text-xl font-bold`}>{title}</h2>
      <div className="space-y-2 text-[14px] leading-relaxed text-[#3b3730] [&_code]:rounded [&_code]:bg-[#23201c]/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12.5px]">
        {children}
      </div>
    </section>
  );
}
