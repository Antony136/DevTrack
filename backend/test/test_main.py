from sqlalchemy import select
from app.models.project_member import ProjectMember


def test_home(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "DevTrack API"
    }


# -------------------------
# Authentication
# -------------------------

def test_invalid_login(client):
    response = client.post(
        "/login",
        json={
            "username": "does_not_exist",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401


def test_protected_endpoint_without_token(client):
    response = client.get("/me")

    assert response.status_code == 401


def test_invalid_token(client):
    response = client.get(
        "/me",
        headers={
            "Authorization": "Bearer invalid_token"
        }
    )

    assert response.status_code == 401


def test_register_user(client):
    response = client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_username(client):
    client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test1@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test2@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == 400


def test_login(client):
    client.post(
        "/users",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/login",
        json={
            "username": "loginuser",
            "password": "password123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_me_with_token(client, auth_headers):
    response = client.get(
        "/me",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


# -------------------------
# Projects
# -------------------------

def test_create_project(client, auth_headers):
    response = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Test Project",
            "description": "A project created during testing"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Test Project"
    assert data["description"] == "A project created during testing"
    assert "id" in data


def test_create_project_adds_owner_member(client, auth_headers, db_session):
    response = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Member Test Project",
            "description": "Testing automatic owner membership"
        }
    )

    assert response.status_code == 201

    project_data = response.json()
    project_id = project_data["id"]

    member = db_session.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id
        )
    )

    assert member is not None
    assert member.role == "owner"
    assert member.user_id == project_data["owner_id"]


def test_get_projects(client, auth_headers):
    client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Project 1",
            "description": "First project"
        }
    )

    response = client.get(
        "/projects",
        headers=auth_headers
    )

    assert response.status_code == 200

    projects = response.json()

    assert len(projects) == 1
    assert projects[0]["name"] == "Project 1"


def test_user_cannot_access_another_users_project(client, auth_headers):
    response = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Private Project",
            "description": "Only owner should access this"
        }
    )

    assert response.status_code == 201

    project_id = response.json()["id"]

    # Create second user
    client.post(
        "/users",
        json={
            "username": "otheruser",
            "email": "other@example.com",
            "password": "password123"
        }
    )

    # Login as second user
    login_response = client.post(
        "/login",
        json={
            "username": "otheruser",
            "password": "password123"
        }
    )

    other_token = login_response.json()["access_token"]

    # Try to access first user's project
    response = client.get(
        f"/projects/{project_id}",
        headers={
            "Authorization": f"Bearer {other_token}"
        }
    )

    assert response.status_code == 404


# -------------------------
# Tasks
# -------------------------

def test_invalid_task_status(client, auth_headers):
    response = client.post(
        "/projects/1/tasks",
        headers=auth_headers,
        json={
            "title": "Test task",
            "status": "invalid_status",
            "priority": "high"
        }
    )

    assert response.status_code == 422

def test_create_task(client, auth_headers, project):
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Build authentication",
            "description": "Implement JWT authentication",
            "priority": "high"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Build authentication"
    assert data["description"] == "Implement JWT authentication"
    assert data["priority"] == "high"
    assert data["status"] == "todo"
    assert data["project_id"] == project["id"]

def test_get_task(client, auth_headers, project):
    create_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Test task",
            "priority": "medium"
        }
    )

    task_id = create_response.json()["id"]

    response = client.get(
        f"/tasks/{task_id}",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task_id
    assert data["title"] == "Test task"

def test_update_task(client, auth_headers, project):
    create_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Old title",
            "priority": "low"
        }
    )

    task_id = create_response.json()["id"]

    response = client.patch(
        f"/tasks/{task_id}",
        headers=auth_headers,
        json={
            "title": "Updated title",
            "priority": "high",
            "status": "in_progress"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Updated title"
    assert data["priority"] == "high"
    assert data["status"] == "in_progress"

def test_delete_task(client, auth_headers, project):
    create_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Task to delete"
        }
    )

    task_id = create_response.json()["id"]

    response = client.delete(
        f"/tasks/{task_id}",
        headers=auth_headers
    )

    assert response.status_code == 200

    response = client.get(
        f"/tasks/{task_id}",
        headers=auth_headers
    )

    assert response.status_code == 404

def test_get_nonexistent_task(client, auth_headers):
    response = client.get(
        "/tasks/99999",
        headers=auth_headers
    )

    assert response.status_code == 404

