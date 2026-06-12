import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Dev helper: serves the brand avatar with CORS so browser automation can
// fetch it from third-party pages (profile photo uploads). Harmless in prod —
// it only exposes the public logo.
export async function GET() {
  const file = await readFile(
    path.join(process.cwd(), 'marketing', 'social', 'assets', 'avatar-800.png')
  )
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}
