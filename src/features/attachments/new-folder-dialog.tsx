import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";

interface NewFolderDialogProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function NewFolderDialog({ onSave, onClose }: NewFolderDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the folder a name.");
      return;
    }
    onSave(trimmed);
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[320px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme">
        <h2 className="m-0 text-base text-ink">New folder</h2>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Folder name"
            className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
          {error && <span className="text-xs text-[#c22a4d]">{error}</span>}
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