def test_invalid_task_status(client, auth_headers, project):
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Test task",
            "status": "invalid_status",
            "priority": "high"
        }
    )

    assert response.status_code == 422

def test_invalid_task_priority(client, auth_headers, project):
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Test task",
            "priority": "super_high"
        }
    )

    assert response.status_code == 422


def test_user_cannot_access_another_users_task(
    client,
    auth_headers,
    project
):
    # User A creates task
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Private task"
        }
    )

    assert response.status_code == 201

    task_id = response.json()["id"]

    # Create User B
    client.post(
        "/users",
        json={
            "username": "taskotheruser",
            "email": "taskother@example.com",
            "password": "password123"
        }
    )

    login_response = client.post(
        "/login",
        json={
            "username": "taskotheruser",
            "password": "password123"
        }
    )

    other_token = login_response.json()["access_token"]

    # User B tries to access User A's task
    response = client.get(
        f"/tasks/{task_id}",
        headers={
            "Authorization": f"Bearer {other_token}"
        }
    )

    assert response.status_code == 404

def test_search_tasks(client, auth_headers, project):
    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Build authentication",
            "description": "Implement JWT"
        }
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Create dashboard",
            "description": "Build statistics page"
        }
    )

    response = client.get(
        "/tasks/search?q=authentication",
        headers=auth_headers
    )

    assert response.status_code == 200

    tasks = response.json()

    assert len(tasks) == 1
    assert tasks[0]["title"] == "Build authentication"

def test_filter_tasks_by_status(client, auth_headers, project):
    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Todo task",
            "status": "todo"
        }
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Completed task",
            "status": "done"
        }
    )

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={"status": "done"}
    )

    assert response.status_code == 200

    tasks = response.json()

    assert len(tasks) == 1
    assert tasks[0]["title"] == "Completed task"

def test_filter_tasks_by_priority(client, auth_headers, project):
    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Low task",
            "priority": "low"
        }
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "High task",
            "priority": "high"
        }
    )

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={"priority": "high"}
    )

    assert response.status_code == 200

    tasks = response.json()

    assert len(tasks) == 1
    assert tasks[0]["title"] == "High task"

def test_sort_tasks_by_title(client, auth_headers, project):
    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Zebra task"
        }
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Apple task"
        }
    )

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={
            "sort_by": "title"
        }
    )

    assert response.status_code == 200

    tasks = response.json()

    assert tasks[0]["title"] == "Apple task"
    assert tasks[1]["title"] == "Zebra task"

def test_sort_tasks_descending(client, auth_headers, project):
    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={"title": "Apple task"}
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={"title": "Zebra task"}
    )

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={
            "sort_by": "title",
            "descending": True
        }
    )

    assert response.status_code == 200

    tasks = response.json()

    assert tasks[0]["title"] == "Zebra task"
    assert tasks[1]["title"] == "Apple task"

def test_task_pagination(client, auth_headers, project):
    for i in range(5):
        response = client.post(
            f"/projects/{project['id']}/tasks",
            headers=auth_headers,
            json={
                "title": f"Task {i}"
            }
        )

        assert response.status_code == 201

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={
            "page": 1,
            "limit": 2
        }
    )

    assert response.status_code == 200

    tasks = response.json()

    assert len(tasks) == 2

    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={
            "page": 2,
            "limit": 2
        }
    )

    assert response.status_code == 200

    tasks = response.json()

    assert len(tasks) == 2


def test_invalid_pagination(client, auth_headers, project):
    response = client.get(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        params={
            "page": 0,
            "limit": 0
        }
    )

    assert response.status_code == 422

def test_create_comment(client, auth_headers, project):
    task_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Task with comment"
        }
    )

    assert task_response.status_code == 201

    task_id = task_response.json()["id"]

    response = client.post(
        f"/tasks/{task_id}/comments",
        headers=auth_headers,
        json={
            "content": "This task looks good."
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["content"] == "This task looks good."
    assert data["task_id"] == task_id
    assert "user_id" in data
    assert "created_at" in data

def test_get_comments(client, auth_headers, project):
    task_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Comment task"
        }
    )

    task_id = task_response.json()["id"]

    client.post(
        f"/tasks/{task_id}/comments",
        headers=auth_headers,
        json={
            "content": "First comment"
        }
    )

    client.post(
        f"/tasks/{task_id}/comments",
        headers=auth_headers,
        json={
            "content": "Second comment"
        }
    )

    response = client.get(
        f"/tasks/{task_id}/comments",
        headers=auth_headers
    )

    assert response.status_code == 200

    comments = response.json()

    assert len(comments) == 2
    assert comments[0]["content"] == "First comment"
    assert comments[1]["content"] == "Second comment"

