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

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

# Now test creating a user
print("\n--- Testing User Creation ---")
from sqlalchemy.orm import Session
from app.models import User
from app.core.security import hash_password, verify_password

try:
    with Session(engine) as session:
        # Check if test user exists
        existing = session.query(User).filter(User.email == "testuser@example.com").first()
        if existing:
            print(f"User already exists: {existing.email}")
        else:
            # Create a test user
            test_user = User(
                username="testuser",
                email="testuser@example.com",
                password_hash=hash_password("testpass123"),
                role="user"
            )
            session.add(test_user)
            session.commit()
            session.refresh(test_user)
            print(f"SUCCESS: Created user with ID: {test_user.id}")
            
            # Test password verification
            if verify_password("testpass123", test_user.password_hash):
                print("SUCCESS: Password verification works!")
            else:
                print("FAILED: Password verification failed!")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
