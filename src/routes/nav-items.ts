import type { ComponentType, SVGProps } from "react";
import {
  AttachmentsIcon,
  BookReviewsIcon,
  FinanceIcon,
  GoalsIcon,
  JournalIcon,
  LearningIcon,
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
// under Journal per explicit request, ahead of its original spec position.
export const navItems: NavItem[] = [
  { path: "/planner", label: "Planner", icon: PlannerIcon },
  { path: "/journal", label: "Journal", icon: JournalIcon },
  { path: "/trackers", label: "Trackers", icon: TrackersIcon },
  { path: "/principles", label: "Principles", icon: PrinciplesIcon },
  { path: "/vocabulary", label: "Vocabulary", icon: VocabularyIcon },
  { path: "/attachments", label: "Attachments", icon: AttachmentsIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/book-reviews", label: "Book Reviews", icon: BookReviewsIcon },
  { path: "/statistics", label: "Statistics", icon: StatisticsIcon },
  { path: "/finance-overview", label: "Finance Overview", icon: FinanceIcon },
  { path: "/learning", label: "Learning", icon: LearningIcon },
];
