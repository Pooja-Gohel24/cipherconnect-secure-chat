# Login Module Documentation

## Overview

The Login Module handles user authentication in CipherConnect. It provides secure login with JWT token-based authentication, including access tokens and refresh tokens for persistent sessions.

## Table of Contents

1. [Architecture](#architecture)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Token Management](#token-management)
5. [Security Considerations](#security-considerations)
6. [Frontend Integration](#frontend-integration)
7. [Error Handling](#error-handling)

## Architecture

### Authentication Flow

```
Login Flow:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Auth Router    │────▶│  Auth Service   │
│  (LoginPage)    │     │  (/login)       │     │(authenticate_user)
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  JWT Generator  │
                                               │(issue_tokens)   │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Response       │
                                               │(tokens + user)  │
                                               └─────────────────┘
```

### Token-Based Authentication

CipherConnect uses a dual-token system:

1. **Access Token**: Short-lived token (default: 30 minutes) for API requests
2. **Refresh Token**: Long-lived token (default: 7 days) for obtaining new access tokens

### File Structure

```
backend/app/
├── api/routes/
│   └── auth.py              # Login, refresh, logout endpoints
├── services/
│   └── auth_service.py      # Authentication & token logic
├── models/
│   ├── user.py              # User model
│   └── auth_token.py        # Auth token model
├── schemas/
│   └── auth.py              # Request/Response schemas
└── core/
    └── security.py          # JWT creation/verification
```

## API Endpoints

### POST /api/auth/login

Authenticate user and obtain tokens.

**Endpoint:** `POST /api/auth/login`

**Base URL:** `http://127.0.0.1:8000`

#### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

#### Request Body

```json
{
  "email": "string",
  "password": "string",
  "device_id": "string (optional)",
  "device_name": "string (optional)"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |
| password | string | Yes | User password |
| device_id | string | No | Device identifier (default: "web-client") |
| device_name | string | No | Device name (default: "Web Browser") |

#### Success Response

**Status Code:** `200 OK`

```
json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_at": "2024-01-15T10:30:00Z"
}
```

### POST /api/auth/refresh

Obtain new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

#### Request Body

```
json
{
  "refresh_token": "string"
}
```

#### Success Response

```
json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_at": "string"
}
```

### POST /api/auth/logout

Invalidate refresh token and logout user.

**Endpoint:** `POST /api/auth/logout`

#### Request Body

```
json
{
  "refresh_token": "string"
}
```

#### Success Response

```
json
{
  "message": "Logged out"
}
```

## Request/Response Schemas

### Backend Schemas (Pydantic)

Located in `backend/app/schemas/auth.py`:

```
python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str | None = None
    device_name: str | None = None

class RefreshRequest(BaseModel):
    refresh_token: str

class AuthTokensOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime
```

### Frontend Types (TypeScript)

Located in `frontend/src/types/auth.ts`:

```
typescript
export interface LoginPayload {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_at: string;
}
```

## Token Management

### Token Structure

#### Access Token Payload

```
json
{
  "sub": "user-uuid",
  "type": "access",
  "exp": 1705315800,
  "iat": 1705314000
}
```

#### Refresh Token Payload

```
json
{
  "sub": "user-uuid",
  "type": "refresh",
  "exp": 1705915800,
  "iat": 1705315800
}
```

### Token Storage

**Backend:**
- Refresh tokens stored in database (`auth_tokens` table)
- Access tokens verified via JWT signature

**Frontend:**
- Access token: Stored in `localStorage` (key: `cipherconnect_access_token`)
- Refresh token: Stored in `localStorage` (key: `cipherconnect_refresh_token`)

### Token Expiration

| Token Type | Default Expiration | Configurable |
|------------|-------------------|---------------|
| Access Token | 30 minutes | Via `ACCESS_TOKEN_EXPIRE_MINUTES` env |
| Refresh Token | 7 days | Via `REFRESH_TOKEN_EXPIRE_DAYS` env |

## Security Considerations

### Password Verification

1. **Hashing**: Uses bcrypt via `passlib[bcrypt]`
2. **Verification**: `verify_password(password, hash)` function

### Token Security

1. **Algorithm**: HS256 (HMAC-SHA256)
2. **Secret Key**: Configurable via `SECRET_KEY` environment variable
3. **Token Validation**:
   - Signature verification
   - Expiration check
   - Token type verification (access vs refresh)

### Session Management

1. **Device Tracking**: Tokens associated with device_id and device_name
2. **Database Session**: Refresh tokens stored with metadata
3. **Session Expiry**: Automatic expiration based on configured duration

### Security Best Practices

- Tokens are signed, not encrypted (don't store sensitive data)
- Short-lived access tokens minimize window of vulnerability
- Refresh tokens can be revoked via logout
- CORS configured to restrict allowed origins

## Frontend Integration

### Login Page

Located in `frontend/src/pages/LoginPage.tsx`

#### Features

1. **Form Fields**:
   - Email input
   - Password input with show/hide toggle

2. **Validation**:
   - Email required and valid format
   - Password required

3. **User Experience**:
   - Loading state during submission
   - Error messages with visual feedback
   - Redirect to dashboard on success

#### Login Flow

```
typescript
// frontend/src/services/auth.ts
export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/login", payload);
  return data;
}

// Usage in LoginPage
const onSubmit = async (data: LoginFormState) => {
  const tokens = await loginUser(data);
  persistTokens(tokens.access_token, tokens.refresh_token);
  navigate("/");
};
```

### Auth Context

Located in `frontend/src/context/AuthContext.tsx`

```
typescript
interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}
```

#### Token Persistence

```
typescript
const persistTokens = (access: string, refresh: string) => {
  localStorage.setItem("cipherconnect_access_token", access);
  localStorage.setItem("cipherconnect_refresh_token", refresh);
};
```

#### Auto Token Refresh

The frontend should handle token refresh when access token expires:

```
typescript
// Example: Axios interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("cipherconnect_refresh_token");
      if (refreshToken) {
        const tokens = await refreshUserToken(refreshToken);
        persistTokens(tokens.access_token, tokens.refresh_token);
        // Retry original request
      }
    }
    return Promise.reject(error);
  }
);
```

## Error Handling

### Backend Error Handling

```
python
@router.post("/login", response_model=AuthTokensOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token, refresh_token, expires_at = issue_tokens(
        db, user, data.device_id, data.device_name
    )
    
    return AuthTokensOut(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at
    )
```

### Frontend Error Handling

```
typescript
const onSubmit = async (e: FormEvent) => {
  try {
    await login(form);
    navigate("/", { replace: true });
  } catch (err: unknown) {
    const message = extractErrorMessage(err); // "Invalid credentials"
    setError(message);
  }
};
```

### Error Messages

| Error | HTTP Status | Cause | Solution |
|-------|-------------|-------|----------|
| "Invalid credentials" | 401 | Wrong email/password | Check credentials |
| "Session expired" | 401 | Access token expired | Refresh token |
| "Session not found" | 401 | Invalid/expired refresh token | Login again |
| "User not found" | 404 | User deleted | Contact support |

## Testing

### API Testing with curl

#### Login

```
bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123",
    "device_id": "web-client",
    "device_name": "Chrome Browser"
  }'
