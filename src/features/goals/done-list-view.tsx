import type { GoalTodoItem, ItemKind } from "@/lib/goals/goal-todo-types";
import { GoalTodoKindIcon } from "./goal-todo-icons";

interface DoneListViewProps {
  kind: ItemKind;
  items: GoalTodoItem[];
  onBack: () => void;
  onUndo: (id: string) => void;
}

export default function DoneListView({ kind, items, onBack, onUndo }: DoneListViewProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <div className="flex flex-shrink-0 items-center gap-2 rounded-theme border border-border bg-surface px-3 py-2.5 shadow-theme">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-sidenav text-ink shadow-theme hover:bg-surface-alt"
        >
          ‹
        </button>
        <h2 className="m-0 font-theme text-base font-semibold text-ink">Done {kind === "goal" ? "Goals" : "To-Dos"}</h2>
      </div>

      {items.length === 0 ? (
        <p className="pt-6 text-center text-sm text-ink-muted">Nothing completed yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 rounded-theme border border-border bg-surface p-3 shadow-theme">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: `color-mix(in srgb, ${item.color} 20%, var(--color-surface))` }}
              >
                <GoalTodoKindIcon kind={item.kind} className="h-4 w-4" style={{ color: item.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-semibold text-ink line-through opacity-70">{item.title || "Untitled"}</p>
                <p className="m-0 text-[0.68rem] text-ink-muted">
                  Done {item.doneAt ? new Date(item.doneAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUndo(item.id)}
                className="flex-shrink-0 rounded-theme-sm border border-border px-2.5 py-1.5 text-xs text-ink-muted hover:bg-surface-alt hover:text-ink"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
