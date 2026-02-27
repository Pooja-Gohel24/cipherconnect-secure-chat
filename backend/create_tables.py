import os
from pathlib import Path

# Load environment variables from .env file in the same directory
env_path = Path(__file__).parent / ".env"
from dotenv import load_dotenv
load_dotenv(env_path)

from app.core.config import settings
print(f"DATABASE_URL from settings: {settings.DATABASE_URL}")

# Test with SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True

print(f"Engine kwargs: {engine_kwargs}")

try:
    engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
    
    # Import all models to register them
    from app.models import User, AuthToken, Conversation, Message, Contact, UserDevice, Report, AuditLog
    from app.database.database import Base
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: All tables created!")
    
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
