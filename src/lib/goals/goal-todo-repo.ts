import { getDb } from "@/lib/db/client";
import { dateKey } from "./goal-todo-dates";
import { emptyItem, type GoalTodoItem } from "./goal-todo-types";

interface GoalTodoRow {
  id: string;
  kind: string;
  title: string;
  category: string | null;
  color: string | null;
  deadline: string | null;
  date: string;
  horizon: string;
  manual_percent: number;
  priority: number | null;
  done: number;
  done_at: string | null;
  sort_order: number | null;
  created_at: string | null;
  steps_json: string | null;
}

function fromRow(row: GoalTodoRow): GoalTodoItem {
  return {
    id: row.id,
    kind: row.kind === "todo" ? "todo" : "goal",
    title: row.title,
    category: row.category ?? "",
    color: row.color ?? "",
    deadline: row.deadline ?? "",
    date: row.date,
    horizon: (row.horizon as GoalTodoItem["horizon"]) ?? "day",
    steps: row.steps_json ? JSON.parse(row.steps_json) : [],
    manualPercent: row.manual_percent ?? 0,
    priority: row.priority == null ? undefined : (row.priority as GoalTodoItem["priority"]),
    done: !!row.done,
    doneAt: row.done_at ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    order: row.sort_order ?? 0,
  };
}

function seedItems(): GoalTodoItem[] {
  const today = new Date();
  const todayKey = dateKey(today);
  return [
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
}

export async function listItems(): Promise<Record<string, GoalTodoItem>> {
  const db = await getDb();
  const rows = await db.select<GoalTodoRow[]>("SELECT * FROM goal_todo_items");
  if (rows.length === 0) {
    const seed = seedItems();
    for (const item of seed) await upsertItem(item);
    return Object.fromEntries(seed.map((i) => [i.id, i]));
  }
  return Object.fromEntries(rows.map(fromRow).map((i) => [i.id, i]));
}

export async function upsertItem(item: GoalTodoItem): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO goal_todo_items
      (id, kind, title, category, color, deadline, date, horizon, manual_percent, priority, done, done_at, sort_order, created_at, steps_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (id) DO UPDATE SET
      kind=$2, title=$3, category=$4, color=$5, deadline=$6, date=$7, horizon=$8, manual_percent=$9,
      priority=$10, done=$11, done_at=$12, sort_order=$13, created_at=$14, steps_json=$15`,
    [
      item.id,
      item.kind,
      item.title,
      item.category,
      item.color,
      item.deadline,
      item.date,
      item.horizon,
      item.manualPercent,
      item.priority ?? null,
      item.done ? 1 : 0,
      item.doneAt,
      item.order,
      item.createdAt,
      JSON.stringify(item.steps),
    ],
  );
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM goal_todo_items WHERE id = $1", [id]);
}

// goals-page.tsx keeps its existing "one big Record<id,item>, replace the
// whole thing on every change" component-local pattern (a large existing
// component, `persist(next)` is called from ~15 different places) — this is
// the seam that turns that into real per-row writes: diff previous vs next
// and only touch the rows that actually changed, added, or disappeared.
export async function syncItems(prev: Record<string, GoalTodoItem>, next: Record<string, GoalTodoItem>): Promise<void> {
  const writes: Promise<void>[] = [];
  for (const id of Object.keys(next)) {
    if (prev[id] !== next[id]) writes.push(upsertItem(next[id]));
  }
  for (const id of Object.keys(prev)) {
    if (!(id in next)) writes.push(deleteItem(id));
  }
  await Promise.all(writes);
}
