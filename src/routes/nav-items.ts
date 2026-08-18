import type { ComponentType, SVGProps } from "react";
import {
  AttachmentsIcon,
  BookReviewsIcon,
  FinanceIcon,
  GoalsIcon,
  JournalIcon,
  LearningIcon,
  OverviewIcon,
  PlannerIcon,
  PrinciplesIcon,
  StatisticsIcon,
  TrackersIcon,
  VocabularyIcon,
} from "@/components/tab-icons/tab-icons";

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Order matches the spec's tab order (Planner is the default/home tab),
// independent of the order tabs are actually built in. Trackers sits right
// under Journal per explicit request, ahead of its original spec position;
// Statistics now sits right under Trackers for the same reason. Overview
// sits above Planner — a future card-grid view of every tab in one place.
export const navItems: NavItem[] = [
  { path: "/overview", label: "Overview", icon: OverviewIcon },
  { path: "/planner", label: "Planner", icon: PlannerIcon },
  { path: "/goals", label: "Goals / To-Dos", icon: GoalsIcon },
  { path: "/journal", label: "Journal", icon: JournalIcon },
  { path: "/trackers", label: "Trackers", icon: TrackersIcon },
  { path: "/statistics", label: "Statistics", icon: StatisticsIcon },
  { path: "/principles", label: "Principles", icon: PrinciplesIcon },
  { path: "/vocabulary", label: "Vocabulary", icon: VocabularyIcon },
  { path: "/attachments", label: "Attachments", icon: AttachmentsIcon },
  { path: "/book-reviews", label: "Book Reviews", icon: BookReviewsIcon },
  { path: "/finance-overview", label: "Finance Overview", icon: FinanceIcon },
  { path: "/learning", label: "Learning", icon: LearningIcon },
];
