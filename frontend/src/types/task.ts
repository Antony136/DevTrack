export type TaskStatus = "todo" | "in_progress" | "done"

export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  project_id: number
  assignee_id: number | null
}

export interface TaskCreate {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: number | null
}