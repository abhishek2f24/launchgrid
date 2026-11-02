/**
 * The shell every chess.launchgrid.in page sits in.
 *
 * Deliberately not the LaunchGrid marketing shell: the audience is chess
 * organisers and arbiters, not sellers, and a storefront nav would only ask
 * them to sign up for something they did not come for. The LaunchGrid link
 * in the footer is the only cross-sell.
 */

import Link from 'next/link';

const NAV = [
  { href: '/chess', label: 'Tools' },
  { href: '/chess/winners', label: 'Prize Winners' },
  { href: '/chess/winners/guide', label: 'Guide' },
  { href: '/chess/about', label: 'About' },
] as const;

export const serif = '[font-family:var(--font-playfair),serif]';

export function ChessShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f3] text-[#23201c] antialiased">
      <header className="sticky top-0 z-40 border-b border-[#23201c]/10 bg-[#f7f6f3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/chess" className="group flex items-center gap-2.5">
            <Board />
            <span className={`${serif} text-lg font-bold tracking-tight`}>
              Chess<span className="text-[#8a7b5c]">Grid</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] font-medium">
            {NAV.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-[#5c564d] transition-colors hover:bg-[#23201c]/[0.06] hover:text-[#23201c]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#23201c]/10 bg-[#efece5]">
        <div className="mx-auto max-w-5xl px-5 py-10 text-[13px] leading-relaxed text-[#5c564d]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-semibold text-[#23201c]">ChessGrid — free tools for tournament organisers</p>
              <p className="mt-1.5">
                Everything runs in your browser. Tournament files are never uploaded to a server.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-[#23201c]">
                  {item.label}
                </Link>
              ))}
              <a href="https://launchgrid.in" className="hover:text-[#23201c]">
                Built by LaunchGrid
              </a>
            </div>
          </div>
          <p className="mt-8 border-t border-[#23201c]/10 pt-6 text-xs">
            The prize winners tool is based on ChessWinners by Zaheer Beig, used under its
            licence. See <Link href="/chess/about" className="underline">About</Link> for the full
            notice. Not endorsed by or affiliated with the author.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Four squares: a chess board reduced to the smallest thing that still reads as one. */
function Board() {
  return (
    <span className="grid h-6 w-6 grid-cols-2 grid-rows-2 overflow-hidden rounded-[5px] ring-1 ring-[#23201c]/15">
      <span className="bg-[#23201c]" />
      <span className="bg-[#e8e2d4]" />
      <span className="bg-[#e8e2d4]" />
      <span className="bg-[#23201c]" />
    </span>
  );
}

/** Shared page header: eyebrow, title, one line of what it is for. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7b5c]">
        {eyebrow}
      </span>
      <h1 className={`${serif} mt-2 text-3xl font-bold leading-tight tracking-tight md:text-[2.75rem]`}>
        {title}
      </h1>
      {children ? (
        <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5c564d]">{children}</div>
      ) : null}
    </div>
  );
}
