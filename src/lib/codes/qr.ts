/**
 * A QR Code encoder — byte mode, error-correction level M, versions 1 to 20.
 *
 * WHY WRITE THIS
 *   No dependency, and nothing here runs on a server. A QR generator that
 *   round-trips a URL through someone else's image API leaks every link the
 *   seller makes; one that posts to our own server costs us money per scan. A
 *   few hundred lines of well-specified bit manipulation avoids both.
 *
 * SCOPE, STATED HONESTLY
 *   Byte mode only (works for every input, at a small size cost against
 *   numeric/alphanumeric modes) and level M only — 15% recovery, the right
 *   default for something printed on a menu or a box. Versions 1–20 hold up to
 *   ~850 bytes, which covers URLs, UPI strings, WhatsApp links, Wi-Fi joins and
 *   short vCards. Longer input throws rather than silently truncating.
 *
 * HOW IT IS VERIFIED
 *   The spec tables below are transcribed by hand, so a typo is the likely
 *   failure and it would produce a code that renders but does not scan. Every
 *   version is round-tripped through the browser's own `BarcodeDetector` in
 *   verification — encode, draw, decode, assert the text matches.
 */

export type QrModules = boolean[][];

/** Level M only. Index is version - 1. */
interface VersionSpec {
  /** Error-correction codewords per block. */
  ecPerBlock: number;
  /** [blockCount, dataCodewordsPerBlock] for group 1 and optional group 2. */
  group1: [number, number];
  group2: [number, number] | null;
  /** Centre coordinates of alignment patterns. */
  alignment: number[];
}

const VERSIONS: VersionSpec[] = [
  { ecPerBlock: 10, group1: [1, 16], group2: null, alignment: [] },
  { ecPerBlock: 16, group1: [1, 28], group2: null, alignment: [6, 18] },
  { ecPerBlock: 26, group1: [1, 44], group2: null, alignment: [6, 22] },
  { ecPerBlock: 18, group1: [2, 32], group2: null, alignment: [6, 26] },
  { ecPerBlock: 24, group1: [2, 43], group2: null, alignment: [6, 30] },
  { ecPerBlock: 16, group1: [4, 27], group2: null, alignment: [6, 34] },
  { ecPerBlock: 18, group1: [4, 31], group2: null, alignment: [6, 22, 38] },
  { ecPerBlock: 22, group1: [2, 38], group2: [2, 39], alignment: [6, 24, 42] },
  { ecPerBlock: 22, group1: [3, 36], group2: [2, 37], alignment: [6, 26, 46] },
  { ecPerBlock: 26, group1: [4, 43], group2: [1, 44], alignment: [6, 28, 50] },
  { ecPerBlock: 30, group1: [1, 50], group2: [4, 51], alignment: [6, 30, 54] },
  { ecPerBlock: 22, group1: [6, 36], group2: [2, 37], alignment: [6, 32, 58] },
  { ecPerBlock: 22, group1: [8, 37], group2: [1, 38], alignment: [6, 34, 62] },
  { ecPerBlock: 24, group1: [4, 40], group2: [5, 41], alignment: [6, 26, 46, 66] },
  { ecPerBlock: 24, group1: [5, 41], group2: [5, 42], alignment: [6, 26, 48, 70] },
  { ecPerBlock: 28, group1: [7, 45], group2: [3, 46], alignment: [6, 26, 50, 74] },
  { ecPerBlock: 28, group1: [10, 46], group2: [1, 47], alignment: [6, 30, 54, 78] },
  { ecPerBlock: 26, group1: [9, 43], group2: [4, 44], alignment: [6, 30, 56, 82] },
  { ecPerBlock: 26, group1: [3, 44], group2: [11, 45], alignment: [6, 30, 58, 86] },
  { ecPerBlock: 26, group1: [3, 41], group2: [13, 42], alignment: [6, 34, 62, 90] },
];

function dataCapacity(version: number): number {
  const spec = VERSIONS[version - 1];
  return (
    spec.group1[0] * spec.group1[1] +
    (spec.group2 ? spec.group2[0] * spec.group2[1] : 0)
  );
}

// ── Galois field GF(256) with the QR primitive polynomial 0x11D ───────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const gfMul = (a: number, b: number): number =>
  a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];

/** Generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** Reed–Solomon remainder: the EC codewords for one block. */
function ecCodewords(data: number[], count: number): number[] {
  const generator = generatorPoly(count);
  const remainder = new Array(count).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < count; i += 1) {
      remainder[i] ^= gfMul(generator[i + 1], factor);
    }
  }
  return remainder;
}

// ── Bit buffer ────────────────────────────────────────────────────────────
class Bits {
  readonly values: number[] = [];

  push(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.values.push((value >>> i) & 1);
    }
  }
}

// ── Format information (level M) ─────────────────────────────────────────
/**
 * 15-bit format string: 5 data bits (EC level + mask) with BCH(15,5) error
 * correction, XORed with the spec's fixed mask 0x5412.
 */
