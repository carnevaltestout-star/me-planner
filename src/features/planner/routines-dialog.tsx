import RoutinesPanel from "@/features/principles/routines-panel";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";

interface RoutinesDialogProps {
  onClose: () => void;
}

// The same live, editable Morning/Evening routine cards from the
// Principles/Routines tab, shown as a quick-glance overlay on the Calendar
// tab — changes made here are the same underlying data, not a copy.
export default function RoutinesDialog({ onClose }: RoutinesDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85dvh] w-full max-w-[560px] flex-col gap-3 overflow-y-auto rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <div className="flex flex-shrink-0 items-center justify-between">
          <h2 className="m-0 text-base text-ink">Routines</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            ✕
          </button>
        </div>
        <RoutinesPanel />
      </div>
    </div>
  );
}
