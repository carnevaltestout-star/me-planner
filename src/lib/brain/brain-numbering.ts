// Decimal outline numbering (1, 1.1, 1.1.1, 2, ...) computed purely from
// each subpoint's position/depth in the tree — nothing is stored, so
// reordering or inserting a subpoint anywhere automatically renumbers
// everything under it without any migration.
export function subpointLabel(path: number[]): string {
  return path.map((n) => n + 1).join(".");
}
