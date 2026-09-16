import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// A small in-app confirm modal standing in for window.confirm() — the
// browser/webview's native confirm prefixes its message with the page's own
// origin ("localhost:1420 says…"), which reads as a stray, meaningless
// string to someone using the actual app. Same escape-key/mobile-bottom-nav
// handling every other feature's own delete-confirm dialog already uses,
// but kept to the notes panel's fixed black/white "paper" colors instead of
// the app's theme, matching the rest of this panel.
export default function ConfirmDialog({ message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onCancel);
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/40 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-xs rounded-theme-sm bg-white p-4 text-[#1a1a1a] shadow-2xl dark:bg-[#1f1f1f] dark:text-[#eaeaea]"
      >
        <p className="m-0 text-sm leading-relaxed">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-current px-3 py-1.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#1a1a1a] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#eaeaea] dark:text-[#1a1a1a]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
