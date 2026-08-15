import type { SVGProps } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { MOOD_OPTIONS, type MoodKey, type TrackerIconKey } from "@/lib/trackers/tracker-types";
import { TRACKER_LINE_ICONS } from "./tracker-line-icons";
import { moodPixelIcon, TRACKER_PIXEL_ICONS } from "./tracker-pixel-icons";

interface TrackerIconProps extends SVGProps<SVGSVGElement> {
  icon: TrackerIconKey;
}

// Picks the line-art or pixel variant based on the active skin — every
// tracker row/picker renders through this instead of choosing directly.
export default function TrackerIcon({ icon, style, ...props }: TrackerIconProps) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const Icon = pixelated ? TRACKER_PIXEL_ICONS[icon] : TRACKER_LINE_ICONS[icon];
  return <Icon {...props} style={pixelated ? { imageRendering: "pixelated", ...style } : style} />;
}

interface MoodIconProps extends SVGProps<SVGSVGElement> {
  mood: MoodKey;
}

// Normal mode shows the plain emoji (no SVG needed); retro/kawaii swap in
// the custom pixel face set.
export function MoodIcon({ mood, style, className, ...props }: MoodIconProps) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  if (pixelated) {
    return moodPixelIcon(mood, { ...props, className, style: { imageRendering: "pixelated", ...style } });
  }
  const option = MOOD_OPTIONS.find((m) => m.key === mood);
  return (
    <span className={className} style={style} aria-hidden="true">
      {option?.emoji}
    </span>
  );
}
