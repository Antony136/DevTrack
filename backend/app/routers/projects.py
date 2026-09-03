from fastapi import APIRouter

router = APIRouter()


@router.get("/projects")
def get_projects():
    return {
        "projects": []
    }


@router.get("/projects/{project_id}")
def get_project(project_id: int):
    return {
        "id": project_id
    }


