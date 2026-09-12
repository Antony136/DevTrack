import { NavLink } from "react-router-dom"

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">D</div>

        <div>
          <h2>DevTrack</h2>
          <span>Developer workspace</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section">Workspace</p>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>⌂</span>
          <span className="sidebar-link-text">Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>▣</span>
          <span className="sidebar-link-text">Projects</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>✓</span>
          <span className="sidebar-link-text">Tasks</span>
        </NavLink>

        <p className="sidebar-section">Personal</p>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>♧</span>
          <span className="sidebar-link-text">Notifications</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>○</span>
          <span className="sidebar-link-text">Profile</span>
        </NavLink>
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