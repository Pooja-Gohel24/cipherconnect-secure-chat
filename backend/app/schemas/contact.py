from datetime import datetime

from pydantic import BaseModel, EmailStr


class ContactCreateRequest(BaseModel):
    contact_user_id: str


class UserBrief(BaseModel):
    """Brief user information for contacts"""
    id: str
    username: str
    email: EmailStr
    profile_picture_url: str | None
    status: str
    is_online: bool

    class Config:
        from_attributes = True


class ContactOut(BaseModel):
    id: str
    user_id: str
    contact_user_id: str
    status: str
    created_at: datetime
    contact_user: UserBrief | None = None

    class Config:
        from_attributes = True
