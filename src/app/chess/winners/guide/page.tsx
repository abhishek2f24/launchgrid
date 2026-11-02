import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, serif } from '@/components/chess/ChessShell';

export const metadata: Metadata = {
  title: 'Which files the prize winners tool needs',
  description:
    'How to export the Category prizes and Final ranking lists from chess-results.com, what the prize sheet should look like, and how prizes are shared out one per player.',
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

      <Section title="1. Category prizes — who is in each category">
        <p>
          On your tournament’s page on <strong>chess-results.com</strong>, choose{' '}
          <em>Category prizes</em> in the list selector, then use the Excel button to download it.
          The file holds one block per category — “age group S60”, “group PH”, “best female”,
          “rating between 1400 and 1499” — each already in order.
        </p>
        <p>
          This is the file that matters most: your tournament software has already decided who
          counts as a veteran and who is in which rating band, so the tool never has to guess.
        </p>
      </Section>

      <Section title="2. Final ranking — everyone who played">
        <p>
          The same page, <em>Final ranking</em> (or <em>Interim ranking</em> while the event is
          still running). It is optional but worth adding, for two reasons.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            chess-results prints only as many players per category as it has prize ranks for. With
            one prize per player those short lists run out, and a prize that should have moved down
            to the seventh veteran instead goes to nobody. The ranking list fills them back in.
          </li>
          <li>
            It lets the tool build the categories chess-results never printed — the unrated prize,
            or a “Below 1500” prize whose bounds do not line up with the bands in the export.
          </li>
        </ul>
      </Section>

      <Section title="3. Your prize sheet — the money (optional)">
        <p>
          A two-column sheet: the category in the first column, the amount in the second, one row
          per prize. This is the list most organisers already keep.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-[#23201c]/10 bg-white p-4 text-[12.5px] leading-relaxed">{`Prize        Prize Money
1            4500
2            3500
3            2500
Un           1500
Below_1500   1000
F            1000
S60          1000
Ph           1000`}</pre>
        <p className="mt-3">
          Numbers are the overall places — 1 is the first prize, 2 the second. The rest are matched
          to your categories: <code>F</code> or <code>W</code> to the female list, <code>S60</code>{' '}
          and <code>Ph</code> to the age and disability groups, <code>Un</code> or <code>Ur</code>{' '}
          to the unrated players, <code>Below_1500</code> to rated players under 1500. Anything the
          tool cannot place confidently is left for you to type, and it says so rather than
          guessing.
        </p>
        <p className="mt-3">
          You do not need this file at all. Without it, type the amounts for each category
          straight into the form: <code>4500, 3500, 2500</code>, biggest first, or the word{' '}
          <code>Trophy</code>.
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
