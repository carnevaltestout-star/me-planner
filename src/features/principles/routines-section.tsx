import { useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { loadRoutineIconSettings, saveRoutineIconSettings } from "@/lib/principles/routine-icon-storage";
import type { RoutineIconPalette, RoutineIconShape } from "@/lib/principles/routine-types";
import { PaletteIcon, PrincipleBunnyIcon } from "./principle-icons";
import RoutinesPanel from "./routines-panel";
import RoutineIconPickerDialog from "./routine-icon-picker-dialog";

// The Routines header + Morning/Evening cards + icon-customize dialog,
// extracted out of PrinciplesPage so it can sit at the top of Goals/To-Dos
// instead — moved there per explicit request, same look and functionality
// (palette picker, bunny decorations, live-editable cards) as it had under
// Principles. The Calendar tab's own "Display routines" dialog still renders
// RoutinesPanel directly and is untouched by this move.
export default function RoutinesSection() {
  const theme = useTheme();
  const showBunny = theme.retro || theme.kawaii;
  const [iconSettings, setIconSettings] = useState(() => loadRoutineIconSettings());
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  function changeIconShape(shape: RoutineIconShape) {
    const next = { ...iconSettings, shape };
    setIconSettings(next);
    saveRoutineIconSettings(next);
  }

  function changeIconPalette(palette: RoutineIconPalette) {
    const next = { ...iconSettings, palette };
    setIconSettings(next);
    saveRoutineIconSettings(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-center gap-2">
        {showBunny && (
          <button
            type="button"
            onClick={() => setIconPickerOpen(true)}
            aria-label="Change routine icon and color"
            title="Change routine icon and color"
            className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-theme hover:bg-surface-alt hover:text-accent"
          >
            <PaletteIcon className="h-4 w-4" />
          </button>
        )}
        {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
        <h2 className="m-0 text-base font-semibold text-ink">Routines</h2>
        {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
      </div>
      <RoutinesPanel iconSettings={iconSettings} />

      {iconPickerOpen && (
        <RoutineIconPickerDialog
          shape={iconSettings.shape}
          palette={iconSettings.palette}
          onChangeShape={changeIconShape}
          onChangePalette={changeIconPalette}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </div>
  );
}
