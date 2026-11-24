import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'

const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement.jsx'))
const ExitManagement = lazy(() => import('./pages/ExitManagement.jsx'))
const ModulePlaceholder = lazy(() => import('./pages/ModulePlaceholder.jsx'))
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
          <Route path="attendance" element={<ModulePlaceholder title="Attendance" />} />
          <Route path="leave" element={<ModulePlaceholder title="Leave management" />} />
          <Route path="onboarding" element={<ModulePlaceholder title="Onboarding" />} />
          <Route path="performance" element={<ModulePlaceholder title="Performance" />} />
          <Route path="feedback" element={<ModulePlaceholder title="Feedback" />} />
          <Route path="grievances" element={<ModulePlaceholder title="Grievance management" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
}
