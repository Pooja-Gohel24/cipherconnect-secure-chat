# Frontend Documentation

## Overview

The CipherConnect frontend is a React application built with TypeScript, providing a modern and responsive user interface for the secure messaging platform.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Pages](#pages)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing](#routing)
8. [Styling](#styling)
9. [Running the Frontend](#running-the-frontend)
10. [Development Guidelines](#development-guidelines)

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| Routing | React Router | 6.x |
| HTTP Client | Axios | 1.x |
| Icons | Heroicons | 2.x |

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ProtectedRoute.tsx
│   │   └── ... (other components)
│   ├── context/               # React Context providers
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                # Custom React hooks
│   │   └── useAuth.ts       # Auth hook
│   ├── layouts/              # Page layouts
│   │   └── AppLayout.tsx    # Main app layout
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/             # API services
│   │   ├── api.ts           # Axios instance
│   │   └── auth.ts         # Auth API calls
│   ├── types/                # TypeScript types
│   │   └── auth.ts         # Auth types
│   ├── utils/               # Utility functions
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Core Components

### ProtectedRoute

Located in `frontend/src/components/ProtectedRoute.tsx`

```
typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Purpose**: Protects routes that require authentication.

**Usage**:
```
tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### AppLayout

Located in `frontend/src/layouts/AppLayout.tsx`

**Purpose**: Main layout wrapper with navigation and auth state.

**Features**:
- Navigation header
- User authentication state display
- Logout functionality

### AuthContext

Located in `frontend/src/context/AuthContext.tsx`

```
typescript
interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Purpose**: Provides authentication state and methods globally.

### useAuth Hook

Located in `frontend/src/hooks/useAuth.ts`

```
typescript
const { user, login, logout, loading } = useAuth();
```

**Purpose**: Access authentication context from any component.

## Pages

### LoginPage

Located in `frontend/src/pages/LoginPage.tsx`

**Features**:
- Email and password inputs
- Password visibility toggle
- Form validation
- Error handling
- Loading states

**Route**: `/login`

### RegisterPage

Located in `frontend/src/pages/RegisterPage.tsx`

**Features**:
- Username, email, password inputs
- Bio field (optional)
- Password strength indicator
- Form validation
- Error handling
- Loading states

**Route**: `/register`

### DashboardPage

Located in `frontend/src/pages/DashboardPage.tsx`

**Features**:
- User dashboard
- Navigation to chats and contacts

**Route**: `/`

### NotFoundPage

Located in `frontend/src/pages/NotFoundPage.tsx`

**Route**: `/*` (catch-all for 404)

## State Management

### AuthContext

The application uses React Context for global authentication state:

```
typescript
// frontend/src/context/AuthContext.tsx
import { createContext, useEffect, useState } from "react";

// Token storage keys
const ACCESS_KEY = "cipherconnect_access_token";
const REFRESH_KEY = "cipherconnect_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(ACCESS_KEY)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem(REFRESH_KEY)
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Persist tokens
  const persistTokens = (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  // Clear auth
  const clearAuth = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Login
  const login = async (payload: LoginPayload) => {
    const tokens = await loginUser(payload);
    persistTokens(tokens.access_token, tokens.refresh_token);
    const me = await getCurrentUser(tokens.access_token);
    setUser(me);
  };

  // Logout
  const logout = async () => {
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } finally {
      clearAuth();
    }
  };

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const me = await getCurrentUser(accessToken);
        setUser(me);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## API Integration

### Axios Instance

Located in `frontend/src/services/api.ts`

```
typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
```

### Auth Service

Located in `frontend/src/services/auth.ts`

```
typescript
import api from "./api";
import type { AuthTokens, LoginPayload, RegisterPayload, UserProfile } from "../types/auth";

// Register new user
export async function registerUser(payload: RegisterPayload): Promise<void> {
  await api.post("/api/auth/register", payload);
}

// Login user
export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/login", payload);
  return data;
}

// Refresh token
export async function refreshUserToken(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

// Logout
export async function logoutUser(refreshToken: string): Promise<void> {
  await api.post("/api/auth/logout", { refresh_token: refreshToken });
}

// Get current user
export async function getCurrentUser(accessToken: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
```

### Adding Auth Headers

For API calls that require authentication:

```
typescript
const response = await api.get("/api/users/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## Routing

### App.tsx

Located in `frontend/src/App.tsx`

```
typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Route Protection

```
typescript
// ProtectedRoute component
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

## Styling

### TailwindCSS Configuration

Located in `frontend/tailwind.config.js`

```
javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Global Styles

Located in `frontend/src/index.css`

```
css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
body {
  @apply bg-gray-50;
}
```

### Using Tailwind Classes

```
tsx
// Button example
<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
  Click me
</button>

// Card example
<div className="bg-white rounded-xl shadow-lg p-6">
  Content here
</div>
```

## Running the Frontend

### Development Mode

```
bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

### Build for Production

```
bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the `frontend` directory:

```
env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Development Guidelines

### Creating a New Page

1. Create the page component in `src/pages/`
2. Add the route in `App.tsx`
3. Wrap with layout if needed
4. Add protection if authentication required

Example:
```
typescript
// src/pages/MyPage.tsx
export default function MyPage() {
  return <div>My Page Content</div>;
}

// App.tsx
<Route path="/my-page" element={<MyPage />} />
```

### Creating a New Component

```
typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

### Using the Auth Hook

```
typescript
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  return (
    <div>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

### Making API Calls

```
typescript
import api from "../services/api";

// GET request
const response = await api.get("/api/users/me");

// POST request
const response = await api.post("/api/auth/login", { email, password });

// With auth header
const response = await api.get("/api/chat/conversations", {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### TypeScript Types

Located in `frontend/src/types/auth.ts`:

```
typescript
export type UserRole = "user" | "admin" | "superadmin";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_at: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  public_key: string | null;
  encrypted_private_key: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  role: UserRole;
  status: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}
```

## Common Issues

### CORS Errors

If you encounter CORS errors:
1. Check backend CORS configuration in `main.py`
2. Verify `FRONTEND_ORIGINS` in backend config
3. Ensure frontend URL matches allowed origins

### Token Expiration

When access token expires:
1. Use refresh token to get new access token
2. Implement axios interceptor for automatic refresh
3. Redirect to login if refresh fails

### API Connection

If API calls fail:
1. Check backend is running (`http://127.0.0.1:8000`)
2. Verify `VITE_API_BASE_URL` in frontend `.env`
3. Check browser console for error details

## Related Documentation

- [Registration Module](./registration-module.md)
- [Login Module](./login-module.md)
- [Backend Documentation](./backend.md)
- [Database Design](./database-design.md)
