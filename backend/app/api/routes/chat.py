from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.database import get_db
from app.models import Conversation, ConversationParticipant, Message, User
from app.schemas.conversation import ConversationCreateRequest, ConversationOut
from app.schemas.message import MessageCreateRequest, MessageOut

router = APIRouter()


@router.post("/conversations", response_model=ConversationOut)
def create_conversation(
    payload: ConversationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    participant_ids = set(payload.participant_ids)
    participant_ids.add(current_user.id)

    conversation = Conversation(
        type=payload.type,
        name=payload.name,
        description=payload.description,
        profile_picture=payload.profile_picture,
        created_by=current_user.id,
    )
    db.add(conversation)
    db.flush()

    for participant_id in participant_ids:
        member = ConversationParticipant(conversation_id=conversation.id, user_id=participant_id, role="member")
        db.add(member)

    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation_ids = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == current_user.id
    )
    return db.query(Conversation).filter(Conversation.id.in_(conversation_ids)).all()


@router.post("/messages", response_model=MessageOut)
def send_message(
    payload: MessageCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == payload.conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not part of this conversation")

    message = Message(
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        encrypted_content=payload.encrypted_content,
        message_type=payload.message_type,
        reply_to=payload.reply_to,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not part of this conversation")

    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
