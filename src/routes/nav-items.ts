import type { ComponentType, SVGProps } from "react";
import {
  AttachmentsIcon,
  BookReviewsIcon,
  BrainIcon,
  FinanceIcon,
  GoalsIcon,
  HomeIcon,
  JournalIcon,
  PlannerIcon,
  PrinciplesIcon,
  ProjectsIcon,
  StatisticsIcon,
  TrackersIcon,
  VocabularyIcon,
} from "@/components/tab-icons/tab-icons";

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Order matches the spec's tab order, independent of the order tabs are
// actually built in. Trackers sits right under Journal per explicit
// request, ahead of its original spec position; Statistics now sits right
// under Trackers for the same reason. Overview (the daily agenda — todos,
// habits, calendar, journal at a glance) is the very first tab and the
// app's default landing page. Principles/Routines sits right under
// Goals/To-Dos per explicit request, ahead of its original spec position.
export const navItems: NavItem[] = [
  { path: "/overview", label: "Overview", icon: HomeIcon },
  { path: "/planner", label: "Calendar", icon: PlannerIcon },
  { path: "/goals", label: "Goals / To-Dos", icon: GoalsIcon },
  { path: "/principles", label: "Principles / Routines", icon: PrinciplesIcon },
  { path: "/journal", label: "Journal", icon: JournalIcon },
  { path: "/trackers", label: "Energy & Habit Tracker", icon: TrackersIcon },
  { path: "/statistics", label: "Statistics", icon: StatisticsIcon },
  { path: "/vocabulary", label: "Vocabulary Training", icon: VocabularyIcon },
  { path: "/attachments", label: "Attachments", icon: AttachmentsIcon },
  { path: "/book-reviews", label: "Book Reviews", icon: BookReviewsIcon },
  { path: "/finance-overview", label: "Finance Overview", icon: FinanceIcon },
  { path: "/learning", label: "Brain & Training", icon: BrainIcon },
  { path: "/projects", label: "Projects", icon: ProjectsIcon },
];
