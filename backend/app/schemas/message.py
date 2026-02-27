from datetime import datetime

from pydantic import BaseModel


class MessageCreateRequest(BaseModel):
    conversation_id: str
    encrypted_content: str
    message_type: str = "text"
    reply_to: str | None = None


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    encrypted_content: str
    message_type: str
    reply_to: str | None
    created_at: datetime
    edited_at: datetime | None
    is_deleted: bool

    class Config:
        from_attributes = True
