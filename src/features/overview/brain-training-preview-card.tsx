import { useState } from "react";
import { Link } from "react-router-dom";
import { loadLearningState } from "@/lib/learning/learning-storage";
import { accuracyPercent } from "@/lib/learning/learning-types";
import { GAME_META } from "@/features/learning/game-meta";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

// Not a single big <Link> like the other preview cards — each game row
// needs its own link straight into that game (via /learning?game=<id>), so
// only the header links to the tab itself. SortableCard's drag activation
// needs real pointer movement to start, so these nested links stay clickable
// without fighting the card's own drag-to-reorder handling.
export default function BrainTrainingPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle }: OverviewPreviewCardProps) {
  const [state] = useState(() => loadLearningState());

  return (
    <div className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme`}>
      <Link to={path} className="flex flex-shrink-0 items-center gap-2 hover:brightness-95">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </Link>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {GAME_META.map((g) => {
          const progress = state.progress[g.id];
          const GameIcon = g.icon;
          return (
            <Link
              key={g.id}
              to={`/learning?game=${g.id}`}
              className="flex items-center gap-2 rounded-theme-sm px-1.5 py-1.5 hover:bg-surface-alt"
            >
              <GameIcon className="h-4 w-4 flex-shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{g.title}</span>
              <span className="flex-shrink-0 text-[0.62rem] text-ink-muted">
                Lv {progress.level} · {accuracyPercent(progress)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
