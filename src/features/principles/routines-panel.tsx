import { useState } from "react";
import { loadRoutineIconSettings } from "@/lib/principles/routine-icon-storage";
import { loadRoutines, saveRoutines } from "@/lib/principles/routine-storage";
import type { RoutineIconSettings, RoutineKey } from "@/lib/principles/routine-types";
import RoutineCard from "./routine-card";

interface RoutinesPanelProps {
  // Principles/Routines page passes its own live state here (so the
  // palette-picker button there updates these cards immediately); anywhere
  // else that just wants to show the two cards as-is (e.g. the Calendar
  // tab's Routines dialog) can leave it out and let this load its own copy.
  iconSettings?: RoutineIconSettings;
}

// The Morning/Evening routine cards, extracted out of PrinciplesPage so the
// Calendar tab's "Display routines" dialog can show the exact same live,
// editable cards without duplicating their storage/handler logic.
export default function RoutinesPanel({ iconSettings: iconSettingsProp }: RoutinesPanelProps) {
  const [routines, setRoutines] = useState(() => loadRoutines());
  const [ownIconSettings] = useState(() => loadRoutineIconSettings());
  const iconSettings = iconSettingsProp ?? ownIconSettings;

  function persistRoutines(next: typeof routines) {
    setRoutines(next);
    saveRoutines(next);
  }

  function addRoutineItem(key: RoutineKey, text: string) {
    persistRoutines({ ...routines, [key]: [...routines[key], text] });
  }

  function removeRoutineItem(key: RoutineKey, index: number) {
    persistRoutines({ ...routines, [key]: routines[key].filter((_, i) => i !== index) });
  }

  function editRoutineItem(key: RoutineKey, index: number, text: string) {
    persistRoutines({ ...routines, [key]: routines[key].map((item, i) => (i === index ? text : item)) });
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <RoutineCard
        emoji="☀️"
        title="Morning Routine"
        placeholder="Add to your morning…"
        items={routines.morning}
        iconShape={iconSettings.shape}
        iconPalette={iconSettings.palette}
        onAdd={(text) => addRoutineItem("morning", text)}
        onRemove={(i) => removeRoutineItem("morning", i)}
        onEdit={(i, text) => editRoutineItem("morning", i, text)}
      />
      <RoutineCard
        emoji="🌙"
        title="Evening Routine"
        placeholder="Add to your evening…"
        items={routines.evening}
        iconShape={iconSettings.shape}
        iconPalette={iconSettings.palette}
        onAdd={(text) => addRoutineItem("evening", text)}
        onRemove={(i) => removeRoutineItem("evening", i)}
        onEdit={(i, text) => editRoutineItem("evening", i, text)}
      />
    </div>
  );
}
