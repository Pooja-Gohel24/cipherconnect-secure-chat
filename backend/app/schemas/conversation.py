from datetime import datetime

from pydantic import BaseModel


class ParticipantOut(BaseModel):
    id: str
    username: str
    email: str
    profile_picture_url: str | None

    class Config:
        from_attributes = True


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
    participants: list[ParticipantOut] = []

    class Config:
        from_attributes = True
