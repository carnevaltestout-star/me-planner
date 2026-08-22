import type { SVGProps } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { pixelGlyph, pixelGlyphLayers } from "@/components/kawaii-icons/kawaii-icons";

// Same bitmaps as public/mockups/journal.html's retro/kawaii icon variants,
// kept in sync so the real component looks identical to the approved mockup.
const BUNNY_MAGNIFIER = ["01000010", "01111110", "11111111", "11111111", "11111111", "01111110", "00000011", "00000001"];
const FLOPPY_BASE = ["11111111", "11111111", "11000011", "11000011", "11111111", "11000011", "11000011", "11111111"];
const FLOPPY_HEART = ["00000000", "00000000", "00000000", "00000000", "00000000", "00100100", "01111110", "00000000"];

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...props}>
      <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
      <line x1="3" y1="8.5" x2="17" y2="8.5" />
      <line x1="6.5" y1="2.5" x2="6.5" y2="6" />
      <line x1="13.5" y1="2.5" x2="13.5" y2="6" />
    </svg>
  );
}

// Three side-by-side columns — "compare days" affordance for the Overview button.
export function ColumnsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...props}>
      <rect x="2.5" y="4" width="4" height="12" rx="1" />
      <rect x="8" y="4" width="4" height="12" rx="1" />
      <rect x="13.5" y="4" width="4" height="12" rx="1" />
    </svg>
  );
}

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

function DefaultSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" {...props}>
      <circle cx="8.3" cy="8.3" r="5.3" />
      <line x1="16" y1="16" x2="12.6" y2="12.6" />
    </svg>
  );
}

function DefaultSaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" {...props}>
      <path d="M4 3.2h9.2L16 6v10.8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1Z" />
      <path d="M6.6 3.2v4.6h5.8V3.2" />
      <rect x="6" y="11" width="7" height="4.5" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) return pixelGlyph(BUNNY_MAGNIFIER, props);
  return <DefaultSearchIcon {...props} />;
}

export function SaveIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.kawaii) {
    return pixelGlyphLayers(
      [
        { grid: FLOPPY_BASE, color: "currentColor" },
        { grid: FLOPPY_HEART, color: "#ff6fa5" },
      ],
      props,
    );
  }
  if (theme.retro) return pixelGlyph(FLOPPY_BASE, props);
  return <DefaultSaveIcon {...props} />;
}
