import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Text,
    DateTime, Date, ForeignKey,
    CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="viewer", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    projects = relationship("Project", back_populates="owner")

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'viewer')",
            name="check_user_role"
        ),
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Existing project fields
    target_trees = Column(Integer, default=0, nullable=False)
    planted_trees = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="planning", nullable=False)

    # New plantation monitoring fields
    location = Column(String(255), nullable=True)
    planting_date = Column(Date, nullable=True)
    initial_trees_planted = Column(Integer, nullable=True)

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    owner = relationship("User", back_populates="projects")

    # New relationship
    inspections = relationship(
        "SurvivalInspection",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "target_trees >= 0 AND planted_trees >= 0",
            name="check_tree_counts_nonnegative"
        ),
        CheckConstraint(
            "planted_trees <= target_trees",
            name="check_planted_not_above_target"
        ),
        CheckConstraint(
            "status IN ('planning', 'in-progress', 'completed')",
            name="check_project_status"
        ),
        CheckConstraint(
            "initial_trees_planted IS NULL OR initial_trees_planted >= 0",
            name="check_initial_trees_nonnegative"
        ),
    )
class SurvivalInspection(Base):
    __tablename__ = "survival_inspections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    milestone_days = Column(Integer, nullable=False)

    scheduled_date = Column(Date, nullable=False)
    inspection_date = Column(Date, nullable=True)

    surviving_trees = Column(Integer, default=0, nullable=False)
    dead_trees = Column(Integer, default=0, nullable=False)
    missing_trees = Column(Integer, default=0, nullable=False)
    replaced_trees = Column(Integer, default=0, nullable=False)

    notes = Column(Text, nullable=True)

    inspected_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    project = relationship(
        "Project",
        back_populates="inspections"
    )

    inspector = relationship("User")

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "milestone_days",
            name="unique_project_inspection_milestone"
        ),
        CheckConstraint(
            "milestone_days IN (30, 90, 180, 365)",
            name="check_valid_inspection_milestone"
        ),
        CheckConstraint(
            "surviving_trees >= 0 AND dead_trees >= 0 "
            "AND missing_trees >= 0 AND replaced_trees >= 0",
            name="check_inspection_counts_nonnegative"
        ),
    )