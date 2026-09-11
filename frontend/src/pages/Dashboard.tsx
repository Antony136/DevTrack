import { useEffect, useState } from "react"
import api from "../services/api"

interface User {
  id: number
  username: string
  email: string
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/me")
        setUser(response.data)
      } catch (error) {
        console.error("Failed to fetch user", error)
      }
    }

    fetchUser()
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>

      {user && (
        <div>
          <p>Welcome, {user.username}</p>
          <p>Email: {user.email}</p>
        </div>
      )}

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

export default Dashboard