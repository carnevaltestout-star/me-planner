import { useMemo } from "react";
import { Link } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import { useTheme } from "@/components/theme-provider/theme-context";
import PlannerPreviewCard from "./planner-preview-card";
import GoalsTodosPreviewCard from "./goals-todos-preview-card";
import JournalPreviewCard from "./journal-preview-card";
import TrackersPreviewCard from "./trackers-preview-card";
import StatisticsPreviewCard from "./statistics-preview-card";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

// Tabs with a real "today at a glance" preview. Every other tab keeps the
// plain icon+label card below until it has its own data worth previewing.
const PREVIEW_CARDS: Partial<Record<string, (props: OverviewPreviewCardProps) => JSX.Element>> = {
  "/planner": PlannerPreviewCard,
  "/goals": GoalsTodosPreviewCard,
  "/journal": JournalPreviewCard,
  "/trackers": TrackersPreviewCard,
  "/statistics": StatisticsPreviewCard,
};

export default function OverviewPage() {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const today = useMemo(() => new Date(), []);
  const cards = navItems.filter((item) => item.path !== "/overview");

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pt-5 md:p-6 md:pt-7">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ path, label, icon: Icon }) => {
          const DisplayIcon = pixelated ? RETRO_NAV_ICONS[path] ?? Icon : Icon;
          const iconStyle = pixelated ? { imageRendering: "pixelated" as const } : undefined;
          const iconClassName = `h-[18px] w-[18px] flex-shrink-0 text-accent ${theme.kawaii ? "kawaii-icon-sticker" : ""}`;

          const PreviewCard = PREVIEW_CARDS[path];
          if (PreviewCard) {
            return (
              <PreviewCard
                key={path}
                path={path}
                label={label}
                icon={DisplayIcon}
                iconClassName={iconClassName}
                iconStyle={iconStyle}
                today={today}
              />
            );
          }

          return (
            <Link
              key={path}
              to={path}
              className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col items-center justify-center gap-2.5 rounded-theme border border-accent bg-surface p-6 text-center shadow-theme hover:brightness-95`}
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
