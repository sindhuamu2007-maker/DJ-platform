# AURA DJ – AI-Powered Collaborative Group Music Experience

> **Emotion-Aware, Intelligent & Real-Time Social DJ Web Application**

A modern full-stack web application combining real-time group music streaming, collaborative queues, live NLP sentiment analysis, autonomous harmonic mixing transitions, Soundclash battle voting, and deep AI-driven preference conflict resolution.

---

## 🌟 The Two Primary Innovations

### 1. Major Innovation 1: Emotion-Adaptive AI DJ
- **Real-Time NLP Sentiment Analysis**: Evaluates room chat messages, emoji reactions (❤️, 🔥, ⚡, 💃, ☕, 😴, 💔, 👎), likes, dislikes, and skip patterns.
- **Specific Emotion Classification**: Classifies sentiment beyond simple binary polarity into specific emotion categories (`Happy`, `Excited`, `Energetic`, `Relaxed`, `Sad`, `Frustrated`, `Neutral`), ensuring negative song criticism is not conflated with grief or sadness.
- **Exponential Time Decay Formulation**: Computes the collective room mood vector where recent listener reactions hold exponential priority over older ones.
- **Live Group Mood Dashboard**: Renders real-time percentage distributions (e.g. Happy 40%, Excited 35%, Relaxed 15%, Neutral 10%) and dynamic energy trajectory curves ("Peak Party High", "Rising Energy", "Mellow Chill Vibes").
- **Autonomous Energy Pacing**: Automatically adapts recommendation and queue order to match the room's evolving emotional state.

### 2. Major Innovation 2: AI Music Preference Conflict Resolution
- **Multi-User Fair-Share Scheduling**: Solves the classic room conflict problem (e.g., 2 Kannada listeners, 2 Hindi listeners, and 1 EDM listener) using Weighted Fair Queueing (WFQ) with starvation compensation.
- **Diversity & Repetition Cooldown**: Strongly penalizes genres played back-to-back ($P_{\text{rep}} = 0.45$ for single, $0.70$ for double repetition), guaranteeing no single genre can monopolize the queue.
- **Starvation Deficit Compensation**: Tracks the distance since each listener's preferred genre was last scheduled. If a minority listener has not heard their genre in 3+ tracks, their genre receives a dynamic priority boost.
- **Human-Readable Algorithmic Explainability**: Generates clear natural-language rationale for every autonomous decision:
  > *"AI selected 'EDM Laser Drop' because: Gives Charlie their preferred EDM music after 3 tracks."*
- **User Override Control**: Host and participants can accept, override, or manually rebalance room preferences at any time.

---

## 🚀 Key Features

- **Collaborative Virtual Music Lounges**: Create and join music rooms via unique codes (e.g. `DJ-7F2A`) or one-click invite links, with real-time presence synchronization.
- **Live Collaborative Music Queue**: Search, add, remove, and reorder songs with duplicate prevention and user attribution ("Added by").
- **Web Audio API Dual-Deck Crossfader Player**: Real equal-power audio crossfading between Deck A and Deck B, adjustable transition duration (2s - 14s), and BPM harmonic analysis.
- **Real-Time Spectrum Visualizer**: Animated canvas audio frequency analyzer reacting dynamically to playing audio.
- **Soundclash Music Battles & AI Prediction**: Pit two songs against each other, live single-vote enforcement, live percentage voting bar, AI prediction confidence rating, and automatic winner queue injection with celebration confetti.
- **6 AI DJ Personalities**: Party DJ, Chill DJ, Retro DJ, Romantic DJ, Workout DJ, and Explorer DJ (specialized in Kannada, Hindi, and Global discoveries).
- **Voice-Controlled AI DJ**: Browser speech recognition ("Play energetic songs", "Skip track", "Add Kannada songs", "Make playlist relaxing") with text fallback.
- **Multi-Shelf Hybrid Recommendations**: 5 distinct shelves: "Recommended for You", "Popular in Your Room", "Based on Your Mood", "Discover New Music", and "Group Compatible Tracks".
- **Multi-Genre Demo Catalog**: 18 royalty-free, verified audio streams across Kannada, Hindi, English, Telugu, Tamil, Pop, Rock, EDM, Lo-fi, Classical, and Jazz.
- **Music Provider Abstraction**: Seamlessly supports both the high-fidelity demo catalog and external Spotify Web API credentials via environment variables.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, React Router DOM, Web Audio API, Canvas Confetti |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, bcryptjs, Mongoose, Axios |
| **Database** | MongoDB with high-reliability embedded in-memory fallback adapter |
| **AI / ML Engine** | Python 3, Flask, Scikit-Learn, NumPy, SciPy, Pandas, NLP Sentiment & Lexicon Classifiers |
| **Audio Engine** | Web Audio API (`AudioContext`, `GainNode`, `AnalyserNode`, `MediaElementAudioSourceNode`) |

