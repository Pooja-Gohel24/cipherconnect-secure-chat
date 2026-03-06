from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models import AuthToken, User

ALLOWED_USER_ROLES = {"user", "admin", "superadmin"}


def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    bio: str | None,
    public_key: str | None,
    encrypted_private_key: str | None,
    role: str = "user",
) -> User:
    if role not in ALLOWED_USER_ROLES:
        role = "user"
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        bio=bio,
        public_key=public_key,
        encrypted_private_key=encrypted_private_key,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    
    # Update last_seen in IST (India Standard Time = UTC+5:30)
    ist = timezone(timedelta(hours=5, minutes=30))
    user.last_seen = datetime.now(ist)
    db.commit()
    
    return user


def issue_tokens(db: Session, user: User, device_id: str | None, device_name: str | None):
    access_token, expires_at = create_access_token(user.id)
    refresh_token, _ = create_refresh_token(user.id)

    token_row = AuthToken(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        device_id=device_id,
        device_name=device_name,
        expires_at=expires_at,
    )
    db.add(token_row)
    db.commit()

    return access_token, refresh_token, expires_at


def validate_refresh_session(db: Session, user_id: str, refresh_token: str) -> bool:
    token_row = (
        db.query(AuthToken)
        .filter(AuthToken.user_id == user_id, AuthToken.refresh_token == refresh_token)
        .first()
    )
    return token_row is not None
