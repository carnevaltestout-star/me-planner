import { useTheme } from "@/components/theme-provider/theme-context";
import { KawaiiHeartIcon, PawIcon, StarIcon } from "@/components/kawaii-icons/kawaii-icons";

const RAIL_ICONS = [PawIcon, StarIcon, PawIcon, KawaiiHeartIcon];
// Generously overshoots any realistic viewport height; the container clips
// the rest so the pattern always reaches the bottom of the page.
const RAIL_LENGTH = 100;

export default function PawDividerRail() {
  const theme = useTheme();
  if (!theme.retro || !theme.gimmicks.pawDivider) return null;

  return (
    <div
      className="hidden w-[26px] flex-shrink-0 flex-col items-center gap-2 overflow-hidden border-r-2 py-3 md:flex"
      style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
      aria-hidden="true"
    >
      {Array.from({ length: RAIL_LENGTH }, (_, i) => {
        const Icon = RAIL_ICONS[i % RAIL_ICONS.length];
        return (
          <Icon
            key={i}
            className="h-3.5 w-3.5"
            style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
          />
        );
      })}
    </div>
  );
}
