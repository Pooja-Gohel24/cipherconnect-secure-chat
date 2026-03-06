# Quick Reference Guide - CipherConnect Frontend

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

## 📦 New Files Created

### Services (API Calls)
1. `src/services/authService.ts` - Authentication endpoints
2. `src/services/userService.ts` - User management endpoints
3. `src/services/chatService.ts` - Chat/messaging endpoints
4. `src/services/groupService.ts` - Group management endpoints
5. `src/services/adminService.ts` - Admin endpoints

### Pages (UI Components)
1. `src/pages/DashboardPage.tsx` - Main dashboard with navigation
2. `src/pages/ChatPage.tsx` - Messaging interface
3. `src/pages/ContactsPage.tsx` - Contact management
4. `src/pages/GroupsPage.tsx` - Group creation & management
5. `src/pages/ProfilePage.tsx` - User profile
6. `src/pages/AdminPage.tsx` - Admin dashboard
7. `src/pages/ApiDocsPage.tsx` - API documentation

### Updated Files
- `src/App.tsx` - Added new routes

## 🎯 API Endpoints Coverage

### ✅ Authentication (`/auth`)
| Method | Endpoint | Service Method | Page |
|--------|----------|----------------|------|
| POST | `/auth/register` | `authService.register()` | RegisterPage |
| POST | `/auth/login` | `authService.login()` | LoginPage |
| POST | `/auth/refresh` | `authService.refresh()` | - |
| POST | `/auth/logout` | `authService.logout()` | DashboardPage |

### ✅ Users (`/users`)
| Method | Endpoint | Service Method | Page |
|--------|----------|----------------|------|
| GET | `/users/me` | `userService.getMe()` | ProfilePage, DashboardPage |
| GET | `/users` | `userService.listUsers()` | ContactsPage, AdminPage |
| PATCH | `/users/me` | `userService.updateMe()` | ProfilePage |
| GET | `/users/{user_id}` | `userService.getUser()` | - |
| POST | `/users/contacts` | `userService.createContact()` | ContactsPage |

### ✅ Chat (`/chat`)
| Method | Endpoint | Service Method | Page |
|--------|----------|----------------|------|
| POST | `/chat/conversations` | `chatService.createConversation()` | ContactsPage |
| GET | `/chat/conversations` | `chatService.listConversations()` | ChatPage, GroupsPage |
| POST | `/chat/messages` | `chatService.sendMessage()` | ChatPage |
| GET | `/chat/conversations/{id}/messages` | `chatService.listMessages()` | ChatPage |

### ✅ Groups (`/groups`)
| Method | Endpoint | Service Method | Page |
|--------|----------|----------------|------|
| POST | `/groups` | `groupService.createGroup()` | GroupsPage |
| POST | `/groups/{id}/members/{user_id}` | `groupService.addMember()` | GroupsPage |

### ✅ Admin (`/admin`)
| Method | Endpoint | Service Method | Page |
|--------|----------|----------------|------|
| POST | `/admin/reports` | `adminService.createReport()` | AdminPage |
| GET | `/admin/reports` | `adminService.listReports()` | AdminPage |
| GET | `/admin/audit-logs` | `adminService.listAuditLogs()` | AdminPage |
| PATCH | `/admin/users/{id}/role` | `adminService.updateUserRole()` | AdminPage |

## 🎨 Component Examples

### Using Auth Service
```typescript
import { authService } from '../services/authService';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'Password123',
  device_id: 'web-client',
  device_name: 'Web Browser'
});

// Store tokens
localStorage.setItem('access_token', response.data.access_token);
localStorage.setItem('refresh_token', response.data.refresh_token);
```

### Using User Service
```typescript
import { userService } from '../services/userService';

const token = localStorage.getItem('access_token') || '';

// Get current user
const user = await userService.getMe(token);

// Update profile
await userService.updateMe({
  bio: 'New bio',
  status: 'Available'
}, token);

// Add contact
await userService.createContact({
  contact_user_id: 'user-123'
}, token);
```

