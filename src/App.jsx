import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'

const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard.jsx'))
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement.jsx'))
const ExitManagement = lazy(() => import('./pages/ExitManagement.jsx'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'))
const GrievancesPage = lazy(() => import('./pages/GrievancesPage.jsx'))
const LeaveManagement = lazy(() => import('./pages/LeaveManagement.jsx'))
const OnboardingManagement = lazy(() => import('./pages/OnboardingManagement.jsx'))
const PerformancePage = lazy(() => import('./pages/PerformancePage.jsx'))
const RecruitmentManagement = lazy(() => import('./pages/RecruitmentManagement.jsx'))
const SimulatorPage = lazy(() => import('./pages/SimulatorPage.jsx'))
const WorkforceInsightPage = lazy(() => import('./pages/WorkforceInsightPage.jsx'))

export default function App() {
  return <Suspense fallback={<p className="muted">Loading section…</p>}>
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="recruitment" element={<RecruitmentManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="analytics/people" element={<AnalyticsDashboard section="people" />} />
          <Route path="exits" element={<ExitManagement />} />
          <Route path="ai/journey" element={<WorkforceInsightPage feature="journey" />} />
          <Route path="ai/workload" element={<WorkforceInsightPage feature="workload" />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="onboarding" element={<OnboardingManagement />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="grievances" element={<GrievancesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
}