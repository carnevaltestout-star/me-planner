import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";

// Recharts sets colors via raw SVG `fill`/`stroke` attributes, which (per
// the pixel-icon layers elsewhere in this app) don't reliably resolve
// var(--color-x) the way a style property does — so charts need the actual
// resolved value. Re-reads whenever the theme context changes (skin/colors
// toggle), since that's when the underlying CSS variable's value changes.
export function useCssVar(name: string, fallback: string): string {
  const theme = useTheme();
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    setValue(resolved || fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, theme]);
  return value;
}
