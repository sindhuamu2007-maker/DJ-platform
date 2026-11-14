"""
Collective Group Mood Aggregation Engine for Collaborative AI DJ
Calculates real-time collective emotional vectors with exponential time decay,
reaction weighting, and mood trajectory forecasting.
"""

import math
import time
from typing import Dict, Any, List

class GroupMoodEngine:
    def __init__(self, half_life_seconds: float = 180.0):
        # Half-life of 3 minutes for emotional decay
        self.half_life = half_life_seconds

    def calculate_group_mood(self, recent_events: List[Dict[str, Any]], current_time: float = None) -> Dict[str, Any]:
        """
        recent_events: list of dicts with:
          - 'emotions': dict of emotion weights or dominant emotion
          - 'polarity': float (-1.0 to 1.0)
          - 'energy_score': float (0.0 to 1.0)
          - 'timestamp': float (unix epoch in seconds)
          - 'event_type': 'chat' | 'reaction' | 'like' | 'dislike' | 'skip'
        """
        if current_time is None:
            current_time = time.time()

        if not recent_events:
            # Default baseline state when room has no events yet
            return {
                'emotions': {
                    'happy': 25.0,
                    'excited': 20.0,
                    'energetic': 20.0,
                    'relaxed': 25.0,
                    'sad': 5.0,
                    'frustrated': 5.0,
                    'neutral': 0.0
                },
                'dominant_emotion': 'happy',
                'collective_energy': 0.65,
                'collective_valence': 0.50,
                'trajectory': 'Balanced & Warming Up',
                'event_count': 0,
                'status': 'baseline'
            }

        decay_constant = math.log(2) / self.half_life
        accumulated_emotions = {
            'happy': 0.0,
            'excited': 0.0,
            'energetic': 0.0,
            'relaxed': 0.0,
            'sad': 0.0,
            'frustrated': 0.0,
            'neutral': 0.0
        }

        weighted_energy = 0.0
        weighted_valence = 0.0
        total_weight = 0.0

        for ev in recent_events:
            event_ts = ev.get('timestamp', current_time)
            # If timestamp is in milliseconds, convert to seconds
            if event_ts > 1e11:
                event_ts = event_ts / 1000.0

            age = max(0.0, current_time - event_ts)
            time_factor = math.exp(-decay_constant * age)

            # Event type importance weight
            ev_type = ev.get('event_type', 'chat')
            type_multiplier = {
                'chat': 1.0,
                'reaction': 1.3,
                'like': 1.5,
                'dislike': 1.8,
                'skip': 2.0
            }.get(ev_type, 1.0)

            w = time_factor * type_multiplier
            total_weight += w

            # Energy and Valence
            weighted_energy += ev.get('energy_score', 0.5) * w
            weighted_valence += ev.get('polarity', 0.0) * w

            # Emotion components
            ev_emotions = ev.get('emotions', {})
            if ev_emotions:
                for em, val in ev_emotions.items():
                    if em in accumulated_emotions:
                        accumulated_emotions[em] += (val / 100.0) * w
            else:
                dom = ev.get('dominant_emotion', 'neutral')
                if dom in accumulated_emotions:
                    accumulated_emotions[dom] += 1.0 * w

        if total_weight > 0:
            avg_energy = max(0.05, min(1.0, weighted_energy / total_weight))
            avg_valence = max(-1.0, min(1.0, weighted_valence / total_weight))

            total_emotion_sum = sum(accumulated_emotions.values())
            if total_emotion_sum > 0:
                normalized_emotions = {
                    k: round((v / total_emotion_sum) * 100, 1)
                    for k, v in accumulated_emotions.items()
                }
            else:
                normalized_emotions = {'happy': 30.0, 'excited': 25.0, 'relaxed': 25.0, 'energetic': 20.0, 'sad': 0.0, 'frustrated': 0.0, 'neutral': 0.0}
        else:
            avg_energy = 0.60
            avg_valence = 0.40
            normalized_emotions = {'happy': 30.0, 'excited': 25.0, 'relaxed': 25.0, 'energetic': 20.0, 'sad': 0.0, 'frustrated': 0.0, 'neutral': 0.0}

        dominant_emotion = max(normalized_emotions.items(), key=lambda x: x[1])[0]

        # Determine Trajectory
        if normalized_emotions.get('frustrated', 0) > 35 or normalized_emotions.get('frustrated', 0) > normalized_emotions.get('happy', 0):
            trajectory = 'Restless / Needs Fresh Genre'
        elif avg_energy > 0.75 and normalized_emotions.get('excited', 0) + normalized_emotions.get('energetic', 0) > 40:
            trajectory = 'Peak Party High'
        elif avg_energy > 0.55 and avg_valence > 0.3:
            trajectory = 'Rising Energy'
        elif avg_energy < 0.4 and normalized_emotions.get('relaxed', 0) > 35:
            trajectory = 'Mellow Chill Vibes'
        elif normalized_emotions.get('sad', 0) > 30:
            trajectory = 'Deep Emotional Space'
        else:
            trajectory = 'Groovy & Upbeat'

        return {
            'emotions': normalized_emotions,
            'dominant_emotion': dominant_emotion,
            'collective_energy': round(avg_energy, 2),
            'collective_valence': round(avg_valence, 2),
            'trajectory': trajectory,
            'event_count': len(recent_events),
            'status': 'active'
        }


mood_engine = GroupMoodEngine()
