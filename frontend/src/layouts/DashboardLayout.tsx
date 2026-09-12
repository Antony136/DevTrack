import { Outlet } from "react-router-dom"

function DashboardLayout() {
  return (
    <div className="app-layout">
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

          <a href="/dashboard" className="sidebar-link active">
            <span>⌂</span>
            Dashboard
          </a>

          <a href="/projects" className="sidebar-link">
            <span>▣</span>
            Projects
          </a>

          <a href="/tasks" className="sidebar-link">
            <span>✓</span>
            Tasks
          </a>

          <p className="sidebar-section">Personal</p>

          <a href="#" className="sidebar-link">
            <span>♧</span>
            Notifications
          </a>

          <a href="#" className="sidebar-link">
            <span>○</span>
            Profile
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot" />
            <span>Workspace active</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <span className="topbar-title">DevTrack</span>
          </div>

          <div className="topbar-user">
            <div className="avatar">A</div>

            <div className="topbar-user-info">
              <span>Developer</span>
              <small>Workspace</small>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout