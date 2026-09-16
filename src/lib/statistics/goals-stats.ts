import type { GoalTodoItem } from "@/lib/goals/goal-todo-types";
import { isWithinRange } from "./stat-dates";
import type { DistributionSlice, TimeRange } from "./stat-types";

export interface DoneUndoneBar {
  label: string;
  done: number;
  undone: number;
}

export interface GoalsTodosStats {
  hasAnyData: boolean;
  totalGoals: number;
  doneGoals: number;
  goalPercent: number;
  totalTodos: number;
  doneTodos: number;
  todoPercent: number;
  // Done vs not-done across both kinds combined — the clearest single view
  // of "how much exists and how much of it is done," rendered as a pie or
  // histogram.
  distribution: DistributionSlice[];
  // Same done/undone split, but kept separate per kind — one bar for
  // Goals, one for To-Dos, each internally stacked done/undone — for the
  // bar chart view specifically, where comparing the two kinds side by
  // side is more useful than a single combined total.
  perKindBars: DoneUndoneBar[];
}

export const DONE_COLOR = "#5b8a72";
export const UNDONE_COLOR = "#d99a3d";

// Scoped by createdAt within the selected range, same as Book Reviews'
// stats — Goals/To-Dos has its own horizon/date filing system for the
// feature's own UI, but for a cross-app dashboard "created within this
// range" is the more legible/consistent question to answer.
export function computeGoalsTodosStats(items: Record<string, GoalTodoItem>, range: TimeRange, today: Date): GoalsTodosStats {
  const all = Object.values(items);
  if (all.length === 0) {
    return {
      hasAnyData: false,
      totalGoals: 0,
      doneGoals: 0,
      goalPercent: 0,
      totalTodos: 0,
      doneTodos: 0,
      todoPercent: 0,
      distribution: [],
      perKindBars: [],
    };
  }

  const inRange = all.filter((i) => isWithinRange(new Date(i.createdAt), range, today));
  const goals = inRange.filter((i) => i.kind === "goal");
  const todos = inRange.filter((i) => i.kind === "todo");
  const doneGoals = goals.filter((i) => i.done).length;
  const doneTodos = todos.filter((i) => i.done).length;
  const done = doneGoals + doneTodos;
  const undone = inRange.length - done;
  const total = inRange.length;

  const distribution: DistributionSlice[] = [];
  if (done > 0) distribution.push({ key: "done", label: "Done", value: done, percent: total ? Math.round((done / total) * 100) : 0, color: DONE_COLOR });
  if (undone > 0) distribution.push({ key: "undone", label: "Not done", value: undone, percent: total ? Math.round((undone / total) * 100) : 0, color: UNDONE_COLOR });

  return {
    hasAnyData: true,
    totalGoals: goals.length,
    doneGoals,
    goalPercent: goals.length ? Math.round((doneGoals / goals.length) * 100) : 0,
    totalTodos: todos.length,
    doneTodos,
    todoPercent: todos.length ? Math.round((doneTodos / todos.length) * 100) : 0,
    distribution,
    perKindBars: [
      { label: "Goals", done: doneGoals, undone: goals.length - doneGoals },
      { label: "To-Dos", done: doneTodos, undone: todos.length - doneTodos },
    ],
  };
}
