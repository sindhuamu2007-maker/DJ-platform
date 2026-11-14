const BASE_URL = '/api';

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'The backend is out of date or the API proxy is misconfigured. Restart the backend from this project, then try again.'
    );
  }
  return response.json();
};

export const getHeaders = () => {
  const token = localStorage.getItem('aura_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  register: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  login: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  demoLogin: async () => {
    const res = await fetch(`${BASE_URL}/auth/demo`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() });
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Rooms
  listRooms: async () => {
    const res = await fetch(`${BASE_URL}/rooms`, { headers: getHeaders() });
    return res.json();
  },

  createRoom: async (data) => {
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteRoom: async (roomId) => {
    const res = await fetch(`${BASE_URL}/rooms/${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return parseApiResponse(res);
  },

  getRoom: async (roomId) => {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}`, { headers: getHeaders() });
    return parseApiResponse(res);
  },

  joinRoom: async (roomId) => {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  updateDJSettings: async (roomId, data) => {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/dj-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Music
  searchTracks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/music/search?${query}`, { headers: getHeaders() });
    return parseApiResponse(res);
  },

  searchYouTube: async (query, options = {}) => {
    const params = new URLSearchParams({ query, ...options });
    const res = await fetch(`${BASE_URL}/music/youtube-search?${params}`, { headers: getHeaders() });
    return parseApiResponse(res);
  },

  getCatalog: async () => {
    const res = await fetch(`${BASE_URL}/music/catalog`, { headers: getHeaders() });
    return res.json();
  },

  getAppleMusicConfig: async () => {
    const res = await fetch(`${BASE_URL}/music/apple-music/config`, { headers: getHeaders() });
    return parseApiResponse(res);
  },

  getRecommendations: async (roomId) => {
    const query = roomId ? `?roomId=${roomId}` : '';
    const res = await fetch(`${BASE_URL}/music/recommendations${query}`, { headers: getHeaders() });
    return res.json();
  },

  addToQueue: async (roomId, trackId, youtubeTrack) => {
    const res = await fetch(`${BASE_URL}/music/queue`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        roomId,
        ...(trackId ? { trackId } : {}),
        ...(youtubeTrack ? {
          youtubeVideoId: youtubeTrack.youtubeVideoId,
          youtubeTrack: {
            title: youtubeTrack.title,
            artist: youtubeTrack.artist,
            genre: youtubeTrack.genre
          }
        } : {})
      })
    });
    return parseApiResponse(res);
  },

  playQueueTrack: async (roomId, queueItemId) => {
    const res = await fetch(`${BASE_URL}/music/queue/play`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomId, queueItemId })
    });
    return parseApiResponse(res);
  },

  removeFromQueue: async (roomId, queueItemId) => {
    const res = await fetch(`${BASE_URL}/music/queue`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ roomId, queueItemId })
    });
    return parseApiResponse(res);
  },

  // Soundclash
  createBattle: async (roomId, songAId, songBId) => {
    const res = await fetch(`${BASE_URL}/soundclash`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomId, songAId, songBId })
    });
    return res.json();
  },

  voteSoundclash: async (clashId, choice) => {
    const res = await fetch(`${BASE_URL}/soundclash/vote`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clashId, choice })
    });
    return res.json();
  },

  endBattle: async (clashId) => {
    const res = await fetch(`${BASE_URL}/soundclash/end`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clashId })
    });
    return res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${BASE_URL}/soundclash/leaderboard`, { headers: getHeaders() });
    return res.json();
  },

  // AI & DJ
  getRoomMood: async (roomId) => {
    const res = await fetch(`${BASE_URL}/ai/mood/${roomId}`, { headers: getHeaders() });
    return res.json();
  },

  resolveConflict: async (roomId) => {
    const res = await fetch(`${BASE_URL}/ai/conflict-resolution`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomId })
    });
    return res.json();
  },

  getNextTrack: async (roomId) => {
    const res = await fetch(`${BASE_URL}/ai/dj/next-track`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomId })
    });
    return res.json();
  },

  getPersonalities: async () => {
    const res = await fetch(`${BASE_URL}/ai/dj/personalities`, { headers: getHeaders() });
    return res.json();
  },

  getAnalytics: async (roomId) => {
    const res = await fetch(`${BASE_URL}/analytics/room/${roomId}`, { headers: getHeaders() });
    return res.json();
  },

  getGlobalAnalytics: async () => {
    const res = await fetch(`${BASE_URL}/analytics/global`, { headers: getHeaders() });
    return res.json();
  }
};
