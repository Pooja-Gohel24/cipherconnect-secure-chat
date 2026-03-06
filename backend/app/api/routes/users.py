from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
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


@router.get("/search", response_model=list[UserOut])
def search_users(
    q: str = Query(..., min_length=1, description="Search query for username or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username or email (for adding contacts)"""
    search = f"%{q}%"
    users = db.query(User).filter(
        (User.username.ilike(search)) | (User.email.ilike(search)),
        User.id != current_user.id
    ).limit(20).all()
    return users


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
    # Store last_seen in IST (India Standard Time = UTC+5:30)
    ist = timezone(timedelta(hours=5, minutes=30))
    current_user.last_seen = datetime.now(ist)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/contacts/requests", response_model=list[ContactOut])
def list_contact_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending contact requests received by current user"""
    requests = db.query(Contact).filter(
        Contact.contact_user_id == current_user.id,
        Contact.status == "pending"
    ).all()
    
    for req in requests:
        requester = db.query(User).filter(User.id == req.user_id).first()
        if requester:
            req.contact_user = requester
    
    return requests


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all contacts for the current user - shows all contacts regardless of status"""
    contacts = db.query(Contact).filter(
        Contact.user_id == current_user.id
    ).all()
    
    for contact in contacts:
        contact_user = db.query(User).filter(User.id == contact.contact_user_id).first()
        if contact_user:
            contact.contact_user = contact_user
    
    return contacts


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
        contact_user = db.query(User).filter(User.id == existing.contact_user_id).first()
        if contact_user:
            existing.contact_user = contact_user
        return existing

    contact = Contact(
        user_id=current_user.id, 
        contact_user_id=payload.contact_user_id, 
        status="pending"
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    contact_user = db.query(User).filter(User.id == contact.contact_user_id).first()
    if contact_user:
        contact.contact_user = contact_user
    
    return contact


@router.patch("/contacts/{contact_id}/accept", response_model=ContactOut)
def accept_contact_request(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a contact request"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.contact_user_id == current_user.id,
        Contact.status == "pending"
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")
    
    contact.status = "accepted"
    db.commit()
    db.refresh(contact)
    
    requester = db.query(User).filter(User.id == contact.user_id).first()
    if requester:
        contact.contact_user = requester
    
    return contact


@router.delete("/contacts/{contact_id}/reject")
def reject_contact_request(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a contact request"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.contact_user_id == current_user.id,
        Contact.status == "pending"
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")
    
    db.delete(contact)
    db.commit()
    
    return {"message": "Contact request rejected"}


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
