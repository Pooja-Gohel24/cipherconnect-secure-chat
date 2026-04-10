from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.database import get_db
from app.models import Contact, User
from app.models.report import Report
from app.schemas.contact import ContactCreateRequest, ContactOut
from app.schemas.report import ReportCreateRequest, ReportOut
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
    
    result_requests = []
    for req in requests:
        requester = db.query(User).filter(User.id == req.user_id).first()
        if requester:
            # Create a virtual contact object for consistent output
            request_contact = Contact(
                id=req.id,
                user_id=req.user_id,
                contact_user_id=req.contact_user_id,
                status=req.status,
                created_at=req.created_at
            )
            request_contact.contact_user = requester
            result_requests.append(request_contact)
    
    return result_requests


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all accepted contacts for the current user"""
    # Get contacts where current user is the requester
    contacts_as_requester = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.status == "accepted"
    ).all()
    
    # Get contacts where current user is the recipient (but we need to flip the relationship)
    contacts_as_recipient = db.query(Contact).filter(
        Contact.contact_user_id == current_user.id,
        Contact.status == "accepted"
    ).all()
    
    # Process contacts where user is requester
    result_contacts = []
    for contact in contacts_as_requester:
        contact_user = db.query(User).filter(User.id == contact.contact_user_id).first()
        if contact_user:
            contact.contact_user = contact_user
            result_contacts.append(contact)
    
    # Process contacts where user is recipient (flip the relationship for consistent output)
    for contact in contacts_as_recipient:
        requester = db.query(User).filter(User.id == contact.user_id).first()
        if requester:
            # Create a virtual contact object with flipped relationship
            flipped_contact = Contact(
                id=contact.id,
                user_id=current_user.id,
                contact_user_id=contact.user_id,
                status=contact.status,
                created_at=contact.created_at
            )
            flipped_contact.contact_user = requester
            
            # Check if we already have this contact from the other direction
            already_exists = any(
                c.contact_user_id == contact.user_id for c in result_contacts
            )
            
            if not already_exists:
                result_contacts.append(flipped_contact)
    
    return result_contacts


@router.post("/contacts", response_model=ContactOut)
def create_contact(
    payload: ContactCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as contact")

    # Check if any relationship already exists (in either direction)
    existing_request = db.query(Contact).filter(
        ((Contact.user_id == current_user.id) & (Contact.contact_user_id == payload.contact_user_id)) |
        ((Contact.user_id == payload.contact_user_id) & (Contact.contact_user_id == current_user.id))
    ).first()
    
    if existing_request:
        # If request exists, return it with proper contact_user data
        if existing_request.user_id == current_user.id:
            contact_user = db.query(User).filter(User.id == existing_request.contact_user_id).first()
            if contact_user:
                existing_request.contact_user = contact_user
            return existing_request
        else:
            # If the other user sent us a request, we can't send another one
            raise HTTPException(status_code=400, detail="Contact request already exists")

    # Create new contact request
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
    
    # Update the original request status
    contact.status = "accepted"
    
    # Create reciprocal contact relationship
    # Check if reciprocal contact already exists
    reciprocal_contact = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_user_id == contact.user_id
    ).first()
    
    if not reciprocal_contact:
        # Create reciprocal contact
        reciprocal_contact = Contact(
            user_id=current_user.id,
            contact_user_id=contact.user_id,
            status="accepted"
        )
        db.add(reciprocal_contact)
    else:
        # Update existing reciprocal contact status
        reciprocal_contact.status = "accepted"
    
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


@router.delete("/contacts/{contact_id}")
def remove_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a contact (delete the relationship)"""
    # Find the contact relationship where current user is involved
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        ((Contact.user_id == current_user.id) | (Contact.contact_user_id == current_user.id)),
        Contact.status == "accepted"
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Find and delete the reciprocal contact relationship
    if contact.user_id == current_user.id:
        # Current user is the requester, find reciprocal
        reciprocal = db.query(Contact).filter(
            Contact.user_id == contact.contact_user_id,
            Contact.contact_user_id == current_user.id
        ).first()
    else:
        # Current user is the recipient, find reciprocal
        reciprocal = db.query(Contact).filter(
            Contact.user_id == contact.user_id,
            Contact.contact_user_id == current_user.id
        ).first()
    
    # Delete both relationships
    db.delete(contact)
    if reciprocal:
        db.delete(reciprocal)
    
    db.commit()
    
    return {"message": "Contact removed successfully"}


@router.get("/me/reports", response_model=list[ReportOut])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Report).filter(Report.reported_by == current_user.id).order_by(Report.created_at.desc()).all()


@router.post("/me/reports", response_model=ReportOut)
def submit_report(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(
        reported_by=current_user.id,
        conversation_id=payload.conversation_id,
        reported_user=payload.reported_user,
        reason=payload.reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
