import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Trophy, Users, Zap } from 'lucide-react';

import { PageHeader, serif } from '@/components/chess/ChessShell';

export const metadata: Metadata = {
  // Absolute: this page is the root of a different product, so the
  // "| LaunchGrid" template from the app's root layout does not belong on it.
  title: { absolute: 'ChessGrid — free tools for chess tournament organisers' },
  alternates: { canonical: 'https://chess.launchgrid.in' },
};

export default function ChessHomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <PageHeader eyebrow="Free · no account · nothing uploaded" title="Tools for people who run chess tournaments">
        <p>
          Arbiter software is desktop-only, Windows-only and usually a decade old. These are the
          same jobs, done in a browser tab, on whatever machine is in the tournament hall.
        </p>
      </PageHeader>

      <Link
        href="/chess/winners"
        className="group block rounded-3xl border border-[#23201c]/10 bg-white p-6 shadow-[0_10px_40px_rgba(35,32,28,0.06)] transition-shadow hover:shadow-[0_14px_50px_rgba(35,32,28,0.12)] md:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8a6f2c]/12 text-[#8a6f2c]">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className={`${serif} text-2xl font-bold`}>Prize Winners</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5c564d]">
              Upload one workbook with your prize list and your final ranklist. It decides who takes
              each prize under the one-prize-per-player rule, shows the result on screen and gives
              you a formatted winners list to print.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#8a6f2c]">
              Open the tool
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Nothing is uploaded">
          The workbook is read and written inside your browser. No server sees your players.
        </Feature>
        <Feature icon={<Zap className="h-4 w-4" />} title="Same answers as the desktop app">
          The rules are a faithful port of ChessWinners v2.0, quirks included, so results match.
        </Feature>
        <Feature icon={<Users className="h-4 w-4" />} title="Warns instead of surprising you">
          Unsorted prize rows, categories nobody matches, prizes that will go unawarded.
        </Feature>
      </div>

      <section className="mt-14 rounded-3xl border border-dashed border-[#23201c]/18 p-6 md:p-8">
        <h2 className="text-[15px] font-bold">Being built next</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5c564d]">
          A Swiss pairing and tournament manager — entries, round pairings, tiebreaks and a
          publishable ranklist — so a full event can run from the browser rather than one laptop in
          the corner of the hall. It is not here yet, and this page will not pretend otherwise.
        </p>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#23201c]/10 bg-white/60 p-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#23201c]/[0.06] text-[#23201c]">
        {icon}
      </span>
      <h3 className="mt-3 text-[14px] font-bold">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c564d]">{children}</p>
    </div>
  );
}
