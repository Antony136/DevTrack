from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.security import hash_password

router = APIRouter()


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User)).all()

    return users

@router.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user