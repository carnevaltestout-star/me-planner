import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";

interface AddTopicDialogProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function AddTopicDialog({ onClose, onSave }: AddTopicDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  const [name, setName] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme">
        <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Add Topic</h2>
        </div>
        <div className="px-[1.1rem] py-3.5">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Topic name…"
            className="w-full rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
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