### Using Chat Service
```typescript
import { chatService } from '../services/chatService';

const token = localStorage.getItem('access_token') || '';

// Create conversation
await chatService.createConversation({
  type: 'direct',
  participant_ids: ['user-123']
}, token);

// Send message
await chatService.sendMessage({
  conversation_id: 'conv-123',
  encrypted_content: 'Hello!'
}, token);

// Get messages
const messages = await chatService.listMessages('conv-123', token);
```

### Using Group Service
```typescript
import { groupService } from '../services/groupService';

const token = localStorage.getItem('access_token') || '';

// Create group
await groupService.createGroup({
  type: 'group',
  name: 'My Group',
  description: 'Group description',
  participant_ids: ['user-1', 'user-2']
}, token);

// Add member
await groupService.addMember('conv-123', 'user-456', token);
```

### Using Admin Service
```typescript
import { adminService } from '../services/adminService';

const token = localStorage.getItem('access_token') || '';

// Create report
await adminService.createReport({
  reported_user: 'user-123',
  reason: 'Spam'
}, token);

// Update user role
await adminService.updateUserRole('user-123', {
  role: 'admin'
}, token);

// Get audit logs
const logs = await adminService.listAuditLogs(token);
```

## 🛣️ Navigation Structure

```
/
├── /login (public)
├── /register (public)
├── /api-docs (public)
└── / (protected)
    ├── /dashboard
    ├── /profile
    ├── /chat
    ├── /contacts
    ├── /groups
    └── /admin (admin only)
```

## 🎨 UI Components Used

### Buttons
```tsx
// Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// Secondary
<button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">

// Danger
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
```

### Cards
```tsx
<div className="bg-white rounded-xl shadow-lg p-6">
  {/* Content */}
</div>
```

### Gradient Cards
```tsx
<div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
  {/* Content */}
</div>
```

### Input Fields
```tsx
<input 
  type="text"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
```

## 🔐 Authentication Pattern

```typescript
// 1. Login and store tokens
const response = await authService.login(credentials);
localStorage.setItem('access_token', response.data.access_token);
localStorage.setItem('refresh_token', response.data.refresh_token);

// 2. Use token in API calls
const token = localStorage.getItem('access_token') || '';
const data = await userService.getMe(token);

// 3. Logout
const refreshToken = localStorage.getItem('refresh_token') || '';
await authService.logout(refreshToken);
localStorage.clear();
```

## 📊 State Management Pattern

```typescript
// Component state
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// Load data
const loadData = async () => {
  setLoading(true);
  try {
    const response = await service.getData(token);
    setData(response.data);
  } catch (err) {
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};

// Use effect
useEffect(() => {
  loadData();
}, []);
```

## 🎯 Error Handling Pattern

```typescript
try {
  await apiCall();
  alert('Success!');
} catch (err) {
  console.error(err);
  alert('Error occurred');
}
```

## 🎨 Color Classes

```
Primary: bg-blue-600, text-blue-600, border-blue-600
Secondary: bg-purple-600, text-purple-600, border-purple-600
Accent: bg-pink-600, text-pink-600, border-pink-600
Success: bg-green-600, text-green-600, border-green-600
Warning: bg-yellow-600, text-yellow-600, border-yellow-600
Danger: bg-red-600, text-red-600, border-red-600
```

## 📱 Responsive Classes

```
Mobile: default
Tablet: md:
Desktop: lg:
Large: xl:

Example:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## 🔍 Testing the Implementation

1. **Start Backend**
```bash
cd backend
python run.py
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
```

3. **Test Flow**
- Register a new user at `/register`
- Login at `/login`
- View dashboard at `/dashboard`
- Test each feature:
  - Profile management
  - Contact management
  - Chat functionality
  - Group creation
  - Admin panel (if admin)
  - API documentation

## 📝 Key Features

✅ All API endpoints implemented
✅ Beautiful, modern UI design
✅ Responsive layout
✅ Form validation
✅ Error handling
✅ Loading states
✅ Authentication flow
✅ Protected routes
✅ Role-based access control
✅ Interactive API documentation

## 🎉 You're Ready!

All API endpoints are now connected to beautiful UI components. Start the application and explore all features!

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

**Happy Coding! 🚀**
