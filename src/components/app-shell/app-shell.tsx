import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { SettingsIcon } from "@/components/tab-icons/tab-icons";
import StarfieldBackground from "@/components/retro-gimmicks/starfield-background";
import PetBunny from "@/components/retro-gimmicks/pet-bunny";
import PawDividerRail from "@/components/retro-gimmicks/paw-divider-rail";
import IdleBunny from "@/components/retro-gimmicks/idle-bunny";
import KawaiiStickers from "@/components/retro-gimmicks/kawaii-stickers";
import { BunnyIcon, KawaiiBunnyIcon } from "@/components/kawaii-icons/kawaii-icons";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Tabs">
      {navItems.map(({ path, label, icon: Icon }) => {
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

// Mobile nav: a single element that width-animates between a 44px icon-only
// rail and a 176px icon+label panel, instead of two separate elements (an
// always-visible rail plus a conditionally-mounted flyout) — that older
// approach rendered both at once side by side, showing every icon twice.
// Row content never changes between the two states; at 44px there's exactly
// enough room for the icon and nothing else, so the label is clipped away by
// each row's own overflow-hidden rather than being swapped out separately.
// It's `absolute` so growing wider overlays the page instead of pushing it
// — the flex layout only reserves the collapsed 44px via the spacer sibling
// rendered alongside it.
function MobileNav({ open, onToggle, onNavigate }: { open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;

  return (
    <div
      className={`absolute left-0 top-0 z-30 h-full border-r border-border bg-sidenav shadow-theme transition-[width] duration-300 ease-in-out md:hidden ${
        open ? "w-44" : "w-11"
      }`}
      data-theme-surface="chrome"
    >
      {/* overflow-hidden lives on this inner wrapper, not the outer one above
          — the toggle arrow below hangs outside the box via negative
          positioning, and the outer box clipping its own contents would clip
          the arrow along with them. */}
      <nav aria-label="Tabs" className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden py-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const DisplayIcon = pixelated ? RETRO_NAV_ICONS[path] ?? Icon : Icon;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={onNavigate}
                title={label}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 overflow-hidden px-[13px] py-2 text-sm font-theme ${
                    isActive ? "bg-accent-soft font-semibold text-accent" : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                  }`
                }
              >
                <DisplayIcon
                  className={`h-[18px] w-[18px] flex-shrink-0 ${theme.kawaii ? "kawaii-icon-sticker" : ""}`}
                  style={pixelated ? { imageRendering: "pixelated" } : undefined}
                />
                <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">{label}</span>
              </NavLink>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            openThemeMockup();
            onNavigate();
          }}
          title="Settings and theme"
          className="flex items-center gap-2.5 overflow-hidden px-[13px] py-2 text-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
        >
          <SettingsIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">Settings &amp; theme</span>
        </button>
      </nav>

      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Collapse tab names" : "Show tab names"}
        aria-expanded={open}
        className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-theme hover:text-ink"
      >
        <span className={`inline-block text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""}`}>›</span>
      </button>
    </div>
  );
}

// Opens the theme-system mockup for now — there's no in-app settings panel
// yet, only the underlying engine (Context/storage/CSS vars). Bring the real
// panel and this can go away.
function openThemeMockup() {
  window.open("/mockups/theme-system.html", "_blank", "noopener,noreferrer");
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
  const location = useLocation();
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? "";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex h-screen bg-canvas text-ink" data-theme-surface="app-root">
      <StarfieldBackground />
      <KawaiiStickers />
      <PetBunny />
      <div className="relative z-10 flex h-full w-full">
        <aside
          className="hidden w-60 flex-shrink-0 flex-col gap-5 border-r border-border bg-sidenav p-3 md:flex"
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

        {/* Reserves the collapsed rail's 44px in the flex layout — MobileNav
            itself is positioned absolute (relative to the flex row below)
            so expanding it overlays the page instead of reflowing it. */}
        <div className="w-11 flex-shrink-0 md:hidden" aria-hidden="true" />
        <MobileNav
          open={mobileNavOpen}
          onToggle={() => setMobileNavOpen((o) => !o)}
          onNavigate={() => setMobileNavOpen(false)}
        />
        {mobileNavOpen && (
          <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        )}

        <PawDividerRail />

        <div className="flex min-w-0 flex-1 flex-col">
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
              onClick={openThemeMockup}
              className="rounded-theme p-1 text-ink-muted hover:bg-surface-alt hover:text-ink md:p-1.5"
              aria-label="Settings and theme"
            >
              <SettingsIcon className="h-[16px] w-[16px] md:h-[19px] md:w-[19px]" />
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
