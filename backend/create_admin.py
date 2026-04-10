"""
Script to create the admin user.
Run: python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

EMAIL = "poojagohel670@gmail.com"
PASSWORD = "poojagohel670@gmail.com"
USERNAME = "poojagohel670"

def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == EMAIL).first()
        if existing:
            existing.role = "superadmin"
            existing.is_verified = True
            existing.password_hash = hash_password(PASSWORD)
            db.commit()
            print(f"Updated existing user '{existing.username}' to superadmin.")
        else:
            user = User(
                username=USERNAME,
                email=EMAIL,
                password_hash=hash_password(PASSWORD),
                role="superadmin",
                is_verified=True,
                status="active",
            )
            db.add(user)
            db.commit()
            print(f"Created superadmin user: {EMAIL}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
