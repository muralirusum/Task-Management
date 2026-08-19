import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import { NotificationProvider } from './context/NotificationContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { DailyWorkPage } from './pages/DailyWorkPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { EmployeeLogsPage } from './pages/EmployeeLogsPage';
import { AttendancePage } from './pages/AttendancePage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs gap-2">
        <span className="animate-spin text-indigo-400 text-lg">⏳</span> Loading workspace session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <NotificationProvider>
            <AttendanceProvider>
              <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Workspace Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="approvals" element={<ApprovalsPage />} />
                  <Route path="daily-work" element={<DailyWorkPage />} />
                  <Route path="time" element={<TimeTrackingPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="team" element={<MyTeamPage />} />
                  <Route path="my-team" element={<MyTeamPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="activity-logs" element={<ActivityHistoryPage />} />
                  <Route path="employee-logs" element={<EmployeeLogsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AttendanceProvider>
          </NotificationProvider>
        </TimerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
