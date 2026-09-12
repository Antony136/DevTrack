import { useState } from "react"
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types/task"
import { type User } from "../types/user"

interface TaskCardProps {
  task: Task
  users: User[]
  onUpdate: (
    taskId: number,
    data: {
      title: string
      description: string | null
      status: TaskStatus
      priority: TaskPriority
      assignee_id: number | null
    }
  ) => Promise<void>
  onDelete: (taskId: number) => Promise<void>
  onStatusChange: (
    task: Task,
    status: TaskStatus
  ) => Promise<void>
  saving: boolean
  deleting: boolean
}

function TaskCard({
  task,
  users,
  onUpdate,
  onDelete,
  onStatusChange,
  saving,
  deleting,
}: TaskCardProps) {
  const [editing, setEditing] = useState(false)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] =
    useState(task.description || "")
  const [status, setStatus] =
    useState<TaskStatus>(task.status)
  const [priority, setPriority] =
    useState<TaskPriority>(task.priority)
  const [assignee, setAssignee] =
    useState<number | "">(
      task.assignee_id ?? ""
    )

  const getUserName = (
    userId: number | null | undefined
  ) => {
    if (!userId) {
      return "Unassigned"
    }

    const user = users.find(
      (item) => item.id === userId
    )

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

  const formatStatus = (
    taskStatus: TaskStatus
  ) => {
    return taskStatus
      .replace("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const formatPriority = (
    taskPriority: TaskPriority
  ) => {
    return (
      taskPriority.charAt(0).toUpperCase() +
      taskPriority.slice(1)
    )
  }

  const startEditing = () => {
    setTitle(task.title)
    setDescription(task.description || "")
    setStatus(task.status)
    setPriority(task.priority)
    setAssignee(task.assignee_id ?? "")
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setTitle(task.title)
    setDescription(task.description || "")
    setStatus(task.status)
    setPriority(task.priority)
    setAssignee(task.assignee_id ?? "")
  }

  const handleSave = async () => {
    if (!title.trim()) {
      return
    }

    await onUpdate(task.id, {
      title: title.trim(),
      description:
        description.trim() || null,
      status,
      priority,
      assignee_id:
        assignee === ""
          ? null
          : assignee,
    })

    setEditing(false)
  }

  if (editing) {
    return (
      <article className="task-card card task-card-editing">
        <div className="card-body task-edit-body">

          <div className="task-edit-header">
            <span>
              Editing Task #{task.id}
            </span>

            <button
              className="icon-button"
              onClick={cancelEditing}
              disabled={saving}
              aria-label="Cancel editing"
            >
              ×
            </button>
          </div>

          <div className="form-group">
            <label htmlFor={`edit-title-${task.id}`}>
              Title
            </label>

            <input
              id={`edit-title-${task.id}`}
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor={`edit-description-${task.id}`}>
              Description
            </label>

            <textarea
              id={`edit-description-${task.id}`}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="edit-fields">

            <div className="form-group">
              <label htmlFor={`edit-status-${task.id}`}>
                Status
              </label>

              <select
                id={`edit-status-${task.id}`}
                value={status}
                onChange={(e) =>
                  setStatus(
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
              <label htmlFor={`edit-priority-${task.id}`}>
                Priority
              </label>

              <select
                id={`edit-priority-${task.id}`}
                value={priority}
                onChange={(e) =>
                  setPriority(
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
              <label htmlFor={`edit-assignee-${task.id}`}>
                Assignee
              </label>

              <select
                id={`edit-assignee-${task.id}`}
                value={assignee}
                onChange={(e) =>
                  setAssignee(
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
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={
                saving || !title.trim()
              }
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </div>
      </article>
    )
  }

  return (
    <article className="task-card card">

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

          <h3>
            {task.title}
          </h3>

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
              {getUserName(task.assignee_id)}
            </span>

          </div>

          <select
            className={`status-select status-${task.status}`}
            value={task.status}
            onChange={(e) =>
              onStatusChange(
                task,
                e.target.value as TaskStatus
              )
            }
            disabled={saving}
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
              onClick={startEditing}
              disabled={saving || deleting}
            >
              Edit
            </button>

            <button
              className="btn-small btn-danger-small"
              onClick={() => onDelete(task.id)}
              disabled={saving || deleting}
            >
              {deleting
                ? "..."
                : "Delete"}
            </button>

          </div>

        </div>

      </div>

    </article>
  )
}

export default TaskCard
