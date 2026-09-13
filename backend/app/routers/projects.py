from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_project_for_member, get_project_owner
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.schemas.project_member import ProjectMemberAdd, ProjectMemberResponse
from app.utils.activity import create_activity_log


router = APIRouter()


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=201
)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id
    )

    db.add(new_project)
    db.flush()

    owner_member = ProjectMember(
        project_id=new_project.id,
        user_id=current_user.id,
        role="owner"
    )

    db.add(owner_member)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get(
    "/projects",
    response_model=list[ProjectResponse]
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.scalars(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(
            ProjectMember.user_id == current_user.id
        )
    ).all()

    return projects


@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project: Project = Depends(get_project_for_member)
):
    return project


@router.patch(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_owner)
):
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


@router.delete("/projects/{project_id}")
def delete_project(
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_owner)
):
    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }


# -------------------------
# Project Members API
# -------------------------

@router.get(
    "/projects/{project_id}/members",
    response_model=list[ProjectMemberResponse]
)
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_member)
):
    stmt = (
        select(
            ProjectMember.user_id,
            User.username,
            User.email,
            ProjectMember.role
        )
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
    )
    results = db.execute(stmt).all()

    return [
        ProjectMemberResponse(
            user_id=row.user_id,
            username=row.username,
            email=row.email,
            role=row.role
        )
        for row in results
    ]


@router.post(
    "/projects/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=201
)
def add_project_member(
    project_id: int,
    member_in: ProjectMemberAdd,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_owner)
):
    target_user = db.get(User, member_in.user_id)
    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == member_in.user_id
        )
    )

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this project"
        )

    new_member = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role="member"
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return ProjectMemberResponse(
        user_id=target_user.id,
        username=target_user.username,
        email=target_user.email,
        role=new_member.role
    )


@router.delete(
    "/projects/{project_id}/members/{user_id}"
)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project: Project = Depends(get_project_owner)
):
    if user_id == current_user.id or user_id == project.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Owner cannot be removed from the project"
        )

    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Project member not found"
        )

    target_user = db.get(User, user_id)
    username = target_user.username if target_user else f"User #{user_id}"

    db.delete(member)

    unassigned_tasks = db.scalars(
        select(Task).where(
            Task.project_id == project_id,
            Task.assignee_id == user_id
        )
    ).all()

    unassigned_count = len(unassigned_tasks)
    for task in unassigned_tasks:
        task.assignee_id = None

    task_str = "1 task was unassigned" if unassigned_count == 1 else f"{unassigned_count} tasks were unassigned"
    description = f"{username} was removed from the project; {task_str}."

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="member_removed",
        description=description
    )

    db.commit()

    return {
        "message": "Member removed successfully"
    }