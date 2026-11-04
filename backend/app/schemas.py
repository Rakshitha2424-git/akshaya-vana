from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator,field_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

from datetime import date

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: Literal["admin", "viewer"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# PROJECT SCHEMAS
# -------------------------

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None

    target_trees: int = Field(default=0, ge=0)
    planted_trees: int = Field(default=0, ge=0)
    location: Optional[str] = None
    planting_date: Optional[date] = None
    initial_trees_planted: Optional[int] = Field(default=None, ge=0)

    status: Literal[
        "planning",
        "in-progress",
        "completed"
    ] = "planning"

    @model_validator(mode="after")
    def check_tree_counts(self):
        if self.planted_trees > self.target_trees:
            raise ValueError(
                "Planted trees cannot exceed target trees"
            )
        return self




class ProjectResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]

    target_trees: int
    planted_trees: int
    status: str

    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    
class SurvivalInspectionCreate(BaseModel):
    inspection_date: date
    surviving_trees: int = Field(ge=0)
    dead_trees: int = Field(ge=0)
    missing_trees: int = Field(ge=0)
    replaced_trees: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class SurvivalInspectionResponse(BaseModel):
    id: UUID
    project_id: UUID
    milestone_days: int
    scheduled_date: date
    inspection_date: Optional[date] = None
    surviving_trees: int
    dead_trees: int
    missing_trees: int
    replaced_trees: int
    notes: Optional[str] = None
    inspected_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)

class SurvivalDashboardResponse(BaseModel):
    total_projects_monitored: int
    total_trees_planted: int
    total_trees_surviving: int
    overall_survival_rate: float
    overdue_inspections: int



class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

    target_trees: Optional[int] = Field(default=None, ge=0)
    planted_trees: Optional[int] = Field(default=None, ge=0)

    planting_date: Optional[date] = None
    status: Optional[str] = None

   
@field_validator("status")
@classmethod
def validate_status(cls, value):
    allowed_statuses = [
        "planning",
        "in-progress",
        "completed"
    ]

    if value is not None and value not in allowed_statuses:
        raise ValueError("Invalid project status")

    return value

