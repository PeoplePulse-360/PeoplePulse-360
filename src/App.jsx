import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EmployeeManagement from './pages/EmployeeManagement.jsx'
import ExitManagement from './pages/ExitManagement.jsx'
import ModulePlaceholder from './pages/ModulePlaceholder.jsx'
import RecruitmentManagement from './pages/RecruitmentManagement.jsx'
import SimulatorPage from './pages/SimulatorPage.jsx'
import WorkforceInsightPage from './pages/WorkforceInsightPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="recruitment" element={<RecruitmentManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
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
  )
}
