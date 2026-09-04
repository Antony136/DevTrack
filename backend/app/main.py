from fastapi import FastAPI
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment
from app.models.activity_log import ActivityLog
from app.models.notification import Notification

from app.database import Base, engine
from app.routers import projects, users, tasks, comments, notifications

app = FastAPI()

app.include_router(projects.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(notifications.router)

@app.get("/")
def home():
    return {"message": "DevTrack API"}

Base.metadata.create_all(bind=engine)

