import { EVENT_COLORS } from "./planner-types";
import type { EventPreset } from "./preset-types";

// Same localStorage-as-stand-in-for-SQLite pattern as planner-storage.ts.
export const EVENT_PRESETS_STORAGE_KEY = "me-planner:mock-event-presets";

function seedPresets(): EventPreset[] {
  return [
    { id: crypto.randomUUID(), title: "Gym", color: EVENT_COLORS[3], start: 18, end: 19 },
    { id: crypto.randomUUID(), title: "Therapy", color: EVENT_COLORS[5], start: 16, end: 17 },
  ];
}

function normalize(raw: Partial<EventPreset>): EventPreset | null {
  if (!raw.id) return null;
  const hasDuration = typeof raw.start === "number" && typeof raw.end === "number";
  return {
    id: raw.id,
    title: raw.title ?? "",
    color: raw.color || EVENT_COLORS[0],
    start: hasDuration ? raw.start : undefined,
    end: hasDuration ? raw.end : undefined,
    priority: raw.priority,
  };
}

export function loadPresets(): EventPreset[] {
  try {
    const raw = window.localStorage.getItem(EVENT_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalize).filter((p): p is EventPreset => p !== null);
    }
  } catch {
    // fall through to seed data
  }
  return seedPresets();
}

export function savePresets(presets: EventPreset[]) {
  window.localStorage.setItem(EVENT_PRESETS_STORAGE_KEY, JSON.stringify(presets));
}
