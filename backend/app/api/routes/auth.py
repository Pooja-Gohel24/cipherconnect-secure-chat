from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.database import get_db
from app.models import AuthToken, User
from app.schemas.auth import AuthTokensOut, LoginRequest, RefreshRequest, RegisterRequest
from app.services.auth_service import authenticate_user, issue_tokens, register_user, validate_refresh_session

router = APIRouter()


@router.post("/register", response_model=dict)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter((User.email == data.email) | (User.username == data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    register_user(db, data.username, data.email, data.password, data.bio, data.public_key, data.encrypted_private_key, "user")
    return {"message": "User registered successfully"}


@router.post("/login", response_model=AuthTokensOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token, refresh_token, expires_at = issue_tokens(db, user, data.device_id, data.device_name)
    return AuthTokensOut(access_token=access_token, refresh_token=refresh_token, expires_at=expires_at)


@router.post("/refresh", response_model=AuthTokensOut)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id or not validate_refresh_session(db, user_id, data.refresh_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token, refresh_token, expires_at = issue_tokens(db, user, None, None)
    return AuthTokensOut(access_token=access_token, refresh_token=refresh_token, expires_at=expires_at)


@router.post("/logout", response_model=dict)
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    token_row = db.query(AuthToken).filter(AuthToken.refresh_token == data.refresh_token).first()
    if not token_row:
        return {"message": "Already logged out"}
    db.delete(token_row)
    db.commit()
    return {"message": "Logged out"}
