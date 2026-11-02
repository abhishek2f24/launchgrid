'use client';

/**
 * The prize list itself — on screen and on paper.
 *
 * The printed sheet is the deliverable: it gets pinned to the notice board and
 * read out at the ceremony. So it is the same component, restyled by the
 * `print:` variants, rather than a second rendering that can drift from what
 * the organiser checked on screen.
 */

import type { Award } from '@/lib/chess/allocate';
import { isCash } from '@/lib/chess/allocate';
import type { RankedPlayer } from '@/lib/chess/swissManager';
import type { PrizeSection } from '@/lib/chess/workbook';

const ORDINALS = ['1st', '2nd', '3rd'];

export function placeLabel(place: number): string {
  return ORDINALS[place - 1] ?? `${place}th`;
}

export function money(amount: string): string {
  return isCash(amount) ? `₹${Number(amount).toLocaleString('en-IN')}` : amount;
}

function detail(player: RankedPlayer): string {
  const bits = [`Rank ${player.rank}`, player.rating === 0 ? 'Unrated' : String(player.rating)];
  if (player.club) bits.push(player.club);
  if (player.type) bits.push(player.type);
  if (player.group) bits.push(player.group);
  if (player.points) bits.push(`${player.points} pts`);
  return bits.join(' · ');
}

export function PrizeList({
  sections,
  tournament,
  totalCash,
}: {
  sections: PrizeSection[];
  tournament: string | null;
  totalCash: number;
}) {
  return (
    <div className="rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8 print:rounded-none print:border-0 print:p-0">
      <header className="mb-6 text-center print:mb-4">
        <h2 className="[font-family:var(--font-playfair),serif] text-xl font-bold leading-snug print:text-2xl">
          {tournament ?? 'Prize list'}
        </h2>
        <p className="mt-1 text-[13px] text-[#5c564d]">
          Prize list · {money(String(totalCash))} awarded
        </p>
      </header>

      <div className="space-y-6 print:space-y-4">
        {sections.map((section) => (
          <section key={section.label} className="break-inside-avoid">
            <h3 className="rounded-t-xl bg-[#23201c] px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-[#f7f6f3] print:rounded-none print:bg-transparent print:px-0 print:text-black print:border-b print:border-black">
              {section.label}
            </h3>
            <ul className="divide-y divide-[#23201c]/8 rounded-b-xl border border-t-0 border-[#23201c]/10 print:rounded-none print:border-0">
              {section.awards.map((award) => (
                <PrizeRow key={`${award.categoryId}-${award.place}`} award={award} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function PrizeRow({ award }: { award: Award }) {
  return (
    <li className="flex items-baseline gap-3 px-4 py-2.5 text-[13px] print:px-0 print:py-1">
      <span className="w-12 shrink-0 font-semibold text-[#8a7b5c] print:text-black">
        {placeLabel(award.place)}
      </span>
      {award.winner ? (
        <span className="flex-1">
          <span className="font-semibold">{award.winner.name}</span>
          <span className="ml-2 text-[12px] text-[#8a8378] print:text-black">
            {detail(award.winner)}
          </span>
        </span>
      ) : (
        <span className="flex-1 italic text-[#a4251f] print:text-black">
          Not awarded — everyone in this category already won a bigger prize
        </span>
      )}
      <span className="shrink-0 font-semibold tabular-nums">{money(award.amount)}</span>
    </li>
  );
}

/** The full ranking, for organisers who print it beside the prize list. */
export function RankingTable({ players }: { players: RankedPlayer[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[#23201c]/10 bg-white p-6 md:p-8 print:rounded-none print:border-0 print:p-0">
      <h3 className="mb-4 [font-family:var(--font-playfair),serif] text-lg font-bold">
        Final ranking
      </h3>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#f3f1ec] text-left text-[11px] uppercase tracking-wider text-[#5c564d] print:bg-transparent">
            {['Rank', 'Name', 'Sex', 'Rating', 'Type', 'Gr', 'Pts'].map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold print:px-1">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={`${player.startNo}-${player.rank}-${player.name}`}
              className="border-t border-[#23201c]/8"
            >
              <td className="px-3 py-1.5 print:px-1">{player.rank}</td>
              <td className="px-3 py-1.5 font-medium print:px-1">{player.name}</td>
              <td className="px-3 py-1.5 print:px-1">{player.female ? 'F' : ''}</td>
              <td className="px-3 py-1.5 print:px-1">
                {player.rating === 0 ? 'Unrated' : player.rating}
              </td>
              <td className="px-3 py-1.5 print:px-1">{player.type}</td>
              <td className="px-3 py-1.5 print:px-1">{player.group}</td>
              <td className="px-3 py-1.5 print:px-1">{player.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