```

#### Refresh Token

```
bash
curl -X POST http://127.0.0.1:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

#### Logout

```
bash
curl -X POST http://127.0.0.1:8000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

### Expected Responses

**Login Response:**
```
json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_at": "2024-01-15T10:30:00"
}
```

**Logout Response:**
```
json
{
  "message": "Logged out"
}
```

## Database Models

### AuthToken Model

Located in `backend/app/models/auth_token.py`:

```
python
class AuthToken(Base):
    __tablename__ = "auth_tokens"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    access_token = Column(Text, nullable=False, unique=True, index=True)
    refresh_token = Column(Text, nullable=False, unique=True, index=True)
    device_id = Column(String(100), nullable=True)
    device_name = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    user = relationship("User", back_populates="auth_tokens")
```

### AuthTokens Table Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| access_token | TEXT | UNIQUE, INDEXED | JWT access token |
| refresh_token | TEXT | UNIQUE, INDEXED | JWT refresh token |
| device_id | VARCHAR(100) | NULLABLE | Device identifier |
| device_name | VARCHAR(255) | NULLABLE | Device name |
| expires_at | DATETIME | NOT NULL | Expiration timestamp |
| created_at | DATETIME | NOT NULL | Creation timestamp |

## Related Documentation

- [Registration Module](./registration-module.md)
- [Backend Documentation](./backend.md)
- [Frontend Documentation](./frontend.md)
- [JWT Security](./jwt-security.md)
