import {
  type FormEvent,
  useEffect,
  useState,
} from "react"
import { useParams } from "react-router-dom"
import api from "../services/api"
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types/task"
import { type User } from "../types/user"

function Tasks() {
  const { projectId } = useParams()

  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo")
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium")
  const [taskAssignee, setTaskAssignee] = useState<number | "">("")

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo")
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium")
  const [editAssignee, setEditAssignee] = useState<number | "">("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("")
  const [assigneeFilter, setAssigneeFilter] = useState<number | "">("")

  const [sortBy, setSortBy] = useState("created_at")
  const [descending, setDescending] = useState(true)

  const [page, setPage] = useState(1)
  const limit = 9
  const [totalTasks, setTotalTasks] = useState(0)

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const getErrorMessage = (error: any, fallback: string) => {
    const detail = error.response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || "Invalid request")
        .join(", ")
    }

    return fallback
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data)
    } catch (error) {
      console.error("Failed to fetch users", error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError("")

      let response

      if (projectId) {
        const params = {
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          assignee_id: assigneeFilter === "" ? undefined : assigneeFilter,
          page,
          limit,
        }

        response = await api.get(`/projects/${projectId}/tasks`, { params })

        const receivedTasks = response.data.items || response.data
        setTasks(receivedTasks)

        setTotalTasks(
          response.data.total ??
          receivedTasks.length ??
          0
        )
      } else {
        response = await api.get("/tasks/search", {
          params: {
            q: search || undefined,
          },
        })

        setTasks(response.data)
        setTotalTasks(response.data.length)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      }

      setError(getErrorMessage(error, "Failed to load tasks"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [
    projectId,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    page,
  ])

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault()

    if (!projectId) {
      setError("Select a project before creating a task.")
      return
    }

    if (!taskTitle.trim()) {
      setError("Task title is required")
      return
    }

    try {
      setCreating(true)
      setError("")

      await api.post(`/projects/${projectId}/tasks`, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        status: taskStatus,
        priority: taskPriority,
        assignee_id: taskAssignee === "" ? null : taskAssignee,
      })

      setTaskTitle("")
      setTaskDescription("")
      setTaskStatus("todo")
      setTaskPriority("medium")
      setTaskAssignee("")
      setShowCreateForm(false)
      setPage(1)

      await fetchTasks()
    } catch (error: any) {
      setError(getErrorMessage(error, "Failed to create task"))
    } finally {
      setCreating(false)
    }
  }

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description || "")
    setEditStatus(task.status)
    setEditPriority(task.priority)
    setEditAssignee(task.assignee_id ?? "")
    setError("")
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditTitle("")
    setEditDescription("")
    setEditStatus("todo")
    setEditPriority("medium")
    setEditAssignee("")
  }

  const handleUpdateTask = async (taskId: number) => {
    if (!editTitle.trim()) {
      setError("Task title is required")
      return
    }

    try {
      setSavingId(taskId)
      setError("")

      await api.patch(`/tasks/${taskId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority,
        assignee_id: editAssignee === "" ? null : editAssignee,
      })

      cancelEditing()
      await fetchTasks()
    } catch (error: any) {
      setError(getErrorMessage(error, "Failed to update task"))
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(taskId)
      setError("")

      await api.delete(`/tasks/${taskId}`)

      const remainingTasks = tasks.filter(
        (task) => task.id !== taskId
      )

      setTasks(remainingTasks)
      setTotalTasks((current) => Math.max(0, current - 1))

      if (remainingTasks.length === 0 && page > 1) {
        setPage((current) => current - 1)
      }
    } catch (error: any) {
      setError(getErrorMessage(error, "Failed to delete task"))
    } finally {
      setDeletingId(null)
    }
  }

  const handleQuickStatusChange = async (
    task: Task,
    status: TaskStatus
  ) => {
    try {
      setSavingId(task.id)
      setError("")

      await api.patch(`/tasks/${task.id}`, { status })

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? { ...currentTask, status }
            : currentTask
        )
      )
    } catch (error: any) {
      setError(
        getErrorMessage(error, "Failed to update task status")
      )
    } finally {
      setSavingId(null)
    }
  }

  const handleSearch = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setAssigneeFilter("")
    setSortBy("created_at")
    setDescending(true)
    setPage(1)
  }

  const getUserName = (
    userId: number | null | undefined
  ) => {
    if (!userId) {
      return "Unassigned"
    }

    const user = users.find((item) => item.id === userId)
    return user?.username || "Unknown user"
  }

  const getInitial = (
    userId: number | null | undefined
  ) => {
    const name = getUserName(userId)

    return name === "Unassigned"
      ? "?"
      : name.charAt(0).toUpperCase()
  }

  const formatStatus = (status: TaskStatus) => {
    return status
      .replace("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const formatPriority = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const filteredTasks = tasks.filter((task) => {
    if (!search.trim()) {
      return true
    }

    const query = search.toLowerCase()

    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    )
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0

    if (sortBy === "title") {
      comparison = a.title.localeCompare(b.title)
    } else if (sortBy === "priority") {
      const priorityOrder = {
        low: 1,
        medium: 2,
        high: 3,
      }

      comparison =
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status)
    } else {
      comparison = a.id - b.id
    }

    return descending ? -comparison : comparison
  })

  const totalPages = Math.max(
    1,
    Math.ceil(totalTasks / limit)
  )

  return (
    <div className="page">
      <div className="page-container">
        <header className="page-header">
          <div className="page-header-content">
            <h1>{projectId ? "Project Tasks" : "All Tasks"}</h1>
            <p>
              Plan, organize, and track your development work.
            </p>
          </div>

          {projectId && (
            <button
              className="btn-primary"
              onClick={() =>
                setShowCreateForm((current) => !current)
              }
            >
              {showCreateForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </header>

        {error && (
          <div className="error-message tasks-error">
            {error}
          </div>
        )}

        {showCreateForm && projectId && (
          <section className="card create-task-card">
            <div className="card-header">
              <div>
                <h3>Create a new task</h3>
                <p className="text-muted">
                  Add a task and assign it to a team member.
                </p>
              </div>
            </div>

            <div className="card-body">
              <form
                className="task-form"
                onSubmit={handleCreateTask}
              >
                <div className="task-form-grid">
                  <div className="form-group task-form-title">
                    <label htmlFor="task-title">Title</label>
                    <input
                      id="task-title"
                      type="text"
                      placeholder="What needs to be done?"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      maxLength={150}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority">Priority</label>
                    <select
                      id="task-priority"
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(
                          e.target.value as TaskPriority
                        )
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-status">Status</label>
                    <select
                      id="task-status"
                      value={taskStatus}
                      onChange={(e) =>
                        setTaskStatus(
                          e.target.value as TaskStatus
                        )
                      }
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">
                        In Progress
                      </option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-assignee">Assignee</label>
                    <select
                      id="task-assignee"
                      value={taskAssignee}
                      onChange={(e) =>
                        setTaskAssignee(
                          e.target.value
                            ? Number(e.target.value)
                            : ""
                        )
                      }
                    >
                      <option value="">Unassigned</option>

                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="task-description">
                    Description
                  </label>

                  <textarea
                    id="task-description"
                    placeholder="Add some context about this task..."
                    value={taskDescription}
                    onChange={(e) =>
                      setTaskDescription(e.target.value)
                    }
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div className="task-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateForm(false)
                      setTaskTitle("")
                      setTaskDescription("")
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="task-toolbar card">
          <div className="task-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="task-filters">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as TaskStatus | ""
                )
                setPage(1)
              }}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(
                  e.target.value as TaskPriority | ""
                )
                setPage(1)
              }}
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(
                  e.target.value
                    ? Number(e.target.value)
                    : ""
                )
                setPage(1)
              }}
              aria-label="Filter by assignee"
            >
              <option value="">All Assignees</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${descending}`}
              onChange={(e) => {
                const [field, direction] =
                  e.target.value.split("-")

                setSortBy(field)
                setDescending(direction === "true")
                setPage(1)
              }}
              aria-label="Sort tasks"
            >
              <option value="created_at-true">Newest</option>
              <option value="created_at-false">Oldest</option>
              <option value="title-false">Title A-Z</option>
              <option value="title-true">Title Z-A</option>
              <option value="priority-true">
                Priority High-Low
              </option>
              <option value="priority-false">
                Priority Low-High
              </option>
            </select>

            {(statusFilter ||
              priorityFilter ||
              assigneeFilter !== "" ||
              search) && (
              <button
                className="clear-filters"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </section>

        <section className="tasks-section">
          <div className="section-heading">
            <div>
              <h2>
                {totalTasks}{" "}
                {totalTasks === 1 ? "Task" : "Tasks"}
              </h2>

              <p>
                {projectId
                  ? "Tasks in this project"
                  : "Tasks matching your search"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="tasks-loading">
              <div className="loading">Loading tasks...</div>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="card empty-tasks">
              <div className="empty-state">
                <div className="empty-icon">✓</div>

                <h3>
                  {search ||
                  statusFilter ||
                  priorityFilter ||
                  assigneeFilter !== ""
                    ? "No matching tasks"
                    : "No tasks yet"}
                </h3>

                <p>
                  {search ||
                  statusFilter ||
                  priorityFilter ||
                  assigneeFilter !== ""
                    ? "Try changing your search or filters."
                    : "Create your first task to start tracking your work."}
                </p>

                {(search ||
                  statusFilter ||
                  priorityFilter ||
                  assigneeFilter !== "") && (
                  <button
                    className="btn-secondary"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="tasks-grid">
              {sortedTasks.map((task) => {
                const isEditing = editingTaskId === task.id

                return (
                  <article
                    className={`task-card card ${
                      isEditing ? "task-card-editing" : ""
                    }`}
                    key={task.id}
                  >
                    {isEditing ? (
                      <div className="card-body task-edit-body">
                        <div className="task-edit-header">
                          <span>
                            Editing Task #{task.id}
                          </span>

                          <button
                            className="icon-button"
                            onClick={cancelEditing}
                            aria-label="Cancel editing"
                          >
                            ×
                          </button>
                        </div>

                        <div className="form-group">
                          <label>Title</label>

                          <input
                            value={editTitle}
                            onChange={(e) =>
                              setEditTitle(e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Description</label>

                          <textarea
                            value={editDescription}
                            onChange={(e) =>
                              setEditDescription(
                                e.target.value
                              )
                            }
                            rows={4}
                          />
                        </div>

                        <div className="edit-fields">
                          <div className="form-group">
                            <label>Status</label>

                            <select
                              value={editStatus}
                              onChange={(e) =>
                                setEditStatus(
                                  e.target.value as TaskStatus
                                )
                              }
                            >
                              <option value="todo">
                                To Do
                              </option>
                              <option value="in_progress">
                                In Progress
                              </option>
                              <option value="done">
                                Done
                              </option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Priority</label>

                            <select
                              value={editPriority}
                              onChange={(e) =>
                                setEditPriority(
                                  e.target.value as TaskPriority
                                )
                              }
                            >
                              <option value="low">
                                Low
                              </option>
                              <option value="medium">
                                Medium
                              </option>
                              <option value="high">
                                High
                              </option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Assignee</label>

                            <select
                              value={editAssignee}
                              onChange={(e) =>
                                setEditAssignee(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : ""
                                )
                              }
                            >
                              <option value="">
                                Unassigned
                              </option>

                              {users.map((user) => (
                                <option
                                  key={user.id}
                                  value={user.id}
                                >
                                  {user.username}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="task-edit-actions">
                          <button
                            className="btn-secondary"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>

                          <button
                            className="btn-primary"
                            onClick={() =>
                              handleUpdateTask(task.id)
                            }
                            disabled={savingId === task.id}
                          >
                            {savingId === task.id
                              ? "Saving..."
                              : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="card-body">
                        <div className="task-card-top">
                          <span
                            className={`priority-badge priority-${task.priority}`}
                          >
                            {formatPriority(task.priority)}
                          </span>

                          <span className="task-id">
                            #{task.id}
                          </span>
                        </div>

                        <div className="task-card-content">
                          <h3>{task.title}</h3>

                          <p>
                            {task.description ||
                              "No description provided."}
                          </p>
                        </div>

                        <div className="task-meta">
                          <div className="task-assignee">
                            <div className="avatar avatar-sm">
                              {getInitial(task.assignee_id)}
                            </div>

                            <span>
                              {getUserName(
                                task.assignee_id
                              )}
                            </span>
                          </div>

                          <select
                            className={`status-select status-${task.status}`}
                            value={task.status}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                task,
                                e.target.value as TaskStatus
                              )
                            }
                            disabled={savingId === task.id}
                            aria-label="Task status"
                          >
                            <option value="todo">
                              To Do
                            </option>
                            <option value="in_progress">
                              In Progress
                            </option>
                            <option value="done">
                              Done
                            </option>
                          </select>
                        </div>

                        <div className="task-card-footer">
                          <span className="task-status-label">
                            {formatStatus(task.status)}
                          </span>

                          <div className="task-actions">
                            <button
                              className="btn-small"
                              onClick={() =>
                                startEditing(task)
                              }
                              disabled={
                                savingId === task.id ||
                                deletingId === task.id
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="btn-small btn-danger-small"
                              onClick={() =>
                                handleDeleteTask(task.id)
                              }
                              disabled={
                                deletingId === task.id
                              }
                            >
                              {deletingId === task.id
                                ? "..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
              >
                ← Previous
              </button>

              <div className="pagination-pages">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination-number ${
                      page === pageNumber ? "active" : ""
                    }`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                className="pagination-button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Tasks