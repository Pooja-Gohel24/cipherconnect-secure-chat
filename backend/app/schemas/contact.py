from datetime import datetime

from pydantic import BaseModel


class ContactCreateRequest(BaseModel):
    contact_user_id: str


class ContactOut(BaseModel):
    id: str
    user_id: str
    contact_user_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
