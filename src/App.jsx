import { Navigate, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import AnalyticsDashboard from "./pages/AnalyticsDashboard"
import EmployeeManagement from "./pages/EmployeeManagement"
import RecruitmentManagement from "./pages/RecruitmentManagement"

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<AnalyticsDashboard />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/recruitment" element={<RecruitmentManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
