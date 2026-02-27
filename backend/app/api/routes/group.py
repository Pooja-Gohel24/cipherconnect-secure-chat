from fastapi import APIRouter, Depends, HTTPException
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
