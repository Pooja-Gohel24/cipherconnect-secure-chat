# Registration Module Documentation

## Overview

The Registration Module handles user registration functionality in CipherConnect. It provides secure user account creation with email verification, password hashing, and optional end-to-end encryption key generation.

## Table of Contents

1. [Architecture](#architecture)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Database Models](#database-models)
5. [Security Considerations](#security-considerations)
6. [Frontend Integration](#frontend-integration)
7. [Error Handling](#error-handling)

## Architecture

### Backend Components

```
Registration Flow:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Auth Router    │────▶│  Auth Service   │
│  (RegisterPage) │     │  (/register)    │     │ (register_user)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Database       │
                                               │  (User Model)   │
                                               └─────────────────┘
```

### File Structure

```
backend/app/
├── api/routes/
│   └── auth.py          # Registration endpoint
├── services/
│   └── auth_service.py  # Registration business logic
├── models/
│   └── user.py          # User database model
├── schemas/
│   └── auth.py          # Request/Response schemas
└── core/
    └── security.py      # Password hashing utilities
```

## API Endpoints

### POST /api/auth/register

Register a new user account.

**Endpoint:** `POST /api/auth/register`

**Base URL:** `http://127.0.0.1:8000`

#### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

#### Request Body

```
json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "bio": "string (optional)",
  "public_key": "string (optional)",
  "encrypted_private_key": "string (optional)"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (3-30 chars, alphanumeric + underscore) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 8 chars) |
| bio | string | No | User biography (max 255 chars) |
| public_key | string | No | End-to-end encryption public key |
| encrypted_private_key | string | No | Encrypted private key for E2E encryption |

#### Success Response

**Status Code:** `200 OK`

```
json
{
  "message": "User registered successfully"
}
```

#### Error Responses

**Status Code:** `400 Bad Request`

```
json
{
  "detail": "Email or username already exists"
}
```

**Status Code:** `422 Unprocessable Entity`

```
json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error"
    }
  ]
}
```

## Request/Response Schemas

### Backend Schemas (Pydantic)

Located in `backend/app/schemas/auth.py`:

```
python
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    bio: str | None = None
    public_key: str | None = None
    encrypted_private_key: str | None = None
```

### Frontend Types (TypeScript)

Located in `frontend/src/types/auth.ts`:

```
typescript
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  bio?: string;
}
```

## Database Models

### User Model

Located in `backend/app/models/user.py`:

```
python
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    public_key = Column(Text, nullable=True)
    encrypted_private_key = Column(Text, nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    bio = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="user")
    status = Column(String(20), nullable=False, default="offline")
    is_online = Column(Boolean, nullable=False, default=False)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
```

### User Table Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID string |
| username | VARCHAR(50) | UNIQUE, NOT NULL, INDEXED | Unique username |
| email | VARCHAR(150) | UNIQUE, NOT NULL, INDEXED | User email |
| password_hash | TEXT | NOT NULL | Bcrypt hashed password |
| public_key | TEXT | NULLABLE | E2E encryption public key |
| encrypted_private_key | TEXT | NULLABLE | Encrypted private key |
| profile_picture_url | TEXT | NULLABLE | Profile picture URL |
| bio | VARCHAR(255) | NULLABLE | User biography |
| role | VARCHAR(20) | NOT NULL, DEFAULT='user' | User role |
| status | VARCHAR(20) | NOT NULL, DEFAULT='offline' | Online status |
| is_online | BOOLEAN | NOT NULL, DEFAULT=FALSE | Online flag |
| last_seen | DATETIME | NULLABLE | Last seen timestamp |
| created_at | DATETIME | NOT NULL | Creation timestamp |

## Security Considerations

### Password Security

1. **Hashing Algorithm**: Uses bcrypt via `passlib[bcrypt]`
2. **Minimum Requirements**: 
   - Minimum 8 characters
   - No maximum length enforced by backend (frontend enforces reasonable limits)

### Input Validation

1. **Email**: Must be valid email format (Pydantic EmailStr)
2. **Username**: 
   - 3-30 characters
   - Alphanumeric + underscores only
   - Must be unique
3. **Password**: Minimum 8 characters (enforced by frontend)

### Security Best Practices

- Passwords are never stored in plain text
- SQL injection prevention via SQLAlchemy ORM
- CORS protection configured in FastAPI
- JWT tokens for session management

## Frontend Integration

### Registration Page

Located in `frontend/src/pages/RegisterPage.tsx`

#### Features

1. **Form Fields**:
   - Username input
   - Email input
   - Password input with show/hide toggle
   - Bio textarea (optional)
   - Password strength indicator

2. **Validation**:
   - Real-time validation on blur
   - Username: 3-30 chars, alphanumeric + underscore
   - Email: Valid email format
   - Password: Min 8 chars, uppercase, lowercase, number

3. **User Experience**:
   - Loading state during submission
   - Error messages with visual feedback
   - Success navigation to login page
   - Password strength meter

#### Registration Flow

```
typescript
// frontend/src/services/auth.ts
export async function registerUser(payload: RegisterPayload): Promise<void> {
  await api.post("/api/auth/register", payload);
}

// Usage in RegisterPage
const onSubmit = async (data: RegisterFormState) => {
  await register(data);
  navigate("/login");
};
```

### Auth Context

The `AuthProvider` in `frontend/src/context/AuthContext.tsx` provides:

- `register(payload)` - Register a new user
- `login(payload)` - Login user
- `logout()` - Logout user
- `user` - Current user object
- `loading` - Auth loading state

## Error Handling

### Backend Error Handling

```
python
# backend/app/api/routes/auth.py
@router.post("/register", response_model=dict)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == data.email) | (User.username == data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email or username already exists"
        )
    
    # Register user
    register_user(db, data.username, data.email, data.password, ...)
    
    return {"message": "User registered successfully"}
```

### Frontend Error Handling

```
typescript
// frontend/src/pages/RegisterPage.tsx
const onSubmit = async (e: FormEvent) => {
  try {
    await register(form);
    navigate("/login");
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    setError(message);
  }
};
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email or username already exists" | User already registered | Use different email/username |
| "value is not a valid email address" | Invalid email format | Enter valid email |
| "Registration failed" | Server error | Try again later |

## Testing

### API Testing with curl

```
bash
# Register a new user
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "bio": "Hello, I am a test user"
  }'
```

### Expected Response

```
json
{
  "message": "User registered successfully"
}
```

## Related Documentation

- [Login Module](./login-module.md)
- [Backend Documentation](./backend.md)
- [Frontend Documentation](./frontend.md)
- [Database Design](./database-design.md)
