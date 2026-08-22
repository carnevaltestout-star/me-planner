import type { RoutineIconSettings } from "./routine-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features.
export const ROUTINE_ICON_STORAGE_KEY = "me-planner:mock-principles-routine-icon";

const DEFAULT_SETTINGS: RoutineIconSettings = { shape: "bunny", palette: "lavender" };

export function loadRoutineIconSettings(): RoutineIconSettings {
  try {
    const raw = window.localStorage.getItem(ROUTINE_ICON_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_SETTINGS;
}

export function saveRoutineIconSettings(settings: RoutineIconSettings) {
  window.localStorage.setItem(ROUTINE_ICON_STORAGE_KEY, JSON.stringify(settings));
}
