import type { SVGProps } from "react";
import { pixelGlyph, pixelGlyphLayers } from "@/components/kawaii-icons/kawaii-icons";
import { useTheme } from "@/components/theme-provider/theme-context";
import type { RoutineIconPalette, RoutineIconShape } from "@/lib/principles/routine-types";

// Same bitmap as public/mockups/principles.html's retro/kawaii bunny, kept
// in sync so the real component looks identical to the approved mockup.
const FLANKING_BUNNY = ["00100100", "00100100", "00111100", "01111110", "11111111", "11011011", "11111111", "01111110"];

// ---- Routine-item mascot: 4 shapes x 5 palettes, all explored in
// public/mockups/mascot-icon-colors.html. Highlight/shadow subsets are that
// mockup's auto-shading (top-left lighter, bottom-right darker) precomputed
// by hand per shape, since these bitmaps are fixed rather than computed at
// runtime like the mockup's picker. ----

const PALETTES: Record<RoutineIconPalette, { face: string; accent: string; eye: string }> = {
  blush: { face: "#f0c3cc", accent: "#c94f6b", eye: "#4a2530" },
  sage: { face: "#bcd8ad", accent: "#4f8a45", eye: "#2c3a24" },
  sand: { face: "#f0cf8f", accent: "#c98a2a", eye: "#4a3418" },
  lavender: { face: "#cdbbe8", accent: "#7d54ad", eye: "#362a4a" },
  sky: { face: "#a9d3ea", accent: "#3d7ba3", eye: "#1f3a4a" },
};

export const ROUTINE_ICON_SHAPES: { key: RoutineIconShape; label: string }[] = [
  { key: "kitty", label: "Kitty" },
  { key: "pup", label: "Pup" },
  { key: "bear", label: "Bear" },
  { key: "bunny", label: "Bunny" },
];

export const ROUTINE_ICON_PALETTES: { key: RoutineIconPalette; label: string }[] = [
  { key: "blush", label: "Blush" },
  { key: "sage", label: "Sage" },
  { key: "sand", label: "Sand" },
  { key: "lavender", label: "Lavender" },
  { key: "sky", label: "Sky" },
];

interface Layer {
  grid: string[];
  color: string;
}

// Base face + auto-derived highlight (lighter) and shadow (darker), same
// stacking order as the mockup's shaded() helper.
function shadedFace(face: string[], highlight: string[], shadow: string[], color: string): Layer[] {
  return [
    { grid: shadow, color: `color-mix(in srgb, ${color} 80%, black)` },
    { grid: face, color },
    { grid: highlight, color: `color-mix(in srgb, ${color} 75%, white)` },
  ];
}

const KITTY_FACE = ["01100110", "11111111", "11111111", "11111111", "11111111", "11111111", "01111110", "00000000"];
const KITTY_FACE_HIGHLIGHT = ["01100000", "11110000", "11110000", "11110000", "00000000", "00000000", "00000000", "00000000"];
const KITTY_FACE_SHADOW = ["00000000", "00000000", "00000000", "00000000", "00001111", "00001111", "00001110", "00000000"];
const KITTY_EYES = ["00000000", "00000000", "00000000", "01000010", "00000000", "00000000", "00000000", "00000000"];
const KITTY_NOSE = ["00000000", "00000000", "00000000", "00000000", "00011000", "00000000", "00000000", "00000000"];
const KITTY_WHISKERS = ["00000000", "00000000", "00000000", "00000000", "10000001", "00000000", "00000000", "00000000"];
const KITTY_BOW = ["00000010", "00000111", "00000010", "00000000", "00000000", "00000000", "00000000", "00000000"];

const PUP_HEAD = ["00000000", "01000010", "11100111", "11111111", "11111111", "11111111", "01111110", "00000000"];
const PUP_HEAD_HIGHLIGHT = ["00000000", "01000000", "11100000", "11110000", "00000000", "00000000", "00000000", "00000000"];
const PUP_HEAD_SHADOW = ["00000000", "00000000", "00000000", "00000000", "00001111", "00001111", "00001110", "00000000"];
const PUP_EYES = ["00000000", "00000000", "00000000", "00000000", "01000010", "00000000", "00000000", "00000000"];
const PUP_BLUSH = ["00000000", "00000000", "00000000", "00000000", "00000000", "10000001", "00000000", "00000000"];

const BEAR_HEAD = ["01000010", "11100111", "11111111", "11111111", "11111111", "11111111", "01111110", "00000000"];
const BEAR_HEAD_HIGHLIGHT = ["01000000", "11100000", "11110000", "11110000", "00000000", "00000000", "00000000", "00000000"];
const BEAR_HEAD_SHADOW = ["00000000", "00000000", "00000000", "00000000", "00001111", "00001111", "00001110", "00000000"];
const BEAR_EYES = ["00000000", "00000000", "00000000", "01000010", "00000000", "00000000", "00000000", "00000000"];
const BEAR_NOSE = ["00000000", "00000000", "00000000", "00000000", "00011000", "00000000", "00000000", "00000000"];
const BEAR_BLUSH = ["00000000", "00000000", "00000000", "00000000", "00000000", "10000001", "00000000", "00000000"];

