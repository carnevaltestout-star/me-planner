import { useMemo, useState } from "react";
import { loadItems, saveItems } from "@/lib/goals/goal-todo-storage";
import { effectiveDate, isItemEmpty, type GoalTodoItem, type ItemKind } from "@/lib/goals/goal-todo-types";
import GoalTodoForm from "@/features/goals/goal-todo-form";
import { GoalTodoKindIcon } from "@/features/goals/goal-todo-icons";
import SectionHeader from "./overview-section-header";

interface OverviewTodoListProps {
  selectedDateKey: string;
}

// Not-done first (priority P1-P4 ahead of unset, unset last), done items
// sink to the bottom — same "what still needs doing" ordering as the full
// Goals/To-Dos page's period view.
function compareForDay(a: GoalTodoItem, b: GoalTodoItem): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const aHas = a.priority !== undefined;
  const bHas = b.priority !== undefined;
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (aHas && bHas && a.priority !== b.priority) return a.priority! - b.priority!;
  return a.createdAt.localeCompare(b.createdAt);
}

export default function OverviewTodoList({ selectedDateKey }: OverviewTodoListProps) {
  const [items, setItems] = useState(() => loadItems());
  const [kind, setKind] = useState<ItemKind>("todo");
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<GoalTodoItem | null>(null);

  function persist(next: Record<string, GoalTodoItem>) {
    setItems(next);
    saveItems(next);
  }

  const dayItems = useMemo(
    () =>
      Object.values(items)
        .filter((i) => i.kind === kind && effectiveDate(i) === selectedDateKey)
        .sort(compareForDay),
    [items, kind, selectedDateKey],
  );

  function toggleDone(item: GoalTodoItem) {
    const nextDone = !item.done;
    persist({ ...items, [item.id]: { ...item, done: nextDone, doneAt: nextDone ? new Date().toISOString() : "" } });
  }

  function handleSave(next: GoalTodoItem) {
    const updated = { ...items };
    if (isItemEmpty(next)) delete updated[next.id];
    else updated[next.id] = next;
    persist(updated);
    setEditing(null);
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader
        icon={<GoalTodoKindIcon kind={kind} className="h-4 w-4" />}
        title={kind === "goal" ? "Goals" : "To-Do List"}
        count={dayItems.length}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        extra={
          <div className="ml-1 inline-flex flex-shrink-0 overflow-hidden rounded-full border border-border">
            <button
              type="button"
              onClick={() => setKind("todo")}
              aria-pressed={kind === "todo"}
              className={`px-2 py-0.5 text-[0.62rem] font-semibold ${kind === "todo" ? "bg-accent text-accent-contrast" : "bg-surface text-ink-muted"}`}
            >
              To-Dos
            </button>
            <button
              type="button"
              onClick={() => setKind("goal")}
              aria-pressed={kind === "goal"}
              className={`px-2 py-0.5 text-[0.62rem] font-semibold ${kind === "goal" ? "bg-accent text-accent-contrast" : "bg-surface text-ink-muted"}`}
            >
              Goals
            </button>
          </div>
        }
      />
      {open &&
        (dayItems.length === 0 ? (
          <p className="m-0 px-1 text-xs text-ink-muted">Nothing for this day.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dayItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-theme border border-border bg-surface p-3 shadow-theme">
                <span aria-hidden="true" className="h-8 w-8 flex-shrink-0 rounded-theme-sm" style={{ background: item.color }} />
                <button type="button" onClick={() => setEditing(item)} className="min-w-0 flex-1 text-left">
                  <span className={`block truncate text-sm font-semibold text-ink ${item.done ? "line-through opacity-60" : ""}`}>
                    {item.title || "Untitled"}
                  </span>
                  {item.deadline && (
                    <span className="block text-[0.68rem] text-ink-muted">
                      Due {new Date(`${item.deadline}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </button>
                {item.priority && (
                  <span
                    aria-hidden="true"
                    style={{ background: item.color }}
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                  >
                    P{item.priority}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleDone(item)}
                  aria-label={item.done ? "Mark not done" : "Mark done"}
                  aria-pressed={item.done}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm border-2 hover:brightness-95"
                  style={{ borderColor: item.done ? item.color : "var(--color-border)", background: item.done ? item.color : "transparent" }}
                >
                  {item.done && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 9.5 17 19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}
      {editing && <GoalTodoForm item={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </section>
  );
}
