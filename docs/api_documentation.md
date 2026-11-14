# REST API & Socket.IO Specification

**AI-Powered Collaborative DJ Platform**

---

## 1. Base URL & Authentication

- Backend Base URL: `http://localhost:5000/api`
- AI Microservice Base URL: `http://localhost:5001/api`
- Protected routes require the HTTP header:
  `Authorization: Bearer <JWT_TOKEN>`

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new user profile with preferred musical genres and languages.
- **Request Body**:
  ```json
  {
    "username": "arjun_dj",
    "displayName": "Arjun",
    "email": "arjun@example.com",
    "password": "securepassword123",
    "preferredGenres": ["Kannada", "Pop", "EDM"],
    "preferredLanguages": ["Kannada", "English"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "u-12345",
      "username": "arjun_dj",
      "displayName": "Arjun",
      "preferredGenres": ["Kannada", "Pop", "EDM"]
    }
  }
  ```

### `POST /api/auth/login`
Authenticates user and returns JWT.
- **Request Body**: `{ "email": "arjun@example.com", "password": "securepassword123" }`
- **Response (200 OK)**: Returns `{ "success": true, "token": "...", "user": { ... } }`

### `GET /api/auth/me` *(Protected)*
Returns the logged-in user's profile and listening stats.

### `PUT /api/auth/profile` *(Protected)*
Updates preferred genres, favorite artists, display name, and avatar.

### `POST /api/auth/forgot-password`
Dispatches password recovery instructions.

---

## 3. Collaborative Room Endpoints (`/api/rooms`)

### `POST /api/rooms` *(Protected)*
Creates a new virtual music lounge with generated unique Room ID.
- **Request Body**:
  ```json
  {
    "name": "Bangalore Electronic Lounge",
    "description": "High energy collaborative room with live voting",
    "personality": "party"
  }
  ```
- **Response (201 Created)**: Returns the initialized room object with `roomId` (e.g. `DJ-7F2A`).

### `GET /api/rooms`
Lists active rooms with participant counts and currently playing track.

### `GET /api/rooms/:id`
Retrieves full room state (queue, playback state, chat, participants, group mood).

### `POST /api/rooms/:id/join` *(Protected)*
Adds user to participants list and returns room state.

### `PUT /api/rooms/:id/dj-settings` *(Protected)*
Updates DJ personality, crossfade duration, and auto-queue toggles.

---

## 4. Music & Queue Endpoints (`/api/music`)

### `GET /api/music/search?query=...&genre=...&limit=20`
Searches multi-genre catalog by song title, artist, or genre.

### `GET /api/music/catalog`
Returns full catalog and music provider operational status.

### `GET /api/music/recommendations?roomId=...` *(Protected)*
Returns multi-shelf hybrid recommendations:
- `recommended_for_you`
- `popular_in_room`
- `based_on_mood`
- `discover_new`
- `group_compatible`

### `POST /api/music/queue` *(Protected)*
Adds a track to the room's live queue.
- **Request Body**: `{ "roomId": "DJ-7F2A", "trackId": "track-kannada-1" }`

### `DELETE /api/music/queue` *(Protected)*
Removes a track from the queue.

### `PUT /api/music/queue/reorder` *(Protected)*
Updates the upcoming queue order.

---

## 5. Soundclash Endpoints (`/api/soundclash`)

### `POST /api/soundclash` *(Protected)*
Initializes a new battle between two songs, generating an AI prediction.
- **Request Body**: `{ "roomId": "DJ-7F2A", "songAId": "track-1", "songBId": "track-2" }`
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "clash": { "round": 1, "songA": { ... }, "songB": { ... }, "votesACount": 0, "votesBCount": 0 },
    "aiPrediction": {
      "predictedWinnerId": "track-1",
      "confidenceScore": 72.4,
      "reasoning": "Higher alignment with active listener genre preferences and party mood"
    }
  }
  ```

### `POST /api/soundclash/vote` *(Protected)*
Casts vote for Song A or Song B (enforces single vote per user per round).

### `POST /api/soundclash/end` *(Protected)*
Concludes battle, determines winner, and automatically injects winner into queue.

### `GET /api/soundclash/leaderboard`
Returns top victorious tracks and dominant genres.

---

## 6. AI Microservice Endpoints (`/api/ai`)

### `POST /api/ai/sentiment`
Analyzes input text and emojis. Returns sentiment label, polarity, dominant emotion, and distribution.

### `GET /api/ai/mood/:roomId`
Computes collective group mood from recent room events with time decay.

### `POST /api/ai/conflict-resolution`
Executes Weighted Fair Queueing across room participants to generate balanced track recommendations and human-readable explanation.

### `POST /api/ai/dj/transition`
Calculates BPM delta, Camelot harmonic key distance, and Web Audio crossfade plan.

### `POST /api/ai/dj/next-track`
Autonomous AI decision selecting the optimal next track given queue, mood, personality, and conflict resolution.

---

## 7. Real-Time Socket.IO Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `room:join` | Client $\to$ Server | `{ roomId, user }` | Joins room channel |
| `room:initial-state` | Server $\to$ Client | `{ currentTrack, queue, groupMood, ... }` | Sends complete room state |
| `playback:play` | Client $\to$ Server | `{ currentTime }` | Broadcasts playback start |
| `playback:pause` | Client $\to$ Server | `{ currentTime }` | Broadcasts playback pause |
| `playback:seek` | Client $\to$ Server | `{ currentTime }` | Synchronizes track position |
| `playback:next` | Client $\to$ Server | `{}` | Skips to next track with crossfade |
| `playback:track-changed` | Server $\to$ Client | `{ currentTrack, queue, transition }` | Notifies clients to crossfade |
| `queue:add` | Client $\to$ Server | `{ track }` | Appends track to queue |
| `queue:updated` | Server $\to$ Client | `{ queue, currentTrack }` | Live queue synchronization |
| `chat:message` | Client $\to$ Server | `{ text }` | Ingests message, triggers NLP |
| `chat:new-message` | Server $\to$ Client | `{ id, sender, text, dominantEmotion }` | Broadcasts tagged message |
| `reaction:add` | Client $\to$ Server | `{ emoji, reactionType, trackId }` | Records song reaction |
| `mood:updated` | Server $\to$ Client | `{ emotions, dominantEmotion, energy }` | Emits recalculated group mood |
| `soundclash:vote` | Client $\to$ Server | `{ clashId, choice: 'A'\|'B' }` | Casts battle vote |
| `soundclash:vote-updated` | Server $\to$ Client | `{ clashId, votesACount, votesBCount }` | Real-time live vote tally |
| `voice:command` | Client $\to$ Server | `{ command }` | Executes hands-free voice action |
