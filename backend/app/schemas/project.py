from pydantic import BaseModel, Field, ConfigDict


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    description: str | None = Field(
        default=None,
        max_length=1000
    )


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_id: int

    model_config = ConfigDict(from_attributes=True)