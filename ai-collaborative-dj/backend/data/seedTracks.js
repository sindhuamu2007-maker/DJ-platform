/**
 * Seed Music Catalog with Rich Metadata across all required genres:
 * Kannada, Hindi, English, Telugu, Tamil, Pop, Rock, EDM, Classical, Jazz, Lo-fi.
 * Includes Camelot harmonic keys, BPM, energy, danceability, and verified audio streams.
 */

const SEED_TRACKS = [
  // Kannada Tracks
  {
    id: 'track-kannada-1',
    title: 'Singara Siriye (Folk Pulse)',
    artist: 'Vijay Prakash & Ananya Bhat',
    album: 'Kantara Groove',
    duration: 185,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Kannada',
    language: 'Kannada',
    bpm: 124,
    key: '8B', // C Major
    energy: 0.82,
    danceability: 0.78,
    valence: 0.85,
    popularity: 92,
    provider: 'demo'
  },
  {
    id: 'track-kannada-2',
    title: 'Belageddu Melodies',
    artist: 'Vijay Prakash',
    album: 'Kirik Party Beats',
    duration: 210,
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Kannada',
    language: 'Kannada',
    bpm: 110,
    key: '8A', // A Minor
    energy: 0.68,
    danceability: 0.72,
    valence: 0.75,
    popularity: 88,
    provider: 'demo'
  },
  {
    id: 'track-kannada-3',
    title: 'Ra Ra Rakkamma (EDM Mix)',
    artist: 'Sunidhi Chauhan & Nakash Aziz',
    album: 'Vikrant Rona Hits',
    duration: 195,
    artwork: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Kannada',
    language: 'Kannada',
    bpm: 130,
    key: '9B', // G Major
    energy: 0.94,
    danceability: 0.88,
    valence: 0.90,
    popularity: 95,
    provider: 'demo'
  },

  // Hindi Tracks
  {
    id: 'track-hindi-1',
    title: 'Kesariya Lo-Fi Romance',
    artist: 'Arijit Singh & Pritam',
    album: 'Brahmastra Beats',
    duration: 220,
    artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Hindi',
    language: 'Hindi',
    bpm: 96,
    key: '7B', // F Major
    energy: 0.58,
    danceability: 0.65,
    valence: 0.70,
    popularity: 96,
    provider: 'demo'
  },
  {
    id: 'track-hindi-2',
    title: 'Jhoome Jo Pathaan (Club Anthem)',
    artist: 'Arijit Singh & Sukriti Kakar',
    album: 'Pathaan Fever',
    duration: 205,
    artwork: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'Hindi',
    language: 'Hindi',
    bpm: 126,
    key: '6A', // G Minor
    energy: 0.92,
    danceability: 0.85,
    valence: 0.88,
    popularity: 94,
    provider: 'demo'
  },
  {
    id: 'track-hindi-3',
    title: 'Channa Mereya (Soul Acoustic)',
    artist: 'Arijit Singh',
    album: 'Ae Dil Hai Mushkil',
    duration: 240,
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'Hindi',
    language: 'Hindi',
    bpm: 82,
    key: '8A', // A Minor
    energy: 0.42,
    danceability: 0.48,
    valence: 0.35,
    popularity: 90,
    provider: 'demo'
  },

  // EDM Tracks
  {
    id: 'track-edm-1',
    title: 'Cyber Pulse (Mainstage Drop)',
    artist: 'Neon Matrix',
    album: 'Ultra Spectrum',
    duration: 180,
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'EDM',
    language: 'English',
    bpm: 128,
    key: '8A', // A Minor
    energy: 0.96,
    danceability: 0.86,
    valence: 0.80,
    popularity: 89,
    provider: 'demo'
  },
  {
    id: 'track-edm-2',
    title: 'Starlight Horizons',
    artist: 'Avicii Style Collective',
    album: 'Infinite Echoes',
    duration: 200,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'EDM',
    language: 'English',
    bpm: 126,
    key: '9B', // G Major
    energy: 0.90,
    danceability: 0.82,
    valence: 0.85,
    popularity: 87,
    provider: 'demo'
  },

  // Pop / English Tracks
  {
    id: 'track-pop-1',
    title: 'Blinding Neon Nights',
    artist: 'The Weekend Dreamer',
    album: 'Synth Wave City',
    duration: 198,
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    genre: 'Pop',
    language: 'English',
    bpm: 120,
    key: '7A', // D Minor
    energy: 0.78,
    danceability: 0.80,
    valence: 0.72,
    popularity: 95,
    provider: 'demo'
  },
  {
    id: 'track-pop-2',
    title: 'Levitating Rhythms',
    artist: 'Luna Ray',
    album: 'Future Nostalgia',
    duration: 212,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Pop',
    language: 'English',
    bpm: 124,
    key: '8B', // C Major
    energy: 0.84,
    danceability: 0.88,
    valence: 0.91,
    popularity: 91,
    provider: 'demo'
  },

  // Telugu Tracks
  {
    id: 'track-telugu-1',
    title: 'Naatu Naatu (Energy Max)',
    artist: 'Rahul Sipligunj & Kaala Bhairava',
    album: 'RRR Thunder',
    duration: 215,
    artwork: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    genre: 'Telugu',
    language: 'Telugu',
    bpm: 135,
    key: '10B', // D Major
    energy: 0.98,
    danceability: 0.92,
    valence: 0.95,
    popularity: 97,
    provider: 'demo'
  },

  // Tamil Tracks
  {
    id: 'track-tamil-1',
    title: 'Arabic Kuthu (Halamithi Habibo)',
    artist: 'Anirudh Ravichander & Jonita Gandhi',
    album: 'Beast Hits',
    duration: 202,
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    genre: 'Tamil',
    language: 'Tamil',
    bpm: 128,
    key: '9A', // E Minor
    energy: 0.91,
    danceability: 0.89,
    valence: 0.90,
    popularity: 94,
    provider: 'demo'
  },

  // Lo-Fi Tracks
  {
    id: 'track-lofi-1',
    title: 'Midnight Coffee & Rain',
    artist: 'Chilled Cowherd',
    album: 'Lofi Study Dreams',
    duration: 175,
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    genre: 'Lo-fi',
    language: 'Instrumental',
    bpm: 78,
    key: '4A', // F Minor
    energy: 0.28,
    danceability: 0.55,
    valence: 0.60,
    popularity: 84,
    provider: 'demo'
  },
  {
    id: 'track-lofi-2',
    title: 'Bengaluru Evening Breeze',
    artist: 'Indie Lofi Project',
    album: 'City Skylines',
    duration: 188,
    artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    genre: 'Lo-fi',
    language: 'Instrumental',
    bpm: 80,
    key: '8A', // A Minor
    energy: 0.32,
    danceability: 0.58,
    valence: 0.65,
    popularity: 81,
    provider: 'demo'
  },

  // Rock Tracks
  {
    id: 'track-rock-1',
    title: 'Electric Thunderstorm',
    artist: 'The Monsoon Riffs',
    album: 'Decibel Overdrive',
    duration: 210,
    artwork: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    genre: 'Rock',
    language: 'English',
    bpm: 132,
    key: '11B', // A Major
    energy: 0.89,
    danceability: 0.62,
    valence: 0.74,
    popularity: 83,
    provider: 'demo'
  },

  // Classical & Jazz Tracks
  {
    id: 'track-classical-1',
    title: 'Raag Hamsadhwani Morning',
    artist: 'Classical Maestros',
    album: 'Dawn of Ragas',
    duration: 260,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    genre: 'Classical',
    language: 'Instrumental',
    bpm: 85,
    key: '8B', // C Major
    energy: 0.45,
    danceability: 0.40,
    valence: 0.80,
    popularity: 79,
    provider: 'demo'
  },
  {
    id: 'track-jazz-1',
    title: 'Blue Velvet Midnight Lounge',
    artist: 'The Crescent Quintet',
    album: 'Late Night Sessions',
    duration: 230,
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Jazz',
    language: 'Instrumental',
    bpm: 92,
    key: '5A', // C Minor
    energy: 0.48,
    danceability: 0.60,
    valence: 0.68,
    popularity: 76,
    provider: 'demo'
  },
  // Hip-Hop
  {
    id: 'track-hiphop-1',
    title: 'Gully Flow & Street Beats',
    artist: 'Divine Vibes',
    album: 'Voice of the Streets',
    duration: 195,
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Hip-Hop',
    language: 'Hindi',
    bpm: 95,
    key: '8A', // A Minor
    energy: 0.85,
    danceability: 0.88,
    valence: 0.72,
    popularity: 88,
    provider: 'demo'
  }
];

module.exports = { SEED_TRACKS };
