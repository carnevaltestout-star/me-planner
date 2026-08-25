import { useState } from "react";
import { Link } from "react-router-dom";
import { loadLearningState } from "@/lib/learning/learning-storage";
import { accuracyPercent } from "@/lib/learning/learning-types";
import { GAME_META } from "@/features/learning/game-meta";
import { BrainIcon } from "@/components/tab-icons/tab-icons";
import SectionHeader from "./overview-section-header";

// Read-only progress + a direct "Play" link per game (straight into that
// game via /learning?game=<id>, see learning-page.tsx) — not editable data
// like the other sections, so no local persistence/write path here.
export default function OverviewBrainTrainingList() {
  const [open, setOpen] = useState(true);
  const [state] = useState(() => loadLearningState());

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader icon={<BrainIcon className="h-4 w-4" />} title="Brain & Training" count={GAME_META.length} open={open} onToggle={() => setOpen((o) => !o)} />
      {open && (
        <div className="flex flex-col gap-2">
          {GAME_META.map((g) => {
            const progress = state.progress[g.id];
            const Icon = g.icon;
            return (
              <div key={g.id} className="flex items-center gap-2.5 rounded-theme border border-border bg-surface p-3 shadow-theme">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-theme-sm bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{g.title}</span>
                  <span className="block text-[0.68rem] text-ink-muted">
                    Level {progress.level} · {accuracyPercent(progress)}% accuracy
                  </span>
                </span>
                <Link
                  to={`/learning?game=${g.id}`}
                  className="flex-shrink-0 rounded-theme-sm border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast hover:brightness-105"
                >
                  ▶ Play
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
