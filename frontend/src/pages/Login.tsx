import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Icon from "../components/Icon"
import api from "../services/api"
import { getErrorMessage } from "../utils/errors"

function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError("Enter your username and password.")
      return
    }

    try {
      setError("")
      setLoading(true)

      const response = await api.post<{
        access_token: string
        token_type: string
      }>("/login", {
        username: username.trim(),
        password,
      })

      localStorage.setItem("token", response.data.access_token)
      navigate("/dashboard", { replace: true })
    } catch (error) {
      setError(getErrorMessage(error, "Invalid username or password."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-lockup auth-brand">
          <div className="brand-mark">
            <Icon name="spark" />
          </div>

          <div>
            <h1>DevTrack</h1>
            <p>Developer project management</p>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">Secure workspace</p>
          <h2 id="login-title">Welcome back</h2>
          <p>Sign in to continue planning, assigning, and shipping work.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="antony"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !username.trim() || !password}
          >
            {loading && <span className="button-spinner" />}
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          <span>New to DevTrack?</span>
          <Link to="/register">Create account</Link>
        </div>
      </section>
    </main>
  )
}

export default Login
