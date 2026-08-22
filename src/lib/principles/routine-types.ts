export type RoutineKey = "morning" | "evening";

export interface RoutineState {
  morning: string[];
  evening: string[];
}

// Which retro/kawaii-only mascot renders at the start of each routine line,
// and which color family it's painted in — user-configurable via the
// picker next to the "Routines" heading, from the shapes/palettes explored
// in public/mockups/mascot-icon-colors.html.
export type RoutineIconShape = "kitty" | "pup" | "bear" | "bunny";
export type RoutineIconPalette = "blush" | "sage" | "sand" | "lavender" | "sky";

export interface RoutineIconSettings {
  shape: RoutineIconShape;
  palette: RoutineIconPalette;
}
