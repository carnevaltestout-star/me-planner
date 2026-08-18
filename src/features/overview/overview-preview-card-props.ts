import type { CSSProperties, ComponentType, SVGProps } from "react";

// Every Overview card — preview or plain — shares this exact height so the
// grid reads as uniform tiles; anything that doesn't fit scrolls internally
// instead of stretching its own card taller than its neighbors.
export const OVERVIEW_CARD_HEIGHT_CLASS = "h-72";

// Shared by every tab-specific preview card on the Overview page (Planner,
// Goals/To-Dos, Journal, Trackers, Statistics) — each renders the same
// icon+label header (already theme-resolved by OverviewPage) above its own
// mini "today at a glance" content.
export interface OverviewPreviewCardProps {
  path: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
  iconStyle?: CSSProperties;
  today: Date;
}
