# 🔐 Complete Admin Panel - Setup & Usage Guide

## ✅ What's Implemented

A **full-featured admin panel** with beautiful UI and complete functionality:

### Features:
- 📊 **Dashboard** - Real-time statistics and system overview
- 👥 **User Management** - View, edit, delete users
- 🚨 **Reports** - View and manage user reports
- 📝 **Audit Logs** - Track all admin actions
- 🔍 **Search** - Find users quickly
- 🎨 **Beautiful UI** - Slack-inspired design

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Make Yourself Admin

Edit `backend/make_admin.py` and change the email:

```python
USER_EMAIL = "your_email@gmail.com"  # Your registered email
```

Run the script:

```bash
cd backend
python make_admin.py
```

Output:
```
User 'your_username' is now an admin!
```

### Step 2: Restart Backend

```bash
cd backend
python run.py
```

### Step 3: Access Admin Panel

1. Login to your account
2. Go to: http://localhost:5173/admin
3. Enjoy full admin access! 🎉

---

## 📊 Dashboard Features

### Statistics Cards:
- **Total Users** - With weekly growth
- **Verified Users** - With verification rate
- **Online Now** - Active users count
- **Messages Today** - Daily activity

### System Overview:
- Total conversations
- Pending reports
- Verification rate

### Quick Actions:
- Manage Users button
- View Reports button
- Audit Logs button

---

## 👥 User Management

### Features:
- ✅ **Search** - Find users by username or email
- ✅ **View All Users** - Complete user list with details
- ✅ **Change Role** - Dropdown: User, Admin, Superadmin
- ✅ **Change Status** - Dropdown: Active, Offline, Suspended, Banned
- ✅ **Delete User** - With confirmation dialog
- ✅ **User Info** - Avatar, username, email, join date

### User Table Columns:
1. **User** - Avatar, username, email
2. **Role** - Editable dropdown
3. **Status** - Editable dropdown
4. **Verified** - Badge (Verified/Unverified)
5. **Joined** - Registration date
6. **Actions** - Delete button

### How to Use:

**Change User Role:**
1. Find user in table
2. Click role dropdown
3. Select new role (User/Admin/Superadmin)
4. Auto-saves immediately

**Change User Status:**
1. Find user in table
2. Click status dropdown
3. Select new status (Active/Offline/Suspended/Banned)
4. Auto-saves immediately

**Delete User:**
1. Click "Delete" button
2. Confirm in dialog
3. User removed from system

**Search Users:**
1. Type in search box
2. Filters by username or email
3. Real-time results

---

## 🚨 Reports Management

### Features:
- View all user reports
- Report details (ID, reported user, reason)
- Status badges (Pending/Resolved/Dismissed)
- Timestamp for each report

### Report Card Shows:
- Report ID
- Reported User ID
- Reason for report
- Status badge (color-coded)
- Creation timestamp

---

## 📝 Audit Logs

### Features:
- Track all admin actions
- Last 200 logs displayed
- Sortable table
- User ID, action, IP address, timestamp

### Logged Actions:
- User role changes
- User status changes
- User deletions
- Report creations
- Report status changes

### Table Columns:
1. **Timestamp** - When action occurred
2. **User ID** - Who performed action
3. **Action** - What was done
4. **IP Address** - Where from

---

## 🎨 UI Design