const BUNNY_FACE = ["00100100", "00100100", "00100100", "01111110", "11111111", "11111111", "01111110", "00000000"];
const BUNNY_FACE_HIGHLIGHT = ["00100000", "00100000", "00100000", "01110000", "00000000", "00000000", "00000000", "00000000"];
const BUNNY_FACE_SHADOW = ["00000000", "00000000", "00000000", "00000000", "00001111", "00001111", "00001110", "00000000"];
const BUNNY_EAR_INNER = ["00000000", "00100100", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"];
const BUNNY_EYES = ["00000000", "00000000", "00000000", "00000000", "01000010", "00000000", "00000000", "00000000"];
const BUNNY_NOSE = ["00000000", "00000000", "00000000", "00000000", "00000000", "00011000", "00000000", "00000000"];
const BUNNY_BLUSH = ["00000000", "00000000", "00000000", "00000000", "00000000", "10000001", "00000000", "00000000"];

const SHAPE_LAYERS: Record<RoutineIconShape, (pal: { face: string; accent: string; eye: string }) => Layer[]> = {
  kitty: (pal) => [
    ...shadedFace(KITTY_FACE, KITTY_FACE_HIGHLIGHT, KITTY_FACE_SHADOW, pal.face),
    { grid: KITTY_EYES, color: pal.eye },
    { grid: KITTY_NOSE, color: pal.accent },
    { grid: KITTY_WHISKERS, color: pal.eye },
    { grid: KITTY_BOW, color: pal.accent },
  ],
  pup: (pal) => [
    ...shadedFace(PUP_HEAD, PUP_HEAD_HIGHLIGHT, PUP_HEAD_SHADOW, pal.face),
    { grid: PUP_EYES, color: pal.eye },
    { grid: PUP_BLUSH, color: pal.accent },
  ],
  bear: (pal) => [
    ...shadedFace(BEAR_HEAD, BEAR_HEAD_HIGHLIGHT, BEAR_HEAD_SHADOW, pal.face),
    { grid: BEAR_EYES, color: pal.eye },
    { grid: BEAR_NOSE, color: pal.eye },
    { grid: BEAR_BLUSH, color: pal.accent },
  ],
  bunny: (pal) => [
    ...shadedFace(BUNNY_FACE, BUNNY_FACE_HIGHLIGHT, BUNNY_FACE_SHADOW, pal.face),
    { grid: BUNNY_EAR_INNER, color: pal.accent },
    { grid: BUNNY_EYES, color: pal.eye },
    { grid: BUNNY_NOSE, color: pal.accent },
    { grid: BUNNY_BLUSH, color: pal.accent },
  ],
};

function DefaultRoutineItemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M7 10.2l2 2 4-4.4" />
    </svg>
  );
}

interface RoutineItemIconProps extends SVGProps<SVGSVGElement> {
  shape: RoutineIconShape;
  palette: RoutineIconPalette;
}

// The "fitting icon" placed at the start of every Morning/Evening Routine
// line — a plain checkmark-circle normally, the chosen mascot+palette (via
// the picker next to the "Routines" heading) in retro/kawaii.
export function RoutineItemIcon({ shape, palette, ...props }: RoutineItemIconProps) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyphLayers(SHAPE_LAYERS[shape](PALETTES[palette]), {
      ...props,
      style: { imageRendering: "pixelated", ...props.style },
    });
  }
  return <DefaultRoutineItemIcon {...props} />;
}

// Flanks the "Principles" and "Routines" headings in retro/kawaii only —
// callers decide whether to render it at all (no classic-theme fallback
// glyph, since classic doesn't get a mascot there).
export function PrincipleBunnyIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(FLANKING_BUNNY, { ...props, style: { imageRendering: "pixelated", ...props.style } });
}

// Same shape as Goals/To-Dos and Journal's own TrashIcon, kept per-feature
// per this app's icon convention rather than cross-imported.
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...props}>
      <line x1="4" y1="5.5" x2="16" y2="5.5" />
      <path d="M7 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
      <path d="M5.5 5.5 6.2 16a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-10.5" />
      <line x1="8.3" y1="8.5" x2="8.3" y2="13.5" />
      <line x1="11.7" y1="8.5" x2="11.7" y2="13.5" />
    </svg>
  );
}

// Same stroke convention as TrashIcon above — pairs with it as the
// hover-reveal edit affordance on a principle card.
export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...props}>
      <path d="M13.5 3.5 16.5 6.5 7 16 3.5 16.5 4 13Z" />
      <line x1="12" y1="5" x2="15" y2="8" />
    </svg>
  );
}

// Small paint-swatch trigger icon for the "change routine icon" button.
export function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2.5a7.5 7.5 0 1 0 0 15c.9 0 1.4-.7 1.1-1.5-.2-.5-.1-1 .3-1.3.3-.3.7-.3 1.1-.3H14a3.5 3.5 0 0 0 3.5-3.5c0-4.9-3.4-8.4-7.5-8.4Z" />
      <circle cx="6.6" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.6" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