---

## 📂 Project Structure

```
ai-collaborative-dj/
├── frontend/                     # React + Vite Client
│   ├── src/
│   │   ├── components/           # AudioVisualizer, MoodIndicator, SoundclashArena, etc.
│   │   ├── context/              # AuthContext, RoomContext
│   │   ├── pages/                # Landing, Dashboard, MusicRoom, AIDJ, Recommendations, etc.
│   │   ├── services/             # REST API & Socket.IO client
│   │   └── utils/                # Web Audio API dual-deck crossfade engine
│   └── package.json
│
├── backend/                      # Node.js + Express + Socket.IO Server
│   ├── config/                   # Database connection & memory store fallback
│   ├── controllers/              # Auth, Room, Music, Soundclash, AI, Analytics
│   ├── models/                   # User, Room, Track, Soundclash, Analytics
│   ├── routes/                   # REST route definitions
│   ├── services/                 # AI bridge, Music provider abstraction
│   ├── sockets/                  # Real-time Socket.IO event handler
│   ├── data/                     # Seeded multi-genre catalog (Kannada, Hindi, EDM, etc.)
│   ├── tests/                    # End-to-end integration test suite
│   └── server.js
│
├── ai-engine/                    # Python AI Microservice
│   ├── sentiment/                # NLP sentiment & emotion analyzer
│   ├── emotion_detection/        # Group mood aggregator with exponential time decay
│   ├── conflict_resolution/      # Weighted Fair Queueing preference balancer
│   ├── dj_engine/                # Harmonic mixing (BPM & Camelot Wheel), Personalities, Clash predictor
│   ├── recommendation/           # Multi-shelf hybrid recommender
│   └── app.py                    # Flask REST API microservice
│
├── docs/                         # Technical Documentation
│   ├── architecture.md           # System architecture & mathematical formulations
│   ├── api_documentation.md      # REST endpoints & Socket.IO events catalog
│   └── setup_guide.md            # Complete installation & run manual
│
├── .env.example                  # Environment variables template
├── package.json                  # Root convenience scripts
└── README.md
```

---

## ⚡ Installation & Execution

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install

# Python AI Engine dependencies
cd ../ai-engine && pip install -r requirements.txt
```

### 2. Run the Services

Open 3 terminal windows or run them in background:

**Terminal 1 — Python AI Engine**:
```bash
cd ai-engine && python app.py
```
*(Runs on `http://127.0.0.1:5001`)*

**Terminal 2 — Node.js & Socket.IO Server**:
```bash
cd backend && node server.js
```
*(Runs on `http://localhost:5000`)*

**Terminal 3 — React Client**:
```bash
cd frontend && npm run dev
```
*(Opens on `http://localhost:3000`)*

---

## 🧪 Automated Testing

Execute the automated end-to-end integration test suite:

```bash
cd backend && node tests/integration.test.js
```

**Test Coverage Highlights**:
- ✅ Database startup & 18-track multi-genre seed verification
- ✅ User registration, bcrypt password hashing & JWT auth
- ✅ Collaborative room creation & presence synchronization
- ✅ NLP Sentiment analysis & emotion classification
- ✅ Major Innovation 1: Emotion-Adaptive group mood aggregation
- ✅ Major Innovation 2: Music conflict resolution with starvation deficit boost
- ✅ Soundclash battle creation, AI prediction & double-vote prevention
- ✅ AI DJ harmonic mixing, Camelot wheel distance & crossfade duration
- ✅ Multi-shelf hybrid recommendations generation

---

## 🔐 Demo Credentials
- **Email**: `dj@auradj.com`
- **Password**: `demodj123`
*(Or click "Click here to fill Demo DJ Credentials" on the login screen).*
