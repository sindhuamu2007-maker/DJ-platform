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
JWT_SECRET=replace_with_a_long_random_secret
AI_ENGINE_URL=http://127.0.0.1:5001
ITUNES_COUNTRY=IN
YOUTUBE_API_KEY=
APPLE_MUSIC_TEAM_ID=
APPLE_MUSIC_KEY_ID=
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Set `YOUTUBE_API_KEY` in `backend/.env` to enable live YouTube results for each selected AI DJ personality. Keep the key out of `.env.example`; restart the backend after changing it. In an active room, queue a search result to play it through YouTube's official embedded player. Videos must allow embedding; this does not download or extract media.

Create a MusicKit key in the Apple Developer portal and set its Team ID, Key ID, and `.p8` private-key contents above. Alternatively, set `APPLE_MUSIC_DEVELOPER_TOKEN` to a pre-generated developer token. The backend signs a maximum 180-day developer token and provides that public token to MusicKit; the private key stays on the server. Configure your website domain for MusicKit in the Apple Developer portal.

Live Room uses [MusicKit JS](https://developer.apple.com/documentation/musickitjs) for full-track playback. After the server credentials are configured, each listener must connect their own Apple Music account and have an eligible subscription; connecting starts the selected catalog song in the full-track player. Without these credentials or subscription, the app can play Apple-provided previews (up to 30 seconds) only.

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

To try the app without creating an account, choose **Continue with demo account** on the login screen. The demo profile is created automatically the first time.
