# Complete OTP Email Verification Setup

## ✅ What's Implemented

Your CipherConnect app now has **complete OTP email verification**:

### Registration Flow:
1. User registers → OTP sent to email
2. User enters OTP → Email verified
3. User can now login

### Login Flow:
1. Unverified user tries to login → OTP sent to email
2. User enters OTP → Email verified
3. User logged in successfully

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
cd backend
alembic upgrade head
```

This adds the `is_verified` column to users table.

### Step 2: Configure Gmail (Get App Password)

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow steps to enable

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "CipherConnect"
   - Click "Generate"
   - **Copy the 16-character password**

3. **Add to .env file**:
   ```bash
   # Edit backend/.env
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

### Step 3: Restart Backend

```bash
cd backend
python run.py
```

## 🧪 Testing Without Email (Development)

If you don't configure Gmail, the system still works! OTP codes are printed in the backend console:

```
⚠️  Email not configured. OTP for user@example.com: 123456
```

Just copy the OTP from console and paste it in the verification page.

## 📧 Email Configuration Details

### Using Gmail (poojajgohel2@gmail.com)

The system is pre-configured to use `poojajgohel2@gmail.com`. You just need to:

1. Get App Password for this Gmail account
2. Add to `backend/.env`:
   ```env
   GMAIL_APP_PASSWORD=your_16_char_password
   ```

### Using Different Email

To use a different email, update `backend/app/services/email_service.py`:

```python
email_user = "your_email@gmail.com"  # Change this line
```

## 🎯 How It Works

### Registration:
```
User fills form → Backend creates user (unverified)
                ↓
Backend generates 6-digit OTP (expires in 5 min)
                ↓
Backend sends OTP email
                ↓
User enters OTP → Backend verifies → User marked as verified
```

### Login (Unverified User):
```
User enters credentials → Backend checks verification status
                        ↓
Not verified? → Send OTP → User enters OTP → Verified → Login
```

### Login (Verified User):
```
User enters credentials → Verified? → Login immediately ✅
```

## 📱 Frontend Pages

- **RegisterPage**: Redirects to OTP verification after registration
- **OTPVerificationPage**: 6-digit OTP input with 5-minute timer
- **LoginPage**: Handles unverified users, shows success message after verification

## 🔐 Security Features

- ✅ OTP expires after 5 minutes
- ✅ OTP deleted after successful verification
- ✅ One-time use only
- ✅ Users cannot login without verification
- ✅ Resend OTP available after expiry

## 📂 Files Modified

### Backend:
- `app/api/routes/auth.py` - Added OTP endpoints
- `app/services/email_service.py` - Gmail SMTP integration
- `app/services/otp_service.py` - OTP generation/validation
- `app/models/user.py` - Added `is_verified` field
- `alembic/versions/20260226_0002_add_is_verified.py` - Migration

### Frontend:
- `pages/OTPVerificationPage.tsx` - OTP input page
- `pages/RegisterPage.tsx` - Redirects to OTP page
- `pages/LoginPage.tsx` - Handles verification flow
- `services/authService.ts` - OTP API methods
- `App.tsx` - Added OTP route

## 🐛 Troubleshooting

### "500 Internal Server Error" on registration
**Solution**: Restart backend server after code changes

### OTP not showing in email
**Solution**: 
1. Check backend console for OTP (development mode)
2. Verify Gmail App Password is correct
3. Check spam folder

### "Invalid or expired OTP"
**Solution**: 
1. OTPs expire after 5 minutes
2. Check backend console for fresh OTP
3. Use resend OTP button

### "Email already verified"
**Solution**: User is already verified, just login normally

## 🎨 Email Template

The OTP email includes:
- CipherConnect branding
- Large 6-digit code
- 5-minute expiration notice
- Professional HTML design

## 📊 Database Schema

```sql
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
```

## 🔄 API Endpoints

- `POST /api/auth/register` - Register + send OTP
- `POST /api/auth/verify-otp?email=...&otp=...` - Verify OTP
- `POST /api/auth/resend-otp?email=...` - Resend OTP
- `POST /api/auth/login` - Login (checks verification)

## ✨ Next Steps

1. Run migration: `alembic upgrade head`
2. Get Gmail App Password
3. Add to `.env`: `GMAIL_APP_PASSWORD=...`
4. Restart backend
5. Test registration with real email!

## 📝 Production Recommendations

- Use Redis for OTP storage (instead of in-memory)
- Add rate limiting to prevent OTP spam
- Use email queue (Celery) for async sending
- Add SMS OTP as backup
- Monitor email delivery rates
