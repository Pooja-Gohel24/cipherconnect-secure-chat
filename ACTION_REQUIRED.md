# 🎯 ACTION REQUIRED: Enable Real Gmail OTP Sending

## Current Status
✅ Code is ready and configured for **poojajgohel2@gmail.com**
⚠️ Gmail App Password needed to send real emails

## What Happens Now

### Without App Password (Current):
```
User registers → Backend prints OTP in console
⚠️  Email not configured. OTP for user@example.com: 123456
```

### With App Password (After Setup):
```
User registers → Real email sent to user's inbox
✅ OTP email sent to user@example.com
```

---

## 🚀 DO THIS NOW (5 Minutes)

### 1. Open Google Account
Go to: **https://myaccount.google.com/apppasswords**

Login with: **poojajgohel2@gmail.com**

### 2. Generate App Password
- If you see "2-Step Verification is off" → Enable it first
- Select app: **Mail**
- Select device: **Other (CipherConnect)**
- Click **Generate**
- Copy the 16-character password

### 3. Add to .env File
Open: `backend/.env`

Add this line:
```env
GMAIL_APP_PASSWORD=your_16_character_password_here
```

Example:
```env
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### 4. Restart Backend
```bash
# Stop backend (Ctrl+C)
cd backend
python run.py
```

### 5. Test It
1. Go to http://localhost:5173/register
2. Register with YOUR email address
3. Check your inbox for OTP email
4. Enter OTP and verify

---

## 📧 Email Details

**Sender**: poojajgohel2@gmail.com
**Subject**: CipherConnect - Email Verification
**Content**: Beautiful HTML email with 6-digit OTP
**Expiry**: 5 minutes

---

## ✅ How to Verify It's Working

### Backend Console Shows:
```
✅ OTP email sent to user@example.com
```

### User Receives Email:
```
From: poojajgohel2@gmail.com
Subject: CipherConnect - Email Verification

Your verification code is:
    1 2 3 4 5 6

This code will expire in 5 minutes.
```

---

## 🔧 If You Don't Have Access to poojajgohel2@gmail.com

You can use your own Gmail:

1. Edit `backend/app/services/email_service.py`
2. Change line 8:
   ```python
   email_user = "your_email@gmail.com"  # Change this
   ```
3. Generate app password for YOUR Gmail
4. Add to `.env`: `GMAIL_APP_PASSWORD=...`
5. Restart backend

---

## 📚 Documentation Files

- **QUICK_GMAIL_SETUP.md** - 5-minute quick start guide
- **GMAIL_REAL_SETUP.md** - Detailed step-by-step with troubleshooting
- **OTP_COMPLETE_SETUP.md** - Complete OTP system documentation

---

## 🎯 Next Steps

1. **Now**: Get Gmail App Password (5 minutes)
2. **Add to .env**: `GMAIL_APP_PASSWORD=...`
3. **Restart backend**: `python run.py`
4. **Test**: Register with real email
5. **Success**: Real OTP emails working! 🎉

---

## 💡 Quick Links

- Generate App Password: https://myaccount.google.com/apppasswords
- Enable 2-Step: https://myaccount.google.com/security
- Test Registration: http://localhost:5173/register

---

## ⚡ TL;DR

```bash
# 1. Get app password from Google
# 2. Add to backend/.env:
GMAIL_APP_PASSWORD=your_password_here

# 3. Restart backend
cd backend
python run.py

# 4. Test registration - check your email inbox!
```

**That's it! Real Gmail OTP emails will work!** 📧✨
