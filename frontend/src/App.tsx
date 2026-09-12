import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import Tasks from "./pages/Tasks"
import ProtectedRoute from "./components/ProtectedRoute"
import DashboardLayout from "./layouts/DashboardLayout"
import Notifications from "./pages/Notifications"
import Profile from "./pages/Profile"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId/tasks" element={<Tasks />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App