import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", ...props };
}

// Open eye — same minimal stroke-icon convention as the rest of the app's
// hand-authored icons (viewBox 0 0 24, currentColor stroke). Shown while
// Trash is hidden; tapping it opens Trash (see EyeOffIcon for that state).
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M2 12c2.5-4.5 6.2-7 10-7s7.5 2.5 10 7c-2.5 4.5-6.2 7-10 7S4.5 16.5 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Same open-eye shape as EyeIcon, plus a diagonal slash through it — the
// familiar "hidden" glyph (same convention as a password field's
// show/hide toggle), clearer at a glance than a closed-eyelid shape.
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M2 12c2.5-4.5 6.2-7 10-7s7.5 2.5 10 7c-2.5 4.5-6.2 7-10 7S4.5 16.5 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3.5" y1="19.5" x2="20.5" y2="4.5" />
    </svg>
  );
}
