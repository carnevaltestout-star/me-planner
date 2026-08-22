import type { EnergyNoteState } from "./energy-note-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features.
export const ENERGY_NOTE_STORAGE_KEY = "me-planner:mock-energy-notes";

// Fills in fields added after a note may have already been saved (e.g.
// updatedAt), same reasoning as every other feature's storage normalize.
function normalize(raw: EnergyNoteState[string]): EnergyNoteState[string] {
  return { ...raw, updatedAt: raw.updatedAt ?? "" };
}

export function loadEnergyNotes(): EnergyNoteState {
  try {
    const raw = window.localStorage.getItem(ENERGY_NOTE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, normalize(v as EnergyNoteState[string])]));
      }
    }
  } catch {
    // fall through to empty state
  }
  return {};
}

export function saveEnergyNotes(state: EnergyNoteState) {
  window.localStorage.setItem(ENERGY_NOTE_STORAGE_KEY, JSON.stringify(state));
}
