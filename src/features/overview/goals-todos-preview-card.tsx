import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadItems } from "@/lib/goals/goal-todo-storage";
import { isDateWithinPeriod } from "@/lib/goals/goal-todo-dates";
import { effectiveDate, type GoalTodoItem } from "@/lib/goals/goal-todo-types";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

function MiniList({ title, items }: { title: string; items: GoalTodoItem[] }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="m-0 mb-1 text-[0.62rem] font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      {items.length === 0 ? (
        <p className="m-0 text-xs text-ink-muted">Nothing today.</p>
      ) : (
        <ul className="m-0 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className={`flex items-center gap-1.5 text-xs ${item.done ? "text-ink-muted line-through opacity-70" : ""}`}>
              <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: item.color }} />
              <span className={`truncate ${item.done ? "" : "text-ink"}`}>{item.title || "Untitled"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Two mini lists — today's goals and today's to-dos — using the same
// cross-horizon "day" filing an item is already visible under everywhere
// else in the app (see goal-todo-dates.ts's isDateWithinPeriod).
export default function GoalsTodosPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle, today }: OverviewPreviewCardProps) {
  const { goals, todos } = useMemo(() => {
    const todayItems = Object.values(loadItems()).filter((i) => isDateWithinPeriod(effectiveDate(i), "day", today));
    return {
      goals: todayItems.filter((i) => i.kind === "goal"),
      todos: todayItems.filter((i) => i.kind === "todo"),
    };
  }, [today]);

  return (
    <Link
      to={path}
      className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme hover:brightness-95`}
    >
      <div className="flex flex-shrink-0 items-center gap-2">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </div>
      <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto pr-1">
        <MiniList title="Goals" items={goals} />
        <MiniList title="To-Dos" items={todos} />
      </div>
    </Link>
  );
}
