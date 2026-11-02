/**
 * Subdomains of launchgrid.in that are ours, not a merchant's.
 *
 * `src/proxy.ts` serves these from the app instead of rewriting them to a
 * storefront, so a tenant that managed to register one would get a store
 * nobody can reach. `checkSubdomainAvailability` therefore refuses them at
 * signup. Add a name here before you point a new product at a subdomain.
 *
 * Keep this a plain constant: proxy code runs at the edge and should not pull
 * in anything heavier.
 */
export const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'app',
  'blog',
  'chess',
  'cdn',
  'dashboard',
  'docs',
  'help',
  'mail',
  'shop',
  'staging',
  'status',
  'store',
  'support',
  'www',
]);

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.trim().toLowerCase());
}
