import { MOOD_OPTIONS, type MoodKey } from "@/lib/trackers/tracker-types";
import { MoodIcon } from "./tracker-icon";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";

interface MoodPickerModalProps {
  onClose: () => void;
  onSelect: (mood: MoodKey) => void;
}

export default function MoodPickerModal({ onClose, onSelect }: MoodPickerModalProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
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
        <h2 className="m-0 text-base text-ink">How's today?</h2>
        <div className="flex justify-between gap-1.5">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelect(m.key)}
              aria-label={m.label}
              title={m.label}
              style={{
                background: `color-mix(in srgb, ${m.color} 22%, var(--color-surface))`,
                borderColor: `color-mix(in srgb, ${m.color} 55%, var(--color-border))`,
              }}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border text-xl hover:brightness-95"
            >
              <MoodIcon mood={m.key} className="h-6 w-6" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
