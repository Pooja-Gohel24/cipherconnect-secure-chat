## Pull Request Description

### Title
```
feat(profile): Add drag-drop image upload, redirect after update, and encryption key support
```

### Body
```
## Summary
This PR enhances the CipherConnect user profile page with improved UX features including drag-and-drop image upload, automatic redirect after profile updates, and support for storing RSA encryption keys (public_key and encrypted_private_key).

CipherConnect is a secure end-to-end encrypted messaging application built with FastAPI, PostgreSQL, and React (TypeScript).

## Changes Made

### Files Modified
- `frontend/src/pages/ProfilePage.tsx` (new file - complete profile page redesign)
- `frontend/src/services/auth.ts` - Extended UpdateProfilePayload
- `backend/app/schemas/user.py` - Added public_key and encrypted_private_key fields
- `backend/app/api/routes/users.py` - Updated PATCH endpoint to handle key updates

## Features Implemented

### 1. Drag-and-Drop Image Upload
- Users can now drag and drop images directly onto the profile picture area
- Click-to-select option still available
- Visual feedback during drag operations
- Image preview with remove option
- File validation: images only, max 5MB

### 2. Automatic Redirect After Profile Update
- After successfully updating profile, user is automatically redirected to home page
- 1.5 second delay to allow user to see success message

### 3. Encryption Key Support
- Added support for storing RSA public_key
- Added support for storing encrypted_private_key
- Both fields are optional and nullable
- Keys can be updated via profile page

## Design Specifications
| Element | Description |
|---------|-------------|
| Drag Zone | Dashed border, hover states, visual feedback |
| Image Preview | Circular crop, remove button overlay |
| Redirect | 1.5s delay with success message |
| Key Storage | Stored in User table, nullable fields |

## Testing Checklist
- [x] Profile page renders correctly
- [x] Drag-and-drop image upload works
- [x] Click-to-select image works
- [x] Image preview displays correctly
- [x] Remove image functionality works
- [x] File validation (type and size) works
- [x] Profile update API works
- [x] Automatic redirect after update works
- [x] Encryption keys can be stored/retrieved
- [x] Responsive design maintained
- [x] No breaking changes to existing functionality

## Backend API Changes
### PATCH /api/users/me
Request body now accepts:
```
json
{
  "profile_picture_url": "string or null",
  "bio": "string or null", 
  "status": "online|away|busy|offline",
  "public_key": "string or null",
  "encrypted_private_key": "string or null"
}
```

## Project Context
- **Project**: CipherConnect - A secure end-to-end encrypted messaging application
- **Backend**: FastAPI with PostgreSQL
- **Frontend**: React with TypeScript, TailwindCSS, Vite
- **Authentication**: JWT (Access/Refresh tokens)

## Checklist
- [x] Code follows project conventions
- [x] No breaking changes
- [x] Tested locally
- [x] Backend health check verified
- [x] Profile update endpoint tested

## Related Documentation
- Frontend docs: `docs/frontend.md`
- Backend docs: `docs/backend.md`

---
