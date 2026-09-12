import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.dispatchEvent(new Event("devtrack:auth-expired"))
    }

    return Promise.reject(error)
  },
)

export default api
