from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comment import Comment
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse


router = APIRouter()

@router.get(
    "/tasks/{task_id}/comments",
    response_model=list[CommentResponse]
)
def get_comments(
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

    comments = db.scalars(
        select(Comment)
        .where(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
    ).all()

    return comments

@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=201
)
def create_comment(
    task_id: int,
    comment: CommentCreate,
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

    new_comment = Comment(
        content=comment.content,
        task_id=task_id,
        user_id=current_user.id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment