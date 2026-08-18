import { dateKey } from "./goal-todo-dates";
import { emptyItem, type GoalTodoItem } from "./goal-todo-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features —
// swapping this for the real DB later shouldn't need to touch any
// component, just this file.
export const GOALS_TODOS_STORAGE_KEY = "me-planner:mock-goals-todos";

function seedItems(): Record<string, GoalTodoItem> {
  const today = new Date();
  const todayKey = dateKey(today);

  const seed: GoalTodoItem[] = [
    {
      ...emptyItem("seed-goal-1", "goal", todayKey),
      title: "Read 3 books this month",
      category: "Learning",
      color: "#4b8fc2",
      deadline: "",
      steps: [
        { id: "s1", text: "Man and His Symbols", done: true },
        { id: "s2", text: "Atomic Habits", done: true },
        { id: "s3", text: "Deep Work", done: false },
      ],
      createdAt: today.toISOString(),
      order: 1,
    },
    {
      ...emptyItem("seed-goal-2", "goal", todayKey),
      title: "Get back into a workout routine",
      category: "Health",
      color: "#5b8a72",
      deadline: "",
      manualPercent: 40,
      createdAt: today.toISOString(),
      order: 2,
    },
    {
      ...emptyItem("seed-todo-1", "todo", todayKey),
      title: "Reply to the landlord's email",
      category: "Errands",
      color: "#d99a3d",
      deadline: "",
      createdAt: today.toISOString(),
      order: 1,
    },
    {
      ...emptyItem("seed-todo-2", "todo", todayKey),
      title: "Pack gym bag for tomorrow",
      category: "Health",
      color: "#5b8a72",
      deadline: "",
      createdAt: today.toISOString(),
      order: 2,
    },
  ];
  return Object.fromEntries(seed.map((i) => [i.id, i]));
}

function normalize(id: string, raw: Partial<GoalTodoItem>): GoalTodoItem {
  // Older records saved before the horizon/periodKey -> date migration
  // fall back to their own createdAt day rather than losing their spot.
  const legacyDate = (raw as { periodKey?: string }).periodKey;
  const fallbackDate = raw.date ?? (raw.createdAt ? dateKey(new Date(raw.createdAt)) : dateKey(new Date()));
  const date = raw.date ?? (legacyDate && /^\d{4}-\d{2}-\d{2}$/.test(legacyDate) ? legacyDate : fallbackDate);
  const base = emptyItem(id, raw.kind === "todo" ? "todo" : "goal", date);
  return {
    ...base,
    ...raw,
    id,
    date,
    steps: Array.isArray(raw.steps) ? raw.steps : [],
  };
}

export function loadItems(): Record<string, GoalTodoItem> {
  try {
    const raw = window.localStorage.getItem(GOALS_TODOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, normalize(k, v as Partial<GoalTodoItem>)]));
      }
    }
  } catch {
    // fall through to seed data
  }
  return seedItems();
}

export function saveItems(items: Record<string, GoalTodoItem>) {
  window.localStorage.setItem(GOALS_TODOS_STORAGE_KEY, JSON.stringify(items));
}
