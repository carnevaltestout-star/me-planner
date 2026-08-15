import { Link } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";

// Every tab except Overview itself — clicking a card jumps straight to that
// tab. Cards are deliberately content-empty for now (icon + label only); the
// card-preview content (upcoming events, latest entry, etc.) comes once each
// tab has real data behind it to preview.
export default function OverviewPage() {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const cards = navItems.filter((item) => item.path !== "/overview");

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div>
        <h2 className="font-theme text-base font-semibold text-ink">Overview</h2>
        <p className="text-sm text-ink-muted">A quick look at every tab — card previews are coming soon.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ path, label, icon: Icon }) => {
          const DisplayIcon = pixelated ? RETRO_NAV_ICONS[path] ?? Icon : Icon;
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-2.5 rounded-theme border border-accent bg-accent-soft p-6 text-center shadow-theme hover:brightness-95"
            >
              <DisplayIcon
                className={`h-7 w-7 flex-shrink-0 text-accent ${theme.kawaii ? "kawaii-icon-sticker" : ""}`}
                style={pixelated ? { imageRendering: "pixelated" } : undefined}
              />
              <span className="text-sm font-semibold text-accent">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
