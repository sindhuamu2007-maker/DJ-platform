# System Architecture & Technical Specifications

**AI-Powered Collaborative DJ Platform – Emotion-Aware, Intelligent & Real-Time Group Music Experience**

---

## 1. High-Level Architecture Overview

The platform uses a decoupled, event-driven, microservices-ready full-stack architecture composed of:
1. **Frontend Client (React + Vite + Tailwind CSS + Web Audio API)**:
   - Single Page Application offering real-time dual-deck DJ controls, frequency spectrum visualization, collaborative queue management, real-time chat, and Soundclash voting.
   - Dual-deck Web Audio API engine managing equal-power crossfades and live audio analysis.
2. **Backend Application Server (Node.js + Express + Socket.IO)**:
   - RESTful API gateway handling user authentication (JWT + bcrypt), collaborative room state persistence, queue management, and analytics.
   - Real-time bi-directional Socket.IO engine synchronizing room presence, playback state, chat sentiment events, emoji reactions, and live vote tallies.
   - Database adapter supporting MongoDB via Mongoose with embedded high-reliability fallback.
3. **AI Machine Learning Engine (Python Microservice)**:
   - NLP sentiment analyzer & multi-class emotion classifier.
   - Exponential time-decay group mood aggregation engine.
   - Weighted Fair Queueing (WFQ) Music Preference Conflict Resolution engine.
   - Camelot Wheel harmonic key & BPM compatibility transition planner.
   - Hybrid recommendation engine (Content, Collaborative, Mood, Group).
   - Soundclash winner probabilistic predictor.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React SPA Client (Vite)                         │
│  Dual-Deck Player │ Waveform Visualizer │ Collaborative Queue │ Chat   │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │ REST / JWT                    │ Socket.IO (WebSockets)
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                    Node.js + Express Backend Engine                    │
│   Auth Controller  │  Room Controller  │ Music Service  │ Sockets Bus  │
└──────────▲────────────────────────┬───────────────────────────▲────────┘
           │                        │                           │
           │ Mongoose               │ HTTP JSON                 │ Fallback / Cache
┌──────────▼────────────┐  ┌────────▼───────────────────┐  ┌─────▼───────────────┐
│     MongoDB / Store   │  │   Python AI Microservice   │  │ Seed Music Catalog  │
│  Users, Rooms, Clashes│  │ NLP, Mood, Transition, WFQ │  │ 18 Multi-Genre Audio│
└───────────────────────┘  └────────────────────────────┘  └─────────────────────┘
```

---

## 2. Major Innovation 1: Emotion-Adaptive AI DJ

### Operational Flow:
1. **Event Ingestion**: Every user chat message, emoji reaction (❤️, 🔥, ⚡, 💃, ☕, 😴, 💔, 👎), song like, and skip event is ingested via Socket.IO.
2. **NLP Sentiment & Emotion Analysis**:
   - Analyzes lexical sentiment polarity $P \in [-1.0, 1.0]$.
   - Maps inputs to multi-class emotion categories:
     - `Happy`, `Excited`, `Energetic`, `Relaxed`, `Sad`, `Frustrated`, `Neutral`.
   - Distinguishes negative music feedback (classified as `Frustrated` or `Restless`) from personal grief (classified as `Sad`).
3. **Exponential Time Decay Formulation**:
   Emotional events decay over time so that recent room reactions exert higher influence than earlier reactions:
   $$w_i(t) = e^{-\lambda (t - t_i)} \cdot M_{\text{type}}$$
   where $\lambda = \frac{\ln(2)}{t_{1/2}}$ (with half-life $t_{1/2} = 180$ seconds), and $M_{\text{type}}$ is the event multiplier:
   - Chat message: $1.0\times$
   - Emoji reaction: $1.3\times$
   - Track like: $1.5\times$
   - Track dislike: $1.8\times$
   - Track skip: $2.0\times$
4. **Trajectory & Dynamic Queue Adjustment**:
   - The collective energy $E_{\text{room}} \in [0.0, 1.0]$ and valence $V_{\text{room}} \in [-1.0, 1.0]$ are calculated.
   - When the queue is empty or auto-adjustment is active, the AI DJ automatically injects tracks matching the target emotional trajectory.

---

## 3. Major Innovation 2: AI Music Preference Conflict Resolution

### The Problem:
Multiple room members often possess starkly divergent music tastes (e.g., 2 Kannada listeners, 2 Hindi listeners, 1 EDM listener). Simple majority voting causes the EDM listener to be permanently starved of their music.

### The Algorithmic Solution (Weighted Fair Queueing with Starvation Compensation):
Candidate tracks are evaluated using a multi-objective scoring formula:

$$Score(t) = w_{\text{ind}} \cdot S_{\text{ind}}(t) + w_{\text{grp}} \cdot S_{\text{grp}}(t) + w_{\text{mood}} \cdot S_{\text{mood}}(t) + w_{\text{starve}} \cdot S_{\text{starve}}(t) + w_{\text{pop}} \cdot S_{\text{pop}}(t) - P_{\text{rep}}(t)$$

Where:
- $S_{\text{ind}}(t)$: Fraction of active room participants whose preferred genres match track $t$.
- $S_{\text{grp}}(t)$: Aggregate share of group preference held by the track's genre.
- $S_{\text{mood}}(t) = 1.0 - |Energy(t) - Energy_{\text{room}}|$: Congruency with detected room mood.
- $S_{\text{starve}}(t)$: Starvation deficit bonus. If a genre has not been played in the last $k \ge 3$ tracks, $S_{\text{starve}} = \min(1.0, 0.25 \cdot (k - 2))$, ensuring minority listeners receive guaranteed scheduled slots.
- $P_{\text{rep}}(t)$: Repetition penalty. Penalizes genres played in the immediately preceding 1 or 2 songs ($0.45$ for last song, $0.70$ for back-to-back songs), strictly preventing genre monopolies.
- **Explainability Generation**: Each recommendation synthesizes a transparent explanation:
  - *e.g., "AI selected 'EDM Laser Drop' because: Gives Charlie their preferred EDM music after 3 tracks."*

---

## 4. Intelligent Harmonic Mixing & Web Audio Crossfader

### Transition Compatibility Analysis:
- **BPM Difference ($\Delta \text{BPM}$)**:
  Evaluates tempo delta as well as half-time ($0.5\times$) and double-time ($2.0\times$) harmonic relationships.
- **Camelot Harmonic Key Matching**:
  Maps standard musical keys to Camelot Wheel coordinates (e.g. A Minor $\to$ 8A, C Major $\to$ 8B). Calculates circular distance on the 12-hour wheel:
  - Distance $0$: Exact Key Match (Harmonic Blend)
  - Distance $1$: Adjacent Step or Relative Major/Minor (Energy Shift)
  - Distance $\ge 2$: Modulating Cut / Filter Wash
- **Web Audio Signal Chain**:
  ```
  Deck A <audio> ──> MediaElementSource ──> GainNode A ──┐
                                                         ├──> MasterGain ──> AnalyserNode ──> Destination
  Deck B <audio> ──> MediaElementSource ──> GainNode B ──┘
  ```
  Smooth equal-power volume curves are scheduled using `linearRampToValueAtTime()` across the AI-computed duration ($2.0$s to $14.0$s).

---

## 5. Security & Reliability Architecture
- **JWT Authentication**: Passwords encrypted with `bcrypt` (10 salt rounds). Tokens verified on all protected REST endpoints and Socket subscriptions.
- **Vote Integrity**: Soundclash enforces single-vote constraints per user per round via compound database indexing.
- **Resilient Fallback Mode**: If MongoDB is not active on `mongodb://127.0.0.1:27017`, the system automatically shifts to high-reliability embedded in-memory persistence without crashing.
- **Microservice Fault Tolerance**: If the Python microservice is offline, the Node.js backend seamlessly executes embedded JavaScript fallback algorithms for all AI tasks.
