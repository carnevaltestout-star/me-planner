import type { SVGProps } from "react";

// Four-way "move" cross — a plus shape with an arrowhead chevron at each of
// its four tips, the universal drag-to-reorder glyph.
export function DragHandleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="3.5" x2="12" y2="20.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <path d="M9.2 6.3 12 3.5l2.8 2.8" />
      <path d="M9.2 17.7 12 20.5l2.8-2.8" />
      <path d="M6.3 9.2 3.5 12l2.8 2.8" />
      <path d="M17.7 9.2 20.5 12l-2.8 2.8" />
    </svg>
  );
}
