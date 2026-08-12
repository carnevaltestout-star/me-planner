import { dateKey, startOfWeek } from "./planner-dates";
import type { PlannerEvent } from "./planner-types";

// Same key the theme-system/planner mockups used, so anything created while
// testing there is already here. Stand-in for the eventual SQLite storage
// (per the tech stack decision) — swapping the storage layer later shouldn't
// need to touch any component, just this file.
export const EVENTS_STORAGE_KEY = "me-planner:mock-events";

function seedEvents(): PlannerEvent[] {
  const seedByOffset: Record<number, Array<Pick<PlannerEvent, "title" | "start" | "end">>> = {
    0: [
      { title: "Deep work", start: 9, end: 11 },
      { title: "Team sync", start: 11.5, end: 12 },
    ],
    1: [{ title: "Dentist", start: 14, end: 15 }],
    2: [
      { title: "Deep work", start: 9, end: 11 },
      { title: "Lunch with Sam", start: 12.5, end: 13.5 },
      { title: "Gym", start: 18, end: 19 },
    ],
    3: [{ title: "Write report", start: 10, end: 12 }],
    4: [
      { title: "Retro", start: 15, end: 16 },
      { title: "Movie night", start: 20, end: 22 },
    ],
    5: [{ title: "Grocery run", start: 10, end: 11 }],
    6: [],
  };
  const monday = startOfWeek(new Date());
  const seeded: PlannerEvent[] = [];
  Object.entries(seedByOffset).forEach(([offset, evs]) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + Number(offset));
    evs.forEach((ev) =>
      seeded.push({
        id: crypto.randomUUID(),
        dateKey: dateKey(d),
        notes: "",
        repeat: "none",
        color: "",
        exceptions: [],
        ...ev,
      }),
    );
  });
  return seeded;
}

export function loadEvents(): PlannerEvent[] {
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed data
  }
  return seedEvents();
}

export function saveEvents(events: PlannerEvent[]) {
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}
