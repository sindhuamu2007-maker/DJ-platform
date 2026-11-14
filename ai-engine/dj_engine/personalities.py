"""
AI DJ Personality Definitions and Behavior Modifiers
Customizes track selection, energy curve targets, transition duration,
and AI speech/commentary for different party moods.
"""

from typing import Dict, Any

DJ_PERSONALITIES: Dict[str, Dict[str, Any]] = {
    'party': {
        'id': 'party',
        'name': 'Party DJ',
        'tagline': 'High-octane club energy & dancefloor anthems',
        'avatar': '🎉',
        'color': '#EC4899', # Pink neon
        'preferred_genres': ['EDM', 'Pop', 'Dance', 'Hip-Hop', 'Kannada', 'Hindi'],
        'target_energy': 0.85,
        'min_bpm': 118,
        'max_bpm': 145,
        'crossfade_speed': 'medium-fast', # 4-6s
        'mood_weights': {'excited': 1.6, 'energetic': 1.5, 'happy': 1.2, 'relaxed': 0.3, 'sad': 0.1},
        'transition_profile': 'high_energy_blends',
        'voice_sample': "Let's turn up the heat! Keeping the room jumping with non-stop bangers!"
    },
    'chill': {
        'id': 'chill',
        'name': 'Chill DJ',
        'tagline': 'Lo-fi beats, warm acoustic melodies & study waves',
        'avatar': '☕',
        'color': '#06B6D4', # Cyan neon
        'preferred_genres': ['Lo-fi', 'Acoustic', 'Jazz', 'Classical', 'Kannada', 'Hindi'],
        'target_energy': 0.35,
        'min_bpm': 65,
        'max_bpm': 95,
        'crossfade_speed': 'slow-ambient', # 8-12s
        'mood_weights': {'relaxed': 1.8, 'happy': 1.2, 'sad': 0.8, 'excited': 0.2, 'energetic': 0.1},
        'transition_profile': 'long_ambient_swells',
        'voice_sample': "Take a deep breath and settle in. Curating smooth, tranquil frequencies for your space."
    },
    'retro': {
        'id': 'retro',
        'name': 'Retro DJ',
        'tagline': 'Vintage classics, golden disco & nostalgic anthems',
        'avatar': '📻',
        'color': '#F59E0B', # Amber/Gold
        'preferred_genres': ['Rock', 'Classical', 'Pop', 'Kannada', 'Hindi'],
        'target_energy': 0.65,
        'min_bpm': 90,
        'max_bpm': 130,
        'crossfade_speed': 'medium', # 6s
        'mood_weights': {'happy': 1.5, 'excited': 1.2, 'relaxed': 1.0, 'energetic': 0.8},
        'transition_profile': 'analog_beatmatch',
        'voice_sample': "Taking you back in time with timeless gems and unforgettable golden melodies."
    },
    'romantic': {
        'id': 'romantic',
        'name': 'Romantic DJ',
        'tagline': 'Heartfelt acoustic ballads, R&B & intimate rhythms',
        'avatar': '🌹',
        'color': '#E11D48', # Rose/Red
        'preferred_genres': ['Pop', 'Kannada', 'Hindi', 'Classical', 'Lo-fi', 'Acoustic'],
        'target_energy': 0.45,
        'min_bpm': 70,
        'max_bpm': 105,
        'crossfade_speed': 'smooth-long', # 7-10s
        'mood_weights': {'happy': 1.4, 'relaxed': 1.4, 'sad': 0.9, 'excited': 0.4},
        'transition_profile': 'harmonic_crossfade',
        'voice_sample': "Setting the scene with sweet melodies, soulful lyrics, and pure romance."
    },
    'workout': {
        'id': 'workout',
        'name': 'Workout DJ',
        'tagline': 'Hard-hitting basslines, heavy drops & peak stamina',
        'avatar': '⚡',
        'color': '#10B981', # Neon Green
        'preferred_genres': ['EDM', 'Rock', 'Hip-Hop', 'Pop'],
        'target_energy': 0.95,
        'min_bpm': 128,
        'max_bpm': 160,
        'crossfade_speed': 'fast-cut', # 3-5s
        'mood_weights': {'energetic': 1.9, 'excited': 1.5, 'frustrated': 0.5},
        'transition_profile': 'drop_impact',
        'voice_sample': "Pumping that iron! No stopping now, let's keep the pulse racing and stamina peaking!"
    },
    'explorer': {
        'id': 'explorer',
        'name': 'Explorer DJ',
        'tagline': 'Global sounds, regional fusion & hidden underground gems',
        'avatar': '🧭',
        'color': '#8B5CF6', # Electric Purple
        'preferred_genres': ['Kannada', 'Hindi', 'Telugu', 'Tamil', 'Jazz', 'EDM', 'Classical'],
        'target_energy': 0.60,
        'min_bpm': 80,
        'max_bpm': 140,
        'crossfade_speed': 'medium', # 5-7s
        'mood_weights': {'excited': 1.2, 'happy': 1.3, 'relaxed': 1.1, 'energetic': 1.1},
        'transition_profile': 'cross_genre_blend',
        'voice_sample': "Expanding your horizons with unexpected sonic mashups, regional rhythms, and fresh discoveries."
    }
}

def get_personality(personality_id: str = 'party') -> Dict[str, Any]:
    return DJ_PERSONALITIES.get(personality_id.lower(), DJ_PERSONALITIES['party'])
