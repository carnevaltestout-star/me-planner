// Plain Math.random-backed helpers — none of these games need a seeded/
// reproducible RNG (each round is meant to be different every time), just a
// shared, tested place for the shuffle/pick/sample logic every game reuses.

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Distinct random picks (no repeats) — `count` is clamped to the pool size.
export function sampleN<T>(arr: readonly T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

// Random picks that CAN repeat — Simon-style sequences reuse the same cell.
export function sampleWithRepeats<T>(arr: readonly T[], count: number): T[] {
  return Array.from({ length: count }, () => pickRandom(arr));
}
