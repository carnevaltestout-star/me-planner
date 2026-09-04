import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";
import type { BrainLink } from "@/lib/brain/brain-types";

interface AddBrainLinkDialogProps {
  links: BrainLink[];
  onClose: () => void;
  onSave: (links: BrainLink[]) => void;
}

// Same shape/behavior as vocabulary's AddLinkDialog (kept as its own small
// copy rather than shared, matching this codebase's per-feature file
// convention) — used for both "link a document" and "link a website" since
// a BrainLink is just a URL either way.
export default function AddBrainLinkDialog({ links, onClose, onSave }: AddBrainLinkDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
  const [rows, setRows] = useState<BrainLink[]>([...links, { id: crypto.randomUUID(), url: "" }]);

  function updateRow(id: string, url: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, url } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), url: "" }]);
  }

  function saveRows(nextRows: BrainLink[]) {
    onSave(nextRows.map((r) => ({ ...r, url: r.url.trim() })).filter((r) => r.url));
  }

  function handlePaste(id: string, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    e.preventDefault();
    const input = e.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const merged = input.value.slice(0, start) + pasted + input.value.slice(end);
    const nextRows = rows.map((r) => (r.id === id ? { ...r, url: merged } : r));
    setRows(nextRows);
    saveRows(nextRows);
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme">
        <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Links</h2>
        </div>
        <div className="flex flex-col gap-2 px-[1.1rem] py-3.5">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-1.5">
              <input
                autoFocus={rows[rows.length - 1].id === row.id && !row.url}
                type="url"
                value={row.url}
                onChange={(e) => updateRow(row.id, e.target.value)}
                onPaste={(e) => handlePaste(row.id, e)}
                placeholder="https://…"
                className="w-full min-w-0 flex-1 rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label="Remove link"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="self-start rounded-theme-sm border border-dashed border-accent px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            +
          </button>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveRows(rows)}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
