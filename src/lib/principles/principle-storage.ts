import type { Principle } from "./principle-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features —
// swapping this for the real DB later shouldn't need to touch any
// component, just this file.
export const PRINCIPLES_STORAGE_KEY = "me-planner:mock-principles";

function seedPrinciples(): Principle[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      text: "Say no to things that don't align with what I actually want.",
      type: "Personal",
      savedAt: new Date(now - 86400000 * 2).toISOString(),
      updatedAt: "",
      order: -(now - 86400000 * 2),
    },
    {
      id: "seed-2",
      text: "Reply to messages within a day, even just to say I need more time.",
      type: "Social",
      savedAt: new Date(now - 86400000 * 5).toISOString(),
      updatedAt: "",
      order: -(now - 86400000 * 5),
    },
    {
      id: "seed-3",
      text: "Review recurring subscriptions every quarter.",
      type: "Finance",
      savedAt: new Date(now - 86400000 * 9).toISOString(),
      updatedAt: "",
      order: -(now - 86400000 * 9),
    },
    {
      id: "seed-4",
      text: "Write down the plan before starting, even a messy one.",
      type: "Work",
      savedAt: new Date(now - 86400000 * 14).toISOString(),
      updatedAt: "",
      order: -(now - 86400000 * 14),
    },
  ];
}

// Fills in fields added after a principle may have already been saved —
// order backfills to the same negated-timestamp shape createPrinciple()
// seeds new ones with, so existing data keeps sorting exactly as it did
// before order existed (most recently saved first) until something is
// actually dragged.
function normalize(raw: Principle): Principle {
  return { ...raw, updatedAt: raw.updatedAt ?? "", order: raw.order ?? -new Date(raw.savedAt).getTime() };
}

export function loadPrinciples(): Principle[] {
  try {
    const raw = window.localStorage.getItem(PRINCIPLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return (parsed as Principle[]).map(normalize);
    }
  } catch {
    // fall through to seed data
  }
  return seedPrinciples();
}

export function savePrinciples(principles: Principle[]) {
  window.localStorage.setItem(PRINCIPLES_STORAGE_KEY, JSON.stringify(principles));
}
