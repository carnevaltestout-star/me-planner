import { useState } from "react";
import { PRINCIPLE_TYPE_COLORS } from "@/lib/principles/principle-types";
import { SELECTABLE_PRINCIPLE_TYPES, type PrincipleType } from "@/lib/journal/journal-types";
import { PencilIcon, TrashIcon } from "./principle-icons";

interface PrincipleCardProps {
  text: string;
  type: PrincipleType;
  savedAt: string;
  updatedAt?: string;
  source?: "journal" | "tracker";
  onEdit?: (text: string) => void;
  onDelete?: () => void;
  // Only for principles this feature actually owns the type field of —
  // tracker-derived ones are always "Me" (there's nowhere to persist a
  // different type for them; see principles-page.tsx), and journal-derived
  // ones aren't editable here at all.
  onChangeType?: (type: PrincipleType) => void;
}

const SOURCE_LABEL: Record<"journal" | "tracker", string> = {
  journal: "From Journal",
  tracker: "From Energy Tracker",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PrincipleCard({ text, type, savedAt, updatedAt, source, onEdit, onDelete, onChangeType }: PrincipleCardProps) {
  const color = PRINCIPLE_TYPE_COLORS[type];
  const editable = Boolean(onEdit);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  function startEditing() {
    if (!editable) return;
    setDraft(text);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== text) onEdit?.(trimmed);
  }

  return (
    <div className="group flex flex-col gap-2 rounded-theme border border-border bg-surface p-3.5 shadow-theme">
      {/* Controls (delete + type) come first in the DOM so they stack above
          the text on mobile (a plain flex-col) — sm:order-2 then moves them
          back after the text once sm:flex-row kicks in, restoring the
          original "text left, controls right, same row" desktop layout.
          The text itself gets sm:order-1 to match, and only constrains its
          own width at sm: and up — on mobile it's the sole item in its row,
          so it already spans the card's full width without needing flex-1. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2.5">
        <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:order-2">
          {editable && (
            <button
              type="button"
              onClick={startEditing}
              aria-label="Rename principle"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted opacity-100 hover:bg-surface-alt hover:text-accent md:opacity-0 md:group-hover:opacity-100"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete principle"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted opacity-100 hover:bg-surface-alt hover:text-[#c22a4d] md:opacity-0 md:group-hover:opacity-100"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {onChangeType ? (
            <select
              value={type}
              onChange={(e) => onChangeType(e.target.value as PrincipleType)}
              aria-label="Principle type"
              className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full border-none px-2 py-0.5 text-[0.68rem] font-bold focus:outline focus:outline-2 focus:outline-accent"
              style={{ background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`, color }}
            >
              {SELECTABLE_PRINCIPLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.68rem] font-bold"
              style={{ background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`, color }}
            >
              {type}
            </span>
          )}
        </div>
        {editing ? (
          <textarea
            autoFocus
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                setDraft(text);
                setEditing(false);
              }
            }}
            className="min-w-0 resize-y rounded-theme-sm border border-accent bg-canvas px-2 py-1 text-sm leading-relaxed text-ink focus:outline-none sm:order-1 sm:flex-1"
          />
        ) : (
          <p
            onClick={startEditing}
            className={`m-0 min-w-0 text-sm leading-relaxed text-ink sm:order-1 sm:flex-1 ${editable ? "cursor-text" : ""}`}
          >
            {text}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-[0.7rem] text-ink-muted">
        <span className="flex items-center gap-2">
          <span>Saved {formatDate(savedAt)}</span>
          {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
        </span>
        {source && <span className="text-[0.68rem] font-semibold text-accent">{SOURCE_LABEL[source]}</span>}
      </div>
    </div>
  );
}
