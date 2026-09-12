import { FormEvent, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../services/api"
import type { Task, TaskPriority, TaskStatus } from "../types/task"
import type { User } from "../types/user"

function Tasks() {
  const { projectId } = useParams()

  const [tasks, setTasks] = useState<Task[]>([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo")
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium")

  const [users, setUsers] = useState<User[]>([])
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [editAssigneeId, setEditAssigneeId] = useState<number | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data)
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to load users"
      )
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)

      const response = await api.get(
        `/projects/${projectId}/tasks`
      )

      setTasks(response.data)
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to load tasks"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchTasks()
      fetchUsers()
    }
  }, [projectId])

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !projectId) {
      return
    }

    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title,
        description: description || null,
        status,
        priority,
        assignee_id: assigneeId,
      })

      setTitle("")
      setDescription("")
      setStatus("todo")
      setPriority("medium")
      setAssigneeId(null)

      await fetchTasks()
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to create task"
      )
    }
  }

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id)

    setEditTitle(task.title)
    setEditDescription(task.description || "")
    setEditStatus(task.status)
    setEditPriority(task.priority)
    setEditAssigneeId(task.assignee_id)
  }

  const handleUpdateTask = async (taskId: number) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, {
        title: editTitle,
        description: editDescription || null,
        status: editStatus,
        priority: editPriority,
        assignee_id: editAssigneeId,
      })

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? response.data
            : task
        )
      )

      setEditingTaskId(null)
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to update task"
      )
    }
  }
  
  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`)

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      )
    } catch (error: any) {
      setError(
        error.response?.data?.detail || "Failed to delete task"
      )
    }
  }

  return (
    <div>
      <h1>Tasks</h1>

      <p>Project ID: {projectId}</p>

      {error && <p>{error}</p>}

      <h2>Create Task</h2>

      <form onSubmit={handleCreateTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as TaskStatus)
          }
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as TaskPriority)
          }
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={assigneeId ?? ""}
          onChange={(e) =>
            setAssigneeId(
              e.target.value ? Number(e.target.value) : null
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

        <button type="submit">
          Create Task
        </button>
      </form>

      <hr />

      <h2>Tasks</h2>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id}>
            {editingTaskId === task.id ? (
              <div>
                <h3>Edit Task</h3>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />

                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as TaskStatus)
                  }
                >
                  <select
                    value={editAssigneeId ?? ""}
                    onChange={(e) =>
                      setEditAssigneeId(
                        e.target.value ? Number(e.target.value) : null
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

                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as TaskPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <button onClick={() => handleUpdateTask(task.id)}>
                  Save
                </button>

                <button onClick={() => setEditingTaskId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <h3>{task.title}</h3>

                <p>{task.description || "No description"}</p>

                <p>Status: {task.status}</p>
                <p>Priority: {task.priority}</p>

                <p>
                  Assignee:{" "}
                  {task.assignee_id
                    ? users.find((user) => user.id === task.assignee_id)?.username
                    : "Unassigned"}
                </p>

                <button onClick={() => startEditing(task)}>
                  Edit
                </button>

                <button onClick={() => handleDeleteTask(task.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default Tasks