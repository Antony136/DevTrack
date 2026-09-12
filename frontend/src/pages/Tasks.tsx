import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Icon from "../components/Icon"
import TaskCard from "../components/TaskCard"
import Toast from "../components/Toast"
import api from "../services/api"
import { type Project } from "../types/project"
import {
  type Task,
  type TaskPriority,
  type TaskSortField,
  type TaskStatus,
  type TaskUpdate,
} from "../types/task"
import { type User } from "../types/user"
import { getErrorMessage, isUnauthorized } from "../utils/errors"

const pageSize = 9
const statusOptions: TaskStatus[] = ["todo", "in_progress", "done"]
const priorityOptions: TaskPriority[] = ["low", "medium", "high"]

interface TaskDraft {
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
}

const emptyDraft: TaskDraft = {
  projectId: "",
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigneeId: "",
}

const priorityRank: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

function Tasks() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft)
  const [editDraft, setEditDraft] = useState<TaskDraft>(emptyDraft)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<TaskSortField>("id")
  const [descending, setDescending] = useState(true)
  const [page, setPage] = useState(1)
  const [knownTotal, setKnownTotal] = useState<number | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const numericProjectId = projectId ? Number(projectId) : null
  const project = projects.find((item) => item.id === numericProjectId)
  const searchQuery = debouncedSearch.trim()
  const useClientQuery = !numericProjectId || searchQuery.length > 0

  const sortTasks = useCallback(
    (items: Task[]) => {
      return [...items].sort((a, b) => {
        const comparison =
          sortBy === "title"
            ? a.title.localeCompare(b.title)
            : sortBy === "priority"
              ? priorityRank[a.priority] - priorityRank[b.priority]
              : sortBy === "status"
                ? a.status.localeCompare(b.status)
                : a.id - b.id

        return descending ? -comparison : comparison
      })
    },
    [descending, sortBy],
  )

  const applyClientFilters = useCallback(
    (items: Task[]) => {
      const assigneeId = assigneeFilter ? Number(assigneeFilter) : null

      return items.filter((task) => {
        if (numericProjectId && task.project_id !== numericProjectId) {
          return false
        }

        if (statusFilter && task.status !== statusFilter) {
          return false
        }

        if (priorityFilter && task.priority !== priorityFilter) {
          return false
        }

        if (assigneeId !== null && task.assignee_id !== assigneeId) {
          return false
        }

        return true
      })
    },
    [assigneeFilter, numericProjectId, priorityFilter, statusFilter],
  )

  const handleUnauthorized = useCallback(
    (error: unknown) => {
      if (isUnauthorized(error)) {
        navigate("/login", { replace: true })
        return true
      }

      return false
    },
    [navigate],
  )

  const fetchReferences = useCallback(async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        api.get<User[]>("/users"),
        api.get<Project[]>("/projects"),
      ])

      setUsers(usersResponse.data)
      setProjects(projectsResponse.data)
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setError(getErrorMessage(error, "Failed to load workspace data."))
      }
    }
  }, [handleUnauthorized])

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      if (useClientQuery) {
        const response = await api.get<Task[]>("/tasks/search", {
          params: { q: searchQuery },
        })
        const filtered = applyClientFilters(response.data)
        const sorted = sortTasks(filtered)
        const start = (page - 1) * pageSize
        const pageItems = sorted.slice(start, start + pageSize)

        setTasks(pageItems)
        setKnownTotal(sorted.length)
        setHasNextPage(start + pageSize < sorted.length)
      } else {
        const response = await api.get<Task[]>(
          `/projects/${numericProjectId}/tasks`,
          {
            params: {
              status: statusFilter || undefined,
              priority: priorityFilter || undefined,
              assignee_id: assigneeFilter || undefined,
              sort_by: sortBy,
              descending,
              page,
              limit: pageSize,
            },
          },
        )

        setTasks(response.data)
        setKnownTotal(null)
        setHasNextPage(response.data.length === pageSize)
      }
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setError(getErrorMessage(error, "Failed to load tasks."))
      }
    } finally {
      setLoading(false)
    }
  }, [
    applyClientFilters,
    assigneeFilter,
    descending,
    handleUnauthorized,
    numericProjectId,
    page,
    priorityFilter,
    searchQuery,
    sortBy,
    sortTasks,
    statusFilter,
    useClientQuery,
  ])

  useEffect(() => {
    fetchReferences()
  }, [fetchReferences])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const resetDraft = () => {
    setDraft({
      ...emptyDraft,
      projectId: numericProjectId ? String(numericProjectId) : "",
    })
  }

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setAssigneeFilter("")
    setSortBy("id")
    setDescending(true)
    setPage(1)
  }

  const taskPayloadFromDraft = (currentDraft: TaskDraft): TaskUpdate => ({
    title: currentDraft.title.trim(),
    description: currentDraft.description.trim() || null,
    status: currentDraft.status,
    priority: currentDraft.priority,
    assignee_id: currentDraft.assigneeId ? Number(currentDraft.assigneeId) : null,
  })

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault()

    const selectedProjectId = numericProjectId
      ? String(numericProjectId)
      : draft.projectId

    if (!selectedProjectId) {
      setError("Choose a project before creating a task.")
      return
    }

    if (draft.title.trim().length < 3) {
      setError("Task title must be at least 3 characters.")
      return
    }

    try {
      setCreating(true)
      setError("")

      await api.post(`/projects/${selectedProjectId}/tasks`, {
        ...taskPayloadFromDraft(draft),
      })

      resetDraft()
      setShowCreateModal(false)
      setPage(1)
      setToast("Task created.")
      await fetchTasks()
      window.dispatchEvent(new Event("devtrack:notifications-changed"))
    } catch (error) {
      setError(getErrorMessage(error, "Failed to create task."))
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setEditDraft({
      projectId: String(task.project_id),
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee_id ? String(task.assignee_id) : "",
    })
    setError("")
  }

  const handleUpdateTask = async (event: FormEvent) => {
    event.preventDefault()

    if (!editingTask) {
      return
    }

    if (editDraft.title.trim().length < 3) {
      setError("Task title must be at least 3 characters.")
      return
    }

    try {
      setSavingId(editingTask.id)
      setError("")

      await api.patch(`/tasks/${editingTask.id}`, taskPayloadFromDraft(editDraft))

      setEditingTask(null)
      setToast("Task updated.")
      await fetchTasks()
      window.dispatchEvent(new Event("devtrack:notifications-changed"))
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update task."))
    } finally {
      setSavingId(null)
    }
  }

  const handleQuickStatusChange = async (task: Task, status: TaskStatus) => {
    if (status === task.status) {
      return
    }

    try {
      setSavingId(task.id)
      setError("")

      const response = await api.patch<Task>(`/tasks/${task.id}`, { status })

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? response.data : currentTask,
        ),
      )
      setToast("Task status updated.")
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update task status."))
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      return
    }

    try {
      setDeletingId(taskToDelete.id)
      setError("")

      await api.delete(`/tasks/${taskToDelete.id}`)

      setTaskToDelete(null)
      setToast("Task deleted.")
      await fetchTasks()
    } catch (error) {
      setError(getErrorMessage(error, "Failed to delete task."))
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = useMemo(() => {
    if (knownTotal === null) {
      return null
    }

    return Math.max(1, Math.ceil(knownTotal / pageSize))
  }, [knownTotal])

  const hasFilters =
    Boolean(search) ||
    Boolean(statusFilter) ||
    Boolean(priorityFilter) ||
    Boolean(assigneeFilter)

  const emptyTitle = hasFilters ? "No matching tasks" : "No tasks yet"
  const emptyDescription = hasFilters
    ? "Try changing your search or filters."
    : numericProjectId
      ? "Create the first task for this project."
      : "Create a project task to start tracking work."

  return (
    <div className="page">
      <div className="page-container">
        <header className="page-header">
          <div className="page-header-content">
            <p className="eyebrow">{numericProjectId ? "Project" : "Workspace"}</p>
            <h1>{project?.name || (numericProjectId ? "Project Tasks" : "All Tasks")}</h1>
            <p>
              {numericProjectId
                ? "Plan and manage work inside this project."
                : "Search and manage tasks across your projects."}
            </p>
          </div>

          <div className="page-actions">
            {numericProjectId && (
              <Link className="btn-secondary" to="/projects">
                <Icon name="arrow-left" />
                Projects
              </Link>
            )}

            <button
              className="btn-primary"
              onClick={() => {
                resetDraft()
                setShowCreateModal(true)
                setError("")
              }}
              type="button"
              disabled={!numericProjectId && projects.length === 0}
            >
              <Icon name="plus" />
              New Task
            </button>
          </div>
        </header>

        {error && <div className="error-message tasks-error">{error}</div>}

        <section className="task-toolbar">
          <div className="task-search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              aria-label="Search tasks"
            />
            {search && (
              <button
                className="task-search-clear"
                type="button"
                onClick={() => {
                  setSearch("")
                  setDebouncedSearch("")
                  setPage(1)
                }}
                aria-label="Clear search"
              >
                <Icon name="close" />
              </button>
            )}
          </div>

          <div className="task-filters" aria-label="Task filters">
            <label className="select-with-icon">
              <Icon name="filter" />
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as TaskStatus | "")
                  setPage(1)
                }}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option value={status} key={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value as TaskPriority | "")
                setPage(1)
              }}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((priority) => (
                <option value={priority} key={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={assigneeFilter}
              onChange={(event) => {
                setAssigneeFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by assignee"
            >
              <option value="">All assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <label className="select-with-icon">
              <Icon name="sort" />
              <select
                value={`${sortBy}:${descending ? "desc" : "asc"}`}
                onChange={(event) => {
                  const [field, direction] = event.target.value.split(":")
                  setSortBy(field as TaskSortField)
                  setDescending(direction === "desc")
                  setPage(1)
                }}
                aria-label="Sort tasks"
              >
                <option value="id:desc">ID newest</option>
                <option value="id:asc">ID oldest</option>
                <option value="title:asc">Title A-Z</option>
                <option value="title:desc">Title Z-A</option>
                <option value="priority:desc">Priority high first</option>
                <option value="priority:asc">Priority low first</option>
                <option value="status:asc">Status A-Z</option>
              </select>
            </label>

            {hasFilters && (
              <button className="clear-filters" onClick={clearFilters} type="button">
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>{knownTotal === null ? "Tasks" : `${knownTotal} Tasks`}</h2>
            <p>
              {knownTotal === null
                ? `Showing ${tasks.length} task${tasks.length === 1 ? "" : "s"} on page ${page}`
                : `Showing page ${page} of ${totalPages}`}
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={fetchTasks}
            type="button"
            disabled={loading}
          >
            <Icon name="refresh" />
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="tasks-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="skeleton skeleton-task" key={index} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="tasks" />
            </div>
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
            {hasFilters ? (
              <button className="btn-secondary" onClick={clearFilters} type="button">
                Clear filters
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                type="button"
                disabled={!numericProjectId && projects.length === 0}
              >
                <Icon name="plus" />
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                users={users}
                onEdit={openEditModal}
                onDelete={setTaskToDelete}
                onStatusChange={handleQuickStatusChange}
                saving={savingId === task.id}
                deleting={deletingId === task.id}
              />
            ))}
          </div>
        )}

        {(page > 1 || hasNextPage || (totalPages !== null && totalPages > 1)) && (
          <nav className="pagination" aria-label="Task pagination">
            <button
              className="pagination-button"
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <Icon name="chevron-left" />
              Previous
            </button>

            {totalPages !== null ? (
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(Math.max(0, page - 3), page + 2)
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      className={`pagination-number ${
                        page === pageNumber ? "active" : ""
                      }`}
                      onClick={() => setPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ))}
              </div>
            ) : (
              <span className="pagination-current">Page {page}</span>
            )}

            <button
              className="pagination-button"
              disabled={loading || (totalPages !== null ? page >= totalPages : !hasNextPage)}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next
              <Icon name="chevron-right" />
            </button>
          </nav>
        )}
      </div>

      {showCreateModal && (
        <TaskModal
          title="Create task"
          draft={draft}
          projects={projects}
          users={users}
          projectLocked={Boolean(numericProjectId)}
          submitting={creating}
          submitLabel="Create Task"
          onChange={setDraft}
          onSubmit={handleCreateTask}
          onClose={() => {
            if (!creating) {
              setShowCreateModal(false)
              resetDraft()
            }
          }}
        />
      )}

      {editingTask && (
        <TaskModal
          title={`Edit task #${editingTask.id}`}
          draft={editDraft}
          projects={projects}
          users={users}
          projectLocked
          submitting={savingId === editingTask.id}
          submitLabel="Save Changes"
          onChange={setEditDraft}
          onSubmit={handleUpdateTask}
          onClose={() => {
            if (savingId !== editingTask.id) {
              setEditingTask(null)
            }
          }}
        />
      )}

      {taskToDelete && (
        <div className="modal-overlay" role="presentation">
          <section className="modal confirm-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow danger-text">Delete task</p>
                <h2>{taskToDelete.title}</h2>
              </div>
            </div>

            <p>This task will be permanently removed.</p>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={deletingId === taskToDelete.id}
              >
                Cancel
              </button>

              <button
                className="btn-danger"
                type="button"
                onClick={handleDeleteTask}
                disabled={deletingId === taskToDelete.id}
              >
                {deletingId === taskToDelete.id && (
                  <span className="button-spinner" />
                )}
                {deletingId === taskToDelete.id ? "Deleting" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}

      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  )
}

interface TaskModalProps {
  title: string
  draft: TaskDraft
  projects: Project[]
  users: User[]
  projectLocked: boolean
  submitting: boolean
  submitLabel: string
  onChange: (draft: TaskDraft) => void
  onSubmit: (event: FormEvent) => void
  onClose: () => void
}

function TaskModal({
  title,
  draft,
  projects,
  users,
  projectLocked,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onClose,
}: TaskModalProps) {
  const updateDraft = (updates: Partial<TaskDraft>) => {
    onChange({ ...draft, ...updates })
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <section className="modal task-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Task</p>
            <h2>{title}</h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            disabled={submitting}
            type="button"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="task-project">Project</label>
            <select
              id="task-project"
              value={draft.projectId}
              onChange={(event) => updateDraft({ projectId: event.target.value })}
              disabled={projectLocked || submitting}
              required
            >
              <option value="">Choose project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="Implement authentication"
              minLength={3}
              maxLength={200}
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={draft.description}
              onChange={(event) =>
                updateDraft({ description: event.target.value })
              }
              placeholder="Add implementation details, constraints, or context."
              maxLength={2000}
              rows={5}
              disabled={submitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={draft.status}
                onChange={(event) =>
                  updateDraft({ status: event.target.value as TaskStatus })
                }
                disabled={submitting}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={draft.priority}
                onChange={(event) =>
                  updateDraft({ priority: event.target.value as TaskPriority })
                }
                disabled={submitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
              value={draft.assigneeId}
              onChange={(event) => updateDraft({ assigneeId: event.target.value })}
              disabled={submitting}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              type="submit"
              disabled={submitting || draft.title.trim().length < 3}
            >
              {submitting && <span className="button-spinner" />}
              {submitting ? "Saving" : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Tasks
