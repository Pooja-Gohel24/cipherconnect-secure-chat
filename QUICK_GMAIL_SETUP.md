# 🚀 QUICK START: Real Gmail OTP in 5 Minutes

## What You Need
- Gmail: **poojajgohel2@gmail.com**
- 5 minutes of your time

---

## Step 1: Enable 2-Step Verification (2 minutes)

```
🌐 Go to: https://myaccount.google.com/security
    ↓
🔒 Click "2-Step Verification"
    ↓
✅ Click "Get Started" and follow prompts
    ↓
📱 Add phone number for verification
    ↓
✅ Done! 2-Step Verification is ON
```

---

## Step 2: Generate App Password (1 minute)

```
🌐 Go to: https://myaccount.google.com/apppasswords
    ↓
📧 Select app: "Mail"
    ↓
💻 Select device: "Other (Custom name)"
    ↓
⌨️  Type: "CipherConnect"
    ↓
🔘 Click "Generate"
    ↓
📋 Copy 16-character password: abcdefghijklmnop
```

---

## Step 3: Add to Backend (30 seconds)

**Edit file**: `backend/.env`

**Add this line**:
```env
GMAIL_APP_PASSWORD=abcdefghijklmnop
```
*(Replace with your actual password)*

---

## Step 4: Restart Backend (30 seconds)

```bash
# Stop backend (Ctrl+C)
cd backend
python run.py
```

---

## Step 5: Test It! (1 minute)

1. Go to: http://localhost:5173/register
2. Register with YOUR real email
3. Check your inbox for OTP email
4. Enter OTP code
5. ✅ Success!

---

## 🎯 What You'll See

### Backend Console (Success):
```
✅ OTP email sent to user@example.com
```

### Backend Console (Not Configured):
```
⚠️  Email not configured. OTP for user@example.com: 123456
```

### Your Email Inbox:
```
From: poojajgohel2@gmail.com
Subject: CipherConnect - Email Verification

Your verification code is:
    1 2 3 4 5 6

This code will expire in 5 minutes.
```

---

## ⚡ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Username and Password not accepted" | Regenerate app password, check 2-Step is ON |
| Still seeing "⚠️ Email not configured" | Check `.env` file, restart backend |
| Email not received | Check spam folder, verify app password |
| "SMTP Authentication Error" | Wrong app password, regenerate it |

---

## 📝 Your .env File Should Look Like:

```env
DATABASE_URL=postgresql+psycopg://postgres:root@localhost:5432/cipherconnect
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GMAIL_APP_PASSWORD=abcdefghijklmnop  ← ADD THIS LINE
```

---

## ✅ Success Checklist

Before testing:
- [ ] 2-Step Verification enabled
- [ ] App password generated
- [ ] Added to `.env` file
- [ ] Backend restarted
- [ ] Ready to test!

---

## 🎉 That's It!

Now your app sends **real OTP emails** to users!

**Test now**: Register with your email and check inbox! 📧
