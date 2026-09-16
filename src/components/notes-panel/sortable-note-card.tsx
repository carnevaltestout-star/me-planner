import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Note } from "@/lib/notes/notes-types";
import NoteCard from "./note-card";

interface SortableNoteCardProps {
  note: Note;
  onOpen: () => void;
  onToggleCheckbox: (nextContent: string) => void;
  onDelete: () => void;
}

// Same whole-card-is-the-drag-surface approach as Book Reviews/Goals's
// sortable cards — no suppressLink workaround needed here since NoteCard
// opens via a plain onClick, not a real anchor, so there's no native
// "click after drag" default action to fight. touchAction stays
// "manipulation" (not "none") for the same reason documented on
// SortableBookReviewCard: "none" would block native scrolling on every
// card from the very first touch, before the TouchSensor's hold-delay
// even gets a chance to matter.
export default function SortableNoteCard({ note, onOpen, onToggleCheckbox, onDelete }: SortableNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined, touchAction: "manipulation" }}
      {...attributes}
      {...listeners}
    >
      <NoteCard note={note} onOpen={onOpen} onToggleCheckbox={onToggleCheckbox} onDelete={onDelete} />
    </div>
  );
}
