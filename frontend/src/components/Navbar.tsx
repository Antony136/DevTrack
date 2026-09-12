import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api from "../services/api"
import { type Notification } from "../types/notification"
import { type User } from "../types/user"
import { getErrorMessage } from "../utils/errors"
import { initialsFromName } from "../utils/format"
import Icon from "./Icon"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/notifications": "Notifications",
  "/profile": "Profile",
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [user, setUser] = useState<User | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const currentPageTitle = useMemo(() => {
    if (location.pathname.startsWith("/projects/")) {
      return "Project Tasks"
    }

    return pageTitles[location.pathname] || "Workspace"
  }, [location.pathname])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get<User>("/me")
        setUser(response.data)
      } catch (error) {
        console.error(getErrorMessage(error, "Failed to fetch user"))
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get<Notification[]>("/notifications")
        setUnreadCount(
          response.data.filter((notification) => !notification.is_read).length,
        )
      } catch (error) {
        console.error(getErrorMessage(error, "Failed to fetch notifications"))
      }
    }

    fetchNotifications()
    const interval = window.setInterval(fetchNotifications, 30000)
    window.addEventListener("devtrack:notifications-changed", fetchNotifications)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener(
        "devtrack:notifications-changed",
        fetchNotifications,
      )
    }
  }, [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login", { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-kicker">Workspace</span>
        <span className="topbar-title">{currentPageTitle}</span>
      </div>

      <div className="topbar-right">
        <button
          className="navbar-icon-button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          title="Notifications"
          type="button"
        >
          <Icon name="bell" />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="profile-menu" ref={menuRef}>
          <button
            className="topbar-user"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            type="button"
          >
            <div className="avatar">
              {initialsFromName(user?.username)}
            </div>

            <div className="topbar-user-info">
              <span>{user?.username || "Developer"}</span>
              <small>{user?.email || "Workspace"}</small>
            </div>

            <Icon name="chevron-down" className="profile-chevron" />
          </button>

          {menuOpen && (
            <div className="profile-dropdown" role="menu">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                role="menuitem"
              >
                <Icon name="user" />
                Profile
              </button>

              <button type="button" onClick={handleLogout} role="menuitem">
                <Icon name="logout" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
