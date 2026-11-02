/**
 * Bridges the ChessWinners workbook engine to the shared prize-list shape.
 *
 * The workbook mode keeps its own rules (`winners.ts`) because its whole point
 * is agreeing with the desktop program. Only its *output* is converted here,
 * so that both modes print, display and export through exactly one path.
 */

import type { Award, Category } from './allocate';
import { categoryId } from './allocate';
import type { PrizeSection } from './workbook';
import type { Award as LegacyAward, Player, WinnerSection } from './winners';
import type { RankedPlayer } from './swissManager';

function toRankedPlayer(player: Player): RankedPlayer {
  return {
    rank: player.rank,
    startNo: player.serialNo,
    name: player.name,
    female: player.gender.toLowerCase() === 'f',
    rating: player.rating,
    federation: '',
    birthYear: 0,
    age: player.age,
    club: player.club,
    type: player.type,
    group: player.disability,
    points: player.points,
  };
}

/**
 * Workbook winners as prize sections. Prize rows that matched nobody are added
 * back as empty awards, because "this prize went to no one" is the single most
 * useful thing the output can tell an organiser and the winner list alone
 * cannot show it.
 */
export function legacySections(
  sections: WinnerSection[],
  awards: LegacyAward[],
): { sections: PrizeSection[]; categories: Category[] } {
  const out: PrizeSection[] = sections.map((section) => ({
    label: section.heading,
    awards: section.winners.map<Award>((player, index) => ({
      categoryId: categoryId(section.heading),
      categoryLabel: section.heading,
      place: index + 1,
      amount: player.prizeMoney,
      winner: toRankedPlayer(player),
    })),
  }));

  for (const award of awards) {
    if (award.winner || award.kind === 'ignored') continue;
    const label = award.category;
    const section =
      out.find((entry) => entry.label.toLowerCase() === label.toLowerCase()) ??
      out.find((entry) => entry.label === 'Un-Rated' && label.toLowerCase() === 'un');
    const empty: Award = {
      categoryId: categoryId(label),
      categoryLabel: label,
      place: (section?.awards.length ?? 0) + 1,
      amount: award.prize,
      winner: null,
    };
    if (section) section.awards.push(empty);
    else out.push({ label, awards: [empty] });
  }

  return {
    sections: out,
    categories: out.map((section) => ({
      id: categoryId(section.label),
      label: section.label,
      players: section.awards.flatMap((award) => (award.winner ? [award.winner] : [])),
    })),
  };
}
