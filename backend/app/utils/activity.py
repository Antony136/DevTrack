from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


def create_activity_log(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    task_id: int | None = None
):
    log = ActivityLog(
        action=action,
        description=description,
        task_id=task_id,
        user_id=user_id
    )

    db.add(log)