import { NavLink } from "react-router-dom"
import Icon, { type IconName } from "./Icon"

interface NavigationItem {
  to: string
  label: string
  icon: IconName
}

const workspaceItems: NavigationItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/projects", label: "Projects", icon: "folder" },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
]

const personalItems: NavigationItem[] = [
  { to: "/notifications", label: "Notifications", icon: "bell" },
  { to: "/profile", label: "Profile", icon: "user" },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Icon name="spark" />
        </div>

        <div>
          <h2>DevTrack</h2>
          <span>Developer workspace</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <p className="sidebar-section">Workspace</p>

        {workspaceItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            title={item.label}
          >
            <Icon name={item.icon} />
            <span className="sidebar-link-text">{item.label}</span>
          </NavLink>
        ))}

        <p className="sidebar-section">Personal</p>

        {personalItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            title={item.label}
          >
            <Icon name={item.icon} />
            <span className="sidebar-link-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <span className="status-dot" />
          <span>Workspace active</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
