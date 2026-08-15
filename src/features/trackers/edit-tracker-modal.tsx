import { useState } from "react";
import { TRACKER_COLORS, TRACKER_ICON_KEYS, type Tracker, type TrackerIconKey } from "@/lib/trackers/tracker-types";
import TrackerIcon from "./tracker-icon";
import { TrashIcon } from "./tracker-line-icons";

interface EditTrackerModalProps {
  tracker: Tracker;
  onClose: () => void;
  onSave: (updated: Tracker) => void;
  onDelete: () => void;
}

// Only Done/Amount are interchangeable — both are just a base tracker plus
// a kind tag, no extra fields. Mood and Period carry their own config
// (cycle dates, etc.) that doesn't have an equivalent on the other side, so
// their kind stays fixed here; only name/icon/color are editable for them.
function canChangeKind(kind: Tracker["kind"]): kind is "boolean" | "amount" {
  return kind === "boolean" || kind === "amount";
}

export default function EditTrackerModal({ tracker, onClose, onSave, onDelete }: EditTrackerModalProps) {
  const [name, setName] = useState(tracker.name);
  const [icon, setIcon] = useState<TrackerIconKey>(tracker.icon);
  const [color, setColor] = useState(tracker.color);
  const [kind, setKind] = useState<"boolean" | "amount">(canChangeKind(tracker.kind) ? tracker.kind : "boolean");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }
    if (canChangeKind(tracker.kind)) {
      onSave({ id: tracker.id, createdAt: tracker.createdAt, name: trimmed, color, icon, kind });
    } else {
      onSave({ ...tracker, name: trimmed, color, icon });
    }
  }

  if (confirmDelete) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="flex w-full max-w-[300px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
        >
          <h2 className="m-0 text-base text-ink">Delete "{tracker.name}"?</h2>
          <p className="m-0 text-sm text-ink-muted">All of its tracked days will be deleted too. This can't be undone.</p>
          <div className="mt-0.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-theme-sm border border-[color-mix(in_srgb,#c22a4d_40%,var(--color-border))] px-3.5 py-2 text-sm text-[#c22a4d] hover:bg-[color-mix(in_srgb,#c22a4d_10%,transparent)]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full max-w-[360px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Edit tracker</h2>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete tracker"
            title="Delete tracker"
            className="flex h-8 w-8 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-[1.1rem] py-3.5">
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>

            {canChangeKind(tracker.kind) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-ink-muted">Type</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-pressed={kind === "boolean"}
                    onClick={() => setKind("boolean")}
                    className={`flex-1 rounded-theme-sm border px-2.5 py-1.5 text-xs ${
                      kind === "boolean" ? "border-ink font-semibold text-ink" : "border-border text-ink-muted hover:bg-surface-alt"
                    }`}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    aria-pressed={kind === "amount"}
                    onClick={() => setKind("amount")}
                    className={`flex-1 rounded-theme-sm border px-2.5 py-1.5 text-xs ${
                      kind === "amount" ? "border-ink font-semibold text-ink" : "border-border text-ink-muted hover:bg-surface-alt"
                    }`}
                  >
                    Amount
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">Icon</span>
              <div className="flex flex-wrap gap-1.5">
                {TRACKER_ICON_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={icon === key}
                    onClick={() => setIcon(key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-theme-sm border ${
                      icon === key ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-alt"
                    }`}
                  >
                    <TrackerIcon icon={key} className="h-[18px] w-[18px]" style={{ color }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">Color</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {TRACKER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={c === color}
                    onClick={() => setColor(c)}
                    style={{ background: c }}
                    className={`h-[26px] w-[26px] rounded-full border-2 ${c === color ? "border-ink" : "border-transparent"}`}
                  />
                ))}
                <span className="relative h-[26px] w-[26px]">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Custom color"
                    title="Custom color"
                    className="h-[26px] w-[26px] cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference"
                  >
                    +
                  </span>
                </span>
              </div>
            </div>

            {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
