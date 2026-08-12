import { useTheme } from "@/components/theme-provider/theme-context";
import { BunnyIcon } from "@/components/kawaii-icons/kawaii-icons";

export default function IdleBunny() {
  const theme = useTheme();
  if (!theme.retro || !theme.gimmicks.bouncingBuddy) return null;

  return (
    <BunnyIcon
      className="gimmick-idle-bob h-4 w-4 flex-shrink-0"
      style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}
