/**
 * robots.txt for chess.launchgrid.in.
 *
 * Next's `robots.ts` file convention only works at the root of the app, and
 * that one belongs to launchgrid.in — so this subdomain gets a plain route
 * handler instead. The proxy rewrites chess.launchgrid.in/robots.txt here.
 */
export const dynamic = 'force-static';

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://chess.launchgrid.in/sitemap.xml',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
