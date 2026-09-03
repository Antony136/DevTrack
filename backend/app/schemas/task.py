from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(
        default=None,
        max_length=2000
    )
    status: str = "todo"
    priority: str = "medium"

class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )

    status: str | None = None
    priority: str | None = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    project_id: int

    class Config:
        from_attributes = True
