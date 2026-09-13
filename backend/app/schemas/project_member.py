from pydantic import BaseModel, ConfigDict


class ProjectMemberAdd(BaseModel):
    user_id: int


class ProjectMemberResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)
