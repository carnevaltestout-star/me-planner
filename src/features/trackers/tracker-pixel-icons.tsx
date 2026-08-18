import type { SVGProps } from "react";
import { pixelGlyph, pixelGlyphLayers, type IconComponent } from "@/components/kawaii-icons/kawaii-icons";
import { MOOD_OPTIONS, type MoodKey, type TrackerIconKey } from "@/lib/trackers/tracker-types";

type Bitmap = string[];

// One shared 8-bit pixel set for both Retro and Kawaii mode (per spec: "use
// the same ones for retro and kawaii mode") — each is a base silhouette
// layer in the tracker's own color, plus a small decorative accent layer in
// a fixed soft pink for the "cute" detail (bubbles, lace, hearts, etc).
const BASE: Record<TrackerIconKey, Bitmap> = {
  water: ["11111111", "01111110", "01111110", "00111100", "00111100", "00111100", "00011000", "00011000"],
  pillow: ["01111110", "11111111", "11111111", "11111111", "11111111", "11111111", "11111111", "01111110"],
  strawberry: ["00000000", "00000000", "00111100", "01111110", "11111111", "11111111", "01111110", "00111100"],
  brain: ["00111100", "01111110", "11111111", "11011011", "11111111", "11011011", "01111110", "00111100"],
  heart: ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00000000"],
  book: ["11111111", "11101111", "11101111", "11101111", "11101111", "11101111", "11101111", "11111111"],
  notepad: ["11111111", "10000001", "10111101", "10111101", "10111101", "10000001", "10111101", "11111111"],
  running: ["00110000", "00110000", "01111000", "11011100", "00110000", "01100100", "01100100", "11001100"],
  plane: ["00011000", "00011000", "01111110", "11111111", "00011000", "00111100", "01100110", "00000000"],
  toothbrush: ["00000011", "00000110", "00001100", "00011000", "00110000", "01100000", "11111100", "11111100"],
  sun: ["00011000", "10011001", "01111110", "11111111", "11111111", "01111110", "10011001", "00011000"],
  money: ["00111100", "01000010", "11111111", "10111101", "10100101", "10111101", "10111101", "11111111"],
  chat: ["11111000", "10001000", "11111000", "00010100", "00011110", "00010001", "00011110", "00000000"],
  moonSleep: ["00111100", "01110000", "11100000", "11100000", "11100000", "01110000", "00111100", "00000000"],
  bottle: ["00011000", "00011000", "00111100", "01111110", "01111110", "01111110", "01111110", "01111110"],
  console: ["00000000", "01111110", "11111111", "11111111", "11111111", "11111111", "11000011", "10000001"],
  speechBubble: ["01111110", "11111111", "11111111", "11111111", "11111111", "01111110", "00110000", "00100000"],
  utensils: ["10101111", "10101111", "10100111", "01100011", "01100010", "01100010", "01100010", "01100010"],
  palette: ["00111100", "01111110", "11111111", "11111111", "11100011", "11111111", "01111110", "00111100"],
  drop: ["00011000", "00011000", "00111100", "01111110", "11111111", "11111111", "01111110", "00111100"],
};

