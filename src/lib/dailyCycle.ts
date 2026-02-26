/**
 * Deterministic daily cycling utilities.
 *
 * Ensures every item in a pool is used exactly once before any item repeats.
 * Each full cycle uses a different permutation order so repeated cycles
 * don't feel like déjà vu.
 */

// ---- primitives ----

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function createSeededRng(seed: number) {
  let s = Math.abs(seed) | 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rng = createSeededRng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Days since 2024-01-01 */
function getDayNumber(dateStr: string): number {
  const epoch = Date.UTC(2024, 0, 1);
  const [y, m, d] = dateStr.split("-").map(Number);
  const current = Date.UTC(y, m - 1, d);
  return Math.floor((current - epoch) / 86_400_000);
}

// ---- public API ----

/**
 * Pick 1 item from `pool` for the given date. Cycles through every item
 * before repeating. Each cycle is a different permutation.
 */
export function pickDaily<T>(pool: T[], date: string, salt: string): T {
  const dayNum = getDayNumber(date);
  const n = pool.length;
  const cycle = Math.floor(dayNum / n);
  const pos = dayNum % n;
  const seed = hashString(`${salt}-c${cycle}`);
  return shuffleWithSeed(pool, seed)[pos];
}

/**
 * Pick `count` items from `pool` for the given date without overlap.
 * Cycles through all possible non-overlapping groups before repeating.
 */
export function pickDailyN<T>(
  pool: T[],
  date: string,
  count: number,
  salt: string,
): T[] {
  const dayNum = getDayNumber(date);
  const groupsPerCycle = Math.floor(pool.length / count);
  const cycle = Math.floor(dayNum / groupsPerCycle);
  const pos = dayNum % groupsPerCycle;
  const seed = hashString(`${salt}-c${cycle}`);
  const shuffled = shuffleWithSeed(pool, seed);
  return shuffled.slice(pos * count, pos * count + count);
}

/**
 * Returns a deterministic seeded RNG for the given date that cycles:
 * every `poolSize` days the permutation seed changes.
 */
export function getDailyCycleRng(
  poolSize: number,
  date: string,
  salt: string,
): () => number {
  const dayNum = getDayNumber(date);
  const cycle = Math.floor(dayNum / poolSize);
  const seed = hashString(`${salt}-c${cycle}`);
  return createSeededRng(seed);
}
