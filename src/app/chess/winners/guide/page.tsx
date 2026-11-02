import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, serif } from '@/components/chess/ChessShell';

export const metadata: Metadata = {
  title: 'Workbook format for the prize winners tool',
  description:
    'The sort and Ranklist sheets the chess prize winners tool reads: column order, category names, rating bands, age groups, club and disability prizes.',
  alternates: { canonical: 'https://chess.launchgrid.in/winners/guide' },
};

const RANK_COLUMNS = [
  ['A', 'Rank', 'Whole number. Required — rows without one are skipped, so title and header rows are safely ignored.'],
  ['B', 'SNo.', 'Starting number. Stored, never printed.'],
  ['C', 'Title', 'GM, IM, FM. Not read at all.'],
  ['D', 'Name', 'The player’s name, as it should appear on the prize list.'],
  ['E', 'Gender', '"F" (any case) is female. Anything else, blank included, is treated as male.'],
  ['F', 'IRtg', 'Rating. Must be a whole number — use 0 for unrated, never a blank or a dash.'],
  ['G', 'Club', 'State, club or district code: GOA, KA, MH.'],
  ['H', 'Age', 'Whole number. Blank or non-numeric becomes 0.'],
  ['I', 'Type', 'Age group exactly as your prize list spells it: U09, U15, F07, S60.'],
  ['J', 'Gr', 'Disability group: PC, VC, HI.'],
  ['K', 'Pts', 'Points. Copied to the output as text.'],
] as const;

const CATEGORIES = [
  ['Main, Main_1, Main_2 …', 'Overall prizes — any player. Capital M required, and the prize must be cash: a "Main" trophy is never awarded.'],
  ['Below_1800', 'Mode 1: a band. With Below_1800 and Below_1600 present, Below_1800 means 1600–1799 and unrated players are excluded. Mode 2: anyone rated under 1800, unrated included.'],
  ['Un', 'Unrated players (rating 0). Capital U, small n. Careful: any category containing "Un" is treated this way, so a club called "Union" behaves oddly.'],
  ['GOA', 'A club prize: players whose Club column is GOA.'],
  ['U15, U09, F07, S60', 'Mode 1: players whose Type column is exactly that. Mode 2: U-names mean age at or below the number for any gender; F, M and lowercase u names mean age at or below the number for girls only.'],
  ['PC, VC, HI', 'Players whose Gr column is exactly that code. An exact match — "PC or VC" does not work.'],
  ['W', 'Women: gender F whose Type contains no F, so girls already in F07 or F09 are left for their own prizes.'],
  ['GOA_M, GOA_F', 'Club and gender together.'],
  ['GOA_U15, GOA_F07', 'Club and age group together.'],
] as const;

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <PageHeader eyebrow="Usage guide" title="What the workbook must look like">
        <p>
          One .xlsx file, two sheets: <strong>sort</strong> for the prizes and{' '}
          <strong>Ranklist</strong> for the standings. Sheet names are matched ignoring case. The
          quickest start is to{' '}
          <Link href="/chess/winners" className="underline">
            download the sample workbook
          </Link>{' '}
          and paste your own Swiss-Manager export over the Ranklist sheet.
        </p>
      </PageHeader>

      <Section title="The 'sort' sheet — one row per prize">
        <p>
          Column A is the category, column B is the prize: a whole number (commas are fine) or the
          word <strong>Trophy</strong>. Anything else — “Medal”, “Rs 500”,
          “10000.50” — makes the
          row be skipped silently, so the tool warns you when it sees one.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong>Sort the rows by amount, highest first.</strong> Prizes are handed out top to
            bottom, and a player who takes a small prize first and a bigger one later keeps only the
            bigger one — the small prize then goes to nobody.
          </li>
          <li>
            <strong>Put every Trophy row below every cash row.</strong> Cash after a trophy stops
            the run with an error, as it crashes the desktop program.
          </li>
          <li>
            Several prizes in one category: write <code>Main_1</code>, <code>Main_2</code>,{' '}
            <code>Main_3</code>. A number from 1 to 99 after the last underscore is a row number and
            is stripped. <code>Below_1800</code> and <code>GOA_U15</code> keep their suffix.
          </li>
          <li>A header row spelled “Prize” and “Prize Money” is skipped. Blank rows are skipped.</li>
        </ul>
      </Section>

      <Section title="The 'Ranklist' sheet — one row per player, in rank order">
        <p>
          Columns are read <strong>by position</strong>, not by heading, so the order below matters
          and the header spelling does not. Players are taken in row order, not sorted by the Rank
          value: an unsorted sheet gives the wrong winners.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#23201c]/10 bg-white">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {RANK_COLUMNS.map(([letter, name, note]) => (
                <tr key={letter} className="border-b border-[#23201c]/8 last:border-0">
                  <td className="w-8 px-3 py-2.5 font-mono text-[12px] text-[#8a8378]">{letter}</td>
                  <td className="w-24 px-1 py-2.5 font-semibold">{name}</td>
                  <td className="px-3 py-2.5 text-[#5c564d]">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Category names">
        <p>
          Names must match your Ranklist exactly. If the prize list says <code>F07</code>, the Type
          column must say <code>F07</code> and not <code>F7</code>. Matching ignores upper and lower
          case for club, type and disability codes, but the special names below are
          case-sensitive: <code>Main</code>, <code>Below</code> and <code>Un</code> must be spelled
          that way.
        </p>
        <dl className="mt-4 space-y-3">
          {CATEGORIES.map(([name, note]) => (
            <div key={name} className="rounded-xl border border-[#23201c]/10 bg-white p-4">
              <dt className="font-mono text-[13px] font-semibold">{name}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#5c564d]">{note}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3">
          Any other name is matched against the Club, Type and Gr columns in that order.
        </p>
      </Section>

      <Section title="The tournament title (optional)">
        <p>
          If the first sheet of the workbook is neither “sort” nor “Ranklist”, its top rows become
          the heading of the winners list. Reading stops at the first cell containing “Main”, which
          is how a Swiss-Manager export’s name, venue and date lines end up in the title and the
          event line does not.
        </p>
      </Section>

      <Section title="Mode 1 or Mode 2">
        <p>
          <strong>Mode 1</strong> is what almost every organiser wants: rating categories are bands
          and age categories come from the Type column. <strong>Mode 2</strong> treats “under X” as
          anyone at or below X, so <code>Below_1800</code> includes unrated players and{' '}
          <code>U15</code> includes everyone aged 15 or less regardless of their Type. It was
          experimental in the original program and it stays experimental here. Use “Compare both
          modes” on the tool if you are unsure which your prize list means.
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
