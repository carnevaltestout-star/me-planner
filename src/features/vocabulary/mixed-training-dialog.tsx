import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";
import { buildSessionQueue } from "@/lib/vocabulary/vocab-srs";
import type { VocabTopic } from "@/lib/vocabulary/vocab-types";

interface MixedTrainingDialogProps {
  topics: VocabTopic[];
  onClose: () => void;
  onStart: (topicIds: string[]) => void;
}

export default function MixedTrainingDialog({ topics, onClose, onStart }: MixedTrainingDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(topics.map((t) => t.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
          <h2 className="m-0 text-base text-ink">Start Mixed Training</h2>
        </div>
        <div className="flex flex-col gap-2 px-[1.1rem] py-3.5">
          <span className="text-xs text-ink-muted">Pick topics to pull due/missed words from:</span>
          <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto">
            {topics.map((t) => {
              const dueCount = buildSessionQueue(t.words, 999).length;
              return (
                <label key={t.id} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="h-3.5 w-3.5 accent-accent" />
                  {t.name} <span className="text-ink-muted">({dueCount} due)</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
            Cancel
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => onStart([...selected])}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105 disabled:cursor-default disabled:opacity-50"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