def test_empty_comment(client, auth_headers, project):
    task_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Comment validation task"
        }
    )

    task_id = task_response.json()["id"]

    response = client.post(
        f"/tasks/{task_id}/comments",
        headers=auth_headers,
        json={
            "content": ""
        }
    )

    assert response.status_code == 422

def test_task_creation_activity(client, auth_headers, project):
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Activity task"
        }
    )

    assert response.status_code == 201

    task_id = response.json()["id"]

    response = client.get(
        f"/tasks/{task_id}/activity",
        headers=auth_headers
    )

    assert response.status_code == 200

    activities = response.json()

    assert len(activities) >= 1
    assert activities[0]["task_id"] == task_id

def test_task_update_creates_activity(
    client,
    auth_headers,
    project
):
    task_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Original title",
            "priority": "low"
        }
    )

    task_id = task_response.json()["id"]

    response = client.patch(
        f"/tasks/{task_id}",
        headers=auth_headers,
        json={
            "title": "Updated title",
            "priority": "high"
        }
    )

    assert response.status_code == 200

    response = client.get(
        f"/tasks/{task_id}/activity",
        headers=auth_headers
    )

    assert response.status_code == 200

    activities = response.json()

    assert len(activities) >= 2

def test_user_cannot_access_another_users_activity(
    client,
    auth_headers,
    project
):
    task_response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Private activity task"
        }
    )

    task_id = task_response.json()["id"]

    # Create User B
    client.post(
        "/users",
        json={
            "username": "activityuser",
            "email": "activity@example.com",
            "password": "password123"
        }
    )

    login_response = client.post(
        "/login",
        json={
            "username": "activityuser",
            "password": "password123"
        }
    )

    other_token = login_response.json()["access_token"]

    response = client.get(
        f"/tasks/{task_id}/activity",
        headers={
            "Authorization": f"Bearer {other_token}"
        }
    )

    assert response.status_code == 404

def test_task_assignment_creates_notification(
    client,
    auth_headers,
    project,
    second_user
):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Assigned Task",
            "description": "Task assigned to another user",
            "assignee_id": second_user["user"]["id"]
        }
    )

    assert response.status_code == 201

    response = client.get(
        "/notifications",
        headers=second_user["headers"]
    )

    assert response.status_code == 200

    notifications = response.json()

    assert len(notifications) == 1
    assert notifications[0]["user_id"] == second_user["user"]["id"]
    assert notifications[0]["is_read"] is False

def test_get_notifications(
    client,
    auth_headers,
    project,
    second_user
):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Notification Task",
            "assignee_id": second_user["user"]["id"]
        }
    )

    response = client.get(
        "/notifications",
        headers=second_user["headers"]
    )

    assert response.status_code == 200

    notifications = response.json()

    assert len(notifications) == 1
    assert notifications[0]["type"] == "task_assigned"

def test_mark_notification_as_read(
    client,
    auth_headers,
    project,
    second_user
):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Read Notification Task",
            "assignee_id": second_user["user"]["id"]
        }
    )

    response = client.get(
        "/notifications",
        headers=second_user["headers"]
    )

    notification_id = response.json()[0]["id"]

    response = client.patch(
        f"/notifications/{notification_id}/read",
        headers=second_user["headers"]
    )

    assert response.status_code == 200

    data = response.json()

    assert data["is_read"] is True

def test_user_cannot_mark_another_users_notification_as_read(
    client,
    auth_headers,
    project,
    second_user
):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Private Notification",
            "assignee_id": second_user["user"]["id"]
        }
    )

    response = client.get(
        "/notifications",
        headers=second_user["headers"]
    )

    notification_id = response.json()[0]["id"]

    response = client.patch(
        f"/notifications/{notification_id}/read",
        headers=auth_headers
    )

    assert response.status_code == 404


