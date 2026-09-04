from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus, TaskPriority, TaskSortField
from app.utils.activity import create_activity_log
from app.utils.notification import create_notification
from app.models.activity_log import ActivityLog

router = APIRouter()

@router.get("/tasks/search", response_model=list[TaskResponse])
def search_tasks(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.scalars(
        select(Task)
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            or_(
                Task.title.ilike(f"%{q}%"),
                Task.description.ilike(f"%{q}%")
            )
        )
    ).all()

    return tasks

@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=201
)
def create_task(
    project_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if task.assignee_id is not None:
        assignee = db.get(User, task.assignee_id)

        if assignee is None:
            raise HTTPException(
                status_code=404,
                detail="Assignee not found"
            )

    new_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project_id=project_id,
        assignee_id=task.assignee_id
    )

    db.add(new_task)
    db.flush()

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="task_created",
        description=f'Task "{new_task.title}" was created',
        task_id=new_task.id
    )

    db.commit()
    db.refresh(new_task)

    return new_task


@router.get(
    "/projects/{project_id}/tasks",
    response_model=list[TaskResponse]
)
def get_tasks(
    project_id: int,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    assignee_id: int | None = None,
    sort_by: TaskSortField = TaskSortField.ID,
    descending: bool = False,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    query = select(Task).where(
        Task.project_id == project_id
    )

    if status is not None:
        query = query.where(Task.status == status.value)

    if priority is not None:
        query = query.where(Task.priority == priority.value)

    if assignee_id is not None:
        query = query.where(Task.assignee_id == assignee_id)

    sort_column = {
        TaskSortField.ID: Task.id,
        TaskSortField.TITLE: Task.title,
        TaskSortField.PRIORITY: Task.priority,
        TaskSortField.STATUS: Task.status
    }[sort_by]

    if descending:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    tasks = db.scalars(query).all()

    return tasks

@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.scalar(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.owner_id == current_user.id
        )
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task

@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.scalar(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.owner_id == current_user.id
        )
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    old_status = task.status
    old_priority = task.priority
    old_assignee_id = task.assignee_id

    update_data = task_update.model_dump(
        exclude_unset=True
    )

    if (
        "assignee_id" in update_data
        and update_data["assignee_id"] is not None
    ):
        assignee = db.get(
            User,
            update_data["assignee_id"]
        )

        if assignee is None:
            raise HTTPException(
                status_code=404,
                detail="Assignee not found"
            )
        
    for field, value in update_data.items():
        if field in {"status", "priority"} and value is not None:
            value = value.value
        setattr(task, field, value)

    if (
        "assignee_id" in update_data
        and old_assignee_id != task.assignee_id
        and task.assignee_id is not None
    ):
        create_notification(
            db=db,
            user_id=task.assignee_id,
            message=f'You were assigned to task "{task.title}"',
            notification_type="task_assigned"
        )
        
    if "status" in update_data:
        create_activity_log(
            db=db,
            user_id=current_user.id,
            action="status_changed",
            description=(
                f'Task "{task.title}" status changed '
                f"from {old_status} to {task.status}"
            ),
            task_id=task.id
        )

    if "priority" in update_data:
        create_activity_log(
            db=db,
            user_id=current_user.id,
            action="priority_changed",
            description=(
                f'Task "{task.title}" priority changed '
                f"from {old_priority} to {task.priority}"
            ),
            task_id=task.id
        )

    if "assignee_id" in update_data:
        create_activity_log(
            db=db,
            user_id=current_user.id,
            action="assignee_changed",
            description=(
                f'Task "{task.title}" assignee changed '
                f"from {old_assignee_id} to {task.assignee_id}"
            ),
            task_id=task.id
        )

    db.commit()
    db.refresh(task)

    return task

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.scalar(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.owner_id == current_user.id
        )
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }

