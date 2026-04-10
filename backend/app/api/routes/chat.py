from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path
from pydantic import BaseModel
from collections import defaultdict

from app.api.deps import get_current_user
from app.database.database import get_db
from app.models import Conversation, ConversationParticipant, Message, MessageAttachment, MessageDeletion, MessageReaction, User
from app.schemas.conversation import ConversationCreateRequest, ConversationOut
from app.schemas.message import MessageCreateRequest, MessageDeleteRequest, MessageOut, ReactionOut, ReplyPreview

router = APIRouter()

# Create uploads directory
UPLOADS_DIR = Path("uploads/attachments")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


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
        # Set creator as admin for group conversations, everyone else as member
        role = "admin" if (payload.type == "group" and participant_id == current_user.id) else "member"
        member = ConversationParticipant(conversation_id=conversation.id, user_id=participant_id, role=role)
        db.add(member)

    db.commit()
    db.refresh(conversation)
    
    # Return conversation data with participants as dict
    participants_data = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation.id
    ).all()
    
    participants = []
    for participant in participants_data:
        user = db.query(User).filter(User.id == participant.user_id).first()
        if user:
            participants.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "profile_picture_url": user.profile_picture_url
            })
    
    return {
        "id": conversation.id,
        "type": conversation.type,
        "name": conversation.name,
        "description": conversation.description,
        "profile_picture": conversation.profile_picture,
        "created_by": conversation.created_by,
        "created_at": conversation.created_at,
        "participants": participants
    }


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation_ids = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == current_user.id
    )
    conversations = db.query(Conversation).filter(Conversation.id.in_(conversation_ids)).all()
    
    # Load participants for each conversation using proper relationships
    result = []
    for conv in conversations:
        # Get participants through the relationship
        participants_data = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id
        ).all()
        
        # Create a new conversation dict with participants
        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "name": conv.name,
            "description": conv.description,
            "profile_picture": conv.profile_picture,
            "created_by": conv.created_by,
            "created_at": conv.created_at,
            "participants": []
        }
        
        # Add participant user data
        for participant in participants_data:
            user = db.query(User).filter(User.id == participant.user_id).first()
            if user:
                conv_dict["participants"].append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "profile_picture_url": user.profile_picture_url
                })
        
        result.append(conv_dict)
    
    return result


@router.delete("/conversations/{conversation_id}", response_model=dict)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation (remove it from user's view)"""
    # Check if user is part of the conversation
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get the conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.type == "group":
        # For groups, only admins can delete the entire group
        if participant.role != "admin":
            raise HTTPException(status_code=403, detail="Only group admins can delete groups")
        # Delete the entire group
        db.delete(conversation)
    else:
        # For direct conversations, just remove the user's participation
        db.delete(participant)
        
        # Check if this was the last participant
        remaining_participants = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id
        ).count()
        
        if remaining_participants == 0:
            # Delete the conversation if no participants left
            db.delete(conversation)
    
    db.commit()
    
    return {"message": "Conversation deleted successfully"}


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


@router.post("/messages/with-attachments", response_model=MessageOut)
async def send_message_with_attachments(
    conversation_id: str = Form(...),
    encrypted_content: str = Form(...),
    message_type: str = Form("text"),
    files: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not part of this conversation")

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        encrypted_content=encrypted_content,
        message_type=message_type,
    )
    db.add(message)
    db.flush()

    if files:
        for file in files:
            file_ext = os.path.splitext(file.filename)[1]
            file_id = str(uuid.uuid4())
            file_path = UPLOADS_DIR / f"{file_id}{file_ext}"
            
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            attachment = MessageAttachment(
                message_id=message.id,
                file_url=f"/uploads/attachments/{file_id}{file_ext}",
                file_name=file.filename,
                file_type=file.content_type or "application/octet-stream",
                file_size=len(content),
            )
            db.add(attachment)
    
    db.commit()
    db.refresh(message)
    return message


@router.get("/conversations/{conversation_id}/messages")
def list_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not part of this conversation")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.deleted_for_everyone == False
    ).order_by(Message.created_at.asc()).all()

    filtered = []
    for message in messages:
        user_deletion = db.query(MessageDeletion).filter(
            MessageDeletion.message_id == message.id,
            MessageDeletion.user_id == current_user.id
        ).first()
        if not user_deletion:
            filtered.append(message)

    result = []
    for msg in filtered:
        # Build reactions grouped by emoji
        reaction_map: dict = defaultdict(list)
        for r in msg.reactions:
            u = db.query(User).filter(User.id == r.user_id).first()
            reaction_map[r.emoji].append(u.username if u else "unknown")
        reactions = [ReactionOut(emoji=e, count=len(users), users=users) for e, users in reaction_map.items()]

        # Build reply preview
        reply_preview = None
        if msg.reply_to:
            parent = db.query(Message).filter(Message.id == msg.reply_to).first()
            if parent:
                sender = db.query(User).filter(User.id == parent.sender_id).first()
                reply_preview = ReplyPreview(
                    id=parent.id,
                    sender_username=sender.username if sender else "Unknown",
                    encrypted_content=parent.encrypted_content[:80]
                )

        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "encrypted_content": msg.encrypted_content,
            "message_type": msg.message_type,
            "reply_to": msg.reply_to,
            "reply_preview": reply_preview.model_dump() if reply_preview else None,
            "created_at": msg.created_at,
            "edited_at": msg.edited_at,
            "is_deleted": msg.is_deleted,
            "deleted_for_everyone": msg.deleted_for_everyone,
            "attachments": [{"id": a.id, "file_url": a.file_url, "file_name": a.file_name, "file_type": a.file_type, "file_size": a.file_size, "thumbnail_url": a.thumbnail_url} for a in msg.attachments],
            "reactions": [r.model_dump() for r in reactions],
        })
    return result


class ReactionRequest(BaseModel):
    emoji: str


@router.post("/messages/{message_id}/reactions", response_model=dict)
def toggle_reaction(
    message_id: str,
    payload: ReactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id,
    ).first()

    if existing:
        if existing.emoji == payload.emoji:
            # Same emoji — remove reaction (toggle off)
            db.delete(existing)
            db.commit()
            return {"action": "removed"}
        else:
            # Different emoji — update
            existing.emoji = payload.emoji
            db.commit()
            return {"action": "updated"}
    else:
        db.add(MessageReaction(message_id=message_id, user_id=current_user.id, emoji=payload.emoji))
        db.commit()
        return {"action": "added"}


@router.delete("/messages/{message_id}", response_model=dict)
def delete_message(
    message_id: str,
    payload: MessageDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is part of the conversation
    is_member = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == message.conversation_id,
        ConversationParticipant.user_id == current_user.id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not part of this conversation")
    
    if payload.delete_for_everyone:
        # Only sender can delete for everyone
        if message.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete your own messages for everyone")
        
        message.deleted_for_everyone = True
        message.encrypted_content = "This message was deleted"
        db.commit()
        return {"message": "Message deleted for everyone"}
    else:
        # Delete for current user only
        existing_deletion = db.query(MessageDeletion).filter(
            MessageDeletion.message_id == message_id,
            MessageDeletion.user_id == current_user.id
        ).first()
        
        if not existing_deletion:
            deletion = MessageDeletion(
                message_id=message_id,
                user_id=current_user.id
            )
            db.add(deletion)
            db.commit()
        
        return {"message": "Message deleted for you"}
