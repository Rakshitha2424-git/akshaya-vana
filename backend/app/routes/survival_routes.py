from datetime import date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, SurvivalInspection
from app.schemas import (
    SurvivalInspectionCreate,
    SurvivalInspectionResponse,
)
from app.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/survival",
    tags=["Tree Survival"]
)

MILESTONES = [30, 90, 180, 365]


# 1. Generate inspection schedule
@router.post("/projects/{project_id}/schedule")
def generate_inspection_schedule(
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if not project.planting_date:
        raise HTTPException(
            status_code=400,
            detail="Add a planting date to this project first"
        )

    if not project.initial_trees_planted or project.initial_trees_planted <= 0:
        raise HTTPException(
            status_code=400,
            detail="Initial trees planted must be greater than zero"
        )

    created_count = 0

    for milestone in MILESTONES:
        existing = db.query(SurvivalInspection).filter(
            SurvivalInspection.project_id == project.id,
            SurvivalInspection.milestone_days == milestone
        ).first()

        if existing:
            continue

        inspection = SurvivalInspection(
            project_id=project.id,
            milestone_days=milestone,
            scheduled_date=(
                project.planting_date + timedelta(days=milestone)
            )
        )

        db.add(inspection)
        created_count += 1

    db.commit()

    return {
        "message": "Inspection schedule generated successfully",
        "project_id": str(project.id),
        "created_inspections": created_count
    }


# 2. Get all inspections for a project
@router.get(
    "/projects/{project_id}/inspections",
    response_model=list[SurvivalInspectionResponse]
)
def get_project_inspections(
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    inspections = db.query(SurvivalInspection).filter(
        SurvivalInspection.project_id == project.id
    ).order_by(
        SurvivalInspection.milestone_days
    ).all()

    return inspections


# 3. Record an inspection result
@router.post(
    "/inspections/{inspection_id}/record",
    response_model=SurvivalInspectionResponse
)
def record_inspection(
    inspection_id: str,
    inspection_data: SurvivalInspectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
    ):
    inspection = db.query(SurvivalInspection).filter(
        SurvivalInspection.id == inspection_id
    ).first()

    if not inspection:
        raise HTTPException(
            status_code=404,
            detail="Inspection not found"
        )

    project = db.query(Project).filter(
        Project.id == inspection.project_id
    ).first()

    if not project.planting_date:
        raise HTTPException(
        status_code=400,
        detail="Project does not have a planting date"
    )
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Associated project not found"
        )

    if inspection.inspection_date is not None:
        raise HTTPException(
            status_code=400,
            detail="This inspection has already been recorded"
        )

    if inspection_data.inspection_date < project.planting_date:
        raise HTTPException(
            status_code=400,
            detail="Inspection date cannot be before planting date"
        )

    initial_count = (
        project.initial_trees_planted
        if project.initial_trees_planted is not None
        else project.planted_trees
    )

    recorded_count = (
        inspection_data.surviving_trees
        + inspection_data.dead_trees
        + inspection_data.missing_trees
    )

    if recorded_count != initial_count:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Surviving + dead + missing trees must equal "
                f"the original planted count ({initial_count})."
            )
        )

    inspection.inspection_date = inspection_data.inspection_date
    inspection.surviving_trees = inspection_data.surviving_trees
    inspection.dead_trees = inspection_data.dead_trees
    inspection.missing_trees = inspection_data.missing_trees
    inspection.replaced_trees = inspection_data.replaced_trees
    inspection.notes = inspection_data.notes
    inspection.inspected_by = current_user.id

    try:
        db.commit()
        db.refresh(inspection)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save inspection"
        )

    return inspection


# 4. Get survival dashboard statistics
@router.get("/dashboard")
def get_survival_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    projects = db.query(Project).filter(
        Project.planting_date.isnot(None)
    ).all()

    total_projects_monitored = 0
    total_trees_planted = 0
    total_trees_surviving = 0
    overdue_inspections = 0

    for project in projects:
        initial_count = (
            project.initial_trees_planted
            if project.initial_trees_planted is not None
            else project.planted_trees
        )

        inspections = db.query(SurvivalInspection).filter(
            SurvivalInspection.project_id == project.id
        ).all()

        completed = [
            item for item in inspections
            if item.inspection_date is not None
        ]

        if completed:
            latest = max(
                completed,
                key=lambda item: item.inspection_date
            )

            total_projects_monitored += 1
            total_trees_planted += initial_count
            total_trees_surviving += latest.surviving_trees

        overdue_inspections += sum(
            1 for item in inspections
            if item.inspection_date is None
            and item.scheduled_date < date.today()
        )

    survival_rate = (
        round(
            total_trees_surviving / total_trees_planted * 100,
            2
        )
        if total_trees_planted > 0 else 0
    )

    return {
        "total_projects_monitored": total_projects_monitored,
        "total_trees_planted": total_trees_planted,
        "total_trees_surviving": total_trees_surviving,
        "overall_survival_rate": survival_rate,
        "overdue_inspections": overdue_inspections
    }