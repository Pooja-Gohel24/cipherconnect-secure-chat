# CipherConnect

A secure end-to-end encrypted messaging application built with FastAPI, PostgreSQL, and React (TypeScript).

## Overview

CipherConnect is a secure messaging platform that provides:
- End-to-end encryption for messages
- User authentication with JWT tokens
- Role-based access control (RBAC)
- Real-time messaging capabilities
- Group chat support
- Contact management

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT (Access/Refresh tokens)
- **Security**: Password hashing with bcrypt

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Context API

### DevOps
- **Containerization**: Docker & Docker Compose

## Project Structure

```
cipherconnect/
├── backend/
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # Dependency injection
│   │   │   └── routes/
│   │   │       ├── admin.py     # Admin endpoints
│   │   │       ├── auth.py     # Authentication endpoints
│   │   │       ├── chat.py     # Chat/messaging endpoints
│   │   │       ├── group.py    # Group management
│   │   │       └── users.py    # User management
│   │   ├── core/
│   │   │   ├── config.py       # Application configuration
│   │   │   └── security.py    # JWT & password utilities
│   │   ├── database/
│   │   │   └── database.py    # Database connection
│   │   ├── models/
│   │   │   ├── user.py        # User model
│   │   │   ├── auth_token.py  # Auth token model
│   │   │   ├── conversation conversation.py # Chat model
│   │   │   ├── message.py     # Message model
│   │   │   ├── contact.py     # Contact model
│   │   │   └── ...            # Other models
│   │   ├── schemas/
│   │   │   ├── auth.py        # Auth request/response schemas
│   │   │   ├── user.py        # User schemas
│   │   │   ├── message.py     # Message schemas
│   │   │   └── ...            # Other schemas
│   │   ├── services/
│   │   │   ├── auth_service.py # Authentication logic
│   │   │   ├── email_service.py # Email utilities
│   │   │   └── otp_service.py  # OTP utilities
│   │   └── main.py            # FastAPI application entry
│   ├── alembic.ini
│   ├── requirements.txt
│   └── run.py                 # Application runner
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Page layouts
│   │   ├── pages/            # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── ...
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig*.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Python 3.10+** 
- **Node.js 18+**
- **Docker** and **Docker Compose**

## Quick Start

### 1. Clone the Repository

```
bash
git clone <repository-url>
cd CipherConnect
```

### 2. Download and Start PostgreSQL Database

#### Option A: Using Docker (Recommended)

```
bash
# Start PostgreSQL using Docker
docker compose up -d postgres

# Or start all services at once
docker compose up -d
```

The database will be available at:
- Host: `localhost`
- Port: `5432`
- Database: `cipherconnect`
- Username: `postgres`
- Password: `postgres`

#### Option B: Download PostgreSQL Directly

1. **Download PostgreSQL**:
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: https://www.postgresql.org/download/macososx/ (or use Homebrew: `brew install postgresql`)
   - Linux: Use your package manager (e.g., `sudo apt install postgresql`)

2. **Start PostgreSQL Service**:
   
```
bash
   # Linux (Ubuntu/Debian)
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # macOS
   brew services start postgresql

   # Windows: Start from Services app or pgAdmin
   
```

3. **Create Database**:
   
```
bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE cipherconnect;

   # Exit
   \q
   
```

### 3. Backend Setup

```
bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file (optional - defaults are provided)
copy .env.example .env
# Or on Windows:
copy .env.example .env

# Run database migrations
alembic upgrade head

# Start the backend server
python run.py
# OR
uvicorn app.main:app --reload
```

The API will be available at: `http://127.0.0.1:8000`

API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 4. Frontend Setup

Open a new terminal:

```
bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file (optional - defaults are provided)
copy .env.example .env

# Start development server
npm run dev
```

The frontend will be available at: `http://127.0.0.1:5173`

## Detailed Setup Guide

### Database Setup Options

#### Option 1: Docker (Recommended)

```
bash
# Start only PostgreSQL
docker compose up -d postgres

# View logs
docker compose logs -f postgres

# Stop PostgreSQL
docker compose down

# Remove all data (reset database)
docker compose down -v
```

#### Option 2: Local PostgreSQL Installation

1. **Download PostgreSQL**:
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **macOS**: Download from https://www.postgresql.org/download/macososx/ or use Homebrew: `brew install postgresql`
   - **Linux (Ubuntu/Debian)**:
     
```
bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     
```

2. **Start PostgreSQL Service**:
   
```
bash
   # Linux (Ubuntu/Debian)
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # macOS
   brew services start postgresql

   # Windows: Start from Services app or pgAdmin
   
```

3. **Create Database and User**:
   
```
bash
   # Connect to PostgreSQL (Linux/macOS)
   sudo -u postgres psql
   
   # Connect to PostgreSQL (Windows - use psql with your credentials)
   psql -U postgres

   # Create database
   CREATE DATABASE cipherconnect;

   # Create user (optional - for better security)
   CREATE USER postgres WITH PASSWORD 'postgres';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE cipherconnect TO postgres;

   # Exit
   \q
   
```

4. **Configure Connection**:
   Update `backend/app/core/config.py` if using custom credentials:
   
```
python
   DATABASE_URL = "postgresql+psycopg://username:password@localhost:5432/cipherconnect"
   
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```
env
# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cipherconnect

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256

# Frontend Origins (comma-separated)
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

#### Frontend (.env)

Create a `.env` file in the `frontend` directory:

```
env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Database Migrations

#### Create a New Migration

```bash
cd backend
alembic revision --autogenerate -m "description_of_changes"
```

#### Apply Migrations

```
bash
alembic upgrade head
```

#### Rollback Migration

```
bash
alembic downgrade -1
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```
bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python run.py
```

**Terminal 2 - Frontend:**
```
bash
cd frontend
npm run dev
```

### Production Mode

```
bash
# Build frontend
cd frontend
npm run build

# Start production server (using Docker)
docker compose up -d
