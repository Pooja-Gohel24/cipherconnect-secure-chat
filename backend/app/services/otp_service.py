import random
from datetime import datetime, timedelta
from typing import Dict

# In-memory OTP storage: {email: {"otp": str, "expires_at": datetime}}
otp_storage: Dict[str, Dict] = {}


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def store_otp(email: str, otp: str) -> None:
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    otp_storage[email] = {"otp": otp, "expires_at": expires_at}


def verify_otp(email: str, otp: str) -> bool:
    if email not in otp_storage:
        return False
    
    stored = otp_storage[email]
    if datetime.utcnow() > stored["expires_at"]:
        del otp_storage[email]
        return False
    
    if stored["otp"] == otp:
        del otp_storage[email]
        return True
    
    return False
