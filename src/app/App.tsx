import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "../components/ToastProvider";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { GoalsPage } from "../features/goals/GoalsPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { SessionsPage } from "../features/sessions/SessionsPage";
import { SubjectsPage } from "../features/subjects/SubjectsPage";
import { AuthProvider } from "../state/AuthProvider";
import { StudyDataProvider } from "../state/StudyDataProvider";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <StudyDataProvider>
                      <AppLayout />
                    </StudyDataProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/progress" element={<ProgressPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
