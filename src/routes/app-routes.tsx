import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/app-shell/app-shell";
import PlannerPage from "@/features/planner/planner-page";
import DiaryPage from "@/features/diary/diary-page";
import PrinciplesPage from "@/features/principles/principles-page";
import VocabularyPage from "@/features/vocabulary/vocabulary-page";
import AttachmentsPage from "@/features/attachments/attachments-page";
import TrackersPage from "@/features/trackers/trackers-page";
import GoalsPage from "@/features/goals/goals-page";
import BookReviewsPage from "@/features/book-reviews/book-reviews-page";

// HashRouter: Tauri serves the production bundle without a server that can
// rewrite deep links, so path-based routing would 404 on refresh.
export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/principles" element={<PrinciplesPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/attachments" element={<AttachmentsPage />} />
          <Route path="/trackers" element={<TrackersPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/book-reviews" element={<BookReviewsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
