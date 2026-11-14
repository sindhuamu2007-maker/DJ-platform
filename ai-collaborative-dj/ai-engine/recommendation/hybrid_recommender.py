"""
Hybrid Music Recommendation Engine for Collaborative AI DJ Platform
Combines Content-Based Filtering, Collaborative/Room Popularity Filtering,
Mood-Adaptive Scoring, and Conflict-Resolved Group Compatibility.
"""

from typing import List, Dict, Any, Optional

class HybridRecommender:
    def __init__(self):
        pass

    def get_recommendations(
        self,
        user: Dict[str, Any],
        catalog: List[Dict[str, Any]],
        room_participants: Optional[List[Dict[str, Any]]] = None,
        room_mood: Optional[Dict[str, Any]] = None,
        listening_history: Optional[List[str]] = None,
        dj_personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates structured multi-shelf recommendations:
        1. Recommended for You
        2. Popular in Your Room
        3. Based on Your Mood
        4. Discover New Music
        5. Group Compatible Tracks
        """
        if not catalog:
            return {
                'recommended_for_you': [],
                'popular_in_room': [],
                'based_on_mood': [],
                'discover_new': [],
                'group_compatible': []
            }

        user_genres = [g.lower().strip() for g in user.get('preferredGenres', [])]
        user_artists = [a.lower().strip() for a in user.get('favoriteArtists', [])]
        user_history = set(listening_history or [])

        mood = room_mood or {'collective_energy': 0.6, 'dominant_emotion': 'happy'}
        mood_energy = float(mood.get('collective_energy', 0.6))
        dominant_emotion = mood.get('dominant_emotion', 'happy')

        # Shelf 1: Recommended for You (personalized user taste)
        scored_user = []
        for track in catalog:
            t_genre = track.get('genre', '').lower().strip()
            t_artist = track.get('artist', '').lower().strip()
            t_id = track.get('id', '')
            
            score = 0.0
            if t_genre in user_genres:
                score += 3.0
            if any(a in t_artist for a in user_artists):
                score += 2.5
            if t_id in user_history:
                score += 0.5 # familiar favorite
            score += (track.get('popularity', 50) / 100.0) * 1.0

            scored_user.append((track, score))
        scored_user.sort(key=lambda x: x[1], reverse=True)
        shelf_for_you = [x[0] for x in scored_user[:8]]

        # Shelf 2: Popular in Your Room (highest stream count, battle winners, overall high popularity)
        sorted_popular = sorted(catalog, key=lambda t: t.get('popularity', 50), reverse=True)
        shelf_popular = sorted_popular[:8]

        # Shelf 3: Based on Your Mood (congruent energy and valence)
        scored_mood = []
        for track in catalog:
            t_energy = float(track.get('energy', 0.5))
            # compute distance from target room energy
            diff = abs(t_energy - mood_energy)
            mood_fit = 1.0 - diff
            
            # Check genre mood congruence
            t_genre = track.get('genre', '').lower()
            if dominant_emotion in ('excited', 'energetic') and t_genre in ('edm', 'pop', 'dance', 'kannada', 'rock'):
                mood_fit += 0.4
            elif dominant_emotion == 'relaxed' and t_genre in ('lo-fi', 'acoustic', 'classical', 'jazz'):
                mood_fit += 0.4
            elif dominant_emotion == 'happy' and t_genre in ('kannada', 'hindi', 'pop'):
                mood_fit += 0.3

            scored_mood.append((track, mood_fit))
        scored_mood.sort(key=lambda x: x[1], reverse=True)
        shelf_mood = [x[0] for x in scored_mood[:8]]

        # Shelf 4: Discover New Music (high quality tracks in genres user hasn't heavily explored)
        scored_discover = []
        for track in catalog:
            t_genre = track.get('genre', '').lower().strip()
            t_id = track.get('id', '')
            # Prioritize tracks NOT in user's direct top genres or history
            unfamiliarity = 2.0 if (t_genre not in user_genres and t_id not in user_history) else 0.5
            disc_score = unfamiliarity + (track.get('popularity', 50) / 100.0)
            scored_discover.append((track, disc_score))
        scored_discover.sort(key=lambda x: x[1], reverse=True)
        shelf_discover = [x[0] for x in scored_discover[:8]]

        # Shelf 5: Group Compatible Tracks (shared intersection across all participants)
        shelf_group = []
        if room_participants and len(room_participants) > 1:
            all_room_genres = {}
            for p in room_participants:
                for g in p.get('preferredGenres', []):
                    g_low = g.lower().strip()
                    all_room_genres[g_low] = all_room_genres.get(g_low, 0) + 1

            scored_group = []
            for track in catalog:
                t_genre = track.get('genre', '').lower().strip()
                affinity = all_room_genres.get(t_genre, 0)
                energy_fit = 1.0 - abs(float(track.get('energy', 0.5)) - mood_energy)
                group_score = (affinity * 2.0) + (energy_fit * 1.5)
                scored_group.append((track, group_score))
            scored_group.sort(key=lambda x: x[1], reverse=True)
            shelf_group = [x[0] for x in scored_group[:8]]
        else:
            shelf_group = shelf_popular[:8]

        return {
            'recommended_for_you': shelf_for_you,
            'popular_in_room': shelf_popular,
            'based_on_mood': shelf_mood,
            'discover_new': shelf_discover,
            'group_compatible': shelf_group,
            'current_room_mood': mood
        }


recommender = HybridRecommender()
