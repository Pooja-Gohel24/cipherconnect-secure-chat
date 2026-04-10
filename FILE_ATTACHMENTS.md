# File Attachments Setup

## What's Implemented

✅ Backend file upload endpoint (`/api/chat/messages/with-attachments`)
✅ Support for images, videos, and PDFs
✅ File storage in `backend/uploads/attachments/`
✅ Static file serving at `/uploads`
✅ Frontend + icon next to message input
✅ File preview for images
✅ File download links for other types
✅ Multiple file selection

## Setup Steps

### 1. Install Python Dependency

```bash
cd backend
pip install python-multipart
```

### 2. Restart Backend

```bash
cd backend
python run.py
```

The backend will automatically create the `uploads/attachments/` directory.

### 3. Test File Upload

1. Go to Chat page
2. Click the **+** icon next to message input
3. Select image/video/PDF files
4. Type a message (optional)
5. Click Send
6. Files will appear in the message with preview/download links

## Features

### Supported File Types
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, webm, mov, avi
- **Documents**: pdf

### UI Features
- **+ Icon**: Opens file picker
- **File Preview**: Shows selected files before sending
- **Remove Files**: X button to remove selected files
- **Image Display**: Images shown inline in messages
- **Download Links**: Other files show as download links with icon

### Backend Features
- Files stored in `backend/uploads/attachments/`
- Unique filenames using UUID
- File metadata stored in database
- Accessible via `/uploads/attachments/{filename}`

## File Structure

```
backend/
├── uploads/
│   └── attachments/
│       ├── abc123.jpg
│       ├── def456.pdf
│       └── ...
```

## Testing

1. **Send Image**:
   - Click + icon
   - Select image file
   - Send message
   - Image appears inline

2. **Send PDF**:
   - Click + icon
   - Select PDF file
   - Send message
   - Download link appears

3. **Multiple Files**:
   - Click + icon
   - Select multiple files
   - All files shown in preview
   - All sent together

## Production Notes

For production, consider:
- Cloud storage (AWS S3, Google Cloud Storage)
- File size limits
- Virus scanning
- Image compression
- CDN for file delivery
