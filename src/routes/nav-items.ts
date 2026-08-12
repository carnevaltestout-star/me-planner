import type { ComponentType, SVGProps } from "react";
import {
  AttachmentsIcon,
  BookReviewsIcon,
  DiaryIcon,
  FinanceIcon,
  GoalsIcon,
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
// independent of the order tabs are actually built in.
export const navItems: NavItem[] = [
  { path: "/planner", label: "Planner", icon: PlannerIcon },
  { path: "/diary", label: "Diary", icon: DiaryIcon },
  { path: "/principles", label: "Principles", icon: PrinciplesIcon },
  { path: "/vocabulary", label: "Vocabulary", icon: VocabularyIcon },
  { path: "/attachments", label: "Attachments", icon: AttachmentsIcon },
  { path: "/trackers", label: "Trackers", icon: TrackersIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/book-reviews", label: "Book Reviews", icon: BookReviewsIcon },
  { path: "/statistics", label: "Statistics", icon: StatisticsIcon },
  { path: "/finance-overview", label: "Finance Overview", icon: FinanceIcon },
];
