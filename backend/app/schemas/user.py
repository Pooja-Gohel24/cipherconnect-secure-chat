from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    public_key: str | None
    encrypted_private_key: str | None
    profile_picture_url: str | None
    bio: str | None
    role: str
    status: str
    is_online: bool
    last_seen: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    profile_picture_url: str | None = None
    bio: str | None = None
    status: str | None = None


class UserRoleUpdateRequest(BaseModel):
    role: str
