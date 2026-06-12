// Renders 9:16 (1080x1920) branded reel cards so a full reel can be assembled
// today from clip1 + these cards + the ElevenLabs voiceover (no Gemini quota needed).
import sharp from 'sharp'

const OUT = new URL('./', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const INK = '#1A1A18', CREAM = '#FAF9F7', ORANGE = '#FF8A00', SUBTLE = '#6B6B67'

const grid = (cx, y, s, gap) => `
  <rect x="${cx - s - gap/2}" y="${y}" width="${s}" height="${s}" rx="${s*0.18}" fill="${ORANGE}"/>
  <rect x="${cx + gap/2}" y="${y}" width="${s}" height="${s}" rx="${s*0.18}" fill="${ORANGE}"/>
  <rect x="${cx - s - gap/2}" y="${y + s + gap}" width="${s}" height="${s}" rx="${s*0.18}" fill="${ORANGE}"/>
  <rect x="${cx + gap/2}" y="${y + s + gap}" width="${s}" height="${s}" rx="${s*0.18}" fill="${CREAM}"/>`

const check = (x, y) => `<circle cx="${x}" cy="${y}" r="22" fill="${ORANGE}"/><path d="M ${x-10} ${y} L ${x-3} ${y+8} L ${x+11} ${y-9}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`

const feat = (y, text) => `${check(150, y)}<text x="200" y="${y+13}" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="${INK}">${text}</text>`

// CARD A — Solution features (covers 10-20s of the VO)
const cardA = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="${CREAM}"/>
  ${grid(540, 180, 90, 26)}
  <text x="540" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="${INK}">Sirf online nahi.</text>
  <text x="540" y="650" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="${ORANGE}">Poora business.</text>
  ${feat(820, 'UPI + Cash on Delivery')}
  ${feat(920, 'GST invoices — automatic')}
  ${feat(1020, 'WhatsApp + Google visible')}
  ${feat(1120, 'Saare orders, ek jagah')}
  ${feat(1220, 'Ek link = poora store')}
  <text x="540" y="1750" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${ORANGE}">launchgrid.in</text>
</svg>`

// CARD B — CTA (covers 27-30s)
const cardB = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="${INK}"/>
  ${grid(540, 240, 96, 28)}
  <text x="540" y="740" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="4" fill="#B9B9B4">PEHLE 10 BUSINESSES</text>
  <text x="540" y="900" text-anchor="middle" font-family="Georgia, serif" font-size="150" font-weight="bold" fill="#fff">FREE</text>
  <text x="540" y="1075" text-anchor="middle" font-family="Georgia, serif" font-size="150" font-weight="bold" fill="${ORANGE}">SETUP</text>
  <rect x="270" y="1250" width="540" height="150" rx="75" fill="${ORANGE}"/>
  <text x="540" y="1348" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="#fff">DM "STORE"</text>
  <text x="540" y="1520" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="600" fill="#B9B9B4">aur apne 5 product photos bhejo</text>
  <text x="540" y="1760" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#fff">launchgrid.in</text>
</svg>`

await sharp(Buffer.from(cardA)).png().toFile(OUT + 'card-solution-1080x1920.png')
await sharp(Buffer.from(cardB)).png().toFile(OUT + 'card-cta-1080x1920.png')
console.log('reel cards written to', OUT)
