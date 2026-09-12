import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

interface User {
  id: number
  username: string
  email: string
}

interface DashboardStats {
  total_projects: number
  total_tasks: number
  todo_tasks: number
  in_progress_tasks: number
  done_tasks: number
  low_priority_tasks: number
  medium_priority_tasks: number
  high_priority_tasks: number
  unassigned_tasks: number
}

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError("")

        const [userResponse, dashboardResponse] = await Promise.all([
          api.get("/me"),
          api.get("/dashboard"),
        ])

        setUser(userResponse.data)
        setStats(dashboardResponse.data)
      } catch (error: any) {
        console.error("Failed to load dashboard", error)

        if (error.response?.status === 401) {
          localStorage.removeItem("token")
          navigate("/login", { replace: true })
          return
        }

        setError(
          error.response?.data?.detail ||
          "Failed to load dashboard"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [navigate])

  if (loading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading">
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="error-message">
            {error}
          </div>

          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const completionRate =
    stats && stats.total_tasks > 0
      ? Math.round(
          (stats.done_tasks / stats.total_tasks) * 100
        )
      : 0

  return (
    <div className="page">
      <div className="page-container">

        <header className="page-header">
          <div className="page-header-content">
            <h1>Dashboard</h1>
            <p>
              Your development workspace at a glance.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate("/projects")}
          >
            + New Project
          </button>
        </header>

        <section className="dashboard-welcome card">
          <div className="card-body">
            <div>
              <p className="dashboard-label">
                Welcome back
              </p>

              <h2>
                {user?.username || "Developer"} 👋
              </h2>

              <p className="dashboard-email">
                {user?.email}
              </p>
            </div>

            <div className="avatar avatar-lg">
              {user?.username?.charAt(0).toUpperCase() || "D"}
            </div>
          </div>
        </section>

        <section className="grid grid-4 dashboard-stats">

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-top">
                <span className="stat-icon">
                  ▣
                </span>

                <span className="stat-label">
                  Projects
                </span>
              </div>

              <h2 className="stat-value">
                {stats?.total_projects ?? 0}
              </h2>

              <p className="stat-description">
                Total projects
              </p>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-top">
                <span className="stat-icon">
                  ✓
                </span>

                <span className="stat-label">
                  Tasks
                </span>
              </div>

              <h2 className="stat-value">
                {stats?.total_tasks ?? 0}
              </h2>

              <p className="stat-description">
                Across all projects
              </p>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-top">
                <span className="stat-icon">
                  ◷
                </span>

                <span className="stat-label">
                  In Progress
                </span>
              </div>

              <h2 className="stat-value">
                {stats?.in_progress_tasks ?? 0}
              </h2>

              <p className="stat-description">
                Currently being worked on
              </p>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-top">
                <span className="stat-icon">
                  ✓
                </span>

                <span className="stat-label">
                  Completed
                </span>
              </div>

              <h2 className="stat-value">
                {stats?.done_tasks ?? 0}
              </h2>

              <p className="stat-description">
                {completionRate}% completion rate
              </p>
            </div>
          </div>

        </section>

        <section className="grid grid-2 dashboard-main-grid">

          <div className="card">
            <div className="card-header">
              <div>
                <h3>Task Progress</h3>
                <p className="text-muted">
                  Current task distribution
                </p>
              </div>
            </div>

            <div className="card-body">

              <div className="progress-row">
                <div className="progress-label">
                  <span>To Do</span>
                  <strong>
                    {stats?.todo_tasks ?? 0}
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar progress-todo"
                    style={{
                      width: `${
                        stats && stats.total_tasks > 0
                          ? (stats.todo_tasks /
                              stats.total_tasks) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="progress-row">
                <div className="progress-label">
                  <span>In Progress</span>
                  <strong>
                    {stats?.in_progress_tasks ?? 0}
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar progress-in-progress"
                    style={{
                      width: `${
                        stats && stats.total_tasks > 0
                          ? (stats.in_progress_tasks /
                              stats.total_tasks) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="progress-row">
                <div className="progress-label">
                  <span>Completed</span>
                  <strong>
                    {stats?.done_tasks ?? 0}
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar progress-done"
                    style={{
                      width: `${
                        stats && stats.total_tasks > 0
                          ? (stats.done_tasks /
                              stats.total_tasks) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3>Priority Overview</h3>
                <p className="text-muted">
                  Tasks by priority
                </p>
              </div>
            </div>

            <div className="card-body priority-overview">

              <div className="priority-item">
                <div className="priority-info">
                  <span className="priority-dot priority-low" />
                  <span>Low</span>
                </div>

                <strong>
                  {stats?.low_priority_tasks ?? 0}
                </strong>
              </div>

              <div className="priority-item">
                <div className="priority-info">
                  <span className="priority-dot priority-medium" />
                  <span>Medium</span>
                </div>

                <strong>
                  {stats?.medium_priority_tasks ?? 0}
                </strong>
              </div>

              <div className="priority-item">
                <div className="priority-info">
                  <span className="priority-dot priority-high" />
                  <span>High</span>
                </div>

                <strong>
                  {stats?.high_priority_tasks ?? 0}
                </strong>
              </div>

              <div className="priority-item">
                <div className="priority-info">
                  <span className="priority-dot priority-unassigned" />
                  <span>Unassigned</span>
                </div>

                <strong>
                  {stats?.unassigned_tasks ?? 0}
                </strong>
              </div>

            </div>
          </div>

        </section>

        <section className="grid grid-2 dashboard-actions">

          <div className="dashboard-action-card card">
            <div className="card-body">
              <div className="action-content">
                <span className="action-icon">
                  ▣
                </span>

                <div>
                  <h3>Manage Projects</h3>
                  <p>
                    Create projects, organize your work,
                    and track project progress.
                  </p>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => navigate("/projects")}
              >
                View Projects
              </button>
            </div>
          </div>

          <div className="dashboard-action-card card">
            <div className="card-body">
              <div className="action-content">
                <span className="action-icon">
                  ✓
                </span>

                <div>
                  <h3>Manage Tasks</h3>
                  <p>
                    View, filter, assign, and update your
                    development tasks.
                  </p>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => navigate("/tasks")}
              >
                View Tasks
              </button>
            </div>
          </div>

        </section>

      </div>
    </div>
  )
}

export default Dashboard