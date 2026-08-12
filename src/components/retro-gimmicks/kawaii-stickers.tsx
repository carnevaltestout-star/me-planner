import { useTheme } from "@/components/theme-provider/theme-context";

const STICKERS: { emoji: string; style: React.CSSProperties; delay: string }[] = [
  { emoji: "⭐", style: { top: "6%", left: "5%" }, delay: "0s" },
  { emoji: "🌙", style: { top: "10%", right: "7%" }, delay: "0.6s" },
  { emoji: "✨", style: { bottom: "10%", left: "8%" }, delay: "1.1s" },
  { emoji: "☁️", style: { bottom: "16%", right: "10%" }, delay: "1.7s" },
  { emoji: "✨", style: { top: "42%", left: "2%" }, delay: "2.2s" },
];

// Floating stickers scattered over the app background — only shown in Super
// Kawaii Mode, mirrors public/mockups/theme-system.html's .kawaii-stickers.
export default function KawaiiStickers() {
  const theme = useTheme();
  if (!theme.kawaii) return null;

  return (
    <div className="kawaii-stickers pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {STICKERS.map(({ emoji, style, delay }, i) => (
        <span key={i} style={{ ...style, animationDelay: delay }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
