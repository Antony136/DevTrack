import {
  type Task,
  type TaskStatus,
} from "../types/task"
import {
  formatPriority,
  formatStatus,
  initialsFromName,
} from "../utils/format"
import Icon from "./Icon"

interface MemberLike {
  id?: number
  user_id?: number
  username: string
}

interface TaskCardProps {
  task: Task
  users: MemberLike[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
  saving: boolean
  deleting: boolean
}

function TaskCard({
  task,
  users,
  onEdit,
  onDelete,
  onStatusChange,
  saving,
  deleting,
}: TaskCardProps) {
  const assignee = users.find(
    (user) => (user.id ?? user.user_id) === task.assignee_id
  )
  const assigneeName = assignee?.username || "Unassigned"

  return (
    <article className={`task-card priority-edge-${task.priority}`}>
      <div className="task-card-top">
        <span className={`priority-badge priority-badge-${task.priority}`}>
          {formatPriority(task.priority)}
        </span>

        {task.project_name && (
          <span
            className="project-badge"
            style={{
              fontSize: "0.8rem",
              fontWeight: 500,
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-muted, #94a3b8)",
            }}
          >
            {task.project_name}
          </span>
        )}

        <span className="task-id">#{task.id}</span>
      </div>

      <div className="task-card-content">
        <h3>{task.title}</h3>
        <p>{task.description || "No description provided."}</p>
      </div>

      <div className="task-meta">
        <div className="task-assignee">
          <div className="avatar avatar-sm">
            {initialsFromName(assigneeName)}
          </div>
          <span>{assigneeName}</span>
        </div>

        <select
          className={`status-select status-select-${task.status}`}
          value={task.status}
          onChange={(event) =>
            onStatusChange(task, event.target.value as TaskStatus)
          }
          disabled={saving}
          aria-label={`Status for ${task.title}`}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="task-card-footer">
        <span className={`status-pill status-pill-${task.status}`}>
          {formatStatus(task.status)}
        </span>

        <div className="task-actions">
          <button
            className="icon-text-button"
            type="button"
            onClick={() => onEdit(task)}
            disabled={saving || deleting}
          >
            <Icon name="edit" />
            Edit
          </button>

          <button
            className="icon-text-button danger"
            type="button"
            onClick={() => onDelete(task)}
            disabled={saving || deleting}
          >
            <Icon name="trash" />
            {deleting ? "Deleting" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default TaskCard
