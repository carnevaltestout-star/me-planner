// Generic drag-to-reorder persistence, shared by any page that lets you
// rearrange a fixed set of cards (Overview, Statistics) — keyed per page so
// each remembers its own order independently.
export function loadCardOrder(storageKey: string, fallbackIds: string[]): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Drop ids that no longer exist, then append any new ones (a card
        // added after the order was last saved) at the end — so it shows up
        // instead of silently vanishing until the user re-orders things.
        const known = parsed.filter((id): id is string => typeof id === "string" && fallbackIds.includes(id));
        const missing = fallbackIds.filter((id) => !known.includes(id));
        return [...known, ...missing];
      }
    }
  } catch {
    // fall through to the default order
  }
  return fallbackIds;
}

export function saveCardOrder(storageKey: string, order: string[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(order));
}
