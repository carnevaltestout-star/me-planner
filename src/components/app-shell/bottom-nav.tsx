import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { LearnGroupIcon, PlanGroupIcon, ReflectGroupIcon, SettingsIcon } from "@/components/tab-icons/tab-icons";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";
import { isTabEnabled } from "@/lib/theme/theme-types";

// The bar's own height while idle vs. while a group's sub-items sheet is
// open. BOTTOM_NAV_HEIGHT_PX is the bar's original (pre-redesign) height —
// kept as the "expanded" size specifically so opening a group restores the
// bar to exactly the height it always used to be, rather than growing past
// it. Exported for app-shell.tsx's main-content padding math, which sizes
// for the larger of the two so content never sits under the bar in either
// state.
export const BOTTOM_NAV_HEIGHT_PX = 58;
const BOTTOM_NAV_HEIGHT_COLLAPSED_PX = 44;
// How far above the (expanded) bar the sub-items sheet floats.
const SHEET_GAP_PX = 8;
const SHEET_TRANSITION_MS = 260;

interface NavGroup {
  key: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  paths: string[];
  // Where the shared sheet anchors horizontally when this group opens it —
  // "left"/"right" for the two edge groups (a centered sheet there would
  // overflow the screen edge on a phone-width viewport), plain centering
  // for whichever sits in the middle.
  align: "left" | "center" | "right";
}

// Plan/Reflect/Learn each stand in for several real tabs — Overview
// deliberately isn't in any group (desktop/tablet-only for now, per
// explicit decision) rather than guessed into one that might not fit.
// Statistics lives under Learn.
const GROUPS: NavGroup[] = [
  {
    key: "plan",
    label: "Plan",
    icon: PlanGroupIcon,
    align: "left",
    paths: ["/projects", "/finance-overview", "/attachments", "/goals", "/planner"],
  },
  {
    key: "reflect",
    label: "Reflect",
    icon: ReflectGroupIcon,
    align: "center",
    paths: ["/book-reviews", "/principles", "/trackers", "/journal"],
  },
  {
    key: "learn",
    label: "Learn",
    icon: LearnGroupIcon,
    align: "right",
    paths: ["/vocabulary", "/learning", "/statistics"],
  },
];

interface BottomNavProps {
  // Sits directly above the bunny gimmick's own fixed footer strip when
  // that's showing (see FOOTER_HEIGHT_PX_MOBILE in pet-bunny.tsx) — 0 when
  // it isn't, so the bar just sits flush at the bottom of the screen.
  bottomOffsetPx: number;
  onOpenSettings: () => void;
}

