// Renders every registered composition to out/<id>.mp4, sequentially, skipping
// ones already rendered. Safe to re-run after a crash — it resumes.
// Run: node scripts/render-all.mjs   (logs to out/render-all.log too)
import { execSync, spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'out')
mkdirSync(outDir, { recursive: true })
const logFile = join(outDir, 'render-all.log')
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  appendFileSync(logFile, line + '\n')
}

// --quiet prints every composition id on a single space-separated line
const ids = execSync('npx remotion compositions --quiet', { cwd: root, encoding: 'utf-8' })
  .split(/\s+/).map((s) => s.trim()).filter((id) => /^(Ad|C)\d/.test(id))

// legacy output names from before this script existed
const LEGACY = {
  'Ad01-OrderPing': 'ad01-order-ping.mp4',
  'Ad02-OrderStack': 'ad02-order-stack.mp4',
  'Ad03-StoreBuild': 'ad03-store-build.mp4',
}

log(`render queue: ${ids.length} compositions`)
let done = 0, failed = []
for (const id of ids) {
  const dst = join(outDir, `${id.toLowerCase()}.mp4`)
  if (existsSync(dst) || (LEGACY[id] && existsSync(join(outDir, LEGACY[id])))) { log(`SKIP ${id} (exists)`); done++; continue }
  const r = spawnSync('npx', ['remotion', 'render', id, dst], { cwd: root, shell: true, stdio: 'pipe', encoding: 'utf-8' })
  if (r.status === 0) { done++; log(`DONE ${id} (${done}/${ids.length})`) }
  else { failed.push(id); log(`FAIL ${id}: ${(r.stderr || '').split('\n').filter(Boolean).slice(-3).join(' | ')}`) }
}
log(`finished: ${done}/${ids.length} rendered, ${failed.length} failed${failed.length ? ` -> ${failed.join(', ')}` : ''}`)
