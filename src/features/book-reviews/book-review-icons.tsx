import type { SVGProps } from "react";
import { pixelGlyph } from "@/components/kawaii-icons/kawaii-icons";
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

function CoverGlyphLine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 6.2c-1.7-1.3-4-1.9-6.2-1.6-.7.1-1.3.7-1.3 1.4v11.6c0 .9.8 1.5 1.6 1.4 2-.3 4.2.2 5.9 1.5 1.7-1.3 3.9-1.8 5.9-1.5.9.1 1.6-.5 1.6-1.4V6c0-.7-.5-1.3-1.3-1.4-2.2-.3-4.5.3-6.2 1.6Z" />
      <line x1="12" y1="6.2" x2="12" y2="19" />
    </svg>
  );
}

// A wide two-column gutter (unlike the hairline-spine Trackers book icon)
// reads clearly as an open book even at the larger size this cover glyph
// renders at.
const COVER_GLYPH_BITMAP = [
  "00000000",
  "11100111",
  "11100111",
  "11100111",
  "11100111",
  "11100111",
  "11100111",
  "00000000",
];

// Placeholder glyph shown centered inside every book cover box until real
// cover art exists — same book silhouette as the Trackers "book" icon,
// duplicated here rather than imported so this feature stays self-contained
// (matches the per-feature icon isolation used by Trackers/Journal).
export function CoverGlyphIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyph(COVER_GLYPH_BITMAP, { ...props, style: { imageRendering: "pixelated", ...props.style } });
  }
  return <CoverGlyphLine {...props} />;
}

const STAR_PATH = "M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.7l-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.7Z";

const STAR_BITMAP = ["00011000", "00011000", "00111100", "11111111", "01111110", "00111100", "01100110", "11000011"];

interface StarIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

// Outline in normal mode when empty, solid fill in accent color when the
// rating reaches this star; pixel mode is always a solid bitmap and relies
// on the caller's color (via className/style) to tell filled from empty.
export function StarIcon({ filled, ...props }: StarIconProps) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyph(STAR_BITMAP, { ...props, fill: "currentColor", style: { imageRendering: "pixelated", ...props.style } });
  }
  return (
    <svg {...baseProps({ strokeWidth: 1.4, fill: filled ? "currentColor" : "none", ...props })}>
      <path d={STAR_PATH} />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.3" y1="15.3" x2="20" y2="20" />
    </svg>
  );
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
