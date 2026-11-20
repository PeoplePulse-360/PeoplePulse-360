import { Navigate, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import AnalyticsDashboard from "./pages/AnalyticsDashboard"

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<AnalyticsDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
