import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

interface User {
  id: number
  username: string
  email: string
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/me")
        setUser(response.data)
      } catch (error) {
        console.error("Failed to fetch user", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return (
      <main className="auth-page">
        <div className="loading">
          Loading dashboard...
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="page-container">
        <header className="page-header">
          <div className="page-header-content">
            <h1>Dashboard</h1>
            <p>Your development workspace at a glance.</p>
          </div>

          <button
            className="btn-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <section className="dashboard-welcome card">
          <div className="card-body">
            <div>
              <p className="dashboard-label">
                Welcome back
              </p>

              <h2>
                {user ? user.username : "Developer"} 👋
              </h2>

              {user && (
                <p className="dashboard-email">
                  {user.email}
                </p>
              )}
            </div>

            <div className="avatar avatar-lg">
              {user?.username?.charAt(0).toUpperCase() || "D"}
            </div>
          </div>
        </section>

        <section className="grid grid-4 dashboard-stats">
          <div className="card">
            <div className="card-body">
              <p className="stat-label">Projects</p>
              <h2 className="stat-value">—</h2>
              <p className="stat-description">
                Active projects
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="stat-label">Tasks</p>
              <h2 className="stat-value">—</h2>
              <p className="stat-description">
                Total tasks
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="stat-label">In Progress</p>
              <h2 className="stat-value">—</h2>
              <p className="stat-description">
                Tasks being worked on
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="stat-label">Completed</p>
              <h2 className="stat-value">—</h2>
              <p className="stat-description">
                Finished tasks
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-2 dashboard-content">
          <div className="card">
            <div className="card-header">
              <h3>Projects</h3>
            </div>

            <div className="card-body">
              <p className="text-muted">
                Your projects will appear here.
              </p>

              <button
                onClick={() => navigate("/projects")}
              >
                View Projects
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Tasks</h3>
            </div>

            <div className="card-body">
              <p className="text-muted">
                Manage your tasks and track progress.
              </p>

              <button
                onClick={() => navigate("/tasks")}
              >
                View Tasks
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard