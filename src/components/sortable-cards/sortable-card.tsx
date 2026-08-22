import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon } from "./drag-handle-icon";

interface SortableCardProps {
  id: string;
  children: ReactNode;
}

// Draggable from anywhere on the card, not just the handle — the outer div
// carries the same {...listeners} the handle does, same "click still works
// normally" reasoning as book-reviews' whole-card dragging: the sensors'
// activation constraints (see the page's useSensors call) mean a plain tap
// without real movement never starts a drag, so nested links/buttons still
// fire their own clicks untouched. The handle stays as an explicit,
// always-visible grab affordance on top of that — not the only way in.
export default function SortableCard({ id, children }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : undefined }}
      className="relative"
      {...listeners}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder"
        style={{ touchAction: "none" }}
        // Stops a plain click on the handle from also reaching a <Link>
        // that wraps the rest of the card (nested-interactive-element
        // clicks bubble through an ancestor anchor by default).
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-theme hover:text-accent active:cursor-grabbing"
      >
        <DragHandleIcon className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}
