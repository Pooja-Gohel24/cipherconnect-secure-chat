from datetime import datetime

from pydantic import BaseModel


class ReportCreateRequest(BaseModel):
    conversation_id: str
    reported_user: str
    reason: str


class ReportOut(BaseModel):
    id: str
    reported_by: str
    conversation_id: str
    reported_user: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
