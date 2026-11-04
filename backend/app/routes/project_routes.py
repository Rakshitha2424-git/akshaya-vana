from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from sqlalchemy import func
from app.database import get_db
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# 1. CREATE PROJECT
@router.post("/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    new_project = Project(
    **project_data.model_dump(),
    owner_id=current_user.id,
    )
    

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project

# dashboard stats
@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_projects = db.query(func.count(Project.id)).scalar() or 0

    target_trees = db.query(
        func.coalesce(func.sum(Project.target_trees), 0)
    ).scalar()

    planted_trees = db.query(
        func.coalesce(func.sum(Project.planted_trees), 0)
    ).scalar()

    overall_progress = (
        round((planted_trees / target_trees) * 100, 2)
        if target_trees > 0 else 0
    )

    recent_projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_projects": total_projects,
        "target_trees": target_trees,
        "planted_trees": planted_trees,
        "overall_progress": overall_progress,
        "recent_projects": [
            {
                "id": str(project.id),
                "title": project.title,
                "target_trees": project.target_trees,
                "planted_trees": project.planted_trees,
                "status": project.status
            }
            for project in recent_projects
        ]
    }

# 2. GET ALL PROJECTS
@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    projects = db.query(Project).all()

    return projects


# 3. GET SINGLE PROJECT
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


# 4. UPDATE PROJECT
@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    update_data = project_data.model_dump(exclude_unset=True)

    # Validate the combined tree counts
    new_target = update_data.get(
        "target_trees", project.target_trees
    )

    new_planted = update_data.get(
        "planted_trees", project.planted_trees
    )

    if new_planted > new_target:
        raise HTTPException(
            status_code=400,
            detail="Planted trees cannot exceed target trees"
        )

    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return project


# 5. DELETE PROJECT
@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }