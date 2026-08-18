import { useMemo } from "react";
import { computeGoalsTodosStats } from "@/lib/statistics/goals-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { GoalsIcon } from "@/components/tab-icons/tab-icons";
import { MiniStat, StatCardShell, StatEmpty, rangeNoun, resolveChartType } from "./stat-card-shell";
import { StatDoneUndoneBarChart, StatHistogram, StatPieChart } from "./stat-charts";

interface GoalsTodosStatsCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function GoalsTodosStatsCard({ range, chartType, today }: GoalsTodosStatsCardProps) {
  const stats = useMemo(() => computeGoalsTodosStats(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["pie", "histogram", "bar"]);
  const total = stats.totalGoals + stats.totalTodos;

  return (
    <StatCardShell icon={GoalsIcon} iconPath="/goals" title="Goals / To-Dos">
      {!stats.hasAnyData || total === 0 ? (
        <StatEmpty message="Statistics will appear once you start using Goals / To-Dos." />
      ) : (
        <>
          <p className="m-0">
            <span className="text-2xl font-bold text-ink">{total}</span>{" "}
            <span className="text-xs text-ink-muted">goals & to-dos {rangeNoun(range)}</span>
          </p>
          <div className="h-36">
            {resolved === "bar" ? (
              <StatDoneUndoneBarChart data={stats.perKindBars} />
            ) : resolved === "pie" ? (
              <StatPieChart data={stats.distribution} />
            ) : (
              <StatHistogram data={stats.distribution} />
            )}
          </div>
          <ul className="m-0 flex flex-col gap-1 p-0 text-xs">
            {stats.distribution.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-ink">{s.label}</span>
                <span className="flex-shrink-0 font-semibold" style={{ color: s.color }}>
                  {s.value} · {s.percent}%
                </span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Goals done" value={`${stats.doneGoals}/${stats.totalGoals} · ${stats.goalPercent}%`} />
            <MiniStat label="To-Dos done" value={`${stats.doneTodos}/${stats.totalTodos} · ${stats.todoPercent}%`} />
          </div>
        </>
      )}
    </StatCardShell>
  );
}
