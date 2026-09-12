import { type FormEvent, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../services/api"
import { type Project } from "../types/project"

function Projects() {
  const [projects, setProjects] = useState<Project[]>([])

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get("/projects")
      setProjects(response.data)
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
        "Failed to load projects"
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
      setError("Project name is required")
      return
    }

    try {
      setCreating(true)
      setError("")

      await api.post("/projects", {
        name: name.trim(),
        description: description.trim() || null,
      })

      setName("")
      setDescription("")
      setShowCreateForm(false)

      await fetchProjects()
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
        "Failed to create project"
      )
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(projectId)
      setError("")

      await api.delete(`/projects/${projectId}`)

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      )
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
        "Failed to delete project"
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-container">

        <header className="page-header">
          <div className="page-header-content">
            <h1>Projects</h1>
            <p>
              Organize your development work into focused projects.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setShowCreateForm((current) => !current)
              setError("")
            }}
          >
            {showCreateForm ? "Cancel" : "+ New Project"}
          </button>
        </header>

        {error && (
          <div className="error-message project-error">
            {error}
          </div>
        )}

        {showCreateForm && (
          <section className="card create-project-card">
            <div className="card-header">
              <div>
                <h3>Create a new project</h3>
                <p className="text-muted">
                  Set up a project to start tracking your work.
                </p>
              </div>
            </div>

            <div className="card-body">
              <form
                onSubmit={handleCreateProject}
                className="project-form"
              >
                <div className="form-group">
                  <label htmlFor="project-name">
                    Project name
                  </label>

                  <input
                    id="project-name"
                    type="text"
                    placeholder="e.g. DevTrack"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project-description">
                    Description
                  </label>

                  <textarea
                    id="project-description"
                    placeholder="What are you building?"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <div className="project-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateForm(false)
                      setName("")
                      setDescription("")
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating
                      ? "Creating..."
                      : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="projects-section">

          <div className="section-heading">
            <div>
              <h2>Your Projects</h2>
              <p>
                {projects.length}{" "}
                {projects.length === 1
                  ? "project"
                  : "projects"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="projects-loading">
              <div className="loading">
                Loading projects...
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="card empty-projects">
              <div className="empty-state">
                <div className="empty-icon">▣</div>

                <h3>No projects yet</h3>

                <p>
                  Create your first project to start
                  organizing your development work.
                </p>

                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowCreateForm(true)
                    setError("")
                  }}
                >
                  Create your first project
                </button>
              </div>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <article
                  className="project-card card"
                  key={project.id}
                >
                  <div className="card-body">

                    <div className="project-card-top">
                      <div className="project-icon">
                        {project.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span className="project-id">
                        #{project.id}
                      </span>
                    </div>

                    <div className="project-info">
                      <h3>{project.name}</h3>

                      <p>
                        {project.description ||
                          "No description provided for this project."}
                      </p>
                    </div>

                    <div className="project-card-footer">
                      <Link
                        className="btn-primary project-tasks-button"
                        to={`/projects/${project.id}/tasks`}
                      >
                        View Tasks
                        <span>→</span>
                      </Link>

                      <button
                        className="btn-danger-outline"
                        onClick={() =>
                          handleDeleteProject(project.id)
                        }
                        disabled={deletingId === project.id}
                      >
                        {deletingId === project.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>

                  </div>
                </article>
              ))}
            </div>
          )}

        </section>

      </div>
    </div>
  )
}

export default Projects
