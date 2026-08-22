// A freeform note per day, living alongside that day's energy points —
// kept as its own small state rather than folded into EnergyState so
// existing point-array records never need a migration.
export interface EnergyNote {
  text: string;
  // Flagged from the Notes field's own "Principle" checkbox — always type
  // "Me" when picked up by the Principles tab, no manual type choice here.
  isPrinciple: boolean;
  // Set only when edited from the Principles tab's own card (the same
  // "Updated" caption every other principle gets) — never touched by
  // editing the note directly on the Energy Tracker page itself.
  updatedAt: string;
}

export type EnergyNoteState = Record<string, EnergyNote>; // dateKey -> note
