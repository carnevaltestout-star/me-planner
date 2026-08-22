import type { PrincipleType } from "@/lib/journal/journal-types";

export interface Principle {
  id: string;
  text: string;
  type: PrincipleType;
  savedAt: string;
  // Set (and overwritten, not appended to) whenever the text is edited
  // after creation — "" until the first edit, so the card only shows an
  // "Updated" caption once there's actually been one.
  updatedAt: string;
  // Set only on the read-only, derived entries built live in
  // principles-page.tsx from Journal's "Principle" checkbox or the Energy
  // Tracker's — never persisted, since those aren't real records in this
  // feature's own storage.
  source?: "journal" | "tracker";
  // Sort key — shares one numeric scale with derived entries' own
  // (unpersisted) order, negated-timestamp-shaped, so a plain ascending
  // sort keeps working the same "most recent first" way by default whether
  // or not anything has ever been manually dragged. Dragging a card
  // interpolates a new value between its new neighbors' order (see
  // principles-page.tsx) rather than reassigning small sequential indices —
  // those would permanently outrank every negated-timestamp value and the
  // dragged card would never sort correctly against undragged ones again.
  order: number;
}

// One distinct color per type for the badge on each principle card — chosen
// to be thematically fitting (Finance green, Social blue, Work slate,
// Personal warm rose, Me teal) rather than reusing the app's single accent
// color for everything, since scanability across types is the whole point
// of the tag.
export const PRINCIPLE_TYPE_COLORS: Record<PrincipleType, string> = {
  All: "#8a8a8a",
  Personal: "#c2708c",
  Social: "#4b8fc2",
  Work: "#7c7c9c",
  Finance: "#5b8a72",
  Me: "#3d9c9c",
};

export function createPrinciple(text: string, type: PrincipleType): Principle {
  return { id: crypto.randomUUID(), text, type, savedAt: new Date().toISOString(), updatedAt: "", order: -Date.now() };
}