export default function BottomNav({ bottomOffsetPx, onOpenSettings }: BottomNavProps) {
  const location = useLocation();
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  // Keeps rendering the last-open group's items while the sheet slides
  // down, instead of the content vanishing out from under the animation —
  // cleared only once the close transition actually finishes (see the
  // sheet's onTransitionEnd below).
  const [displayedGroupKey, setDisplayedGroupKey] = useState<string | null>(null);

  useEffect(() => {
    if (openGroup) setDisplayedGroupKey(openGroup);
  }, [openGroup]);

  // Closes (and, via the height being derived from openGroup below, shrinks
  // the bar back down) the moment the route changes — covers navigation
  // that doesn't go through a sub-item NavLink's own onClick, e.g. a
  // programmatic redirect.
  useEffect(() => {
    setOpenGroup(null);
  }, [location.pathname]);

  function isPathActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }
  // Tabs turned off in Settings → Activated features drop out of their
  // group's sub-menu entirely — and if that empties a group out completely,
  // the group's own button disappears from the bar too rather than sitting
  // there opening an empty sheet.
  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    paths: g.paths.filter((p) => isTabEnabled(theme.enabledTabs, p)),
  })).filter((g) => g.paths.length > 0);
  const activeGroupKey = visibleGroups.find((g) => g.paths.some(isPathActive))?.key;
  const sheetOpen = openGroup !== null;
  // Only grows to its full (original) height while a group's sheet is
  // open — idle, it sits smaller, so the redesign doesn't just add a
  // permanently taller bar to every screen.
  const barHeight = sheetOpen ? BOTTOM_NAV_HEIGHT_PX : BOTTOM_NAV_HEIGHT_COLLAPSED_PX;
  const displayedGroup = visibleGroups.find((g) => g.key === displayedGroupKey) ?? null;

  return (
    <>
      {sheetOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpenGroup(null)} aria-hidden="true" />}
      {/* One shared sheet (not a per-group popover) so it fades in above
          the bar itself regardless of which group triggered it, and fades
          back out — rather than each group's items instantly appearing
          pinned to that one icon. */}
      <div
        role="menu"
        aria-hidden={!sheetOpen}
        className={`fixed inset-x-3 z-40 flex max-w-[calc(100vw-24px)] flex-col gap-1.5 rounded-theme border border-border/40 bg-surface/55 p-1.5 shadow-lg backdrop-blur-xl transition-opacity ease-out md:hidden ${
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } ${displayedGroup?.align === "right" ? "ml-auto w-48" : displayedGroup?.align === "left" ? "mr-auto w-48" : "mx-auto w-48"}`}
        style={{
          bottom: `calc(${bottomOffsetPx + BOTTOM_NAV_HEIGHT_PX + SHEET_GAP_PX}px + env(safe-area-inset-bottom))`,
          transitionDuration: `${SHEET_TRANSITION_MS}ms`,
        }}
        onTransitionEnd={() => {
          if (!sheetOpen) setDisplayedGroupKey(null);
        }}
      >
        {displayedGroup?.paths.map((path) => {
          const item = navItems.find((n) => n.path === path);
          if (!item) return null;
          const DisplayIcon = pixelated ? RETRO_NAV_ICONS[path] ?? item.icon : item.icon;
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpenGroup(null)}
              role="menuitem"
              className={({ isActive: linkActive }) =>
                // Each row keeps its own translucent "chip" behind the
                // label at all times (not just on hover/active) — the
                // menu's own backdrop is see-through now, so a label
                // sitting on nothing but blur would have unpredictable
                // contrast depending on whatever's behind the app at
                // that moment. The chip guarantees a consistent,
                // theme-matched surface for the text regardless.
                // subitem-frame (see index.css) draws a thick chunky
                // monitor-bezel border + inset inner edge directly on this
                // same element rather than an extra wrapper — deliberately
                // replaces rounded-theme-sm's own radius (its rule comes
                // later in the stylesheet and wins the tie) so the frame
                // stays chunky-rounded even under retro, which would
                // otherwise force sharp 0px corners here.
                `subitem-frame flex items-center gap-2.5 px-2.5 py-2 text-sm backdrop-blur-sm ${
                  linkActive ? "subitem-frame-on" : "subitem-frame-off"
                } ${
                  linkActive
                    ? "bg-accent-soft font-semibold text-accent"
                    : "bg-surface/45 text-ink hover:bg-surface/80"
                }`
              }
            >
              <DisplayIcon
                className={`h-[18px] w-[18px] flex-shrink-0 ${theme.kawaii ? "kawaii-icon-sticker" : ""}`}
                style={pixelated ? { imageRendering: "pixelated" } : undefined}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {/* border-t (not a full border) and shadow-theme everywhere except
          retro matches this bar's original look; in retro specifically it
          gets the same treatment journal's cards (and most bordered panels
          app-wide) use — a full border-border ring, so shadow-theme's
          chunky hard-offset pixel shadow (3px 3px 0 var(--color-border) in
          retro) reads as a proper bordered "card" sitting on the screen
          rather than just a top hairline. overflow-hidden was dropped
          entirely (not just for retro) since it was clipping that same
          shadow on every theme that has one (retro and kawaii both do) —
          button content never actually overflows the collapsed height, so
          nothing relied on the clipping. */}
      <nav
        aria-label="Tabs"
        className={`fixed inset-x-0 z-30 flex bg-sidenav shadow-theme transition-[height] ease-out md:hidden ${
          theme.retro ? "border border-border" : "border-t border-border"
        }`}
        style={{
          // + env(safe-area-inset-bottom) so the bar floats clear of
          // Android's gesture-navigation strip instead of sitting flush
          // against (and getting swallowed by) it — 0 on devices without
          // one, so this is a no-op there.
          bottom: `calc(${bottomOffsetPx}px + env(safe-area-inset-bottom))`,
          height: barHeight,
          transitionDuration: `${SHEET_TRANSITION_MS}ms`,
        }}
        data-theme-surface="chrome"
      >
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const isActive = activeGroupKey === group.key;
          const isOpen = openGroup === group.key;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setOpenGroup((g) => (g === group.key ? null : group.key))}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              aria-label={group.label}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-semibold"
            >
              <GroupIcon className={`h-5 w-5 ${isActive ? "text-accent" : "text-ink-muted"}`} />
              {/* Always this fixed dark grey, on purpose — unlike the icon
                  above, the label never switches to the accent color even
                  when its group is active, per explicit instruction. */}
              <span className="text-[#4b5563]">{group.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setOpenGroup(null);
            onOpenSettings();
          }}
          aria-label="Settings and theme"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-semibold text-ink-muted"
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="text-[#4b5563]">Settings</span>
        </button>
      </nav>
    </>
  );
}
