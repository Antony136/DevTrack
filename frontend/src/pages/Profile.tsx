import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "../components/Icon"
import api from "../services/api"
import { type User } from "../types/user"
import { getErrorMessage, isUnauthorized } from "../utils/errors"
import { initialsFromName } from "../utils/format"

function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get<User>("/me")
      setUser(response.data)
    } catch (error) {
      if (isUnauthorized(error)) {
        navigate("/login", { replace: true })
        return
      }

      setError(getErrorMessage(error, "Failed to load profile."))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <div className="page">
      <div className="page-container profile-page">
        <header className="page-header">
          <div className="page-header-content">
            <p className="eyebrow">Account</p>
            <h1>Profile</h1>
            <p>Your DevTrack account information.</p>
          </div>
        </header>

        {error && (
          <div className="state-panel error-panel">
            <div>
              <h3>Profile could not load</h3>
              <p>{error}</p>
            </div>
            <button className="btn-secondary" onClick={fetchUser} type="button">
              <Icon name="refresh" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton skeleton-profile" />
        ) : (
          <section className="profile-panel">
            <div className="profile-hero">
              <div className="avatar avatar-xl">
                {initialsFromName(user?.username)}
              </div>

              <div>
                <p className="eyebrow">Your account</p>
                <h2>{user?.username || "Developer"}</h2>
                <p>{user?.email}</p>
              </div>
            </div>

            <div className="profile-divider" />

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Username</span>
                <span className="profile-info-value">{user?.username}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{user?.email}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">User ID</span>
                <span className="profile-info-value">#{user?.id}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default Profile
