# Military Web App

A full-stack web application for military project management and chat functionality.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Database**: SQLite (SQLAlchemy)

## Project Structure

```
Military_web_app/
├── backend/
│   ├── src/
│   │   ├── main.py       # FastAPI application
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── database.py   # Database configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the backend server:
   ```bash
   uvicorn src.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Project Phases

## ✅ Phase 1: Foundational Secure Messaging — **COMPLETE**

| Component | Status |
|-----------|--------|
| FastAPI backend with SQLAlchemy | ✅ |
| PostgreSQL/SQLite database | ✅ |
| User authentication (register/login) | ✅ |
| Project-based communication (Operations) | ✅ |
| Project creation and member management | ✅ |
| React frontend with tactical dark theme | ✅ |
| Two-panel layout (sidebar + message area) | ✅ |
| FAST API with polling for messages | ✅ |
| Self-destruct message logic | ✅ |
| Visual countdown timer on messages | ✅ |
| `/messages/{id}/destroy` endpoint (ACK placeholder) | ✅ |

---

## ⏳ Phase 2: LSB Steganography — **NOT STARTED**

**Status:** 1 of 5 phases complete (20%)

## API Endpoints

- `POST /users/` - Create or get user
- `GET /users/` - List all users
- `POST /projects/` - Create a project
- `GET /projects/` - List all projects

## Features

- User authentication and management
- Project creation and management
- Real-time chat functionality
- RESTful API with FastAPI
- React-based responsive frontend
