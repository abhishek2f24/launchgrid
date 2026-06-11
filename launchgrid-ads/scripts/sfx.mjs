// Synthesizes the SFX kit → public/*.wav (44.1kHz 16-bit mono).
// whoosh: filtered-noise sweep (whip transitions)
// impact: sub-drop thump (zoom punches, slams)
// riser:  noise+tone ramp (build into a transition)
// key:    soft tick (typing)
// Run: node scripts/sfx.mjs
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

function writeWav(name, samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  writeFileSync(join(out, name), buf)
  console.log(`wrote public/${name} (${(n / SR).toFixed(2)}s)`)
}

// Deterministic noise
let seed = 1
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1

// --- whoosh: 0.55s — noise through a sweeping one-pole lowpass, doppler-ish env
{
  const n = Math.floor(SR * 0.55)
  const s = new Float64Array(n)
  let lp = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const cutoff = 0.02 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.3)) // sweep up then down
    lp += cutoff * (rnd() - lp)
    const env = Math.sin(Math.PI * t) ** 1.6
    s[i] = lp * env * 1.6
  }
  writeWav('whoosh.wav', s)
}

// --- impact: 0.45s — sine pitch-drop 150→38Hz + click transient
{
  const n = Math.floor(SR * 0.45)
  const s = new Float64Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 150 * Math.exp(-t * 9) + 38
    phase += (2 * Math.PI * f) / SR
    const body = Math.sin(phase) * Math.exp(-t * 7)
    const click = i < 180 ? rnd() * (1 - i / 180) * 0.5 : 0
    s[i] = (body * 0.95 + click) * 0.9
  }
  writeWav('impact.wav', s)
}

// --- riser: 1.0s — noise + tone rising 180→850Hz, swelling, hard cut
{
  const n = Math.floor(SR * 1.0)
  const s = new Float64Array(n)
  let phase = 0, lp = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const f = 180 + 670 * t * t
    phase += (2 * Math.PI * f) / SR
    lp += (0.04 + 0.3 * t) * (rnd() - lp)
    const env = (t ** 1.7) * 0.85
    s[i] = (Math.sin(phase) * 0.45 + lp * 1.1) * env
  }
  writeWav('riser.wav', s)
}

// --- key: 0.05s — soft filtered tick for typing
{
  const n = Math.floor(SR * 0.05)
  const s = new Float64Array(n)
  let lp = 0
  for (let i = 0; i < n; i++) {
    lp += 0.35 * (rnd() - lp)
    s[i] = lp * Math.exp(-i / (SR * 0.008)) * 0.55
  }
  writeWav('key.wav', s)
}
