import { NextRequest } from 'next/server';
import { proxy } from './proxy';

export async function middleware(request: NextRequest) {
  return await proxy(request);
}

export const config = {
  // Matches all request paths except for:
  // 1. /api routes
  // 2. /_next (static files)
  // 3. /_static (if any)
  // 4. static files (e.g. favicon.ico, images, sitemap, robots)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