function formatBits(mask: number): number {
  // Level M is 0b00 in the format encoding.
  const data = (0b00 << 3) | mask;
  let bch = data << 10;
  for (let i = 4; i >= 0; i -= 1) {
    if ((bch >>> (i + 10)) & 1) bch ^= 0b10100110111 << i;
  }
  return ((data << 10) | bch) ^ 0b101010000010010;
}

/** 18-bit version information, used from version 7 upwards. */
function versionBits(version: number): number {
  let bch = version << 12;
  for (let i = 5; i >= 0; i -= 1) {
    if ((bch >>> (i + 12)) & 1) bch ^= 0b1111100100101 << i;
  }
  return (version << 12) | bch;
}

// ── Matrix construction ──────────────────────────────────────────────────
type Grid = (boolean | null)[][];

function placeFinder(grid: Grid, reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || y >= grid.length || x < 0 || x >= grid.length) continue;
      const inRing =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[y][x] = inRing || inCore;
      reserved[y][x] = true;
    }
  }
}

function buildBase(version: number): { grid: Grid; reserved: boolean[][] } {
  const size = version * 4 + 17;
  const grid: Grid = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false)
  );

  placeFinder(grid, reserved, 0, 0);
  placeFinder(grid, reserved, 0, size - 7);
  placeFinder(grid, reserved, size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    const on = i % 2 === 0;
    grid[6][i] = on;
    grid[i][6] = on;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Alignment patterns, skipping the three finder corners
  const centres = VERSIONS[version - 1].alignment;
  for (const row of centres) {
    for (const col of centres) {
      const nearFinder =
        (row <= 8 && col <= 8) ||
        (row <= 8 && col >= size - 9) ||
        (row >= size - 9 && col <= 8);
      if (nearFinder) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          grid[row + r][col + c] =
            Math.max(Math.abs(r), Math.abs(c)) !== 1;
          reserved[row + r][col + c] = true;
        }
      }
    }
  }

  // Dark module, always set, always reserved
  grid[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve the format areas
  for (let i = 0; i < 9; i += 1) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Reserve the version areas
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        reserved[size - 11 + j][i] = true;
        reserved[i][size - 11 + j] = true;
      }
    }
  }

  return { grid, reserved };
}

/** Upward-then-downward zigzag placement, skipping the vertical timing column. */
function placeData(grid: Grid, reserved: boolean[][], bits: number[]) {
  const size = grid.length;
  let index = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    // Column 6 is the vertical timing pattern. Stepping onto column 5 has to
    // move the cursor itself — relabelling it would make the next iteration
    // revisit column 4 and shift every remaining column.
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const col = right - offset;
        if (reserved[row][col]) continue;
        grid[row][col] = index < bits.length ? bits[index] === 1 : false;
        index += 1;
      }
    }
    upward = !upward;
  }
}

