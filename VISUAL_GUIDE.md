# 🎨 Visual Page Layout Guide

## Page Previews

### 1. 🔐 Login Page (`/login`)
```
┌─────────────────────────────────────────┐
│                                         │
│         🔒 Welcome Back                 │
│    Sign in to continue to CipherConnect │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📧 Email                          │ │
│  │ [Enter your email...............]  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🔒 Password                       │ │
│  │ [Enter your password.........] 👁 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │        🔑 Sign In                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│     Don't have an account? Register    │
└─────────────────────────────────────────┘
```

### 2. 📝 Register Page (`/register`)
```
┌─────────────────────────────────────────┐
│                                         │
│         👤 Create Account               │
│       Join CipherConnect today          │
│                                         │
│  [Username]                             │
│  [Email]                                │
│  [Password] 👁                          │
│  [Bio (optional)]                       │
│                                         │
│  Password Strength: ████░░░░            │
│                                         │
│  [Create Account]                       │
│                                         │
│     Already have an account? Sign in    │
└─────────────────────────────────────────┘
```

### 3. 📊 Dashboard Page (`/dashboard`)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔷 CipherConnect  Dashboard Messages Contacts Groups Admin  │
│                                              👤 User [Logout]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, Username! 👋                                 │
│  Ready to connect securely with your contacts?              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ 💬       │  │ 📧       │  │ 👥       │                 │
│  │ Convs: 5 │  │ Msgs: 42 │  │ Contacts │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  Quick Actions:                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 💬 Start │ │ 👤 Add   │ │ 👥 Create│ │ ✏️ Edit  │     │
│  │   Chat   │ │ Contact  │ │  Group   │ │ Profile  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4. 💬 Chat Page (`/chat`)
```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar          │ Chat Area                                │
├──────────────────┼──────────────────────────────────────────┤
│ 🔍 Search...     │ Conversation Name                        │
│ [+ New Chat]     ├──────────────────────────────────────────┤
│                  │                                          │
│ ┌──────────────┐ │  👤 User: Hello!                        │
│ │ 👤 John      │ │      12:30 PM                           │
│ │ Hey there!   │ │                                          │
│ └──────────────┘ │  👤 You: Hi! How are you?               │
│                  │      12:31 PM                           │
│ ┌──────────────┐ │                                          │
│ │ 👤 Sarah     │ │  👤 User: Great, thanks!                │
│ │ See you!     │ │      12:32 PM                           │
│ └──────────────┘ │                                          │
│                  ├──────────────────────────────────────────┤
│                  │ [Type a message...............] [Send 📤]│
└──────────────────┴──────────────────────────────────────────┘
```

### 5. 👥 Contacts Page (`/contacts`)
```
┌─────────────────────────────────────────────────────────────┐
│  Contacts                                    [🔄 Refresh]   │
│                                                             │
│  🔍 [Search contacts by name or email...................]   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ 👤       │  │ 👤       │  │ 👤       │                 │
│  │ John Doe │  │ Sarah    │  │ Mike     │                 │
│  │ john@... │  │ sarah@.. │  │ mike@... │                 │
│  │ 🟢 Online│  │ 🟢 Online│  │ ⚫ Away  │                 │
│  │[Add][💬] │  │[Add][💬] │  │[Add][💬] │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ 👤       │  │ 👤       │  │ 👤       │                 │
│  │ Emma     │  │ David    │  │ Lisa     │                 │
│  │ emma@... │  │ david@.. │  │ lisa@... │                 │
│  │ 🟢 Online│  │ ⚫ Away  │  │ 🟢 Online│                 │
│  │[Add][💬] │  │[Add][💬] │  │[Add][💬] │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 6. 👥 Groups Page (`/groups`)
```
┌─────────────────────────────────────────────────────────────┐
│  Groups                                  [+ Create Group]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Create New Group                                    │   │
│  │ Group Name: [...........................]           │   │
│  │ Description: [.........................]            │   │
│  │ Add Members:                                        │   │
│  │ ☑ John  ☑ Sarah  ☐ Mike  ☑ Emma                   │   │
│  │ [Create Group] [Cancel]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ 👥       │  │ 👥       │  │ 👥       │                 │
│  │ Team A   │  │ Friends  │  │ Family   │                 │
│  │ Work grp │  │ Chat grp │  │ Personal │                 │
│  │ 5 members│  │ 8 members│  │ 4 members│                 │
│  │ [Open]   │  │ [Open]   │  │ [Open]   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 7. 👤 Profile Page (`/profile`)
```
┌─────────────────────────────────────────────────────────────┐
│                 Gradient Header                             │
│                                                             │
│                    ┌──────────┐                             │
│                    │   👤     │                             │
│                    │  Avatar  │                             │
│                    └──────────┘                             │
│                                                             │
│                    Username                                 │
│                    user@email.com                           │
│                    [user] role                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ About                                    [Edit]     │   │
│  │ Bio: This is my bio...                              │   │
│  │ 🟢 Status: Available                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Messages │  │ Contacts │  │  Groups  │                 │
│  │    0     │  │    0     │  │    0     │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Account Information                                 │   │
│  │ User ID: abc-123-def                                │   │
│  │ Member Since: Jan 1, 2024                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 8. ⚙️ Admin Page (`/admin`)
```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                            │
│  Manage users, reports, and system logs                     │
├─────────────────────────────────────────────────────────────┤
│  [Users] [Reports] [Audit Logs]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Users Tab:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ User      │ Email        │ Role  │ Actions          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 👤 John   │ john@...     │ user  │ [Role: ▼]       │   │
│  │ 👤 Sarah  │ sarah@...    │ admin │ [Role: ▼]       │   │
│  │ 👤 Mike   │ mike@...     │ user  │ [Role: ▼]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Reports Tab:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [pending] Report #1                                 │   │
│  │ Reason: Spam | Reported by: user-123                │   │
│  │ Date: 2024-01-15                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Audit Logs Tab:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ user_login | User: abc-123 | 2024-01-15 10:30      │   │
│  │ role_changed | User: def-456 | 2024-01-15 09:15    │   │
│  │ report_created | User: ghi-789 | 2024-01-14 16:45  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9. 📚 API Docs Page (`/api-docs`)
```
┌─────────────────────────────────────────────────────────────┐
│  API Documentation                                          │
│  Complete reference for CipherConnect API endpoints         │
├─────────────────────────────────────────────────────────────┤
│ Sidebar    │ Content                                        │
├────────────┼────────────────────────────────────────────────┤
│ 🔐 Auth    │ [POST] /auth/register                          │
│ 👤 Users   │ 🔒 Auth Required                               │
│ 💬 Chat    │ Register a new user                            │
│ 👥 Groups  │                                                │
│ ⚙️ Admin   │ Request Body:                                  │
│            │ {                                              │
│            │   "username": "string",                        │
│            │   "email": "string",                           │
│            │   "password": "string"                         │
│            │ }                                              │
│            │                                                │
│            │ Response:                                      │
│            │ {                                              │
│            │   "message": "User registered successfully"    │
│            │ }                                              │
│            │                                                │
│            │ ─────────────────────────────────────────      │
│            │                                                │
│            │ [POST] /auth/login                             │
│            │ 🔒 Auth Required                               │
│            │ Login user and get tokens                      │
│            │ ...                                            │
└────────────┴────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Gradients Used
```
Blue to Purple:   from-blue-600 to-purple-600
Purple to Pink:   from-purple-500 to-pink-600
Blue to Blue:     from-blue-500 to-blue-600
Green to Blue:    from-green-400 to-blue-500
```

### Status Colors
```
🟢 Online/Active:  bg-green-500
🟡 Away:           bg-yellow-500
⚫ Offline:        bg-gray-500
🔴 Error:          bg-red-500
```

### Component Colors
```
Primary Button:    bg-blue-600 hover:bg-blue-700
Secondary Button:  bg-gray-200 hover:bg-gray-300
Danger Button:     bg-red-600 hover:bg-red-700
Success Badge:     bg-green-100 text-green-800
Warning Badge:     bg-yellow-100 text-yellow-800
Info Badge:        bg-blue-100 text-blue-800
```

## 📱 Responsive Breakpoints

```
Mobile:    < 768px   (default)
Tablet:    768px+    (md:)
Desktop:   1024px+   (lg:)
Large:     1280px+   (xl:)
```

## 🎯 Interactive Elements

### Hover Effects
- Cards: `hover:shadow-xl`
- Buttons: `hover:bg-{color}-700`
- Links: `hover:text-gray-900`
- Scale: `hover:scale-105`

### Transitions
- All: `transition-all`
- Colors: `transition-colors`
- Transform: `transition-transform`

### Animations
- Spin: `animate-spin` (loading)
- Pulse: `animate-pulse` (loading)
- Bounce: `animate-bounce` (notifications)

## 🎨 Typography

```
Headings:
h1: text-3xl font-bold
h2: text-2xl font-bold
h3: text-xl font-semibold

Body:
Regular: text-base
Small: text-sm
Tiny: text-xs

Colors:
Primary: text-gray-900
Secondary: text-gray-600
Muted: text-gray-400
```

## 📐 Spacing

```
Padding:
Small: p-2, p-4
Medium: p-6, p-8
Large: p-12

Margin:
Small: m-2, m-4
Medium: m-6, m-8
Large: m-12

Gap:
Small: gap-2, gap-4
Medium: gap-6, gap-8
```

## 🎯 Layout Patterns

### Card Layout
```tsx
<div className="bg-white rounded-xl shadow-lg p-6">
  {/* Content */}
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>
```

### Flex Layout
```tsx
<div className="flex items-center justify-between">
  {/* Items */}
</div>
```

---

**All pages are fully responsive and feature beautiful, modern designs! 🎨**
