import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

function ProtectedRoute() {
  const location = useLocation()
  const [, setAuthVersion] = useState(0)
  const token = localStorage.getItem("token")

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthVersion((current) => current + 1)
    }

    window.addEventListener("devtrack:auth-expired", handleAuthExpired)
    return () =>
      window.removeEventListener("devtrack:auth-expired", handleAuthExpired)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
