from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.database import get_db
from app.models import Contact, User
from app.schemas.contact import ContactCreateRequest, ContactOut
from app.schemas.user import UserOut, UserUpdateRequest

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.profile_picture_url is not None:
        current_user.profile_picture_url = payload.profile_picture_url
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.status is not None:
        current_user.status = payload.status
    if payload.public_key is not None:
        current_user.public_key = payload.public_key
    if payload.encrypted_private_key is not None:
        current_user.encrypted_private_key = payload.encrypted_private_key
    current_user.last_seen = datetime.utcnow()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/contacts", response_model=ContactOut)
def create_contact(
    payload: ContactCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as contact")

    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_user_id == payload.contact_user_id,
    ).first()
    if existing:
        return existing

    contact = Contact(user_id=current_user.id, contact_user_id=payload.contact_user_id, status="accepted")
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
