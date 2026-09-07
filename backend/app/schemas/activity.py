from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    id: int
    action: str
    description: str
    task_id: int | None
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)