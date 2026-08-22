import { useState, type KeyboardEvent } from "react";
import type { RoutineIconPalette, RoutineIconShape } from "@/lib/principles/routine-types";
import { RoutineItemIcon } from "./principle-icons";

interface RoutineCardProps {
  emoji: string;
  title: string;
  placeholder: string;
  items: string[];
  iconShape: RoutineIconShape;
  iconPalette: RoutineIconPalette;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, text: string) => void;
}

export default function RoutineCard({ emoji, title, placeholder, items, iconShape, iconPalette, onAdd, onRemove, onEdit }: RoutineCardProps) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function commit() {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  function startEditing(index: number, text: string) {
    setEditingIndex(index);
    setEditDraft(text);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const text = editDraft.trim();
    if (text) onEdit(editingIndex, text);
    setEditingIndex(null);
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingIndex(null);
    }
  }

  return (
    <div className="flex min-h-[220px] flex-col gap-2 rounded-theme border border-border bg-surface p-2.5 shadow-theme sm:min-h-[300px] sm:gap-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink sm:gap-2 sm:text-lg">
        <span className="text-base sm:text-xl">{emoji}</span>
        <span className="min-w-0 truncate">{title}</span>
      </div>

      <ul className="m-0 flex flex-1 flex-col gap-1 p-0 sm:gap-1.5">
        {items.length === 0 ? (
          <li className="text-[0.68rem] italic text-ink-muted sm:text-xs">Nothing yet — add below.</li>
        ) : (
          items.map((text, i) =>
            editingIndex === i ? (
              <li key={i} className="flex items-start gap-1 sm:gap-2">
                <RoutineItemIcon shape={iconShape} palette={iconPalette} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent sm:h-[18px] sm:w-[18px]" />
                <input
                  type="text"
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={commitEdit}
                  className="min-w-0 flex-1 rounded-theme-sm border border-accent bg-canvas px-1 py-0.5 text-[0.72rem] text-ink focus:outline focus:outline-2 focus:outline-accent sm:text-sm"
                />
              </li>
            ) : (
              <li key={i} className="flex items-start gap-1 text-[0.72rem] text-ink sm:gap-2 sm:text-sm">
                <RoutineItemIcon shape={iconShape} palette={iconPalette} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent sm:h-[18px] sm:w-[18px]" />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEditing(i, text)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") startEditing(i, text);
                  }}
                  title="Click to edit"
                  className="min-w-0 flex-1 cursor-text break-words rounded-theme-sm px-0.5 py-0.5 -mx-0.5 -my-0.5 hover:bg-surface-alt"
                >
                  {text}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${text}`}
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d] sm:h-5 sm:w-5"
                >
                  ×
                </button>
              </li>
            ),
          )
        )}
      </ul>

      {/* pt-2 on top of the container's own gap and mt-auto — mt-auto alone
          only pushes this row down while the list is shorter than the
          card's min-height; once the list grows past that, mt-auto
          collapses to 0 and the row would otherwise sit only one gap step
          (the same spacing used between list items) away from the last
          entry, reading as cramped rather than a deliberate pad. */}
      <div className="mt-auto flex gap-1 pt-1.5 sm:gap-1.5 sm:pt-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-theme-sm border border-border bg-canvas px-1.5 py-1.5 text-[0.72rem] text-ink focus:outline focus:outline-2 focus:outline-accent sm:px-2.5 sm:py-2 sm:text-sm"
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Add"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm border border-accent text-accent hover:bg-accent-soft sm:h-9 sm:w-9"
        >
          +
        </button>
      </div>
    </div>
  );
}
