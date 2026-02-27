import os
import smtplib
from email.mime.text import MIMEText


def send_otp_email(to_email: str, otp: str) -> None:
    email_host = os.getenv("EMAIL_HOST")
    email_port = int(os.getenv("EMAIL_PORT", "587"))
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")

    if not all([email_host, email_user, email_pass]):
        return

    msg = MIMEText(f"Your OTP is: {otp}")
    msg["Subject"] = "CipherConnect Email Verification"
    msg["From"] = email_user
    msg["To"] = to_email

    with smtplib.SMTP(email_host, email_port) as server:
        server.starttls()
        server.login(email_user, email_pass)
        server.send_message(msg)
