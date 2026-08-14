import type { SVGProps } from "react";
import type { IconPackKey } from "@/lib/theme/theme-types";

type Bitmap = string[];

const BITMAPS: Record<string, Bitmap> = {
  bunny: ["00100100", "00100100", "00111100", "01111110", "11111111", "11011011", "11111111", "01111110"],
  cat: ["10000001", "11000011", "01111110", "11111111", "11011011", "11111111", "01111110", "00000000"],
  heart: ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00000000"],
  star: ["00011000", "00011000", "00111100", "11111111", "01111110", "00111100", "01100110", "11000011"],
  sparkle: ["00011000", "00011000", "00111100", "11111111", "11111111", "00111100", "00011000", "00011000"],
  moon: ["00111000", "01111000", "11110000", "11110000", "11110000", "11110000", "01111000", "00111000"],
  onigiri: ["00011000", "00111100", "01111110", "01111110", "11111111", "11000011", "11000011", "11111111"],
  donut: ["00111100", "01111110", "11100111", "11000011", "11000011", "11100111", "01111110", "00111100"],
  boba: ["00011000", "00011000", "01111110", "01111110", "01111110", "01111110", "00111100", "00011000"],
  paw: ["01100110", "01100110", "00000000", "00111100", "01111110", "11111111", "11111111", "01111110"],
  bunnySleeping: ["00000000", "00000000", "01111000", "11111100", "11111111", "11111111", "01111110", "00000000"],
};

export function pixelGlyph(bitmap: Bitmap, props: SVGProps<SVGSVGElement>) {
  const cell = 20 / 8;
  const rects: string[] = [];
  bitmap.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "1") rects.push(`${x * cell},${y * cell}`);
    });
  });
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      {rects.map((pos) => {
        const [x, y] = pos.split(",");
        return <rect key={pos} x={x} y={y} width={cell} height={cell} />;
      })}
    </svg>
  );
}

interface GlyphLayer {
  grid: Bitmap;
  color: string;
}

// Multi-color variant of pixelGlyph, for icons that need more than one fill
// (e.g. the kawaii bunny's body + blush + bow). Each layer is its own <g>
// with an inline style — SVG presentation attributes like fill="var(...)"
// can't resolve CSS custom properties, only style="fill:..." can.
export function pixelGlyphLayers(layers: GlyphLayer[], props: SVGProps<SVGSVGElement>) {
  const cell = 20 / 8;
  return (
    <svg viewBox="0 0 20 20" {...props}>
      {layers.map(({ grid, color }, layerIndex) => (
        <g key={layerIndex} style={{ fill: color }}>
          {grid.flatMap((row, y) =>
            [...row].map((c, x) =>
              c === "1" ? <rect key={`${x},${y}`} x={x * cell} y={y * cell} width={cell} height={cell} /> : null,
            ),
          )}
        </g>
      ))}
    </svg>
  );
}

const KAWAII_BUNNY_BLUSH: Bitmap = [
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "01000010",
  "00000000",
  "00000000",
];
const KAWAII_BUNNY_BOW: Bitmap = [
  "00000011",
  "00000101",
  "00000011",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
];

// Blush + one-ear bow layered on top of the plain bunny body, shown instead
// of BunnyIcon when Super Kawaii Mode is on. Body uses currentColor (the
// accent) like every other pixel icon; blush/bow are fixed kawaii colors.
export function KawaiiBunnyIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyphLayers(
    [
      { grid: BITMAPS.bunny, color: "currentColor" },
      { grid: KAWAII_BUNNY_BLUSH, color: "#ff9fc4" },
      { grid: KAWAII_BUNNY_BOW, color: "#e0217a" },
    ],
    props,
  );
}

export function BunnyIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.bunny, props);
}
export function CatIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.cat, props);
}
export function KawaiiHeartIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.heart, props);
}
export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.star, props);
}
export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.sparkle, props);
}
export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.moon, props);
}
export function OnigiriIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.onigiri, props);
}
export function DonutIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.donut, props);
}
export function BobaIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.boba, props);
}
export function PawIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.paw, props);
}
export function SleepingBunnyIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BITMAPS.bunnySleeping, props);
}

// Overlay-only glyph: just the two eye pixels from the bunny bitmap, meant to
// be stacked on top of BunnyIcon/KawaiiBunnyIcon in a heart color so it works
// as a "heart eyes" reaction regardless of which skin is currently showing.
const BUNNY_HEART_EYES: Bitmap = [
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "00100100",
  "00000000",
  "00000000",
];
export function BunnyHeartEyesIcon(props: SVGProps<SVGSVGElement>) {
  return pixelGlyph(BUNNY_HEART_EYES, props);
}

export type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

// Mirrors public/mockups/theme-system.html's iconPacks list. "classic" has no
// entry here — callers fall back to each tab's own functional icon.
export const KAWAII_ICON_PACKS: Partial<Record<IconPackKey, IconComponent[]>> = {
  bunny: [BunnyIcon, CatIcon, KawaiiHeartIcon],
  sparkle: [StarIcon, SparkleIcon, MoonIcon],
  snacks: [OnigiriIcon, DonutIcon, BobaIcon],
};
