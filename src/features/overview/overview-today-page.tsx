import { useMemo, useState } from "react";
import { dateKey } from "@/lib/trackers/tracker-dates";
import OverviewDateStrip from "./overview-date-strip";
import OverviewTodoList from "./overview-todo-list";
import OverviewHabitList from "./overview-habit-list";
import OverviewCalendarList from "./overview-calendar-list";
import OverviewJournalPreview from "./overview-journal-preview";
import OverviewBrainTrainingList from "./overview-brain-training-list";

// The app's default landing tab — a compact, mobile-first daily agenda: a
// 7-day strip to pick which day to look at, then expandable sections for
// that day's to-dos/goals, habits, calendar, and journal. Distinct from the
// "Dashboard" tab (the card-grid overview of every tab), which is what this
// page used to be before the rename.
export default function OverviewTodayPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(() => dateKey(today));

  // No overflow/height of its own — AppShell's <main> is the scroll owner
  // (see app-shell.tsx), and it spans the full content width. Giving this
  // div its own overflow-y-auto + h-full alongside mx-auto/max-w-2xl left
  // dead zones beside the centered column on wide screens: <main> had
  // nothing left to scroll (its one child fit it exactly) but wasn't as
  // wide as the column, so hovering the margin didn't scroll anything.
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-3 md:p-5">
      <OverviewDateStrip today={today} selectedKey={selectedDateKey} onSelect={setSelectedDateKey} />
      <div className="flex flex-col gap-4 pb-2">
        <OverviewTodoList selectedDateKey={selectedDateKey} />
        <OverviewHabitList selectedDateKey={selectedDateKey} />
        <OverviewCalendarList selectedDateKey={selectedDateKey} />
        <OverviewJournalPreview selectedDateKey={selectedDateKey} />
        <OverviewBrainTrainingList />
      </div>
    </div>
  );
}
