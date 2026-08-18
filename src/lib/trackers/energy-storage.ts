import { dateKey } from "./tracker-dates";
import type { EnergyState } from "./energy-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features.
export const ENERGY_STORAGE_KEY = "me-planner:mock-energy";

function seedState(): EnergyState {
  const todayKey = dateKey(new Date());
  return {
    [todayKey]: [
      { time: 8.5, value: 55 },
      { time: 12, value: 70 },
      { time: 16, value: 40 },
      { time: 20, value: 25 },
    ],
  };
}

export function loadEnergyState(): EnergyState {
  try {
    const raw = window.localStorage.getItem(ENERGY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as EnergyState;
    }
  } catch {
    // fall through to seed data
  }
  return seedState();
}

export function saveEnergyState(state: EnergyState) {
  window.localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(state));
}