const MASKS: ((row: number, col: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/** The spec's four penalty rules. Lower is better. */
function penalty(modules: QrModules): number {
  const size = modules.length;
  let score = 0;

  // Rule 1: runs of five or more same-coloured modules
  const runScore = (get: (i: number, j: number) => boolean) => {
    let total = 0;
    for (let i = 0; i < size; i += 1) {
      let run = 1;
      for (let j = 1; j < size; j += 1) {
        if (get(i, j) === get(i, j - 1)) {
          run += 1;
        } else {
          if (run >= 5) total += run - 2;
          run = 1;
        }
      }
      if (run >= 5) total += run - 2;
    }
    return total;
  };
  score += runScore((i, j) => modules[i][j]);
  score += runScore((i, j) => modules[j][i]);

  // Rule 2: 2x2 blocks of one colour
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const first = modules[r][c];
      if (
        modules[r][c + 1] === first &&
        modules[r + 1][c] === first &&
        modules[r + 1][c + 1] === first
      ) {
        score += 3;
      }
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns with four light modules either side
  const PATTERN = [true, false, true, true, true, false, true];
  const matches = (line: boolean[], at: number, extra: 'before' | 'after') => {
    for (let i = 0; i < 7; i += 1) {
      if (line[at + i] !== PATTERN[i]) return false;
    }
    const range =
      extra === 'before' ? [at - 4, at - 1] : [at + 7, at + 10];
    for (let i = range[0]; i <= range[1]; i += 1) {
      if (i < 0 || i >= line.length) continue;
      if (line[i]) return false;
    }
    return true;
  };
  for (let i = 0; i < size; i += 1) {
    const row = modules[i];
    const col = modules.map((line) => line[i]);
    for (const line of [row, col]) {
      for (let j = 0; j <= size - 7; j += 1) {
        if (matches(line, j, 'before') || matches(line, j, 'after')) score += 40;
      }
    }
  }

  // Rule 4: deviation from an even split of dark and light
  let dark = 0;
  for (const row of modules) for (const cell of row) if (cell) dark += 1;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

function applyFormat(modules: QrModules, mask: number) {
  const size = modules.length;
  const bits = formatBits(mask);

  // Both copies are written LSB-first, but they run in different directions:
  // the first climbs column 8 (rows 0–5, then 7–8, then the bottom strip), the
  // second runs leftwards along row 8 from the right edge. Swapping the two —
  // which is the easy mistake — produces a code that renders perfectly and
  // scans as nothing at all.
  for (let i = 0; i < 15; i += 1) {
    const on = ((bits >>> i) & 1) === 1;

    if (i < 6) modules[i][8] = on;
    else if (i < 8) modules[i + 1][8] = on;
    else modules[size - 15 + i][8] = on;

    if (i < 8) modules[8][size - 1 - i] = on;
    else if (i === 8) modules[8][7] = on;
    else modules[8][14 - i] = on;
  }

  modules[size - 8][8] = true;
}

function applyVersion(modules: QrModules, version: number) {
  if (version < 7) return;
  const size = modules.length;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const on = ((bits >>> i) & 1) === 1;
    const row = Math.floor(i / 3);
    const col = (i % 3) + size - 11;
    modules[row][col] = on;
    modules[col][row] = on;
  }
}

export class QrTooLongError extends Error {
  constructor(byteLength: number) {
    super(
      `That is ${byteLength} bytes. This encoder handles up to ${dataCapacity(20) - 3} bytes at error-correction level M — shorten the text, or use a link instead of embedding the whole content.`
    );
    this.name = 'QrTooLongError';
  }
}

/**
 * Encode `text` and return the module grid (true = dark). The caller decides
 * how to draw it — canvas, SVG, or a table of divs.
 */
export function encodeQr(text: string): QrModules {
  const bytes = Array.from(new TextEncoder().encode(text));

  // Smallest version that fits, accounting for mode (4 bits) and the length
  // field (8 bits under version 10, 16 bits from version 10).
  let version = 0;
  for (let candidate = 1; candidate <= 20; candidate += 1) {
    const lengthBits = candidate < 10 ? 8 : 16;
    const needed = Math.ceil((4 + lengthBits + bytes.length * 8) / 8);
    if (needed <= dataCapacity(candidate)) {
      version = candidate;
      break;
    }
  }
  if (version === 0) throw new QrTooLongError(bytes.length);

  const spec = VERSIONS[version - 1];
  const capacity = dataCapacity(version);

  // Build the data bit stream
  const bits = new Bits();
  bits.push(0b0100, 4); // byte mode
  bits.push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) bits.push(byte, 8);

  // Terminator, then pad to a byte boundary
  const capacityBits = capacity * 8;
  const terminator = Math.min(4, capacityBits - bits.values.length);
  bits.push(0, terminator);
  while (bits.values.length % 8 !== 0) bits.values.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.values.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits.values[i + j];
    dataCodewords.push(byte);
  }
  // Alternating pad bytes, as the spec requires
  const PADS = [0xec, 0x11];
  let padIndex = 0;
  while (dataCodewords.length < capacity) {
    dataCodewords.push(PADS[padIndex % 2]);
    padIndex += 1;
  }

  // Split into blocks and compute error correction per block
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let cursor = 0;
  const groups: [number, number][] = spec.group2
    ? [spec.group1, spec.group2]
    : [spec.group1];

  for (const [blockCount, blockSize] of groups) {
    for (let i = 0; i < blockCount; i += 1) {
      const block = dataCodewords.slice(cursor, cursor + blockSize);
      cursor += blockSize;
      blocks.push(block);
      ecBlocks.push(ecCodewords(block, spec.ecPerBlock));
    }
  }

  // Interleave data codewords, then EC codewords
  const interleaved: number[] = [];
  const longest = Math.max(...blocks.map((block) => block.length));
  for (let i = 0; i < longest; i += 1) {
    for (const block of blocks) if (i < block.length) interleaved.push(block[i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (const block of ecBlocks) interleaved.push(block[i]);
  }

  const finalBits: number[] = [];
  for (const byte of interleaved) {
    for (let i = 7; i >= 0; i -= 1) finalBits.push((byte >>> i) & 1);
  }

  // Place, then pick the mask with the lowest penalty
  const { grid, reserved } = buildBase(version);
  placeData(grid, reserved, finalBits);

  let best: QrModules | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate: QrModules = grid.map((row, r) =>
      row.map((cell, c) =>
        reserved[r][c] ? cell === true : (cell === true) !== MASKS[mask](r, c)
      )
    );
    applyFormat(candidate, mask);
    applyVersion(candidate, version);

    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best as QrModules;
}

/** Draw a module grid onto a canvas at `scale` pixels per module. */
export function drawQr(
  canvas: HTMLCanvasElement,
  modules: QrModules,
  scale = 8,
  // Four light modules on every side, as the spec requires. Scanners rely on
  // this margin; without it a code printed flush against artwork often fails.
  quietZone = 4
) {
  const size = modules.length;
  const pixels = (size + quietZone * 2) * scale;
  canvas.width = pixels;
  canvas.height = pixels;

  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pixels, pixels);
  context.fillStyle = '#000000';

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!modules[r][c]) continue;
      context.fillRect(
        (c + quietZone) * scale,
        (r + quietZone) * scale,
        scale,
        scale
      );
    }
  }
}
