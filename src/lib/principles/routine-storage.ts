import type { RoutineState } from "./routine-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features.
export const ROUTINES_STORAGE_KEY = "me-planner:mock-principles-routines";

function seedRoutines(): RoutineState {
  return {
    morning: ["Drink a glass of water", "5 minutes of stretching", "Look over today's plan"],
    evening: ["Lay out clothes for tomorrow", "10pm: phone away", "Write one line in the journal"],
  };
}

export function loadRoutines(): RoutineState {
  try {
    const raw = window.localStorage.getItem(ROUTINES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return { morning: [], evening: [], ...parsed };
    }
  } catch {
    // fall through to seed data
  }
  return seedRoutines();
}

export function saveRoutines(routines: RoutineState) {
  window.localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
}
