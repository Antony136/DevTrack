from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.dashboard import DashboardResponse


router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardResponse
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_projects = db.scalar(
        select(func.count(Project.id))
        .where(Project.owner_id == current_user.id)
    )

    total_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(Project.owner_id == current_user.id)
    )

    todo_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.status == "todo"
        )
    )

    in_progress_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.status == "in_progress"
        )
    )

    done_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.status == "done"
        )
    )

    low_priority_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.priority == "low"
        )
    )

    medium_priority_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.priority == "medium"
        )
    )

    high_priority_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.priority == "high"
        )
    )

    unassigned_tasks = db.scalar(
        select(func.count(Task.id))
        .join(Project)
        .where(
            Project.owner_id == current_user.id,
            Task.assignee_id.is_(None)
        )
    )

    return DashboardResponse(
        total_projects=total_projects or 0,
        total_tasks=total_tasks or 0,
        todo_tasks=todo_tasks or 0,
        in_progress_tasks=in_progress_tasks or 0,
        done_tasks=done_tasks or 0,
        low_priority_tasks=low_priority_tasks or 0,
        medium_priority_tasks=medium_priority_tasks or 0,
        high_priority_tasks=high_priority_tasks or 0,
        unassigned_tasks=unassigned_tasks or 0
    )