import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { BOTTOM_NAV_HEIGHT_PX } from "@/components/app-shell/bottom-nav";
import { FOOTER_HEIGHT_PX_MOBILE } from "@/components/retro-gimmicks/pet-bunny";

// How much space BottomNav + PetBunny's mobile footer strip reserve at the
// bottom of the screen — full-screen modal backdrops use this so they stop
// short of that strip instead of dimming/covering BottomNav and the bunny
// while open, mirroring the gap app-shell.tsx already reserves in <main>'s
// own bottom padding. 0 on desktop, where there's no bottom nav to protect.
export function useMobileBottomReserve() {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!isMobile) return 0;
  const bunnyActive = (theme.retro || theme.kawaii || theme.tryout) && theme.gimmicks.bouncingBuddy;
  return BOTTOM_NAV_HEIGHT_PX + (bunnyActive ? FOOTER_HEIGHT_PX_MOBILE : 0);
}
