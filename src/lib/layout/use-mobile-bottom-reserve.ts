import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { BOTTOM_NAV_HEIGHT_PX } from "@/components/app-shell/bottom-nav";
import { FOOTER_HEIGHT_PX_MOBILE } from "@/components/retro-gimmicks/pet-bunny";

// How much space BottomNav + PetBunny's mobile footer strip reserve at the
// bottom of the screen — full-screen modal backdrops use this so they stop
// short of that strip instead of dimming/covering BottomNav and the bunny
// while open, mirroring the gap app-shell.tsx already reserves in <main>'s
// own bottom padding. 0 on desktop, where there's no bottom nav to protect.
//
// Returns a CSS length string (not a bare number) — BottomNav itself floats
// clear of an Android gesture bar/home indicator by adding
// env(safe-area-inset-bottom) on top of its own height, so anything using
// this reserve to stop short of BottomNav needs that same inset added, or
// it under-reserves by exactly that amount and ends up overlapping the bar
// on any phone that has one.
export function useMobileBottomReserve(): string {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!isMobile) return "0px";
  const bunnyActive = (theme.retro || theme.kawaii || theme.tryout) && theme.gimmicks.bouncingBuddy;
  const heightPx = BOTTOM_NAV_HEIGHT_PX + (bunnyActive ? FOOTER_HEIGHT_PX_MOBILE : 0);
  return `calc(${heightPx}px + env(safe-area-inset-bottom))`;
}
