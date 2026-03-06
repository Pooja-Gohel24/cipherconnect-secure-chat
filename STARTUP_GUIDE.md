# 🚀 Quick Startup Guide - CipherConnect

## ⚡ 5-Minute Setup

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
python run.py
```
✅ Backend running at: `http://localhost:8000`

### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # First time only
npm run dev
```
✅ Frontend running at: `http://localhost:5173`

### Step 3: Open Browser
Visit: `http://localhost:5173`

## 🎯 First Time Setup

### 1. Register Account
- Go to `/register`
- Fill in:
  - Username: `testuser`
  - Email: `test@example.com`
  - Password: `Test1234`
  - Bio: `Test user` (optional)
- Click "Create Account"

### 2. Login
- Go to `/login`
- Enter credentials
- Click "Sign In"

### 3. Explore Dashboard
- View statistics
- Try quick actions
- Navigate through menu

## 📱 Feature Tour

### 1. Profile Management (`/profile`)
- View your profile
- Click "Edit"
- Update bio and status
- Click "Save Changes"

### 2. Contact Management (`/contacts`)
- View all users
- Use search to find users
- Click "Add" to add contact
- Click "Chat" to start conversation

### 3. Messaging (`/chat`)
- View conversations in sidebar
- Click conversation to open
- Type message in input
- Press Enter or click Send

### 4. Group Management (`/groups`)
- Click "Create Group"
- Enter group name and description
- Select members
- Click "Create Group"

### 5. Admin Panel (`/admin`) - Admin Only
- Switch between tabs:
  - Users: Manage user roles
  - Reports: View reports
  - Audit Logs: View system logs

### 6. API Documentation (`/api-docs`)
- Browse all endpoints
- View request/response examples
- See authentication requirements

## 🎨 UI Features to Try

### Beautiful Gradients
- Dashboard header
- Quick action cards
- Profile header
- Group cards

### Interactive Elements
- Hover over cards
- Click buttons
- Use search bars
- Toggle password visibility

### Responsive Design
- Resize browser window
- Try on mobile device
- Test on tablet

## 🔧 Common Tasks

### Create a Conversation
1. Go to `/contacts`
2. Find a user
3. Click "Chat" button
4. Conversation created!

### Send a Message
1. Go to `/chat`
2. Select conversation
3. Type message
4. Press Enter or click Send

### Create a Group
1. Go to `/groups`
2. Click "Create Group"
3. Fill in details
4. Select members
5. Click "Create Group"

### Update Profile
1. Go to `/profile`
2. Click "Edit"
3. Update bio/status
4. Click "Save Changes"

### Add Contact
1. Go to `/contacts`
2. Find user
3. Click "Add" button
4. Contact added!

## 🎯 Testing Checklist

Quick test of all features:

- [ ] Register new user
- [ ] Login
- [ ] View dashboard
- [ ] Update profile
- [ ] Add contact
- [ ] Create conversation
- [ ] Send message
- [ ] Create group
- [ ] View API docs
- [ ] Logout

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

### Frontend Not Starting
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force
```

### API Calls Failing
1. Check backend is running
2. Check API URL in `.env`:
   ```
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
3. Check browser console for errors
4. Check network tab in DevTools

### Login Not Working
1. Verify user exists in database
2. Check password is correct
3. Check backend logs
4. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```

## 📊 Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 8000 | http://localhost:8000 |
| API Docs | 8000 | http://localhost:8000/docs |
| Database | 5432 | localhost:5432 |

## 🔐 Test Credentials

Create these test users for full testing:

### Regular User
- Username: `user1`
- Email: `user1@test.com`
- Password: `Test1234`

### Admin User
- Username: `admin1`
- Email: `admin1@test.com`
- Password: `Admin1234`
- Role: `admin` (update via superadmin)

### Superadmin User
- Username: `superadmin`
- Email: `superadmin@test.com`
- Password: `Super1234`
- Role: `superadmin` (update via database)

## 🎨 Page URLs

| Page | URL | Access |
|------|-----|--------|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Protected |
| Profile | `/profile` | Protected |
| Chat | `/chat` | Protected |
| Contacts | `/contacts` | Protected |
| Groups | `/groups` | Protected |
| Admin | `/admin` | Admin Only |
| API Docs | `/api-docs` | Public |

## 📱 Mobile Testing

### Using Browser DevTools
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device (iPhone, iPad, etc.)
4. Test all features

### Using Real Device
1. Find your local IP:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
2. Update frontend URL:
   ```
   VITE_API_BASE_URL=http://YOUR_IP:8000
   ```
3. Access from mobile:
   ```
   http://YOUR_IP:5173
   ```

## 🎯 Quick Commands

### Backend
```bash
# Start server
python run.py

# Run migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "description"

# Check database
python check_tables.py
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Project overview |
| `FRONTEND_API_GUIDE.md` | Complete API guide |
| `QUICK_REFERENCE.md` | Quick reference |
| `IMPLEMENTATION_SUMMARY.md` | Implementation summary |
| `VISUAL_GUIDE.md` | Visual layouts |
| `CHECKLIST.md` | Implementation checklist |
| `STARTUP_GUIDE.md` | This file |

## 🎉 You're Ready!

Everything is set up and ready to use. Start exploring the beautiful UI and testing all the features!

### Quick Start Commands
```bash
# Terminal 1 - Backend
cd backend && python run.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Then Visit
```
http://localhost:5173
```

## 💡 Tips

1. **Use Chrome DevTools** for debugging
2. **Check Console** for errors
3. **Check Network Tab** for API calls
4. **Use React DevTools** for component inspection
5. **Test on Multiple Browsers** for compatibility
6. **Try Mobile View** for responsive design
7. **Read API Docs** at `/api-docs` for endpoint details

## 🆘 Need Help?

1. Check documentation files
2. Review code comments
3. Check browser console
4. Check backend logs
5. Review API documentation at `/api-docs`

---

**Happy Coding! 🚀**

**Built with ❤️ using React, TypeScript, TailwindCSS, and FastAPI**
