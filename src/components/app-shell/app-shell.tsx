import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { SettingsIcon } from "@/components/tab-icons/tab-icons";
import StarfieldBackground from "@/components/retro-gimmicks/starfield-background";
import PetBunny, { FOOTER_HEIGHT_PX_MOBILE } from "@/components/retro-gimmicks/pet-bunny";
import BottomNav, { BOTTOM_NAV_HEIGHT_PX } from "./bottom-nav";
import PawDividerRail from "@/components/retro-gimmicks/paw-divider-rail";
import IdleBunny from "@/components/retro-gimmicks/idle-bunny";
import KawaiiStickers from "@/components/retro-gimmicks/kawaii-stickers";
import TryoutStickers from "@/components/retro-gimmicks/tryout-stickers";
import { BunnyIcon, KawaiiBunnyIcon } from "@/components/kawaii-icons/kawaii-icons";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";
import SettingsDialog from "@/components/settings-dialog/settings-dialog";
import { isTabEnabled } from "@/lib/theme/theme-types";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  // Tabs turned off in Settings → Activated features drop out of the
  // desktop sidebar entirely, same as they drop out of BottomNav's
  // sub-menus on mobile (see bottom-nav.tsx's visibleGroups).
  const visibleNavItems = navItems.filter((item) => isTabEnabled(theme.enabledTabs, item.path));

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Tabs">
      {visibleNavItems.map(({ path, label, icon: Icon }) => {
        const DisplayIcon = pixelated ? RETRO_NAV_ICONS[path] ?? Icon : Icon;
        return (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-theme px-2.5 py-2 text-sm font-theme ${
                isActive
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-ink-muted hover:bg-surface-alt hover:text-ink"
              }`
            }
          >
            <DisplayIcon
              className={`h-[19px] w-[19px] flex-shrink-0 ${theme.kawaii ? "kawaii-icon-sticker" : ""}`}
              style={pixelated ? { imageRendering: "pixelated" } : undefined}
            />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}


// Flanks the topbar's tab name in retro/kawaii mode — unlike IdleBunny this
// isn't gated behind the Bunny Buddy gimmick toggle, same reasoning as the
// settings mockup's always-visible topbar icon: it's part of the skin, not
// an optional flourish.
function TabTitleBunny() {
  const theme = useTheme();
  if (!(theme.retro || theme.kawaii)) return null;
  const Bunny = theme.kawaii ? KawaiiBunnyIcon : BunnyIcon;
  return (
    <Bunny
      className="h-4 w-4 flex-shrink-0"
      style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <span className="font-theme text-base font-bold text-ink">Me</span>
      <span className="text-xs text-ink-muted">planner</span>
      <IdleBunny />
    </div>
  );
}

export default function AppShell() {
  const theme = useTheme();
  const location = useLocation();
  // Matches nested routes too (e.g. /book-reviews/:bookId under /book-reviews)
  // so the topbar title doesn't go blank on a tab's detail/edit sub-pages.
  const currentLabel =
    navItems.find(
      (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
    )?.label ?? "";
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Gimmicks only mean anything under a skin — mirrors the same gate
  // PetBunny and IdleBunny apply to themselves, so the space reserved for
  // PetBunny's mobile footer bar below tracks whether it's actually
  // rendering instead of a stale `bouncingBuddy: true` left over from a
  // previous session with a skin on.
  const bunnyActive = (theme.retro || theme.kawaii || theme.tryout) && theme.gimmicks.bouncingBuddy;

  return (
    <div className="relative flex h-screen bg-canvas text-ink" data-theme-surface="app-root">
      <StarfieldBackground />
      <KawaiiStickers />
      <TryoutStickers />
      <PetBunny />
      <div className="relative z-10 flex h-full w-full">
        <aside
          className="hidden w-60 flex-shrink-0 flex-col gap-5 border-r border-border bg-sidenav p-3 md:flex"
          data-theme-surface="chrome"
        >
          {/* mt-9 shifts the brand mark + first sidenav icon (Settings,
              below) down to start at roughly the height the old second icon
              (the first real tab, below Settings) used to start at — a pure
              reposition, everything else just shifts down to match, nothing
              is resized or removed. */}
          <div className="mt-9">
            <BrandMark />
          </div>
          {/* Settings is a distinct utility item, not another tab — leads
              the list instead of trailing it with no separation, and the
              border-b + pb-3 below gives it its own visual gap from the
              actual tabs. */}
          <div className="flex flex-col gap-0.5 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 rounded-theme px-2.5 py-2 text-left text-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
            >
              <SettingsIcon className="h-[17px] w-[17px]" />
              <span>Settings &amp; theme</span>
            </button>
          </div>
          <NavList />
        </aside>

        {/* Mobile only (md:hidden internally) — a fixed-position bottom bar,
            not part of this flex row's own flow, so it doesn't need a
            spacer sibling the way the old side rail did. */}
        <BottomNav
          bottomOffsetPx={bunnyActive ? FOOTER_HEIGHT_PX_MOBILE : 0}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <PawDividerRail />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-surface px-2.5 py-1.5 md:px-4 md:py-3"
            data-theme-surface="chrome"
          >
            <div className="flex flex-1 items-center justify-center gap-1.5 md:justify-start">
              <TabTitleBunny />
              <h1 className="font-theme text-xs font-semibold text-ink md:text-sm">{currentLabel}</h1>
              <TabTitleBunny />
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-theme p-1 text-ink-muted hover:bg-surface-alt hover:text-ink md:p-1.5"
              aria-label="Settings and theme"
            >
              <SettingsIcon className="h-[16px] w-[16px] md:h-[19px] md:w-[19px]" />
            </button>
          </div>
          {/* Reserves room at the bottom so page content doesn't end up
              underneath fixed overlays. On mobile that's always the
              BottomNav bar now, plus PetBunny's own fixed footer strip (see
              FOOTER_HEIGHT_PX_MOBILE in pet-bunny.tsx) stacked below it when
              that gimmick is showing — hence the CSS-variable-driven
              padding rather than a fixed Tailwind class, since the total
              varies with bunnyActive. On desktop there's no bottom nav at
              all (the sidebar handles navigation there), so it only ever
              needs PetBunny's own floating-corner clearance. */}
          <main
            className={`flex-1 overflow-y-auto bg-canvas pb-[var(--mobile-bottom-pad)] ${bunnyActive ? "md:pb-16" : "md:pb-0"}`}
            style={{ "--mobile-bottom-pad": `${BOTTOM_NAV_HEIGHT_PX + (bunnyActive ? FOOTER_HEIGHT_PX_MOBILE : 0)}px` } as React.CSSProperties}
            data-theme-surface="main"
          >
            <Outlet />
          </main>
        </div>
      </div>
      {/* Rendered at the app-shell root — outside every tab's content and
          outside the retro-gimmick overlays (PetBunny etc.) — instead of
          inside the main content column above. That column has no z-index
          of its own, so anything nested inside it (including this dialog)
          was scoped to the "z-10 flex h-full w-full" wrapper's local
          stacking context and could never out-rank elements rendered
          outside it — most notably PetBunny's fixed sprite/footer bar,
          which sit at document level with their own z-40/z-30 and would
          render on top of the dialog on every tab whenever the Bunny Buddy
          gimmick was on, making it look like the dialog wouldn't open at
          all. Rendering it here as a true viewport-level overlay (see its
          own fixed inset-0 + z-50) makes it reliably win regardless of
          which tab is active or which gimmicks are on. */}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
