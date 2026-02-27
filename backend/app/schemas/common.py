from datetime import datetime

from pydantic import BaseModel


class BaseOut(BaseModel):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
