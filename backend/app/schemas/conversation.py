from datetime import datetime

from pydantic import BaseModel


class ConversationCreateRequest(BaseModel):
    type: str
    name: str | None = None
    description: str | None = None
    profile_picture: str | None = None
    participant_ids: list[str]


class ConversationOut(BaseModel):
    id: str
    type: str
    name: str | None
    description: str | None
    profile_picture: str | None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
