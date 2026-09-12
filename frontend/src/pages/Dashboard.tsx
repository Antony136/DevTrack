import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Icon, { type IconName } from "../components/Icon"
import api from "../services/api"
import { type DashboardStats } from "../types/dashboard"
import { type User } from "../types/user"
import { getErrorMessage, isUnauthorized } from "../utils/errors"
import { initialsFromName } from "../utils/format"

interface StatCard {
  label: string
  value: number
  description: string
  icon: IconName
}

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [userResponse, dashboardResponse] = await Promise.all([
        api.get<User>("/me"),
        api.get<DashboardStats>("/dashboard"),
      ])

      setUser(userResponse.data)
      setStats(dashboardResponse.data)
    } catch (error) {
      if (isUnauthorized(error)) {
        navigate("/login", { replace: true })
        return
      }

      setError(getErrorMessage(error, "Failed to load dashboard."))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const totalTasks = stats?.total_tasks ?? 0
  const completionRate =
    stats && totalTasks > 0
      ? Math.round((stats.done_tasks / totalTasks) * 100)
      : 0

  const statCards: StatCard[] = [
    {
      label: "Projects",
      value: stats?.total_projects ?? 0,
      description: "Active workspaces",
      icon: "folder",
    },
    {
      label: "Tasks",
      value: totalTasks,
      description: "Across owned projects",
      icon: "tasks",
    },
    {
      label: "In Progress",
      value: stats?.in_progress_tasks ?? 0,
      description: "Currently moving",
      icon: "refresh",
    },
    {
      label: "Completed",
      value: stats?.done_tasks ?? 0,
      description: `${completionRate}% completion rate`,
      icon: "check",
    },
  ]

  const progressRows = [
    {
      label: "To Do",
      value: stats?.todo_tasks ?? 0,
      className: "progress-todo",
    },
    {
      label: "In Progress",
      value: stats?.in_progress_tasks ?? 0,
      className: "progress-in-progress",
    },
    {
      label: "Done",
      value: stats?.done_tasks ?? 0,
      className: "progress-done",
    },
  ]

  const priorityRows = [
    { label: "Low", value: stats?.low_priority_tasks ?? 0, tone: "low" },
    {
      label: "Medium",
      value: stats?.medium_priority_tasks ?? 0,
      tone: "medium",
    },
    { label: "High", value: stats?.high_priority_tasks ?? 0, tone: "high" },
    {
      label: "Unassigned",
      value: stats?.unassigned_tasks ?? 0,
      tone: "unassigned",
    },
  ]

  return (
    <div className="page">
      <div className="page-container">
        <header className="page-header">
          <div className="page-header-content">
            <p className="eyebrow">Overview</p>
            <h1>Dashboard</h1>
            <p>Your development workspace at a glance.</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate("/projects")}
            type="button"
          >
            <Icon name="plus" />
            New Project
          </button>
        </header>

        {error && (
          <div className="state-panel error-panel">
            <div>
              <h3>Dashboard could not load</h3>
              <p>{error}</p>
            </div>
            <button className="btn-secondary" onClick={fetchDashboard}>
              <Icon name="refresh" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-skeleton">
            <div className="skeleton skeleton-hero" />
            <div className="grid grid-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="skeleton skeleton-card" key={index} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <section className="dashboard-welcome">
              <div>
                <p className="dashboard-label">Welcome back</p>
                <h2>{user?.username || "Developer"}</h2>
                <p className="dashboard-email">{user?.email}</p>
              </div>

              <div className="dashboard-identity">
                <div className="avatar avatar-lg">
                  {initialsFromName(user?.username)}
                </div>
                <span>Signed in</span>
              </div>
            </section>

            <section className="grid grid-4 dashboard-stats">
              {statCards.map((card) => (
                <article className="stat-card" key={card.label}>
                  <div className="stat-top">
                    <span className="stat-icon">
                      <Icon name={card.icon} />
                    </span>
                    <span className="stat-label">{card.label}</span>
                  </div>

                  <strong className="stat-value">{card.value}</strong>
                  <p className="stat-description">{card.description}</p>
                </article>
              ))}
            </section>

            <section className="grid grid-2 dashboard-main-grid">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Task Progress</h3>
                    <p>Current task distribution</p>
                  </div>
                </div>

                <div className="panel-body">
                  {totalTasks === 0 ? (
                    <div className="compact-empty">
                      <h4>No tasks yet</h4>
                      <p>Create tasks inside a project to see progress.</p>
                    </div>
                  ) : (
                    progressRows.map((row) => (
                      <div className="progress-row" key={row.label}>
                        <div className="progress-label">
                          <span>{row.label}</span>
                          <strong>{row.value}</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className={`progress-bar ${row.className}`}
                            style={{
                              width: `${(row.value / totalTasks) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Priority Overview</h3>
                    <p>Work grouped by urgency</p>
                  </div>
                </div>

                <div className="panel-body priority-overview">
                  {priorityRows.map((row) => (
                    <div className="priority-item" key={row.label}>
                      <div className="priority-info">
                        <span className={`priority-dot priority-${row.tone}`} />
                        <span>{row.label}</span>
                      </div>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid grid-2 dashboard-actions">
              <article className="action-panel">
                <div className="action-content">
                  <span className="action-icon">
                    <Icon name="folder" />
                  </span>

                  <div>
                    <h3>Manage Projects</h3>
                    <p>Create project containers and jump into their tasks.</p>
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate("/projects")}
                  type="button"
                >
                  View Projects
                </button>
              </article>

              <article className="action-panel">
                <div className="action-content">
                  <span className="action-icon">
                    <Icon name="tasks" />
                  </span>

                  <div>
                    <h3>Manage Tasks</h3>
                    <p>Search, filter, assign, and update development work.</p>
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate("/tasks")}
                  type="button"
                >
                  View Tasks
                </button>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
