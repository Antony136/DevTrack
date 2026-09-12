import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

interface User {
  id: number
  username: string
  email: string
}

function Navbar() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/me")
        setUser(response.data)
      } catch (error) {
        console.error("Failed to fetch user", error)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const initials = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "D"

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Developer Workspace</span>
      </div>

      <div className="topbar-right">
        <button
          className="navbar-icon-button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          title="Notifications"
        >
          ♧
        </button>

        <div className="topbar-user">
          <div className="avatar">
            {initials}
          </div>

          <div className="topbar-user-info">
            <span>{user?.username || "Developer"}</span>
            <small>{user?.email || "Workspace"}</small>
          </div>
        </div>

        <button
          className="navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
