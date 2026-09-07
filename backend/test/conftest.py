import os

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Import all models so SQLAlchemy knows about all tables
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment
from app.models.activity_log import ActivityLog
from app.models.notification import Notification


load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

test_engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client):
    client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/login",
        json={
            "username": "testuser",
            "password": "password123"
        }
    )

    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {
        "Authorization": f"Bearer {auth_token}"
    }

@pytest.fixture
def project(client, auth_headers):
    response = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Test Project",
            "description": "Project for task tests"
        }
    )

    assert response.status_code == 201

    return response.json()

@pytest.fixture
def second_user(client):
    response = client.post(
        "/users",
        json={
            "username": "seconduser",
            "email": "second@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == 201

    user = response.json()

    login_response = client.post(
        "/login",
        json={
            "username": "seconduser",
            "password": "password123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "user": user,
        "token": token,
        "headers": {
            "Authorization": f"Bearer {token}"
        }
    }