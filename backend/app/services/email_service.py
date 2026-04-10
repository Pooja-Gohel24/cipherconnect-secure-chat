import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


def send_otp_email(to_email: str, otp: str) -> None:
    email_user = "poojajgohel2@gmail.com"
    email_pass = os.getenv("GMAIL_APP_PASSWORD", "your_app_password_here")
    
    # Skip email sending if password not configured
    if email_pass == "your_app_password_here":
        print(f"⚠️  Email not configured. OTP for {to_email}: {otp}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "CipherConnect - Email Verification"
    msg["From"] = email_user
    msg["To"] = to_email

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f8f8f8; padding: 30px; border-radius: 10px;">
          <h2 style="color: #4a154b;">CipherConnect Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4a154b; font-size: 36px; letter-spacing: 5px;">{otp}</h1>
          <p style="color: #666;">This code will expire in 5 minutes.</p>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
        print(f"✅ OTP email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        print(f"📧 OTP for testing: {otp}")
