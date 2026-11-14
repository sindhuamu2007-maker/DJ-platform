"""
AI Music Preference Conflict Resolution Engine
Solves multi-user musical diversity conflicts using Weighted Fair Queueing,
genre starvation compensation, repetition penalties, and transparent explainability.
"""

from typing import List, Dict, Any, Optional

class ConflictResolutionEngine:
    def __init__(self):
        # Weights for multi-objective optimization
        self.w_individual = 0.25
        self.w_group_genre = 0.25
        self.w_mood = 0.20
        self.w_starvation = 0.20
        self.w_popularity = 0.10

    def resolve_conflicts(
        self,
        participants: List[Dict[str, Any]],
        candidate_tracks: List[Dict[str, Any]],
        recent_played_genres: List[str],
        current_mood: Dict[str, Any],
        soundclash_history: Optional[List[Dict[str, Any]]] = None,
        dj_personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates balanced candidate rankings and returns top recommended tracks
        with explicit human-readable reasons for conflict resolution.
        """
        if not candidate_tracks:
            return {'recommended_tracks': [], 'explanation': 'No candidate tracks available to evaluate.'}

        if not participants:
            # Baseline ranking by popularity/mood if no participants
            return {
                'recommended_tracks': candidate_tracks[:5],
                'explanation': 'Ranked by room baseline popularity and mood.'
            }

        # 1. Analyze Group Preferences and Tastes
        genre_counts: Dict[str, int] = {}
        total_user_genres = 0
        user_genre_map: Dict[str, List[str]] = {}

        for p in participants:
            uid = p.get('id') or p.get('userId') or p.get('username') or 'anon'
            genres = [g.lower().strip() for g in p.get('preferredGenres', [])]
            user_genre_map[uid] = genres
            for g in genres:
                genre_counts[g] = genre_counts.get(g, 0) + 1
                total_user_genres += 1

        # Group genre distribution: { 'kannada': 0.40, 'hindi': 0.40, 'edm': 0.20 }
        group_genre_share: Dict[str, float] = {}
        if total_user_genres > 0:
            for g, count in genre_counts.items():
                group_genre_share[g] = count / total_user_genres

        # 2. Compute Starvation Deficit per User and Genre
        # How many tracks ago was each genre played?
        genre_last_played_distance: Dict[str, int] = {}
        for idx, g in enumerate(reversed(recent_played_genres)):
            g_low = g.lower().strip()
            if g_low not in genre_last_played_distance:
                genre_last_played_distance[g_low] = idx + 1

        # Calculate starvation score for genres desired by users
        starvation_bonus: Dict[str, float] = {}
        for g in genre_counts.keys():
            # If never played in recent window, distance is high
            distance = genre_last_played_distance.get(g, len(recent_played_genres) + 2)
            # If distance > 2, boost priority to guarantee fair-share representation
            if distance >= 3:
                starvation_bonus[g] = min(1.0, 0.25 * (distance - 2))
            else:
                starvation_bonus[g] = 0.0

        # Repetition penalty for genres played in the immediately preceding 1 or 2 tracks
        repetition_penalties: Dict[str, float] = {}
        if recent_played_genres:
            last_genre = recent_played_genres[-1].lower().strip() if len(recent_played_genres) >= 1 else ''
            second_last = recent_played_genres[-2].lower().strip() if len(recent_played_genres) >= 2 else ''
            
            repetition_penalties[last_genre] = 0.45  # strong penalty to prevent consecutive monopoly
            if second_last == last_genre:
                repetition_penalties[last_genre] = 0.70  # harsher penalty for back-to-back same genre

        # Soundclash winning genres boost
        soundclash_boost: Dict[str, float] = {}
        if soundclash_history:
            for clash in soundclash_history[-3:]:  # last 3 clashes
                winner_genre = clash.get('winnerGenre', '').lower().strip()
                if winner_genre:
                    soundclash_boost[winner_genre] = soundclash_boost.get(winner_genre, 0.0) + 0.15

        # 3. Score Each Candidate Track
        mood_energy = current_mood.get('collective_energy', 0.6)
        dominant_emotion = current_mood.get('dominant_emotion', 'happy')
        personality_genres = {
            genre.lower().strip()
            for genre in (dj_personality or {}).get('preferred_genres', []) or []
        }
        personality_energy = (dj_personality or {}).get('target_energy')

        scored_candidates = []
        for track in candidate_tracks:
            t_genre = track.get('genre', '').lower().strip()
            t_energy = track.get('energy', 0.5)
            t_popularity = track.get('popularity', 50) / 100.0

            # Sub-score A: Group Genre Popularity
            s_group_genre = group_genre_share.get(t_genre, 0.05)

            # Sub-score B: Individual User Alignment (how many users feel represented?)
            users_represented = sum(1 for uid, ugenres in user_genre_map.items() if t_genre in ugenres)
            s_individual = (users_represented / max(1, len(participants)))

            # Sub-score C: Mood & Energy Alignment
            # If excited/energetic, high energy tracks get higher score
            energy_diff = abs(t_energy - mood_energy)
            s_mood = max(0.0, 1.0 - energy_diff)

            # Sub-score D: Starvation / Fair Share
            s_starvation = starvation_bonus.get(t_genre, 0.0)

            # Sub-score E: Repetition Penalty
            p_repetition = repetition_penalties.get(t_genre, 0.0)

            # Clash boost
            b_clash = soundclash_boost.get(t_genre, 0.0)

            personality_genre_fit = 1.0 if t_genre in personality_genres else 0.0
            personality_energy_fit = (
                max(0.0, 1.0 - abs(t_energy - personality_energy))
                if personality_energy is not None else 0.0
            )
            personality_bonus = (0.25 * personality_genre_fit) + (0.10 * personality_energy_fit)

            # Composite compatibility score
            total_score = (
                self.w_individual * s_individual +
                self.w_group_genre * s_group_genre +
                self.w_mood * s_mood +
                self.w_starvation * s_starvation +
                self.w_popularity * t_popularity +
                b_clash -
                p_repetition +
                personality_bonus
            )

            # Generate individualized reason
            represented_users = [
                p.get('displayName') or p.get('username') or 'Guest'
                for p in participants
                if t_genre in [g.lower() for g in p.get('preferredGenres', [])]
            ]
            
            explanation_parts = []
            if s_starvation > 0.2 and represented_users:
                names = ", ".join(represented_users[:2])
                explanation_parts.append(f"Gives {names} their preferred {t_genre.title()} music after {genre_last_played_distance.get(t_genre, 3)} tracks")
            elif len(represented_users) >= len(participants) * 0.5:
                pct = int((len(represented_users) / len(participants)) * 100)
                explanation_parts.append(f"Appeals to {pct}% of room members ({t_genre.title()})")
            elif p_repetition == 0.0 and s_mood > 0.7:
                explanation_parts.append(f"Diversifies genre while perfectly matching the {dominant_emotion} room vibe")
            else:
                explanation_parts.append(f"Balances group taste diversity with {int(s_mood * 100)}% mood compatibility")

            if p_repetition > 0:
                explanation_parts.append("(slight repetition cooldown applied)")

            reason_str = "; ".join(explanation_parts)

            scored_candidates.append({
                'track': track,
                'score': round(total_score, 4),
                'breakdown': {
                    'group_share': round(s_group_genre, 3),
                    'individual_alignment': round(s_individual, 3),
                    'mood_fit': round(s_mood, 3),
                    'personality_genre_fit': round(personality_genre_fit, 3),
                    'personality_energy_fit': round(personality_energy_fit, 3),
                    'starvation_boost': round(s_starvation, 3),
                    'repetition_penalty': round(p_repetition, 3),
                    'users_satisfied': represented_users
                },
                'explanation': reason_str
            })

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x['score'], reverse=True)

        top_pick = scored_candidates[0] if scored_candidates else None
        overall_summary = "AI selected this song because it matches the group's preferences and maintains music diversity."
        if top_pick:
            overall_summary = f"AI selected '{top_pick['track'].get('title')}' because: {top_pick['explanation']}"

        return {
            'recommended_tracks': scored_candidates,
            'top_recommendation': top_pick,
            'explanation': overall_summary,
            'group_genre_distribution': {k: round(v * 100, 1) for k, v in group_genre_share.items()}
        }


conflict_resolver = ConflictResolutionEngine()

if __name__ == '__main__':
    # Test scenario from problem statement:
    # 5 users: User 1: Kannada, User 2: Hindi, User 3: EDM, User 4: Kannada, User 5: Hindi
    test_participants = [
        {'id': 'u1', 'username': 'Alice', 'displayName': 'Alice', 'preferredGenres': ['Kannada', 'Pop']},
        {'id': 'u2', 'username': 'Bob', 'displayName': 'Bob', 'preferredGenres': ['Hindi', 'Rock']},
        {'id': 'u3', 'username': 'Charlie', 'displayName': 'Charlie', 'preferredGenres': ['EDM']},
        {'id': 'u4', 'username': 'Divya', 'displayName': 'Divya', 'preferredGenres': ['Kannada', 'Classical']},
        {'id': 'u5', 'username': 'Eshan', 'displayName': 'Eshan', 'preferredGenres': ['Hindi', 'Lo-fi']},
    ]
    test_tracks = [
        {'id': 't1', 'title': 'Kannada High Beat', 'artist': 'Raghu', 'genre': 'Kannada', 'energy': 0.8, 'popularity': 80},
        {'id': 't2', 'title': 'Hindi Dance Anthem', 'artist': 'Arijit', 'genre': 'Hindi', 'energy': 0.75, 'popularity': 85},
        {'id': 't3', 'title': 'EDM Laser Drop', 'artist': 'Avicii', 'genre': 'EDM', 'energy': 0.9, 'popularity': 90},
        {'id': 't4', 'title': 'Kannada Melodic Breeze', 'artist': 'Sanjith', 'genre': 'Kannada', 'energy': 0.5, 'popularity': 75},
        {'id': 't5', 'title': 'Lofi Chill Study', 'artist': 'Kavita', 'genre': 'Lo-fi', 'energy': 0.3, 'popularity': 60},
    ]

    # Scenario: Kannada and Hindi were just played back-to-back. Who should get played?
    recent = ['Kannada', 'Hindi']
    mood = {'collective_energy': 0.8, 'dominant_emotion': 'excited'}

    result = conflict_resolver.resolve_conflicts(test_participants, test_tracks, recent, mood)
    print("Conflict Resolution Top Recommendation:")
    print("Track:", result['top_recommendation']['track']['title'], f"({result['top_recommendation']['track']['genre']})")
    print("Score:", result['top_recommendation']['score'])
    print("Explanation:", result['explanation'])
    print("Breakdown:", result['top_recommendation']['breakdown'])
