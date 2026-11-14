"""
Hybrid Music Recommendation Engine for Collaborative AI DJ Platform
Combines personal taste, room mood, group preferences, and discovery.
"""

from typing import Any, Dict, List, Optional


def _normalized(value: Any) -> str:
    return str(value or '').strip().lower()


def _matches(value: str, preferences: List[str]) -> bool:
    normalized_value = _normalized(value)
    return bool(normalized_value) and any(
        preference and (preference == normalized_value or preference in normalized_value or normalized_value in preference)
        for preference in preferences
    )


def _track_id(track: Dict[str, Any]) -> str:
    return str(track.get('id') or f"{track.get('title', '')}|{track.get('artist', '')}")


def _diverse_take(
    ranked_tracks: List[Dict[str, Any]],
    excluded_ids: set,
    limit: int
) -> List[Dict[str, Any]]:
    selected = []
    selected_ids = set(excluded_ids)
    selected_artists = set()

    for allow_repeat_artist in (False, True):
        for track in ranked_tracks:
            track_id = _track_id(track)
            artist = _normalized(track.get('artist'))
            if track_id in selected_ids:
                continue
            if not allow_repeat_artist and artist and artist in selected_artists:
                continue
            selected.append(track)
            selected_ids.add(track_id)
            if artist:
                selected_artists.add(artist)
            if len(selected) >= limit:
                return selected
    return selected


class HybridRecommender:
    def get_recommendations(
        self,
        user: Dict[str, Any],
        catalog: List[Dict[str, Any]],
        room_participants: Optional[List[Dict[str, Any]]] = None,
        room_mood: Optional[Dict[str, Any]] = None,
        listening_history: Optional[List[str]] = None,
        dj_personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not catalog:
            return {
                'recommended_for_you': [],
                'popular_in_room': [],
                'based_on_mood': [],
                'discover_new': [],
                'group_compatible': []
            }

        unique_catalog = []
        seen_ids = set()
        for track in catalog:
            track_id = _track_id(track)
            if track_id not in seen_ids:
                unique_catalog.append(track)
                seen_ids.add(track_id)

        user_genres = [_normalized(value) for value in user.get('preferredGenres', [])]
        user_artists = [_normalized(value) for value in user.get('favoriteArtists', [])]
        user_languages = [_normalized(value) for value in user.get('preferredLanguages', [])]
        history = {_normalized(value) for value in (listening_history or [])}

        mood = room_mood or {}
        mood_energy = float(mood.get('collective_energy', mood.get('collectiveEnergy', 0.6)))
        dominant_emotion = _normalized(
            mood.get('dominant_emotion', mood.get('dominantEmotion', 'happy'))
        ) or 'happy'
        personality = dj_personality or {}
        personality_genres = [
            _normalized(value) for value in personality.get('preferred_genres', [])
        ]
        target_energy = float(personality.get('target_energy', mood_energy))

        mood_genres = {
            'excited': ['edm', 'dance', 'pop', 'hip-hop', 'rock'],
            'energetic': ['edm', 'dance', 'pop', 'hip-hop', 'rock'],
            'relaxed': ['lo-fi', 'acoustic', 'jazz', 'classical', 'ambient'],
            'happy': ['pop', 'dance', 'soundtrack', 'bollywood'],
            'sad': ['acoustic', 'classical', 'lo-fi', 'soundtrack'],
            'frustrated': ['rock', 'metal', 'hip-hop', 'edm'],
            'neutral': []
        }
        emotion_genres = mood_genres.get(dominant_emotion, [])
        participants = room_participants or [user]
        group_genres = [
            _normalized(genre)
            for participant in participants
            for genre in participant.get('preferredGenres', [])
        ]

        def score_personal(track: Dict[str, Any]) -> float:
            genre = _normalized(track.get('genre'))
            artist = _normalized(track.get('artist'))
            language = _normalized(track.get('language'))
            score = 0.0
            if _matches(genre, user_genres):
                score += 3.0
            if any(favorite and favorite in artist for favorite in user_artists):
                score += 2.5
            if _matches(language, user_languages):
                score += 1.5
            if _track_id(track) in history:
                score -= 4.0
            score += float(track.get('popularity', 50) or 0) / 100.0
            return score

        def score_mood(track: Dict[str, Any]) -> float:
            genre = _normalized(track.get('genre'))
            energy = float(track.get('energy', 0.5))
            mood_fit = 1.0 - abs(energy - mood_energy)
            personality_fit = 1.0 - abs(energy - target_energy)
            if _matches(genre, emotion_genres):
                mood_fit += 0.8
            if _matches(genre, personality_genres):
                mood_fit += 0.6
            return mood_fit + personality_fit * 0.5

        def score_group(track: Dict[str, Any]) -> float:
            genre = _normalized(track.get('genre'))
            affinity = sum(1 for preference in group_genres if _matches(genre, [preference]))
            energy_fit = 1.0 - abs(float(track.get('energy', 0.5)) - mood_energy)
            return affinity * 2.0 + energy_fit

        def score_discovery(track: Dict[str, Any]) -> float:
            genre = _normalized(track.get('genre'))
            artist = _normalized(track.get('artist'))
            known_artist = any(favorite and favorite in artist for favorite in user_artists)
            known_genre = _matches(genre, user_genres)
            already_heard = _track_id(track) in history
            novelty = 0.0 if already_heard else 1.0
            novelty += 0.5 if not known_genre else 0.0
            novelty += 0.5 if not known_artist else 0.0
            return novelty + float(track.get('popularity', 50) or 0) / 200.0

        def ranked(score_function):
            return sorted(unique_catalog, key=score_function, reverse=True)

        rankings = {
            'recommended_for_you': ranked(score_personal),
            'based_on_mood': ranked(score_mood),
            'group_compatible': ranked(score_group),
            'popular_in_room': sorted(
                unique_catalog,
                key=lambda track: float(track.get('popularity', 50) or 0),
                reverse=True
            ),
            'discover_new': ranked(score_discovery)
        }

        shelf_limit = max(1, min(6, (len(unique_catalog) + len(rankings) - 1) // len(rankings)))
        used_ids = set()
        shelves = {}
        for shelf_name, tracks in rankings.items():
            shelves[shelf_name] = _diverse_take(tracks, used_ids, shelf_limit)
            used_ids.update(_track_id(track) for track in shelves[shelf_name])

        shelves['current_room_mood'] = mood
        return shelves


recommender = HybridRecommender()
