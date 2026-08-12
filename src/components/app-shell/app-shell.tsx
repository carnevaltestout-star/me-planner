import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { MenuIcon, SettingsIcon } from "@/components/tab-icons/tab-icons";
import StarfieldBackground from "@/components/retro-gimmicks/starfield-background";
import PetBunny from "@/components/retro-gimmicks/pet-bunny";
import PawDividerRail from "@/components/retro-gimmicks/paw-divider-rail";
import IdleBunny from "@/components/retro-gimmicks/idle-bunny";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Tabs">
      {navItems.map(({ path, label, icon: Icon }) => {
        const DisplayIcon = theme.retro ? RETRO_NAV_ICONS[path] ?? Icon : Icon;
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
              className="h-[19px] w-[19px] flex-shrink-0"
              style={theme.retro ? { imageRendering: "pixelated" } : undefined}
            />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

// Opens the theme-system mockup for now — there's no in-app settings panel
// yet, only the underlying engine (Context/storage/CSS vars). Bring the real
// panel and this can go away.
function openThemeMockup() {
  window.open("/mockups/theme-system.html", "_blank", "noopener,noreferrer");
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? "";

  return (
    <div className="relative flex h-screen bg-canvas text-ink">
      <StarfieldBackground />
      <PetBunny />
      <div className="relative z-10 flex h-full w-full">
        <aside
          className="hidden w-60 flex-shrink-0 flex-col gap-5 border-r border-border bg-surface p-3 md:flex"
          data-theme-surface="chrome"
        >
          <BrandMark />
          <NavList />
          <button
            type="button"
            onClick={openThemeMockup}
            className="mt-auto flex items-center gap-2 rounded-theme px-2.5 py-2 text-left text-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            <SettingsIcon className="h-[17px] w-[17px]" />
            <span>
              Settings &amp; theme{" "}
              <span className="ml-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                mockup preview
              </span>
            </span>
          </button>
        </aside>

        <PawDividerRail />

        {drawerOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/30 md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-20 flex w-[76%] max-w-[280px] flex-col gap-5 border-r border-border bg-surface p-3 transition-transform duration-200 md:hidden ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <BrandMark />
          <NavList onNavigate={() => setDrawerOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3"
            data-theme-surface="chrome"
          >
            <button
              type="button"
              className="-m-1 p-1 text-ink md:hidden"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon className="h-[19px] w-[19px]" />
            </button>
            <h1 className="flex-1 text-center font-theme text-sm font-semibold text-ink md:text-left">
              {currentLabel}
            </h1>
            <button
              type="button"
              onClick={openThemeMockup}
              className="rounded-theme p-1.5 text-ink-muted hover:bg-surface-alt hover:text-ink"
              aria-label="Settings and theme"
            >
              <SettingsIcon className="h-[19px] w-[19px]" />
            </button>
          </div>
          <main className="flex-1 overflow-y-auto bg-canvas" data-theme-surface="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
