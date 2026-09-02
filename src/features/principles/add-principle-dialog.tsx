import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { SELECTABLE_PRINCIPLE_TYPES, type PrincipleType } from "@/lib/journal/journal-types";

interface AddPrincipleDialogProps {
  onClose: () => void;
  onSave: (text: string, type: PrincipleType) => void;
}

const inputClass =
  "w-full rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent";
const labelClass = "text-xs text-ink-muted";

export default function AddPrincipleDialog({ onClose, onSave }: AddPrincipleDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  const [text, setText] = useState("");
  const [type, setType] = useState<PrincipleType>("Personal");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Write the principle first.");
      return;
    }
    onSave(trimmed, type);
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[380px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Add Principle</h2>
        </div>

        <div className="flex flex-col gap-3.5 px-[1.1rem] py-3.5">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Principle</span>
            <textarea
              autoFocus
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A rule you try to live by…"
              className={`${inputClass} resize-y`}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as PrincipleType)} className={inputClass}>
              {SELECTABLE_PRINCIPLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
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
