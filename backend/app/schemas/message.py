from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AttachmentOut(BaseModel):
    id: str
    file_url: str
    file_name: str
    file_type: str
    file_size: int
    thumbnail_url: str | None

    class Config:
        from_attributes = True


class ReactionOut(BaseModel):
    emoji: str
    count: int
    users: list[str]  # list of usernames


class ReplyPreview(BaseModel):
    id: str
    sender_username: str
    encrypted_content: str


class MessageCreateRequest(BaseModel):
    conversation_id: str
    encrypted_content: str
    message_type: str = "text"
    reply_to: str | None = None


class MessageDeleteRequest(BaseModel):
    delete_for_everyone: bool = False


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    encrypted_content: str
    message_type: str
    reply_to: str | None
    reply_preview: Optional[ReplyPreview] = None
    created_at: datetime
    edited_at: datetime | None
    is_deleted: bool
    deleted_for_everyone: bool
    attachments: list[AttachmentOut] = []
    reactions: list[ReactionOut] = []

    class Config:
        from_attributes = True
