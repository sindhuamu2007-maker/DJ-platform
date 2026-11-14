const BASE_URL = '/api';

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

  getRoom: async (roomId) => {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}`, { headers: getHeaders() });
    return res.json();
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
    return res.json();
  },

  searchYouTube: async (query, options = {}) => {
    const params = new URLSearchParams({ query, ...options });
    const res = await fetch(`${BASE_URL}/music/youtube-search?${params}`, { headers: getHeaders() });
    return res.json();
  },

  getCatalog: async () => {
    const res = await fetch(`${BASE_URL}/music/catalog`, { headers: getHeaders() });
    return res.json();
  },

  getRecommendations: async (roomId) => {
    const query = roomId ? `?roomId=${roomId}` : '';
    const res = await fetch(`${BASE_URL}/music/recommendations${query}`, { headers: getHeaders() });
    return res.json();
  },

  addToQueue: async (roomId, track) => {
    const trackId = track.id?.startsWith('youtube-') ? undefined : track.id || track._id;
    const res = await fetch(`${BASE_URL}/music/queue`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        roomId,
        trackId,
        youtubeVideoId: track.youtubeVideoId,
        track: {
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          energy: track.energy
        }
      })
    });
    return res.json();
  },

  removeFromQueue: async (roomId, queueItemId) => {
    const res = await fetch(`${BASE_URL}/music/queue`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ roomId, queueItemId })
    });
    return res.json();
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

  getNextTrack: async (roomId, personalityId) => {
    const res = await fetch(`${BASE_URL}/ai/dj/next-track`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomId, personalityId })
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
