import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/app-shell/app-shell";
import OverviewTodayPage from "@/features/overview/overview-today-page";
import DashboardPage from "@/features/overview/overview-page";
import PlannerPage from "@/features/planner/planner-page";
import JournalPage from "@/features/journal/journal-page";
import PrinciplesPage from "@/features/principles/principles-page";
import VocabularyPage from "@/features/vocabulary/vocabulary-page";
import AttachmentsPage from "@/features/attachments/attachments-page";
import TrackersPage from "@/features/trackers/trackers-page";
import GoalsPage from "@/features/goals/goals-page";
import BookReviewsPage from "@/features/book-reviews/book-reviews-page";
import BookReviewDetailPage from "@/features/book-reviews/book-review-detail-page";
import StatisticsPage from "@/features/statistics/statistics-page";
import FinanceOverviewPage from "@/features/finance-overview/finance-overview-page";
import LearningPage from "@/features/learning/learning-page";

// HashRouter: Tauri serves the production bundle without a server that can
// rewrite deep links, so path-based routing would 404 on refresh.
export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewTodayPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/principles" element={<PrinciplesPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/attachments" element={<AttachmentsPage />} />
          <Route path="/trackers" element={<TrackersPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/book-reviews" element={<BookReviewsPage />} />
          <Route path="/book-reviews/:bookId" element={<BookReviewDetailPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/finance-overview" element={<FinanceOverviewPage />} />
          <Route path="/learning" element={<LearningPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
