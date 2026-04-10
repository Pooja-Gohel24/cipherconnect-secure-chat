# Real-Time Gmail OTP Setup Guide

## 🎯 Goal
Send actual OTP emails from **poojajgohel2@gmail.com** to users in real-time.

## 📋 Prerequisites
- Gmail account: **poojajgohel2@gmail.com**
- Access to this Gmail account

## 🚀 Step-by-Step Setup

### Step 1: Enable 2-Step Verification (Required for App Passwords)

1. **Open Google Account Security**:
   - Go to: https://myaccount.google.com/security
   - Or: Google Account → Security (left sidebar)

2. **Find "2-Step Verification"**:
   - Scroll to "How you sign in to Google"
   - Click on "2-Step Verification"

3. **Enable 2-Step Verification**:
   - Click "Get Started"
   - Enter your password
   - Add phone number for verification
   - Follow the prompts to complete setup

4. **Verify it's enabled**:
   - You should see "2-Step Verification is ON"

---

### Step 2: Generate App Password

1. **Go to App Passwords**:
   - Direct link: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords (at bottom)

2. **Create App Password**:
   - You may need to sign in again
   - Under "Select app": Choose **"Mail"**
   - Under "Select device": Choose **"Other (Custom name)"**
   - Type: **"CipherConnect"**
   - Click **"Generate"**

3. **Copy the Password**:
   - Google will show a 16-character password like: `abcd efgh ijkl mnop`
   - **IMPORTANT**: Copy this password immediately (you won't see it again)
   - Remove spaces: `abcdefghijklmnop`

---

### Step 3: Add App Password to Backend

1. **Open the .env file**:
   ```bash
   # Location: backend/.env
   ```

2. **Add this line** (replace with your actual app password):
   ```env
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

3. **Your complete .env should look like**:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:root@localhost:5432/cipherconnect
   SECRET_KEY=change-me-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   JWT_ALGORITHM=HS256
   FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

---

### Step 4: Restart Backend Server

1. **Stop the current backend** (Ctrl+C in terminal)

2. **Start it again**:
   ```bash
   cd backend
   python run.py
   ```

3. **Verify it's running**:
   - You should see: `Uvicorn running on http://127.0.0.1:8000`

---

### Step 5: Test Real Email Sending

1. **Open frontend**: http://localhost:5173/register

2. **Register with a REAL email address** (your email or test email):
   - Username: `testuser`
   - Email: `your_real_email@gmail.com` (use your actual email)
   - Password: `Test@123`

3. **Check backend console**:
   - You should see: `✅ OTP email sent to your_real_email@gmail.com`
   - NOT: `⚠️ Email not configured...`

4. **Check your email inbox**:
   - Look for email from **poojajgohel2@gmail.com**
   - Subject: "CipherConnect - Email Verification"
   - Contains 6-digit OTP code

5. **Enter OTP on verification page**:
   - Copy the 6-digit code from email
   - Paste in verification page
   - Click "Verify Email"

6. **Success!** You should be redirected to login page

---

## 🔍 Troubleshooting

### Issue 1: "Username and Password not accepted"

**Cause**: Wrong app password or 2-Step Verification not enabled

**Solution**:
1. Verify 2-Step Verification is ON
2. Generate a NEW app password
3. Make sure you copied it correctly (no spaces)
4. Update `.env` file
5. Restart backend

---

### Issue 2: Still seeing "⚠️ Email not configured" in console

**Cause**: `.env` file not loaded or wrong variable name

**Solution**:
1. Check `.env` file exists in `backend/` folder
2. Verify line is: `GMAIL_APP_PASSWORD=your_password` (no spaces around =)
3. Restart backend server
4. Check if `.env` is in `.gitignore` (it should be)

---

### Issue 3: Email not received

**Cause**: Email in spam or Gmail blocking

**Solution**:
1. Check spam/junk folder
2. Check backend console for error messages
3. Verify sender email is correct: poojajgohel2@gmail.com
4. Try with different recipient email
5. Check Gmail account hasn't hit sending limits

---

### Issue 4: "SMTP Authentication Error"

**Cause**: Incorrect credentials

**Solution**:
1. Regenerate app password from Google
2. Copy it carefully (remove spaces)
3. Update `.env` file
4. Restart backend

---

## 📧 What the Email Looks Like

Recipients will receive:

```
From: poojajgohel2@gmail.com
Subject: CipherConnect - Email Verification

┌─────────────────────────────────┐
│  CipherConnect Verification     │
│                                 │
│  Your verification code is:     │
│                                 │
│         1 2 3 4 5 6            │
│                                 │
│  This code will expire in       │
│  5 minutes.                     │
└─────────────────────────────────┘
```

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] 2-Step Verification is enabled on poojajgohel2@gmail.com
- [ ] App password generated from Google
- [ ] App password added to `backend/.env` as `GMAIL_APP_PASSWORD=...`
- [ ] Backend server restarted
- [ ] Database migration run (`alembic upgrade head`)
- [ ] Frontend running on http://localhost:5173

---

## 🎯 Quick Test Command

After setup, test with:

```bash
# 1. Register new user
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "your_email@gmail.com",
    "password": "Test@123",
    "public_key": "test",
    "encrypted_private_key": "test"
  }'

# 2. Check backend console for:
# ✅ OTP email sent to your_email@gmail.com

# 3. Check your email inbox for OTP
```

---

## 🔐 Security Notes

1. **Never commit `.env` to Git**:
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **App Password vs Regular Password**:
   - Use App Password (16 chars)
   - NOT your regular Gmail password

3. **Revoke Access**:
   - Can revoke app password anytime from Google Account
   - Won't affect your main Gmail access

---

## 📞 Need Help?

If emails still not sending after following all steps:

1. Check backend console for exact error message
2. Verify Gmail account is active and not suspended
3. Try generating a new app password
4. Test with a simple Python script first (see below)

### Test Script:

```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("Test email from CipherConnect")
msg["Subject"] = "Test"
msg["From"] = "poojajgohel2@gmail.com"
msg["To"] = "your_email@gmail.com"

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login("poojajgohel2@gmail.com", "your_app_password")
    server.send_message(msg)
    print("✅ Email sent!")
```

---

## 🎉 Success Indicators

You'll know it's working when:

1. Backend console shows: `✅ OTP email sent to user@example.com`
2. Email arrives in inbox within seconds
3. OTP verification works on frontend
4. No error messages in backend console

---

## 📊 Email Sending Limits

Gmail free accounts have limits:
- **500 emails per day**
- **100 emails per hour** (approximately)

For production, consider:
- Gmail Workspace (higher limits)
- SendGrid, AWS SES, Mailgun (dedicated email services)
