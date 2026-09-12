import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"

function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields")
      return
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      setError("")
      setLoading(true)

      await api.post("/users", {
        username,
        email,
        password,
      })

      navigate("/login")
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Registration failed"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">D</div>

          <div>
            <h1>DevTrack</h1>
            <p>Developer project management</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>Start organizing your projects and tasks.</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </main>
  )
}

export default Register