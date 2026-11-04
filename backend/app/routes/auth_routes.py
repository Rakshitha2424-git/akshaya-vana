
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db, settings
from app.models import User
from app.schemas import UserRegister, UserResponse, LoginRequest
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# 1. USER REGISTRATION
@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash the password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role="viewer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# 2. USER LOGIN
@router.post("/login")
def login_user(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    # Find user by email
    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    # Verify password
    if not user or not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate JWT token
    access_token = create_access_token(user.id)

    # Store token in HttpOnly cookie
    response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,
    samesite="none",
    max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
)

    return {
        "message": "Login successful",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role
        }
    }


# 3. GET CURRENT USER
@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


# 4. USER LOGOUT
@router.post("/logout")
def logout_user(response: Response):

    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return {
        "message": "Logged out successfully"
    }
