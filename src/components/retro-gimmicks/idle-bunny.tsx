import { useTheme } from "@/components/theme-provider/theme-context";
import { BunnyIcon, KawaiiBunnyIcon } from "@/components/kawaii-icons/kawaii-icons";

export default function IdleBunny() {
  const theme = useTheme();
  if (!(theme.retro || theme.kawaii || theme.tryout) || !theme.gimmicks.bouncingBuddy) return null;
  const Bunny = theme.kawaii ? KawaiiBunnyIcon : BunnyIcon;

  return (
    <Bunny
      className="gimmick-idle-bob h-4 w-4 flex-shrink-0"
      style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}
