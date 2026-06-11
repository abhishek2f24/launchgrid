import { NextRequest } from 'next/server'
import { proxy } from './proxy'

export async function middleware(request: NextRequest) {
  return proxy(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
