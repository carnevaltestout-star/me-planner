import type { SVGProps } from "react";
import { pixelGlyph, type IconComponent } from "@/components/kawaii-icons/kawaii-icons";

type Bitmap = string[];

// Pixel-art re-draws of each tab's own icon (not the kawaii mascot packs) —
// swapped in for the nav list specifically while Retro Mode is on.
const BITMAPS: Record<string, Bitmap> = {
  overview: ["01110111", "01110111", "01110111", "00000000", "01110111", "01110111", "01110111", "00000000"],
  planner: ["11111111", "10000001", "10101101", "10000001", "10101101", "10000001", "10000001", "11111111"],
  journal: ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00000000"],
  principles: ["00011000", "00111100", "01111110", "11111111", "11111111", "01111110", "00111100", "00011000"],
  vocabulary: ["11111111", "10000001", "10011001", "10011001", "10000001", "10011001", "10000001", "11111111"],
  attachments: ["00111100", "01100110", "01100000", "01100000", "00000110", "00000110", "01100110", "00111100"],
  trackers: ["00000000", "00000000", "00000011", "00000011", "00001111", "00001111", "01111111", "01111111"],
  goals: ["00111100", "01000010", "10011001", "10100101", "10100101", "10011001", "01000010", "00111100"],
  bookReviews: ["11111110", "10000010", "10111010", "10111010", "10111010", "10000010", "10000010", "11111110"],
  statistics: ["00000001", "00000011", "00000110", "00011100", "00110000", "01100000", "11000000", "10000000"],
  finance: ["00111100", "01111110", "11100111", "11000011", "11000011", "11100111", "01111110", "00111100"],
  brainTraining: ["00111100", "01111110", "11111111", "11101111", "11101111", "11111111", "01111110", "00111100"],
};

function icon(key: keyof typeof BITMAPS): IconComponent {
  return (props: SVGProps<SVGSVGElement>) => pixelGlyph(BITMAPS[key], props);
}

// Keyed by nav path (see routes/nav-items.ts) so the sidebar can look each
// one up directly.
export const RETRO_NAV_ICONS: Record<string, IconComponent> = {
  "/overview": icon("overview"),
  "/planner": icon("planner"),
  "/journal": icon("journal"),
  "/principles": icon("principles"),
  "/vocabulary": icon("vocabulary"),
  "/attachments": icon("attachments"),
  "/trackers": icon("trackers"),
  "/goals": icon("goals"),
  "/book-reviews": icon("bookReviews"),
  "/statistics": icon("statistics"),
  "/finance-overview": icon("finance"),
  "/learning": icon("brainTraining"),
};
