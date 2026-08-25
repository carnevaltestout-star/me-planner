import { useState } from "react";
import { emptyPreset, formatDuration, presetDurationHours, type EventPreset } from "@/lib/planner/preset-types";
import PresetEditDialog from "./preset-edit-dialog";

// The MIME-ish key used for the native HTML5 drag payload — a plain custom
// type string works fine here since both ends (this bar and PlannerGrid's
// day columns) are our own code, no other drop target needs to understand
// it.
export const PRESET_DRAG_TYPE = "application/x-me-planner-preset-id";

interface PresetBarProps {
  presets: EventPreset[];
  onAdd: (preset: EventPreset) => void;
  onUpdate: (preset: EventPreset) => void;
  onDelete: (id: string) => void;
  onQuickAdd: (preset: EventPreset) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

// A row of reusable event templates — same title/color/time every time —
// for things you do on no fixed schedule but want to log wherever they
// actually happen: drag one onto a day in the grid below to create a real
// event there, or tap the + to drop it on today at the current time
// instead (the mobile-friendly fallback, since native drag doesn't work on
// touch). A plain click on the card itself opens it for editing — the card
// is a template you shape, not a one-shot action. The preset card itself
// never gets "used up" — it's a stamp, not a to-do.
//
// Each card is *both* a drag source (same PRESET_DRAG_TYPE payload used to
// drop onto the calendar grid) and a drop target for reordering — dropping
// one preset onto another moves it to that position instead of creating an
// event, since there's no calendar slot involved.
export default function PresetBar({ presets, onAdd, onUpdate, onDelete, onQuickAdd, onReorder }: PresetBarProps) {
  const [editing, setEditing] = useState<EventPreset | null>(null);
  const [creating, setCreating] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleSave(preset: EventPreset) {
    if (creating) onAdd(preset);
    else onUpdate(preset);
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => {
          setCreating(true);
          setEditing(emptyPreset(crypto.randomUUID()));
        }}
        aria-label="Add event preset"
        title="Add event preset"
        className="flex h-[54px] w-9 flex-shrink-0 items-center justify-center rounded-theme border border-dashed border-accent text-accent hover:bg-accent-soft"
      >
        +
      </button>

      {presets.map((preset) => (
        <div
          key={preset.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(PRESET_DRAG_TYPE, preset.id);
            // Needs both: "copy" is what a grid hour-cell sets as its
            // dropEffect when this preset stamps a new event there, "move"
            // is what a sibling card sets when reordering — effectAllowed
            // has to cover whichever one the actual drop target picks.
            e.dataTransfer.effectAllowed = "copyMove";
            setDraggingId(preset.id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== preset.id) setDragOverId(preset.id);
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (related && e.currentTarget.contains(related)) return;
            setDragOverId((id) => (id === preset.id ? null : id));
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverId(null);
            const draggedId = e.dataTransfer.getData(PRESET_DRAG_TYPE);
            if (draggedId && draggedId !== preset.id) onReorder(draggedId, preset.id);
          }}
          onClick={() => {
            setCreating(false);
            setEditing(preset);
          }}
          title="Click to edit, drag onto a time slot to schedule it there, or drag onto another preset to reorder"
          className={`group flex h-[54px] flex-shrink-0 cursor-grab flex-col justify-center gap-0.5 rounded-theme border p-2 text-left shadow-theme transition-opacity active:cursor-grabbing ${
            draggingId === preset.id ? "opacity-40" : ""
          } ${dragOverId === preset.id && draggingId !== preset.id ? "ring-2 ring-accent" : ""}`}
          style={{ borderColor: preset.color, background: `color-mix(in srgb, ${preset.color} 12%, var(--color-surface))` }}
        >
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: preset.color }} />
            <span className="min-w-0 max-w-[8rem] truncate text-xs font-semibold text-ink">{preset.title || "Untitled"}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(preset);
              }}
              aria-label={`Add ${preset.title} to today`}
              title="Add to today at the current time"
              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-ink-muted opacity-0 hover:text-accent group-hover:opacity-100"
            >
              +
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset.id);
              }}
              aria-label={`Delete ${preset.title}`}
              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-ink-muted opacity-0 hover:text-[#c22a4d] group-hover:opacity-100"
            >
              ×
            </button>
          </div>
          <span className="text-[0.65rem] text-ink-muted">{formatDuration(presetDurationHours(preset))}</span>
        </div>
      ))}

      {editing && (
        <PresetEditDialog
          preset={editing}
          onSave={handleSave}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
