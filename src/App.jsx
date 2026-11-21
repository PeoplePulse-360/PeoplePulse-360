import { Navigate, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import AnalyticsDashboard from "./pages/AnalyticsDashboard"
import ExitManagement from "./pages/ExitManagement"
import AuthGate from "./components/AuthGate"

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<AnalyticsDashboard />} />
        <Route path="exit-management" element={<AuthGate><ExitManagement /></AuthGate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}