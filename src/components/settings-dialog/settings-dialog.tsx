import SettingsPanel from "./settings-panel";

interface SettingsDialogProps {
  onClose: () => void;
}

// A real in-app dialog (ported from public/mockups/theme-system.html, which
// stays around as historical reference but is no longer live) instead of a
// separate browser tab or an iframe — every control in SettingsPanel writes
// straight through useSetTheme(), so changes autosave and apply instantly.
// Positioned absolute within AppShell's main content column (not the whole
// viewport), so the sidenav stays visible and clickable outside the dialog
// on desktop, and sized to 80% of that column rather than covering it
// entirely — full-screen only on mobile, where there's no sidenav to leave
// room for.
export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings and theme"
        className="flex h-full w-full flex-col overflow-hidden border border-border bg-surface shadow-theme md:h-[80%] md:w-[80%] md:rounded-theme"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface-alt px-3 py-2">
          <span className="text-sm font-semibold text-ink">Settings &amp; theme</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
          >
            ✕
          </button>
        </div>
        <SettingsPanel />
      </div>
    </div>
  );
}