def test_dashboard_counts(client, auth_headers, project):
    # Create TODO + LOW + unassigned
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Todo Task",
            "status": "todo",
            "priority": "low"
        }
    )

    assert response.status_code == 201

    # Create IN_PROGRESS + MEDIUM
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "In Progress Task",
            "status": "in_progress",
            "priority": "medium"
        }
    )

    assert response.status_code == 201

    # Create DONE + HIGH
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Done Task",
            "status": "done",
            "priority": "high"
        }
    )

    assert response.status_code == 201

    response = client.get(
        "/dashboard",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_projects"] == 1
    assert data["total_tasks"] == 3

    assert data["todo_tasks"] == 1
    assert data["in_progress_tasks"] == 1
    assert data["done_tasks"] == 1

    assert data["low_priority_tasks"] == 1
    assert data["medium_priority_tasks"] == 1
    assert data["high_priority_tasks"] == 1

    assert data["unassigned_tasks"] == 3

def test_dashboard_only_counts_current_user(
    client,
    auth_headers,
    project,
    second_user
):
    # Current user's project/task
    response = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "My Task",
            "status": "todo",
            "priority": "low"
        }
    )

    assert response.status_code == 201

    # Second user's project
    response = client.post(
        "/projects",
        headers=second_user["headers"],
        json={
            "name": "Other Project",
            "description": "Another user's project"
        }
    )

    assert response.status_code == 201

    other_project = response.json()

    # Second user's task
    response = client.post(
        f"/projects/{other_project['id']}/tasks",
        headers=second_user["headers"],
        json={
            "title": "Other Task",
            "status": "done",
            "priority": "high"
        }
    )

    assert response.status_code == 201

    # Check dashboard as first user
    response = client.get(
        "/dashboard",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_projects"] == 1
    assert data["total_tasks"] == 1

    assert data["todo_tasks"] == 1
    assert data["in_progress_tasks"] == 0
    assert data["done_tasks"] == 0


# -------------------------
# Project Members API (Phase 2 & 3)
# -------------------------

def test_get_project_members(client, auth_headers, project):
    response = client.get(
        f"/projects/{project['id']}/members",
        headers=auth_headers
    )

    assert response.status_code == 200

    members = response.json()
    assert len(members) == 1
    assert members[0]["username"] == "testuser"
    assert members[0]["role"] == "owner"


def test_add_project_member(client, auth_headers, project, second_user):
    response = client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={
            "user_id": second_user["user"]["id"]
        }
    )

    assert response.status_code == 201

    member_data = response.json()
    assert member_data["user_id"] == second_user["user"]["id"]
    assert member_data["username"] == "seconduser"
    assert member_data["role"] == "member"

    # Verify second user can now get members list
    list_res = client.get(
        f"/projects/{project['id']}/members",
        headers=second_user["headers"]
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2


def test_add_duplicate_member_fails(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # Attempt adding second time
    response = client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "User is already a member of this project"


def test_add_nonexistent_user_fails(client, auth_headers, project):
    response = client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": 99999}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_non_member_cannot_get_members(client, project, second_user):
    response = client.get(
        f"/projects/{project['id']}/members",
        headers=second_user["headers"]
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


def test_non_owner_member_cannot_add_member(client, auth_headers, project, second_user):
    # Owner adds second_user as member
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # Register a third user
    third_res = client.post(
        "/users",
        json={
            "username": "thirduser",
            "email": "third@example.com",
            "password": "password123"
        }
    )
    third_id = third_res.json()["id"]

    # second_user (member, but not owner) attempts to add third_user
    response = client.post(
        f"/projects/{project['id']}/members",
        headers=second_user["headers"],
        json={"user_id": third_id}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


def test_remove_project_member(client, auth_headers, project, second_user, db_session):
    from app.models.task import Task
    from app.models.activity_log import ActivityLog

    # Add second user as member
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # Create a task assigned to second user
    task_res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Task for second user",
            "assignee_id": second_user["user"]["id"]
        }
    )
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    # Remove second user from project
    del_res = client.delete(
        f"/projects/{project['id']}/members/{second_user['user']['id']}",
        headers=auth_headers
    )
    assert del_res.status_code == 200

    # Verify task assignee_id is now None
    db_session.expire_all()
    task = db_session.get(Task, task_id)
    assert task.assignee_id is None

    # Verify activity log entry created
    log = db_session.scalar(
        select(ActivityLog).where(
            ActivityLog.action == "member_removed"
        )
    )
    assert log is not None
    assert "seconduser was removed from the project; 1 task was unassigned." in log.description


def test_owner_cannot_remove_self(client, auth_headers, project):
    response = client.get("/me", headers=auth_headers)
    owner_id = response.json()["id"]

    del_res = client.delete(
        f"/projects/{project['id']}/members/{owner_id}",
        headers=auth_headers
    )

    assert del_res.status_code == 400
    assert del_res.json()["detail"] == "Owner cannot be removed from the project"


def test_remove_nonexistent_member_fails(client, auth_headers, project, second_user):
    del_res = client.delete(
        f"/projects/{project['id']}/members/{second_user['user']['id']}",
        headers=auth_headers
    )

    assert del_res.status_code == 404
    assert del_res.json()["detail"] == "Project member not found"


# -------------------------
# Phase 4 — Fix Project Access
# -------------------------

def test_get_projects_returns_member_projects(client, auth_headers, project, second_user):
    # Owner adds second_user as member to project
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # second_user checks GET /projects
    res = client.get("/projects", headers=second_user["headers"])
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) == 1
    assert projects[0]["id"] == project["id"]


def test_member_can_get_project_detail(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    res = client.get(f"/projects/{project['id']}", headers=second_user["headers"])
    assert res.status_code == 200
    assert res.json()["name"] == project["name"]


def test_owner_can_patch_project_member_cannot(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # Member attempt to patch project -> 404
    res_member = client.patch(
        f"/projects/{project['id']}",
        headers=second_user["headers"],
        json={"name": "Updated Name"}
    )
    assert res_member.status_code == 404

    # Owner attempt to patch project -> 200
    res_owner = client.patch(
        f"/projects/{project['id']}",
        headers=auth_headers,
        json={"name": "Updated Name By Owner"}
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["name"] == "Updated Name By Owner"


def test_member_cannot_delete_project(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    res = client.delete(f"/projects/{project['id']}", headers=second_user["headers"])
    assert res.status_code == 404


# -------------------------
# Phase 5 — Fix Task Authorization
# -------------------------

def test_member_can_create_and_view_tasks(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    # Member creates task
    create_res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=second_user["headers"],
        json={"title": "Member Created Task"}
    )
    assert create_res.status_code == 201
    task_id = create_res.json()["id"]

    # Member views task
    get_res = client.get(f"/tasks/{task_id}", headers=second_user["headers"])
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Member Created Task"

    # Member lists project tasks
    list_res = client.get(f"/projects/{project['id']}/tasks", headers=second_user["headers"])
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_member_can_update_task_but_cannot_delete_task(client, auth_headers, project, second_user):
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    create_res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={"title": "Task To Test Delete"}
    )
    task_id = create_res.json()["id"]

    # Member updates task
    update_res = client.patch(
        f"/tasks/{task_id}",
        headers=second_user["headers"],
        json={"status": "in_progress"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"

    # Member tries to delete task -> 404
    del_res = client.delete(f"/tasks/{task_id}", headers=second_user["headers"])
    assert del_res.status_code == 404

    # Owner deletes task -> 200
    owner_del_res = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert owner_del_res.status_code == 200


# -------------------------
# Phase 6 — Fix Task Assignment
# -------------------------

def test_task_assignment_to_non_member_fails(client, auth_headers, project, second_user):
    # second_user is NOT a member yet
    res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Task Assigned to Non-Member",
            "assignee_id": second_user["user"]["id"]
        }
    )

    assert res.status_code == 400
    assert res.json()["detail"] == "Assignee is not a member of this project"


def test_task_assignment_to_member_succeeds(client, auth_headers, project, second_user):
    # Add second_user as member
    client.post(
        f"/projects/{project['id']}/members",
        headers=auth_headers,
        json={"user_id": second_user["user"]["id"]}
    )

    res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={
            "title": "Task Assigned to Member",
            "assignee_id": second_user["user"]["id"]
        }
    )

    assert res.status_code == 201
    assert res.json()["assignee_id"] == second_user["user"]["id"]


def test_update_task_assignee_to_non_member_fails(client, auth_headers, project, second_user):
    # Create task without assignee
    task_res = client.post(
        f"/projects/{project['id']}/tasks",
        headers=auth_headers,
        json={"title": "Task For Assignee Update"}
    )
    task_id = task_res.json()["id"]

    # Try assigning to second_user (who is not a member)
    update_res = client.patch(
        f"/tasks/{task_id}",
        headers=auth_headers,
        json={"assignee_id": second_user["user"]["id"]}
    )

    assert update_res.status_code == 400
    assert update_res.json()["detail"] == "Assignee is not a member of this project"