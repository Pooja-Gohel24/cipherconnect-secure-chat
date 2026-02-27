from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    bio: str | None = None
    public_key: str | None = None
    encrypted_private_key: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str | None = None
    device_name: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthTokensOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime
