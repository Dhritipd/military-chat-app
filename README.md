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

## ✅ Phase 2: LSB Steganography — **COMPLETE**

| Component | Status |
|-----------|--------|
| Python LSB module (`lsb.py`) | ✅ |
| Generation of innocent cover images | ✅ |
| `GET /stego/cover-image` endpoint | ✅ |
| Update `/messages/{id}/destroy` for multipart/form-data | ✅ |
| Extracting message ID from stego image on backend | ✅ |
| JS Canvas utility (`stego.js`) for embedding ID | ✅ |
| Modifying Chat component to use LSB ACK | ✅ |

**Status:** 2 of 5 phases complete (40%)

---

## ✅ Phase 3: Role-Based Access Control (RBAC) & Social Graph Protection — **COMPLETE**

| Component | Status |
|-----------|--------|
| Database schema modification for user roles (Commander/Operator) | ✅ |
| Codenames assignment upon project creation | ✅ |
| Backend API restriction for member list visibility | ✅ |
| Hiding real user identities from Operators | ✅ |
| Frontend UI updates to conditionally render based on role | ✅ |
| Preserving LSB steganography compatibility | ✅ |

**Status:** 3 of 5 phases complete (60%)

---

## ✅ Phase 4: Multi-Method Stego ACK & Zero-Click Auto-Assign — **COMPLETE**

| Component | Status |
|-----------|--------|
| Python Spread Spectrum module (`spread_spectrum.py`) | ✅ |
| Python ACK Manager (`ack_manager.py`) | ✅ |
| Database schema updates (`stego_key`, `recipient_type`) | ✅ |
| Auto-assign sensitivity logic based on timer and recipient | ✅ |
| Backend endpoints updated for Multi-Method stego ACKs | ✅ |
| JS Spread Spectrum encoding utility (`stego.js`) | ✅ |
| Frontend Recipient toggle and Sensitivity indicators | ✅ |
| Zero-click operational feasibility (removed manual selection) | ✅ |

**Status:** 4 of 5 phases complete (80%)

## API Endpoints

- `POST /users/` - Create or get user
- `GET /users/` - List all users
- `POST /projects/` - Create a project
- `GET /projects/` - List all projects

## Features

- User authentication and management
- Project creation and management
- Real-time chat functionality
- Strict Role-Based Access Control (RBAC) to prevent social graph leakage
- LSB & Spread Spectrum Steganography for hidden message destruction ACKs
- Zero-click auto-assigned message sensitivity
- RESTful API with FastAPI
- React-based responsive frontend

## 🔐 Research Gap Covered in Phase 2

**The Problem:** Self-destruct message confirmations (ACKs) are visible on the network, leaking *when* a message was destroyed and *that* communication occurred.

**The Fix:** ACK is hidden inside innocent image pixels using LSB steganography. Network observers see only normal image uploads, not destruction events.

---

## 📋 Before vs After Phase 2

|                 Before                       |            After                        |
|--------                                      |-------                                  |
| `POST /destroy` → "Message was just deleted" | `POST /upload` → "User shared a photo"  |
| Adversary knows timing and activity          | Adversary sees routine traffic          |

---

**Gap Closed:** ACK metadata leakage. 🫡

---

## 🔐 Research Gap Covered in Phase 3

**The Problem:** Exposing the full member list and real identities of project participants leaks the social graph (who is talking to whom). If a low-level operator is compromised, the entire unit structure is exposed.

**The Fix:** Implementation of strict Role-Based Access Control (RBAC). Only "Commanders" can view full member lists and real identities. "Operators" see only anonymized codenames and the project name, drastically reducing the value of a compromised operator account.

---

## 📋 Before vs After Phase 3

|                 Before                       |            After                        |
|--------                                      |-------                                  |
| All users see project member lists & names   | Operators see only anonymized codenames |
| Compromised operator exposes unit structure  | Compromised operator exposes nothing    |

---

**Gap Closed:** Social graph leakage and identity exposure. 🛡️

---

## 🔐 Research Gap Covered in Phase 4 --(Auto-Sensitivity + Multi-Method Stego)

**The Problem:** Manual sensitivity selection is not feasible in time-critical combat scenarios. A single static steganography method (LSB) becomes predictable against targeted analysis, but operators cannot be burdened with choosing cryptographic methods under fire.

**The Fix:** Implementation of zero-click auto-assign logic. Message sensitivity is derived from existing operational parameters (timer duration and recipient scope). The ACK Manager automatically selects the appropriate hiding method (LSB for routine, Spread Spectrum for tactical), dynamically adjusting steganographic protection without adding cognitive load to the operator.

---

## 📋 Before vs After Phase 4

|                 Before                       |            After                        |
|--------                                      |-------                                  |
| Operator manually selects sensitivity level  | Zero-click, auto-derived sensitivity    |
| Single static stego method (predictable)     | Dynamic multi-method protection         |

---

**Gap Closed:** Operational friction and predictable static steganography. ⚡


