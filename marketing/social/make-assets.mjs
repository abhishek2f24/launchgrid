// Renders LaunchGrid social profile assets from brand SVG via sharp (bundled with Next).
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const OUT = new URL('./assets/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

const INK = '#1A1A18'
const CREAM = '#FAF9F7'
const ORANGE = '#FF8A00'

const grid = (x, y, s, gap, fill = ORANGE, lastFill = CREAM) => `
  <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.18}" fill="${fill}"/>
  <rect x="${x + s + gap}" y="${y}" width="${s}" height="${s}" rx="${s * 0.18}" fill="${fill}"/>
  <rect x="${x}" y="${y + s + gap}" width="${s}" height="${s}" rx="${s * 0.18}" fill="${fill}"/>
  <rect x="${x + s + gap}" y="${y + s + gap}" width="${s}" height="${s}" rx="${s * 0.18}" fill="${lastFill}"/>`

// 1. Avatar 800x800 — ink background, orange grid mark
const avatar = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="${INK}"/>
  ${grid(220, 220, 165, 30)}
</svg>`

// 2. X header 1500x500
const xHeader = `<svg width="1500" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1500" height="500" fill="${CREAM}"/>
  ${grid(90, 145, 95, 18)}
  <text x="330" y="240" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="${INK}">Your business, in your pocket.</text>
  <text x="332" y="305" font-family="Arial, sans-serif" font-size="30" font-weight="600" fill="#6B6B67">Online store with UPI · COD · GST invoices — live in 15 minutes</text>
  <text x="332" y="370" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${ORANGE}">launchgrid.in</text>
</svg>`

// 3. Facebook cover 1640x624 (renders safely at 820x312 too)
const fbCover = `<svg width="1640" height="624" xmlns="http://www.w3.org/2000/svg">
  <rect width="1640" height="624" fill="${INK}"/>
  ${grid(120, 190, 110, 20)}
  <text x="400" y="290" font-family="Georgia, serif" font-size="68" font-weight="bold" fill="${CREAM}">Dukaan se duniya tak.</text>
  <text x="402" y="360" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#B9B9B4">Store live in 15 minutes — UPI · COD · GST · WhatsApp</text>
  <text x="402" y="430" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="${ORANGE}">launchgrid.in — pehle 10 stores ka setup FREE</text>
</svg>`

await sharp(Buffer.from(avatar)).png().toFile(OUT + 'avatar-800.png')
await sharp(Buffer.from(xHeader)).png().toFile(OUT + 'x-header-1500x500.png')
await sharp(Buffer.from(fbCover)).png().toFile(OUT + 'fb-cover-1640x624.png')
console.log('assets written to', OUT)
