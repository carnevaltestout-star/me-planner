import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@/components/theme-provider/theme-context";
import { isOverdue } from "@/lib/goals/goal-todo-dates";
import { progressPercent, type ChecklistStep, type GoalTodoItem } from "@/lib/goals/goal-todo-types";
import { HeartCheckIcon, TrashIcon } from "./goal-todo-icons";

interface GoalTodoCardProps {
  item: GoalTodoItem;
  today: Date;
  onToggleDone: () => void;
  onToggleStep: (stepId: string) => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

// dnd-kit id for this card as a drag source — prefixed so it can never
// collide with a horizon-tab droppable id (see goals-page.tsx's
// HorizonTab), which share the same DndContext id namespace.
export function goalTodoDragId(itemId: string): string {
  return `item:${itemId}`;
}

export default function GoalTodoCard({ item, today, onToggleDone, onToggleStep, onEdit, onDeleteRequest }: GoalTodoCardProps) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const percent = progressPercent(item);
  const overdue = isOverdue(item.deadline, today);

  // Whole-card dnd-kit drag source (see goals-page.tsx for the shared
  // DndContext/sensors) so it can be long-pressed and dropped onto one of
  // the Day/Week/Month/Quarter/Year horizon tabs to reassign this item's
  // horizon — same pointer-based approach as the Attachments file cards,
  // since native HTML5 drag-and-drop never fires from a touchscreen. The
  // sensors' activation constraints (200ms hold + 8px tolerance for touch,
  // 8px distance for mouse) mean a plain tap without real movement never
  // starts a drag, so the nested toggle/edit/delete buttons below still
  // fire their own clicks untouched.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: goalTodoDragId(item.id),
    data: { type: "item", itemId: item.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...(item.priority !== undefined ? { border: `2px solid ${item.color}` } : undefined),
        transform: CSS.Translate.toString(transform),
        // "manipulation", not "none" — the touch sensor's 200ms hold delay
        // (see goals-page.tsx) is exactly the case dnd-kit recommends this
        // for: it lets a plain swipe scroll the list normally, and only
        // takes over once the hold has actually elapsed. "none" here was
        // blocking that scroll from ever starting in the first place, since
        // the browser locks in touch-action at the very start of a touch.
        touchAction: "manipulation",
      }}
      className={`relative flex cursor-grab flex-col gap-2.5 rounded-theme bg-surface p-3 shadow-theme active:cursor-grabbing ${
        item.priority === undefined ? "border border-border" : ""
      } ${item.done ? "opacity-60" : ""} ${isDragging ? "z-10 opacity-40" : ""}`}
    >
      {item.priority !== undefined && (
        <span
          aria-hidden="true"
          style={{ background: item.color }}
          className="absolute -left-2.5 -top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[0.65rem] font-bold text-white shadow-theme"
        >
          P{item.priority}
        </span>
      )}
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={onToggleDone}
          aria-label={item.done ? "Mark not done" : "Mark done"}
          aria-pressed={item.done}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full hover:brightness-95 ${
            pixelated ? "" : "border-2"
          }`}
          style={
            pixelated
              ? { background: "#ffffff" }
              : { borderColor: item.color, background: item.done ? item.color : "transparent" }
          }
        >
          {pixelated ? (
            <HeartCheckIcon
              className="h-5 w-5"
              borderColor="var(--color-accent)"
              fillColor={item.done ? item.color : "#ffffff"}
            />
          ) : (
            item.done && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-accent-contrast" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            )
          )}
        </button>

        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className={`m-0 truncate text-sm font-semibold text-ink ${item.done ? "line-through opacity-60" : ""}`}>{item.title || "Untitled"}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.68rem] text-ink-muted">
            {item.category && (
              <span className="rounded-full px-1.5 py-0.5 font-semibold" style={{ background: `color-mix(in srgb, ${item.color} 16%, var(--color-surface))`, color: item.color }}>
                {item.category}
              </span>
            )}
            {item.deadline && (
              <span className={overdue && !item.done ? "font-semibold text-[#c22a4d]" : ""}>
                Due {new Date(`${item.deadline}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onDeleteRequest}
          aria-label={`Delete ${item.title || "this item"}`}
          title="Delete"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {item.kind === "goal" && (
        <div className="flex items-center gap-2 pl-[30px]">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full" style={{ width: `${percent}%`, background: item.color }} />
          </div>
          <span className="w-8 flex-shrink-0 text-right text-[0.68rem] font-semibold text-ink-muted">{percent}%</span>
        </div>
      )}

      {item.steps.length > 0 && (
        <ul className="m-0 flex flex-col gap-1 pl-[30px]">
          {item.steps.map((step: ChecklistStep) => (
            <li key={step.id}>
              <button type="button" onClick={() => onToggleStep(step.id)} className="flex w-full items-center gap-2 text-left">
                <span
                  className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border"
                  style={{ borderColor: item.color, background: step.done ? item.color : "transparent" }}
                >
                  {step.done && (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-accent-contrast" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 9.5 17 19 7" />
                    </svg>
                  )}
                </span>
                <span className={`truncate text-xs ${step.done ? "text-ink-muted line-through" : "text-ink"}`}>{step.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
