import { dateKey } from "./goal-todo-dates";
import { emptyItem, type GoalTodoItem } from "./goal-todo-types";

// Old localStorage key — kept here (unused for day-to-day storage now, see
// goal-todo-repo.ts) only so the one-time legacy migration knows where to
// look for pre-SQLite data.
export const GOALS_TODOS_STORAGE_KEY = "me-planner:mock-goals-todos";

// Same defensive parsing loadItems() used to apply to a raw localStorage
// blob — reused by the legacy migration so old records (including the
// horizon/periodKey -> date migration) come across intact.
export function normalizeLegacyItem(id: string, raw: Partial<GoalTodoItem>): GoalTodoItem {
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