// The cute accent layer per icon: bubbles in the glass, polka dots on the
// pillow, hearts around the brain, a heart in the book, lace on the
// notepad, a tutu on the runner, a smiling face on the sun, hearts in the
// speech bubbles, a sleep cap + heart pompom on the moon, a drop by the
// toothbrush — matching the spec's per-icon "cute variant" list.
const ACCENT: Partial<Record<TrackerIconKey, Bitmap>> = {
  water: ["00000000", "00000000", "00010000", "00000000", "00001000", "00010000", "00000000", "00000000"],
  pillow: ["00000000", "00100000", "00000000", "00000100", "00000000", "00100000", "00000100", "00000000"],
  strawberry: ["00100100", "01111110", "00000000", "00100100", "00000000", "00011000", "00000000", "00000000"],
  brain: ["10000001", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "10000001"],
  book: ["00000000", "00000000", "00000000", "00001100", "00001100", "00000000", "00000000", "00000000"],
  notepad: ["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "01000010", "00000000"],
  running: ["00000000", "00000000", "00000000", "00000000", "01111100", "00000000", "00000000", "00000000"],
  toothbrush: ["00000100", "00001110", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  sun: ["00000000", "00000000", "00000000", "00100100", "00011000", "00000000", "00000000", "00000000"],
  money: ["10000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  chat: ["00000000", "00100000", "00000000", "00000000", "00000000", "00001000", "00000000", "00000000"],
  moonSleep: ["00000010", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  bottle: ["00000000", "00000000", "00000000", "00100000", "00000000", "00000000", "00000000", "00000000"],
  console: ["00000000", "00000000", "00000000", "00000000", "00000101", "00000000", "00000000", "00000000"],
  speechBubble: ["00000000", "00000000", "00011000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  utensils: ["00000010", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
};

const ACCENT_COLOR = "#ff8fc0";

function trackerIcon(key: TrackerIconKey): IconComponent {
  const accent = ACCENT[key];
  if (!accent) {
    return (props: SVGProps<SVGSVGElement>) => pixelGlyph(BASE[key], props);
  }
  return (props: SVGProps<SVGSVGElement>) =>
    pixelGlyphLayers(
      [
        { grid: BASE[key], color: "currentColor" },
        { grid: accent, color: ACCENT_COLOR },
      ],
      props,
    );
}

export const TRACKER_PIXEL_ICONS: Record<TrackerIconKey, IconComponent> = {
  water: trackerIcon("water"),
  pillow: trackerIcon("pillow"),
  strawberry: trackerIcon("strawberry"),
  brain: trackerIcon("brain"),
  heart: trackerIcon("heart"),
  book: trackerIcon("book"),
  notepad: trackerIcon("notepad"),
  running: trackerIcon("running"),
  plane: trackerIcon("plane"),
  toothbrush: trackerIcon("toothbrush"),
  sun: trackerIcon("sun"),
  money: trackerIcon("money"),
  chat: trackerIcon("chat"),
  moonSleep: trackerIcon("moonSleep"),
  bottle: trackerIcon("bottle"),
  console: trackerIcon("console"),
  speechBubble: trackerIcon("speechBubble"),
  utensils: trackerIcon("utensils"),
  palette: trackerIcon("palette"),
  drop: trackerIcon("drop"),
};

// Small decorative strawberries scattered around the tracker grid in
// retro/kawaii mode only (see TrackersPage) — same bitmap as the strawberry
// tracker icon, just reused as pure decoration.
export function StrawberryDecoration(props: SVGProps<SVGSVGElement>) {
  return trackerIcon("strawberry")(props);
}

const FACE_BASE: Bitmap = ["00111100", "01111110", "11111111", "11111111", "11111111", "11111111", "01111110", "00111100"];

const MOOD_FACES: Record<MoodKey, Bitmap> = {
  awful: ["00000000", "01000010", "00100100", "00000000", "00000000", "00111100", "01000010", "00000000"],
  low: ["00000000", "00000000", "00100100", "00000000", "00000000", "00111100", "00000000", "00000000"],
  okay: ["00000000", "00000000", "00100100", "00000000", "00000000", "00111110", "00000000", "00000000"],
  good: ["00000000", "00000000", "00100100", "00000000", "00000000", "00100100", "00011000", "00000000"],
  great: ["10000001", "00000000", "00100100", "00000000", "00000000", "01000010", "00111100", "00000000"],
};

// Custom 5-face pixel mood set for retro/kawaii mode, standing in for the
// plain emoji used in normal mode (spec: "make sure to use custom ones for
// retro and kawaii"). The face itself is tinted with that mood's own
// red-to-green color instead of the tracker accent, so the color scale
// reads the same way here as it does for the emoji in normal mode.
export function moodPixelIcon(key: MoodKey, props: SVGProps<SVGSVGElement>) {
  const color = MOOD_OPTIONS.find((m) => m.key === key)?.color ?? "currentColor";
  return pixelGlyphLayers(
    [
      { grid: FACE_BASE, color },
      { grid: MOOD_FACES[key], color: "#ffffff" },
    ],
    props,
  );
}
