import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthPage } from "@/pages/auth-page";
import { LandingPage } from "./pages/landing-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { JobsPage } from "@/pages/jobs-page";
import { JobDetailPage } from "@/pages/job-detail-page";
import { JobTrackerPage } from "@/pages/job-tracker-page";
import { InterviewsPage } from "@/pages/interviews-page";
import { RoadmapDetailPage } from "@/pages/roadmap-detail-page";
import { RoadmapsPage } from "@/pages/roadmaps-page";
import { ResumeEditorPage } from "./pages/resume-editor-page";
import { CoverLetterPage } from "./pages/cover-letter-page";
import { SettingsPage } from "@/pages/settings-page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="tracker" element={<JobTrackerPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="roadmaps" element={<RoadmapsPage />} />
          <Route path="roadmaps/:id" element={<RoadmapDetailPage />} />
          <Route path="documents/resume" element={<ResumeEditorPage />} />
          <Route path="documents/cover-letter" element={<CoverLetterPage />} />
          <Route path="editor" element={<Navigate to="/app/documents/resume" replace />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
