import { useTheme } from "@/components/theme-provider/theme-context";

const STICKERS: { emoji: string; style: React.CSSProperties; delay: string }[] = [
  { emoji: "⭐", style: { top: "8%", left: "6%" }, delay: "0s" },
  { emoji: "🌙", style: { top: "38%", right: "6%" }, delay: "0.6s" },
  { emoji: "☁️", style: { bottom: "12%", left: "10%" }, delay: "1.1s" },
  { emoji: "⭐", style: { bottom: "22%", right: "12%" }, delay: "1.7s" },
  { emoji: "☁️", style: { top: "14%", right: "30%" }, delay: "2.2s" },
];

// Floating stickers scattered over the app background — only shown in
// Tryout Mode. Reuses the same .kawaii-stickers float animation as Super
// Kawaii Mode's own stickers (generic drift/rotate, not kawaii-specific).
export default function TryoutStickers() {
  const theme = useTheme();
  if (!theme.tryout) return null;

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
