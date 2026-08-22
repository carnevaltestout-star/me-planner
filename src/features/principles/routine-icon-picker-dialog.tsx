import { ROUTINE_ICON_PALETTES, ROUTINE_ICON_SHAPES, RoutineItemIcon } from "./principle-icons";
import type { RoutineIconPalette, RoutineIconShape } from "@/lib/principles/routine-types";

interface RoutineIconPickerDialogProps {
  shape: RoutineIconShape;
  palette: RoutineIconPalette;
  onChangeShape: (shape: RoutineIconShape) => void;
  onChangePalette: (palette: RoutineIconPalette) => void;
  onClose: () => void;
}

export default function RoutineIconPickerDialog({
  shape,
  palette,
  onChangeShape,
  onChangePalette,
  onClose,
}: RoutineIconPickerDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Routine Icon</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 px-[1.1rem] py-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-muted">Shape</span>
            <div className="grid grid-cols-4 gap-1.5">
              {ROUTINE_ICON_SHAPES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={shape === s.key}
                  onClick={() => onChangeShape(s.key)}
                  className={`flex flex-col items-center gap-1 rounded-theme-sm border p-2 ${
                    shape === s.key ? "border-accent bg-accent-soft" : "border-border bg-canvas hover:bg-surface-alt"
                  }`}
                >
                  <RoutineItemIcon shape={s.key} palette={palette} className="h-6 w-6" />
                  <span className="text-[0.65rem] text-ink-muted">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-muted">Color</span>
            <div className="grid grid-cols-5 gap-1.5">
              {ROUTINE_ICON_PALETTES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={palette === p.key}
                  onClick={() => onChangePalette(p.key)}
                  className={`flex flex-col items-center gap-1 rounded-theme-sm border p-2 ${
                    palette === p.key ? "border-accent bg-accent-soft" : "border-border bg-canvas hover:bg-surface-alt"
                  }`}
                >
                  <RoutineItemIcon shape={shape} palette={p.key} className="h-6 w-6" />
                  <span className="text-[0.62rem] text-ink-muted">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end border-t border-border px-[1.1rem] py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
