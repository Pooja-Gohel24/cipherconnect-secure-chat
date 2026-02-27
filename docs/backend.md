# Backend Documentation

## Overview

The CipherConnect backend is built with FastAPI, providing a RESTful API for the secure messaging application. It handles authentication, user management, messaging, and administrative functions.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [API Architecture](#api-architecture)
4. [Database Models](#database-models)
5. [Authentication System](#authentication-system)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Configuration](#configuration)
8. [Running the Backend](#running-the-backend)
9. [Development Guidelines](#development-guidelines)

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.116.1 |
| Server | Uvicorn | 0.35.0 |
| ORM | SQLAlchemy | 2.0.43 |
| Database | PostgreSQL | 15+ |
| Migrations | Alembic | 1.14.1 |
| Authentication | JWT (python-jose) | 3.5.0 |
| Password Hashing | passlib | 1.7.4 |
| Validation | Pydantic | 2.11.7 |
| Database Driver | psycopg | 3.2.9 |

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependency injection
│   │   └── routes/
│   │       ├── admin.py         # Admin endpoints
│   │       ├── auth.py          # Authentication
│   │       ├── chat.py          # Messaging
│   │       ├── group.py         # Group management
│   │       └── users.py         # User management
│   ├── core/
│   │   ├── config.py            # Settings
│   │   └── security.py          # JWT & password utilities
│   ├── database/
│   │   └── database.py          # Database connection
│   ├── models/                  # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth_token.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── contact.py
│   │   ├── device.py
│   │   ├── report.py
│   │   └── audit_log.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── message.py
│   │   ├── conversation.py
│   │   ├── contact.py
│   │   └── report.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── email_service.py
│   │   └── otp_service.py
│   └── main.py                  # Application entry
├── alembic/                     # Database migrations
│   ├── env.py
│   └── versions/
├── requirements.txt
├── alembic.ini
└── run.py                      # Server runner
```

## API Architecture

### Application Startup

Located in `backend/app/main.py`:

```
python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, chat, group, users
from app.core.config import settings

app = FastAPI(title="CipherConnect API", version="0.1.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(group.router, prefix="/api/groups", tags=["groups"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
```

### Dependency Injection

Located in `backend/app/api/deps.py`:

```
python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    # Validates JWT token and returns current user
    ...

def require_roles(*allowed_roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        # Checks if user has required role
        ...
    return dependency
```

## Database Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  AuthToken  │       │   Contact   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◀──────│ user_id     │       │ id          │
│ username    │       │ id          │       │ user_id     │
│ email       │       │ access_tkn  │       │ contact_usr │
│ password_hash│      │ refresh_tkn │       │ status      │
│ role        │       │ device_id   │       └─────────────┘
│ status      │       │ expires_at  │
│ ...         │       └─────────────┘
└─────────────┘              │
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    Conversation                             │
├─────────────────────────────────────────────────────────────┤
│ id                                                         │
│ type (direct/group)                                        │
│ name                                                       │
│ created_by                                                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Message                              │
├─────────────────────────────────────────────────────────────┤
│ id                                                         │
│ conversation_id                                            │
│ sender_id                                                  │
│ encrypted_content                                          │
│ message_type                                               │
│ created_at                                                 │
└─────────────────────────────────────────────────────────────┘
```

### User Model

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
    
    # Relationships
    auth_tokens = relationship("AuthToken", back_populates="user")
    devices = relationship("UserDevice", back_populates="user")
    contacts = relationship("Contact", foreign_keys="Contact.user_id")
    sent_messages = relationship("Message", back_populates="sender")
```

### AuthToken Model

```
python
class AuthToken(Base):
    __tablename__ = "auth_tokens"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    access_token = Column(Text, nullable=False, unique=True, index=True)
    refresh_token = Column(Text, nullable=False, unique=True, index=True)
    device_id = Column(String(100), nullable=True)
    device_name = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    user = relationship("User", back_populates="auth_tokens")
```

### Conversation Model

```
python
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(20), nullable=False)  # "direct" or "group"
    name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    profile_picture = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    participants = relationship("ConversationParticipant", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")
```

### Message Model

```
python
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    encrypted_content = Column(Text, nullable=False)
    message_type = Column(String(20), nullable=False, default="text")
    reply_to = Column(String(36), ForeignKey("messages.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
    attachments = relationship("MessageAttachment", back_populates="message")
```

## Authentication System

### JWT Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOGIN                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ Client   │───▶│ /login   │───▶│ Validate │                 │
│  │          │    │ endpoint │    │ Password │                 │
│  └──────────┘    └──────────┘    └──────────┘                 │
│       │                                   │                     │
│       │◀──────────────────────────────────┘                     │
│       │         Access + Refresh Tokens                         │
│       │                                                          │
│  2. API REQUEST                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ Client   │───▶│ API      │───▶│ Validate │                 │
│  │          │    │ Endpoint │    │ JWT      │                 │
│  └──────────┘    └──────────┘    └──────────┘                 │
│       │                                   │                     │
│       │◀──────────────────────────────────┘                     │
│       │         Response                                          │
│       │                                                          │
│  3. REFRESH                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ Client   │───▶│ /refresh │───▶│ Validate │                 │
│  │          │    │ endpoint │    │ Refresh  │                 │
│  └──────────┘    └──────────┘    └──────────┘                 │
│       │                                   │                     │
│       │◀──────────────────────────────────┘                     │
│       │         New Access Token                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Generation

Located in `backend/app/core/security.py`:

```
python
def create_access_token(user_id: str) -> tuple[str, datetime]:
    """Create JWT access token"""
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "type": "access",
        "exp": expires_at,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at

def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    """Create JWT refresh token"""
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at
```

### Password Hashing

```
python
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

## API Endpoints Reference

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/ & get tokens | No |
| POSTlogin` | Login | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout & invalidate token | Yes |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user | Yes |
| GET | `/{user_id}` | Get user by ID | Yes |
| PATCH | `/me` | Update current user | Yes |
| GET | `/` | List all users | Admin |
| POST | `/contacts` | Add contact | Yes |

### Chat Routes (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/conversations` | Create conversation | Yes |
| GET | `/conversations` | List conversations | Yes |
| POST | `/messages` | Send message | Yes |
| GET | `/conversations/{id}/messages` | Get messages | Yes |

### Group Routes (`/api/groups`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `` | Create group | Yes |
| POST | `/{id}/members/{user_id}` | Add member | Yes |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reports` | Create report | Admin |
| GET | `/reports` | List reports | Admin |
| GET | `/audit-logs` | List audit logs | Admin |
| PATCH | `/users/{id}/role` | Update user role | Superadmin |

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```
env
# Database Connection
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cipherconnect

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256

# CORS
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Configuration Class

Located in `backend/app/core/config.py`:

```
python
class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/cipherconnect",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    FRONTEND_ORIGINS: list[str] = os.getenv(
        "FRONTEND_ORIGINS", 
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

settings = Settings()
```

## Running the Backend

### Development Mode

```
bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
python run.py
# OR
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```
bash
# Using Docker
docker compose up -d backend

# Or run directly
cd backend
pip install -r requirements.txt
gunicorn app.main:app --workers 4 --bind 0.0.0.0:8000
```

## Development Guidelines

### Creating a New Endpoint

1. Define schema in `app/schemas/`
2. Add route in appropriate `app/api/routes/` file
3. Add business logic in `app/services/`
4. Register router in `app/main.py`

### Database Migrations

```
bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Testing

```
bash
# Run tests (if available)
pytest

# Test specific endpoint
curl -X GET http://127.0.0.1:8000/health
```

## Error Handling

### HTTP Exceptions

```
python
from fastapi import HTTPException, status

# 400 Bad Request
raise HTTPException(status_code=400, detail="Error message")

# 401 Unauthorized
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, 
    detail="Invalid credentials"
)

# 403 Forbidden
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN, 
    detail="Insufficient permissions"
)

# 404 Not Found
raise HTTPException(status_code=404, detail="Resource not found")
```

### Global Exception Handler

```
python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

## Logging

### Using the Logger

```
python
import logging

logger = logging.getLogger(__name__)

logger.info("User logged in")
logger.error("Failed to send message")
logger.warning("Rate limit exceeded")
```

## Related Documentation

- [Registration Module](./registration-module.md)
- [Login Module](./login-module.md)
- [Frontend Documentation](./frontend.md)
- [Database Design](./database-design.md)
