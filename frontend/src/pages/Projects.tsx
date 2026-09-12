import { type FormEvent, useEffect, useState } from "react"
import api from "../services/api"
import { type Project } from "../types/project"
import { Link } from "react-router-dom"

function Projects() {
  const [projects, setProjects] = useState<Project[]>([])

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchProjects = async () => {
    try {
      setLoading(true)

      const response = await api.get("/projects")

      setProjects(response.data)
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to load projects"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    try {
      setError("")
      await api.post("/projects", {
        name,
        description: description || null,
      })

      setName("")
      setDescription("")

      await fetchProjects()
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to create project"
      )
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    try {
      await api.delete(`/projects/${projectId}`)

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      )
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to delete project"
      )
    }
  }

  return (
    <div>
      <h1>Projects</h1>

      {error && <p>{error}</p>}

      <h2>Create Project</h2>

      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">
          Create Project
        </button>
      </form>

      <hr />

      <h2>Your Projects</h2>

      {loading ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        projects.map((project) => (
          <div key={project.id}>
            <h3>{project.name}</h3>

            <p>
              {project.description || "No description"}
            </p>

            <p>Project ID: {project.id}</p>
            
            <Link to={`/projects/${project.id}/tasks`}>
              View Tasks
            </Link>

            <button
              onClick={() => handleDeleteProject(project.id)}
            >
              Delete
            </button>
            
          </div>
        ))
      )}
    </div>
  )
}

export default Projects