"""
AI Soundclash Match Predictor
Predicts the winner between two competing battle tracks based on active participant tastes,
historical voting trends, and room mood with confidence scoring.
"""

from typing import Dict, Any, List

class SoundclashPredictor:
    def __init__(self):
        pass

    def predict_battle(
        self,
        song_a: Dict[str, Any],
        song_b: Dict[str, Any],
        participants: List[Dict[str, Any]],
        room_mood: Dict[str, Any],
        past_battles: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates Song A vs Song B across audience affinity, mood fit, and historical clash bias.
        Returns predicted winner, confidence percentage, and key reasoning factors.
        """
        genre_a = song_a.get('genre', '').lower().strip()
        genre_b = song_b.get('genre', '').lower().strip()
        
        energy_a = float(song_a.get('energy', 0.5))
        energy_b = float(song_b.get('energy', 0.5))
        
        pop_a = float(song_a.get('popularity', 50))
        pop_b = float(song_b.get('popularity', 50))
        
        mood_energy = float(room_mood.get('collective_energy', 0.6))
        dominant_emotion = room_mood.get('dominant_emotion', 'happy')

        score_a = 0.0
        score_b = 0.0
        factors_a = []
        factors_b = []

        # 1. Active Participants Taste Alignment
        if participants:
            count_pref_a = 0
            count_pref_b = 0
            for p in participants:
                prefs = [g.lower().strip() for g in p.get('preferredGenres', [])]
                if genre_a in prefs:
                    count_pref_a += 1
                if genre_b in prefs:
                    count_pref_b += 1
            
            score_a += count_pref_a * 2.5
            score_b += count_pref_b * 2.5
            
            if count_pref_a > count_pref_b:
                factors_a.append(f"{count_pref_a} of {len(participants)} listeners favor {genre_a.title()}")
            elif count_pref_b > count_pref_a:
                factors_b.append(f"{count_pref_b} of {len(participants)} listeners favor {genre_b.title()}")

        # 2. Mood Alignment (energy congruency)
        fit_a = max(0.0, 1.0 - abs(energy_a - mood_energy))
        fit_b = max(0.0, 1.0 - abs(energy_b - mood_energy))
        score_a += fit_a * 2.0
        score_b += fit_b * 2.0

        if fit_a > fit_b + 0.15:
            factors_a.append(f"Higher energy match with current {dominant_emotion} room vibe")
        elif fit_b > fit_a + 0.15:
            factors_b.append(f"Higher energy match with current {dominant_emotion} room vibe")

        # 3. Track Popularity
        score_a += (pop_a / 100.0) * 1.5
        score_b += (pop_b / 100.0) * 1.5
        if pop_a > pop_b + 15:
            factors_a.append(f"Higher streaming traction ({int(pop_a)}% popularity)")
        elif pop_b > pop_a + 15:
            factors_b.append(f"Higher streaming traction ({int(pop_b)}% popularity)")

        # 4. Historical Battle Outcomes
        if past_battles:
            clash_wins_a = sum(1 for b in past_battles if b.get('winnerGenre', '').lower() == genre_a)
            clash_wins_b = sum(1 for b in past_battles if b.get('winnerGenre', '').lower() == genre_b)
            score_a += clash_wins_a * 0.8
            score_b += clash_wins_b * 0.8
            if clash_wins_a > clash_wins_b:
                factors_a.append(f"{genre_a.title()} has won {clash_wins_a} previous room battles")
            elif clash_wins_b > clash_wins_a:
                factors_b.append(f"{genre_b.title()} has won {clash_wins_b} previous room battles")

        total = score_a + score_b
        if total <= 0:
            prob_a = 0.5
            prob_b = 0.5
        else:
            prob_a = score_a / total
            prob_b = score_b / total

        # Bound confidence between 52% and 88% to avoid unrealistic certainty
        if prob_a >= prob_b:
            predicted_winner_id = song_a.get('id', 'songA')
            predicted_winner_title = song_a.get('title', 'Song A')
            raw_conf = prob_a
            key_reasons = factors_a if factors_a else ["Stronger overall audio affinity"]
        else:
            predicted_winner_id = song_b.get('id', 'songB')
            predicted_winner_title = song_b.get('title', 'Song B')
            raw_conf = prob_b
            key_reasons = factors_b if factors_b else ["Stronger overall audio affinity"]

        # Scale into plausible confidence (53% to 86%)
        scaled_confidence = round(52.0 + (raw_conf - 0.5) * 68.0, 1)
        scaled_confidence = max(53.0, min(86.0, scaled_confidence))

        return {
            'predicted_winner_id': predicted_winner_id,
            'predicted_winner_title': predicted_winner_title,
            'confidence_score': scaled_confidence,
            'probability_song_a': round(prob_a * 100, 1),
            'probability_song_b': round(prob_b * 100, 1),
            'reasoning': "; ".join(key_reasons[:3]),
            'note': 'AI prediction does not influence live voting or tally.'
        }


clash_predictor = SoundclashPredictor()
