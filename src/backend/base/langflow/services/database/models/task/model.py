from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import field_serializer, field_validator
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from langflow.serialization.serialization import serialize

if TYPE_CHECKING:
    from langflow.services.database.models.flow.model import Flow


class TaskBase(SQLModel):
    title: str
    description: str
    attachments: list[str] = Field(sa_column=Column(JSON))
    author_id: UUID = Field(foreign_key="flow.id", index=True)
    assignee_id: UUID = Field(foreign_key="flow.id", index=True)
    category: str
    state: str
    status: str
    result: dict | None = Field(default=None, sa_column=Column(JSON))
    input_request: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cron_expression: str | None = Field(default=None)

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def validate_datetime(cls, v):
        if isinstance(v, datetime):
            return v
        return datetime.fromisoformat(v)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if not v:
            return "pending"
        valid_statuses = ["pending", "processing", "completed", "failed"]
        if v not in valid_statuses:
            msg = f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            raise ValueError(msg)
        return v


class Task(TaskBase, table=True):  # type: ignore[call-arg]
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author: Flow = Relationship(sa_relationship_kwargs={"primaryjoin": "Task.author_id==Flow.id"})
    assignee: Flow = Relationship(sa_relationship_kwargs={"primaryjoin": "Task.assignee_id==Flow.id"})


class TaskCreate(SQLModel):
    title: str
    description: str
    attachments: list[str] = Field(default_factory=list)
    author_id: UUID
    assignee_id: UUID
    category: str
    state: str
    status: str = "pending"
    cron_expression: str | None = None


class TaskRead(TaskBase):
    id: UUID

    @field_serializer("result")
    @classmethod
    def serialize_result(cls, v):
        return serialize(v)


class TaskUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    attachments: list[str] | None = None
    author_id: UUID | None = None
    assignee_id: UUID | None = None
    category: str | None = None
    status: str | None = None
    state: str | None = None
    result: dict | None = None
