from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class CommentCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=2000
    )


class CommentResponse(BaseModel):
    id: int
    content: str
    task_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)