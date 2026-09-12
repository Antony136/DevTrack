import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "../components/Icon"
import Toast from "../components/Toast"
import api from "../services/api"
import { type Notification } from "../types/notification"
import { getErrorMessage, isUnauthorized } from "../utils/errors"
import { formatDateTime } from "../utils/format"

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [markingRead, setMarkingRead] = useState<number | null>(null)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = useCallback(async () => {
    try {
      setError("")
      setLoading(true)

      const response = await api.get<Notification[]>("/notifications")
      setNotifications(response.data)
    } catch (error) {
      if (isUnauthorized(error)) {
        navigate("/login", { replace: true })
        return
      }

      setError(getErrorMessage(error, "Failed to load notifications."))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (notificationId: number) => {
    try {
      setMarkingRead(notificationId)
      setError("")

      const response = await api.patch<Notification>(
        `/notifications/${notificationId}/read`,
      )

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? response.data : notification,
        ),
      )
      setToast("Notification marked as read.")
      window.dispatchEvent(new Event("devtrack:notifications-changed"))
    } catch (error) {
      setError(getErrorMessage(error, "Failed to mark notification as read."))
    } finally {
      setMarkingRead(null)
    }
  }

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  )

  const visibleNotifications = useMemo(() => {
    return filter === "unread"
      ? notifications.filter((notification) => !notification.is_read)
      : notifications
  }, [filter, notifications])

  return (
    <div className="page">
      <div className="page-container notifications-page">
        <header className="page-header">
          <div className="page-header-content">
            <p className="eyebrow">Personal</p>
            <h1>Notifications</h1>
            <p>Stay updated on activity across your workspace.</p>
          </div>

          <div className="notification-summary">
            <span className="notification-summary-dot" />
            <span>{unreadCount} unread</span>
          </div>
        </header>

        {error && (
          <div className="error-message notifications-error">{error}</div>
        )}

        <div className="notifications-toolbar">
          <div className="notification-tabs" role="tablist">
            <button
              className={`notification-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
              type="button"
              role="tab"
              aria-selected={filter === "all"}
            >
              All
              <span>{notifications.length}</span>
            </button>

            <button
              className={`notification-tab ${
                filter === "unread" ? "active" : ""
              }`}
              onClick={() => setFilter("unread")}
              type="button"
              role="tab"
              aria-selected={filter === "unread"}
            >
              Unread
              <span>{unreadCount}</span>
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={fetchNotifications}
            disabled={loading}
            type="button"
          >
            <Icon name="refresh" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="notifications-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="skeleton skeleton-notification" key={index} />
            ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="check" />
            </div>

            <h3>
              {filter === "unread" ? "You're all caught up" : "No notifications yet"}
            </h3>

            <p>
              {filter === "unread"
                ? "You have no unread notifications."
                : "Activity and updates from your workspace will appear here."}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-card ${
                  notification.is_read
                    ? "notification-read"
                    : "notification-unread"
                }`}
              >
                <div className="notification-icon">
                  <Icon name={notification.is_read ? "check" : "bell"} />
                </div>

                <div className="notification-content">
                  <div className="notification-top">
                    <span className="notification-label">
                      {notification.is_read ? notification.type : "New"}
                    </span>

                    {!notification.is_read && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p className="notification-message">{notification.message}</p>
                  <time
                    className="notification-time"
                    dateTime={notification.created_at}
                  >
                    {formatDateTime(notification.created_at)}
                  </time>
                </div>

                {!notification.is_read && (
                  <button
                    className="icon-text-button notification-read-button"
                    onClick={() => markAsRead(notification.id)}
                    disabled={markingRead === notification.id}
                    type="button"
                  >
                    <Icon name="check" />
                    {markingRead === notification.id ? "Marking" : "Mark read"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  )
}

export default Notifications
