import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";

interface AmountEntryModalProps {
  trackerName: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export default function AmountEntryModal({ trackerName, initialValue, onClose, onSave }: AmountEntryModalProps) {
  const bottomReserve = useMobileBottomReserve();
  const [value, setValue] = useState(initialValue);

  function handleSave() {
    onSave(value.trim());
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
        className="flex w-full max-w-[300px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <h2 className="m-0 text-base text-ink">{trackerName}</h2>
        <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
          <span>Amount</span>
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. 320 or 500ml"
            className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </label>
        <div className="flex justify-end gap-2">
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
