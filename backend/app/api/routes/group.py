from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.database import get_db
from app.models import Conversation, ConversationParticipant, User
from app.schemas.conversation import ConversationCreateRequest, ConversationOut

router = APIRouter()


@router.post("", response_model=ConversationOut)
def create_group(
    payload: ConversationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.type != "group":
        raise HTTPException(status_code=400, detail="Group endpoint only supports type='group'")

    member_ids = set(payload.participant_ids)
    member_ids.add(current_user.id)

    conversation = Conversation(
        type="group",
        name=payload.name,
        description=payload.description,
        profile_picture=payload.profile_picture,
        created_by=current_user.id,
    )
    db.add(conversation)
    db.flush()

    for user_id in member_ids:
        role = "admin" if user_id == current_user.id else "member"
        db.add(ConversationParticipant(conversation_id=conversation.id, user_id=user_id, role=role))

    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/{conversation_id}/members/{user_id}", response_model=dict)
def add_member(
    conversation_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only group admins can add members")

    exists = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id,
    ).first()
    if exists:
        return {"message": "User already in group"}

    db.add(ConversationParticipant(conversation_id=conversation_id, user_id=user_id, role="member"))
    db.commit()
    return {"message": "Member added"}


@router.delete("/{conversation_id}/members/{user_id}", response_model=dict)
def remove_member(
    conversation_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only group admins can remove members")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot remove themselves")

    member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="User not in group")

    db.delete(member)
    db.commit()
    return {"message": "Member removed"}


@router.put("/{conversation_id}/members/{user_id}/role", response_model=dict)
def update_member_role(
    conversation_id: str,
    user_id: str,
    role_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = role_data.get("role")
    if role not in ["admin", "member"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")
    
    admin_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only group admins can change member roles")

    member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="User not in group")

    member.role = role
    db.commit()
    return {"message": f"Member role updated to {role}"}


@router.put("/{conversation_id}/profile-picture", response_model=dict)
async def update_group_profile_picture(
    conversation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if user is admin of the group
    admin_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only group admins can update profile picture")
    
    # Get the conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if conversation.type != "group":
        raise HTTPException(status_code=400, detail="Only groups can have profile pictures")
    
    # Save the uploaded file
    import os
    import uuid
    from pathlib import Path
    
    UPLOADS_DIR = Path("uploads/group_pictures")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    file_id = str(uuid.uuid4())
    file_path = UPLOADS_DIR / f"{file_id}{file_ext}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Update conversation profile picture
    conversation.profile_picture = f"/uploads/group_pictures/{file_id}{file_ext}"
    db.commit()
    
    return {"message": "Profile picture updated", "profile_picture_url": conversation.profile_picture}


@router.get("/{conversation_id}/info", response_model=dict)
def get_group_info(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if user is in the group
    member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    # Get conversation details
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {
        "id": conversation.id,
        "name": conversation.name,
        "description": conversation.description,
        "profile_picture": conversation.profile_picture,
        "type": conversation.type,
        "created_by": conversation.created_by,
        "created_at": conversation.created_at,
        "current_user_role": member.role
    }
@router.delete("/{conversation_id}", response_model=dict)
def delete_group(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if user is admin of the group
    admin_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only group admins can delete the group")
    
    # Get the conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if conversation.type != "group":
        raise HTTPException(status_code=400, detail="Only groups can be deleted")
    
    # Delete the conversation (cascade will handle participants and messages)
    db.delete(conversation)
    db.commit()
    
    return {"message": "Group deleted successfully"}


@router.get("/{conversation_id}/members", response_model=list)
def list_members(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if user is in the group
    member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # Use join to ensure user data is loaded
    members = db.query(ConversationParticipant).join(User).filter(
        ConversationParticipant.conversation_id == conversation_id
    ).all()
    
    result = []
    for m in members:
        result.append({
            "id": m.user.id,
            "username": m.user.username,
            "email": m.user.email,
            "profile_picture_url": m.user.profile_picture_url,
            "role": m.role,
            "joined_at": m.joined_at,
            "is_muted": m.is_muted
        })
    
    return result
