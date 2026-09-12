import { type FormEvent, useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Icon from "../components/Icon"
import Toast from "../components/Toast"
import api from "../services/api"
import { type Project } from "../types/project"
import { getErrorMessage, isUnauthorized } from "../utils/errors"

function Projects() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get<Project[]>("/projects")
      setProjects(response.data)
    } catch (error) {
      if (isUnauthorized(error)) {
        navigate("/login", { replace: true })
        return
      }

      setError(getErrorMessage(error, "Failed to load projects."))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const resetCreateForm = () => {
    setName("")
    setDescription("")
  }

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault()

    if (name.trim().length < 3) {
      setError("Project name must be at least 3 characters.")
      return
    }

    try {
      setCreating(true)
      setError("")

      await api.post("/projects", {
        name: name.trim(),
        description: description.trim() || null,
      })

      resetCreateForm()
      setShowCreateModal(false)
      setToast("Project created.")
      await fetchProjects()
    } catch (error) {
      setError(getErrorMessage(error, "Failed to create project."))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return
    }

    try {
      setDeletingId(projectToDelete.id)
      setError("")

      await api.delete(`/projects/${projectToDelete.id}`)

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectToDelete.id),
      )
      setToast("Project deleted.")
      setProjectToDelete(null)
    } catch (error) {
      setError(getErrorMessage(error, "Failed to delete project."))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-container">
        <header className="page-header">
          <div className="page-header-content">
            <p className="eyebrow">Workspace</p>
            <h1>Projects</h1>
            <p>Organize development work into focused project spaces.</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setShowCreateModal(true)
              setError("")
            }}
            type="button"
          >
            <Icon name="plus" />
            New Project
          </button>
        </header>

        {error && <div className="error-message project-error">{error}</div>}

        <section className="section-heading">
          <div>
            <h2>Your Projects</h2>
            <p>
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          <button
            className="btn-secondary"
            type="button"
            onClick={fetchProjects}
            disabled={loading}
          >
            <Icon name="refresh" />
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="projects-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="skeleton skeleton-project" key={index} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="folder" />
            </div>

            <h3>No projects yet</h3>
            <p>Create your first project to start organizing your work.</p>

            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
              type="button"
            >
              <Icon name="plus" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <div className="project-icon">
                    {project.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="project-id">#{project.id}</span>
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
                    className="btn-secondary project-tasks-button"
                    to={`/projects/${project.id}/tasks`}
                  >
                    <Icon name="tasks" />
                    Tasks
                    <Icon name="arrow-right" />
                  </Link>

                  <button
                    className="icon-button danger"
                    onClick={() => setProjectToDelete(project)}
                    disabled={deletingId === project.id}
                    type="button"
                    aria-label={`Delete ${project.name}`}
                    title="Delete project"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowCreateModal(false)
              resetCreateForm()
            }
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New project</p>
                <h2>Create project</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false)
                  resetCreateForm()
                }}
                disabled={creating}
                type="button"
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="DevTrack"
                  autoFocus
                  maxLength={100}
                  disabled={creating}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What are you building?"
                  maxLength={1000}
                  disabled={creating}
                  rows={5}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetCreateForm()
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={creating || name.trim().length < 3}
                >
                  {creating && <span className="button-spinner" />}
                  {creating ? "Creating" : "Create Project"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {projectToDelete && (
        <div className="modal-overlay" role="presentation">
          <section className="modal confirm-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow danger-text">Delete project</p>
                <h2>{projectToDelete.name}</h2>
              </div>
            </div>

            <p>
              This will permanently delete the project. Any backend cascade
              behavior is controlled by the API.
            </p>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingId === projectToDelete.id}
              >
                Cancel
              </button>

              <button
                className="btn-danger"
                type="button"
                onClick={handleDeleteProject}
                disabled={deletingId === projectToDelete.id}
              >
                {deletingId === projectToDelete.id && (
                  <span className="button-spinner" />
                )}
                {deletingId === projectToDelete.id ? "Deleting" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}

      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  )
}

export default Projects
