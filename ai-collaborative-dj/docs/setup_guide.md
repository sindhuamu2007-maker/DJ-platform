# Installation & Setup Guide

**AI-Powered Collaborative DJ Platform**

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher (v24 tested)
- **npm**: v9.0.0 or higher
- **Python**: 3.10 or higher (Python 3.14 tested)
- **MongoDB** *(Optional)*: Community Server 6.0+ (The platform automatically uses a resilient high-performance in-memory fallback if no MongoDB daemon is running locally!)

---

## 2. Quick Start Execution (Single Command)

From the project root directory:

```bash
cd "C:\Users\Sindhushree T B\.gemini\antigravity\scratch\ai-collaborative-dj"
```

### Step 1: Install Dependencies

1. **Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

3. **Python AI Engine Dependencies**:
   ```bash
   cd ../ai-engine
   pip install -r requirements.txt
   ```

---

## 3. Starting the Services

You can start the three platform services in separate terminal windows:

### Terminal 1: Python AI Engine Microservice
```bash
cd "C:\Users\Sindhushree T B\.gemini\antigravity\scratch\ai-collaborative-dj\ai-engine"
python app.py
```
*Microservice starts on `http://127.0.0.1:5001`.*

### Terminal 2: Node.js & Socket.IO Backend Server
```bash
cd "C:\Users\Sindhushree T B\.gemini\antigravity\scratch\ai-collaborative-dj\backend"
node server.js
```
*Backend starts on `http://localhost:5000` and initializes the multi-genre demo music catalog.*

### Terminal 3: Vite React Client
```bash
cd "C:\Users\Sindhushree T B\.gemini\antigravity\scratch\ai-collaborative-dj\frontend"
npm run dev
```
*Web application opens on `http://localhost:3000` (or `http://localhost:5173`).*

---

## 4. Environment Variables Configuration

Copy `.env.example` in `backend/` and `ai-engine/` to `.env`:

### `backend/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/ai_dj_platform
JWT_SECRET=ai_dj_platform_super_secret_jwt_key_2026
AI_ENGINE_URL=http://127.0.0.1:5001
MUSIC_PROVIDER=demo

# YouTube Data API v3 key enables full-length embedded playback
YOUTUBE_API_KEY=

# Optional Spotify API Integration (if available)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

Create a Google Cloud project, enable the YouTube Data API v3, and set its API key as `YOUTUBE_API_KEY` in `backend/.env`. The key stays on the backend. Search results are limited to videos that allow embedding and play through YouTube's official player.

### `ai-engine/.env`
```env
PORT=5001
FLASK_ENV=development
```

---

## 5. Running Integration Tests

Run the automated test suite verifying all 9 core subsystems:

```bash
cd "C:\Users\Sindhushree T B\.gemini\antigravity\scratch\ai-collaborative-dj\backend"
node tests/integration.test.js
```

---

## 6. Demo Account Credentials

To sign in immediately without registration:
- **Email**: `dj@auradj.com`
- **Password**: `demodj123`
*(Or click "Click here to fill Demo DJ Credentials" on the login screen).*
