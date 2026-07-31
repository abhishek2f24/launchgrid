// Lightweight, dependency-free text-similarity utilities for product
// deduplication stage 2 (§31) — token Jaccard + normalised Levenshtein.
// No embeddings/network calls required, so this runs fully offline.

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalise(text).split(' ').filter(Boolean);
}

export function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const normA = normalise(a);
  const normB = normalise(b);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLen;
}

// Blended title-similarity score used by the dedup engine — Jaccard catches
// reordered/keyword-stuffed titles, Levenshtein catches near-identical
// titles with minor typos or punctuation differences.
export function titleSimilarity(a: string, b: string): number {
  return 0.6 * jaccardSimilarity(a, b) + 0.4 * levenshteinSimilarity(a, b);
}
