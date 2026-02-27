import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text

from app.database.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reported_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    reported_user = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="open")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
