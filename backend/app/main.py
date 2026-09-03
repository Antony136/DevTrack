from fastapi import FastAPI
from app.models.user import User
from app.models.project import Project
from app.database import Base, engine
from app.routers import projects, users

app = FastAPI()

app.include_router(projects.router)
app.include_router(users.router)

@app.get("/")
def home():
    return {"message": "DevTrack API"}

Base.metadata.create_all(bind=engine)