import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GoalTodoItem } from "@/lib/goals/goal-todo-types";
import GoalTodoCard from "./goal-todo-card";

interface SortableGoalTodoCardProps {
  item: GoalTodoItem;
  today: Date;
  onToggleDone: () => void;
  onToggleStep: (stepId: string) => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

// The whole card is the drag surface rather than a separate handle — the
// sensors' activation constraints (see goals-page.tsx) are what keep a
// plain tap on the checkbox/title/trash from being mistaken for a drag,
// so this doesn't need to special-case which part of the card is "safe"
// to grab.
export default function SortableGoalTodoCard({ item, ...cardProps }: SortableGoalTodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <GoalTodoCard item={item} {...cardProps} />
    </div>
  );
}
