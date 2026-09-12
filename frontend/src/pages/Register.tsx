import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Icon from "../components/Icon"
import api from "../services/api"
import { getErrorMessage } from "../utils/errors"

function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!username.trim() || !email.trim() || !password) {
      return "Fill in all fields to create your account."
    }

    if (username.trim().length < 3) {
      return "Username must be at least 3 characters."
    }

    if (!email.includes("@")) {
      return "Enter a valid email address."
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters."
    }

    return ""
  }

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError("")
      setLoading(true)

      await api.post("/users", {
        username: username.trim(),
        email: email.trim(),
        password,
      })

      navigate("/login", { replace: true })
    } catch (error) {
      setError(getErrorMessage(error, "Registration failed."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
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
          <p className="eyebrow">Start focused</p>
          <h2 id="register-title">Create your account</h2>
          <p>Set up a workspace for projects, tasks, and assignments.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form" noValidate>
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
              minLength={3}
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
              minLength={8}
              maxLength={72}
              required
            />
            <p className="field-hint">Use 8 to 72 characters.</p>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading || !username.trim() || !email.trim() || !password
            }
          >
            {loading && <span className="button-spinner" />}
            {loading ? "Creating account" : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </section>
    </main>
  )
}

export default Register
