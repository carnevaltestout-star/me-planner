// Retro/kawaii-only stand-in for a plain border divider — a dashed rule in
// the accent color. Drawn as a repeating gradient rather than a fixed run of
// literal "--" characters so it always spans the full row edge to edge, at
// any width, instead of a fixed-length string that falls short (or
// overflows) depending on how wide the row actually is. Shared by Journal
// (between its questions) and Vocabulary Training (between word rows) so
// both use the exact same divider under a skin.
export default function DashDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-[2px] w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-accent) 45%, transparent) 0, color-mix(in srgb, var(--color-accent) 45%, transparent) 8px, transparent 8px, transparent 16px)",
      }}
    />
  );
}
