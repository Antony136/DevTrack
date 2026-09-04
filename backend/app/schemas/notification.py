from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    message: str
    type: str
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True