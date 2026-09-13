from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.models.user import User
from app.schemas.task import MyTaskResponse
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.dependencies import get_current_user
from app.security import (
    create_access_token,
    hash_password,
    verify_password
)

router = APIRouter()


@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.scalars(select(User)).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.scalar(
        select(User).where(
            (User.username == user.username) |
            (User.email == user.email)
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.scalar(
        select(User).where(User.username == user.username)
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(existing_user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/me/tasks", response_model=list[MyTaskResponse])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(
            Task.id,
            Task.title,
            Task.description,
            Task.status,
            Task.priority,
            Task.project_id,
            Project.name.label("project_name"),
            Task.assignee_id
        )
        .join(Project, Project.id == Task.project_id)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(
            Task.assignee_id == current_user.id,
            ProjectMember.user_id == current_user.id
        )
        .order_by(Task.id.desc())
    )
    results = db.execute(stmt).all()

    return [
        MyTaskResponse(
            id=row.id,
            title=row.title,
            description=row.description,
            status=row.status,
            priority=row.priority,
            project_id=row.project_id,
            project_name=row.project_name,
            assignee_id=row.assignee_id
        )
        for row in results
    ]