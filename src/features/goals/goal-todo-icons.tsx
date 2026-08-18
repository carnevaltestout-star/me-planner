import type { SVGProps } from "react";
import { pixelGlyph, pixelGlyphLayers } from "@/components/kawaii-icons/kawaii-icons";
import { useTheme } from "@/components/theme-provider/theme-context";

function baseProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

function GoalLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TodoLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
      <path d="M8.5 12.3 10.8 14.6 15.6 9.6" />
    </svg>
  );
}

const GOAL_BITMAP = ["00111100", "01111110", "11100111", "11011011", "11011011", "11100111", "01111110", "00111100"];
const TODO_BITMAP = ["11111111", "10000001", "10000101", "10001011", "11010001", "10100001", "10000001", "11111111"];

export function GoalTodoKindIcon({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: "goal" | "todo" }) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  if (pixelated) {
    return pixelGlyph(kind === "goal" ? GOAL_BITMAP : TODO_BITMAP, { ...props, style: { imageRendering: "pixelated", ...props.style } });
  }
  return kind === "goal" ? <GoalLineIcon {...props} /> : <TodoLineIcon {...props} />;
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps({ strokeWidth: 2.1, ...props })}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <path d="M8.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V6" />
      <path d="M6.5 6 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 6" />
      <line x1="10" y1="10" x2="10" y2="16.5" />
      <line x1="14" y1="10" x2="14" y2="16.5" />
    </svg>
  );
}

function DefaultSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.3" y1="15.3" x2="20" y2="20" />
    </svg>
  );
}

// Same bunny-with-magnifying-glass bitmap as Journal's own SearchIcon, so
// the two search fields match in retro/kawaii instead of one keeping the
// plain glass icon.
const BUNNY_MAGNIFIER = ["01000010", "01111110", "11111111", "11111111", "11111111", "01111110", "00000011", "00000001"];

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyph(BUNNY_MAGNIFIER, { ...props, style: { imageRendering: "pixelated", ...props.style } });
  }
  return <DefaultSearchIcon {...props} />;
}

const HEART_BITMAP = ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00000000"];
// HEART_BITMAP eroded by one pixel on every edge — layering this in a second
// color on top of the full heart leaves only a one-pixel outer ring of the
// base color showing, i.e. a small border around the heart.
const HEART_FILL_BITMAP = ["00000000", "01100110", "01111110", "01111110", "00111100", "00011000", "00000000", "00000000"];

// Retro/kawaii-only replacement for the plain circle "mark done" checkbox —
// a small accent-colored border with the interior colored by the caller
// (white when not done, the item's own color when done).
export function HeartCheckIcon({ borderColor, fillColor, ...props }: SVGProps<SVGSVGElement> & { borderColor: string; fillColor: string }) {
  return pixelGlyphLayers(
    [
      { grid: HEART_BITMAP, color: borderColor },
      { grid: HEART_FILL_BITMAP, color: fillColor },
    ],
    { ...props, style: { imageRendering: "pixelated", ...props.style } },
  );
}

function ImportImageLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="4.5" width="18" height="14" rx="2" />
      <circle cx="8.3" cy="9.3" r="1.5" />
      <path d="M3.5 15.3 8.5 10.8l3.4 3.2 3-2.5 5.6 4.6" />
    </svg>
  );
}

const IMPORT_IMAGE_BITMAP = [
  "11111111",
  "10000001",
  "10010001",
  "10000001",
  "10001001",
  "10010101",
  "10101101",
  "11111111",
];

// Picture-with-mountain glyph for the "Import from image" action — same
// shape family as CoverGlyphIcon in Book Reviews, just its own bitmap since
// icons are kept per-feature rather than cross-imported.
export function ImportImageIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyph(IMPORT_IMAGE_BITMAP, { ...props, style: { imageRendering: "pixelated", ...props.style } });
  }
  return <ImportImageLineIcon {...props} />;
}

export function CheckArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="7" width="17" height="13" rx="2" />
      <path d="M3.5 7 6 3.5h12L20.5 7" />
      <path d="M9.5 12.5 11.5 14.5 15 10.5" />
    </svg>
  );
}
