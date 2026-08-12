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

export type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

// Mirrors public/mockups/theme-system.html's iconPacks list. "classic" has no
// entry here — callers fall back to each tab's own functional icon.
export const KAWAII_ICON_PACKS: Partial<Record<IconPackKey, IconComponent[]>> = {
  bunny: [BunnyIcon, CatIcon, KawaiiHeartIcon],
  sparkle: [StarIcon, SparkleIcon, MoonIcon],
  snacks: [OnigiriIcon, DonutIcon, BobaIcon],
};