### Color Scheme:
- **Primary**: Purple (#4a154b) - Slack-inspired
- **Success**: Green - Verified badges
- **Warning**: Yellow - Pending status
- **Danger**: Red - Delete actions
- **Neutral**: Gray - Inactive elements

### Components:
- **Tabs** - Dashboard, Users, Reports, Logs
- **Cards** - Statistics and overview
- **Tables** - User list, audit logs
- **Badges** - Status indicators
- **Dropdowns** - Role and status selectors
- **Search Bar** - User filtering
- **Buttons** - Actions and navigation

---

## 🔐 Permissions

### User Roles:

**User** (Default):
- No admin access
- Cannot access /admin page

**Admin**:
- View dashboard stats
- View all users
- Change user status
- View reports
- View audit logs
- Cannot change roles
- Cannot delete users

**Superadmin**:
- All admin permissions
- Change user roles
- Delete users
- Full system control

---

## 📱 Admin Panel Tabs

### 1. Dashboard Tab
- 8 statistics cards
- System overview panel
- Quick action buttons
- Real-time data

### 2. Users Tab
- Search bar at top
- Full user table
- Inline editing (role/status)
- Delete functionality
- Loading states

### 3. Reports Tab
- List of all reports
- Status badges
- Report details
- Empty state message

### 4. Logs Tab
- Audit log table
- 200 most recent logs
- Sortable columns
- Timestamp formatting

---

## 🔄 API Endpoints Used

### Dashboard:
- `GET /api/admin/dashboard-stats` - Get statistics

### Users:
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/{id}/role` - Update role
- `PATCH /api/admin/users/{id}/status` - Update status
- `DELETE /api/admin/users/{id}` - Delete user

### Reports:
- `GET /api/admin/reports` - List reports
- `POST /api/admin/reports` - Create report

### Logs:
- `GET /api/admin/audit-logs` - Get audit logs

---

## 🧪 Testing the Admin Panel

### Test Scenario 1: View Dashboard
1. Login as admin
2. Go to /admin
3. See statistics cards
4. Verify numbers are correct

### Test Scenario 2: Manage Users
1. Click "Users" tab
2. Search for a user
3. Change their role to "admin"
4. Change their status to "suspended"
5. Verify changes saved

### Test Scenario 3: Delete User
1. Find a test user
2. Click "Delete"
3. Confirm deletion
4. User removed from list

### Test Scenario 4: View Logs
1. Click "Logs" tab
2. See your recent actions
3. Verify timestamps correct

---

## 🎯 Quick Actions

### Make User Admin:
```bash
cd backend
# Edit make_admin.py with user email
python make_admin.py
```

### Make User Superadmin:
```python
# In make_admin.py, change:
text("UPDATE users SET role = 'superadmin' WHERE email = :email")
```

### View All Admins:
```sql
SELECT username, email, role FROM users WHERE role IN ('admin', 'superadmin');
```

---

## 🐛 Troubleshooting

### "Access Denied" on /admin page
**Solution**: Make sure your user has admin or superadmin role

### Can't change user roles
**Solution**: Only superadmins can change roles. Make yourself superadmin.

### Stats showing 0
**Solution**: 
- Check backend is running
- Verify database has data
- Check browser console for errors

### Changes not saving
**Solution**:
- Check network tab for API errors
- Verify authentication token is valid
- Restart backend server

---

## 📊 Statistics Explained

### Total Users
- Count of all registered users
- Shows weekly growth

### Verified Users
- Users who verified email
- Shows verification rate %

### Online Now
- Currently active users
- Real-time count

### Messages Today
- Messages sent since midnight
- Shows total messages

### New Users Week
- Registrations in last 7 days
- Growth indicator

### Pending Reports
- Unresolved reports
- Requires attention

---

## 🎨 Customization

### Change Colors:
Edit `AdminPage.tsx` and replace:
- `#4a154b` - Primary purple
- `bg-blue-100` - Stat card colors
- `bg-green-100` - Success colors

### Add More Stats:
1. Add to backend `dashboard-stats` endpoint
2. Update `Stats` interface in AdminPage.tsx
3. Add new stat card in dashboard

### Add More Actions:
1. Create new backend endpoint
2. Add to `adminService.ts`
3. Add button/action in AdminPage.tsx

---

## ✅ Success Checklist

Before using admin panel:
- [ ] User promoted to admin role
- [ ] Backend server running
- [ ] Logged in as admin user
- [ ] Can access /admin page
- [ ] Dashboard shows statistics
- [ ] Can view users list
- [ ] Can change user roles/status
- [ ] Can view reports
- [ ] Can view audit logs

---

## 🎉 You're Ready!

Your admin panel is **fully functional** with:
- ✅ Beautiful UI
- ✅ Real-time statistics
- ✅ User management
- ✅ Reports system
- ✅ Audit logging
- ✅ Search functionality
- ✅ Role-based access

**Access it now**: http://localhost:5173/admin

Enjoy your powerful admin panel! 🚀
