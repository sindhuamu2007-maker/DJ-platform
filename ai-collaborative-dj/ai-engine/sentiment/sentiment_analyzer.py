"""
NLP Sentiment & Emotion Analysis Engine for Collaborative AI DJ Platform
Provides sentiment classification (positive, negative, neutral) and
multi-class emotion detection (happy, excited, sad, relaxed, energetic, frustrated).
"""

import re
from typing import Dict, Any, List

# Emoji mappings to sentiment and specific emotions with intensity weights
EMOJI_LEXICON: Dict[str, Dict[str, Any]] = {
    '🔥': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.9, 'energy': 0.95},
    '❤️': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.85, 'energy': 0.7},
    '💖': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.85, 'energy': 0.7},
    '⚡': {'sentiment': 'positive', 'emotion': 'energetic', 'polarity': 0.8, 'energy': 0.95},
    '💃': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.85, 'energy': 0.9},
    '🕺': {'sentiment': 'positive', 'emotion': 'energetic', 'polarity': 0.85, 'energy': 0.9},
    '🎉': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.9, 'energy': 0.9},
    '🙌': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.8, 'energy': 0.8},
    '✨': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.75, 'energy': 0.6},
    '🎶': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.6, 'energy': 0.6},
    '🎧': {'sentiment': 'positive', 'emotion': 'relaxed', 'polarity': 0.6, 'energy': 0.5},
    '🎵': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.6, 'energy': 0.6},
    '😍': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.9, 'energy': 0.7},
    '🤩': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.95, 'energy': 0.9},
    '🥳': {'sentiment': 'positive', 'emotion': 'excited', 'polarity': 0.9, 'energy': 0.9},
    '😎': {'sentiment': 'positive', 'emotion': 'relaxed', 'polarity': 0.7, 'energy': 0.6},
    '😴': {'sentiment': 'neutral', 'emotion': 'relaxed', 'polarity': 0.0, 'energy': 0.1},
    '😌': {'sentiment': 'positive', 'emotion': 'relaxed', 'polarity': 0.6, 'energy': 0.25},
    '☕': {'sentiment': 'neutral', 'emotion': 'relaxed', 'polarity': 0.3, 'energy': 0.2},
    '🌊': {'sentiment': 'neutral', 'emotion': 'relaxed', 'polarity': 0.3, 'energy': 0.3},
    '💔': {'sentiment': 'negative', 'emotion': 'sad', 'polarity': -0.8, 'energy': 0.3},
    '😢': {'sentiment': 'negative', 'emotion': 'sad', 'polarity': -0.85, 'energy': 0.2},
    '😭': {'sentiment': 'negative', 'emotion': 'sad', 'polarity': -0.7, 'energy': 0.5},
    '🥺': {'sentiment': 'neutral', 'emotion': 'sad', 'polarity': -0.3, 'energy': 0.3},
    '😡': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.9, 'energy': 0.85},
    '🤬': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.95, 'energy': 0.95},
    '👎': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.75, 'energy': 0.5},
    '🤮': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.9, 'energy': 0.7},
    '🤦': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.6, 'energy': 0.4},
    '🥱': {'sentiment': 'negative', 'emotion': 'frustrated', 'polarity': -0.4, 'energy': 0.15},
    '👍': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.6, 'energy': 0.6},
    '👏': {'sentiment': 'positive', 'emotion': 'happy', 'polarity': 0.7, 'energy': 0.75},
}

# Emotion lexicons with intensity weights
EMOTION_KEYWORDS = {
    'happy': {
        'love': 0.8, 'amazing': 0.85, 'awesome': 0.8, 'great': 0.7, 'good': 0.6,
        'beautiful': 0.8, 'sweet': 0.7, 'nice': 0.6, 'vibes': 0.65, 'vibe': 0.6,
        'smile': 0.75, 'delight': 0.8, 'joy': 0.85, 'fun': 0.7, 'wonderful': 0.85,
        'favorite': 0.8, 'favourite': 0.8, 'melody': 0.6, 'bliss': 0.9, 'lovely': 0.75
    },
    'excited': {
        'fire': 0.9, 'banger': 0.95, 'insane': 0.85, 'drop': 0.8, 'party': 0.85,
        'dance': 0.8, 'hype': 0.9, 'wild': 0.85, 'blast': 0.85, 'turn up': 0.9,
        'slaps': 0.9, 'lit': 0.9, 'craziest': 0.85, 'bop': 0.8, 'peak': 0.8,
        'screaming': 0.8, 'anthem': 0.85, 'lets go': 0.85, "let's go": 0.85, 'madness': 0.8
    },
    'energetic': {
        'bass': 0.8, 'beat': 0.7, 'energy': 0.85, 'heavy': 0.75, 'drop': 0.75,
        'speed': 0.7, 'workout': 0.85, 'fast': 0.7, 'power': 0.8, 'hard': 0.7,
        'jump': 0.8, 'drive': 0.75, 'punch': 0.75, 'tempo': 0.7, 'edm': 0.8
    },
    'relaxed': {
        'chill': 0.85, 'calm': 0.85, 'peaceful': 0.9, 'soothing': 0.85, 'lofi': 0.85,
        'lo-fi': 0.85, 'smooth': 0.8, 'mellow': 0.85, 'sleep': 0.7, 'ambient': 0.8,
        'gentle': 0.8, 'relax': 0.85, 'easy': 0.6, 'zen': 0.9, 'rain': 0.7, 'soft': 0.75
    },
    'sad': {
        'cry': 0.85, 'crying': 0.9, 'sad': 0.85, 'tears': 0.9, 'heartbroken': 0.95,
        'lonely': 0.8, 'melancholy': 0.85, 'miss': 0.7, 'pain': 0.8, 'deep': 0.6,
        'emotional': 0.75, 'slow': 0.5, 'somber': 0.85, 'hurts': 0.85
    },
    'frustrated': {
        'skip': 0.85, 'trash': 0.9, 'hate': 0.85, 'terrible': 0.9, 'horrible': 0.95,
        'bad': 0.7, 'annoying': 0.85, 'stop': 0.75, 'turn off': 0.8, 'boring': 0.8,
        'sucks': 0.9, 'worst': 0.95, 'ear bleeding': 0.95, 'change': 0.65, 'cringe': 0.8
    }
}

NEGATIONS = {'not', 'never', 'no', 'hardly', "don't", 'dont', "can't", 'cant', 'hardly', 'barely'}
INTENSIFIERS = {'very': 1.4, 'super': 1.5, 'so': 1.3, 'extremely': 1.6, 'totally': 1.3, 'really': 1.3, 'absolute': 1.4}


class SentimentAnalyzer:
    def __init__(self):
        pass

    def clean_text(self, text: str) -> str:
        """Strip URLs, user handles, and special characters, preserving words and emojis."""
        if not text:
            return ""
        # Remove URLs
        text = re.sub(r'https?://\S+', '', text)
        # Remove mentions
        text = re.sub(r'@\w+', '', text)
        return text.strip()

    def analyze(self, text: str, reaction_type: str = None) -> Dict[str, Any]:
        """
        Analyze text and optional reaction type.
        Returns sentiment, polarity (-1 to 1), dominant emotion, and emotion distribution scores.
        """
        cleaned = self.clean_text(text)
        words = re.findall(r"[\w']+|[^\s\w]", cleaned.lower())
        
        emotion_scores = {
            'happy': 0.0,
            'excited': 0.0,
            'energetic': 0.0,
            'relaxed': 0.0,
            'sad': 0.0,
            'frustrated': 0.0,
            'neutral': 0.1  # baseline
        }
        
        polarity = 0.0
        polarity_count = 0
        energy_score = 0.5  # middle baseline

        # 1. Check for emojis
        for char in cleaned:
            if char in EMOJI_LEXICON:
                lex = EMOJI_LEXICON[char]
                emotion_scores[lex['emotion']] += 1.2
                polarity += lex['polarity']
                energy_score = (energy_score + lex['energy']) / 2.0
                polarity_count += 1

        # 2. Check for keywords with negation and intensifiers
        i = 0
        while i < len(words):
            word = words[i]
            
            # Check 2-word ngrams like "let's go" or "turn up"
            if i + 1 < len(words):
                bigram = f"{word} {words[i+1]}"
                for emotion, kws in EMOTION_KEYWORDS.items():
                    if bigram in kws:
                        weight = kws[bigram]
                        emotion_scores[emotion] += weight * 1.5
                        if emotion in ('happy', 'excited', 'energetic'):
                            polarity += 0.8
                        elif emotion in ('sad', 'frustrated'):
                            polarity -= 0.8
                        polarity_count += 1
                        i += 2
                        continue

            # Check negation in window of previous 2 words
            is_negated = False
            if i > 0 and words[i-1] in NEGATIONS:
                is_negated = True
            elif i > 1 and words[i-2] in NEGATIONS:
                is_negated = True

            multiplier = 1.0
            if i > 0 and words[i-1] in INTENSIFIERS:
                multiplier = INTENSIFIERS[words[i-1]]

            for emotion, kws in EMOTION_KEYWORDS.items():
                if word in kws:
                    weight = kws[word] * multiplier
                    if is_negated:
                        # Negating positive emotion implies frustration/neutrality
                        if emotion in ('happy', 'excited', 'energetic', 'relaxed'):
                            emotion_scores['frustrated'] += weight * 0.8
                            polarity -= 0.5 * multiplier
                        else:
                            emotion_scores['relaxed'] += weight * 0.5
                            polarity += 0.4 * multiplier
                    else:
                        emotion_scores[emotion] += weight
                        if emotion in ('happy', 'excited', 'energetic'):
                            polarity += weight
                            if emotion in ('excited', 'energetic'):
                                energy_score = min(1.0, energy_score + 0.15)
                        elif emotion == 'relaxed':
                            polarity += weight * 0.4
                            energy_score = max(0.0, energy_score - 0.15)
                        elif emotion == 'sad':
                            polarity -= weight
                            energy_score = max(0.0, energy_score - 0.1)
                        elif emotion == 'frustrated':
                            polarity -= weight
                    polarity_count += 1

            i += 1

        # 3. Factor in reaction_type if provided (e.g. from UI song reaction button)
        if reaction_type:
            r_lower = reaction_type.lower()
            if r_lower in ('fire', 'lit', 'flame'):
                emotion_scores['excited'] += 2.0
                polarity += 1.0
                polarity_count += 1
                energy_score = min(1.0, energy_score + 0.25)
            elif r_lower in ('love', 'heart', 'like'):
                emotion_scores['happy'] += 2.0
                polarity += 0.9
                polarity_count += 1
            elif r_lower in ('bolt', 'energy', 'zap'):
                emotion_scores['energetic'] += 2.0
                polarity += 0.8
                polarity_count += 1
                energy_score = min(1.0, energy_score + 0.3)
            elif r_lower in ('chill', 'sleep', 'relax'):
                emotion_scores['relaxed'] += 2.0
                polarity += 0.5
                polarity_count += 1
                energy_score = max(0.0, energy_score - 0.2)
            elif r_lower in ('dislike', 'skip', 'trash'):
                emotion_scores['frustrated'] += 2.0
                polarity -= 1.0
                polarity_count += 1
            elif r_lower in ('sad', 'cry', 'broken'):
                emotion_scores['sad'] += 2.0
                polarity -= 0.7
                polarity_count += 1

        # Calculate final normalized polarity
        final_polarity = 0.0
        if polarity_count > 0:
            final_polarity = max(-1.0, min(1.0, polarity / max(1, polarity_count)))
        
        # Classification
        if final_polarity > 0.15:
            sentiment_label = 'positive'
        elif final_polarity < -0.15:
            sentiment_label = 'negative'
        else:
            sentiment_label = 'neutral'

        # Normalize emotion distribution
        total_emotion_weight = sum(emotion_scores.values())
        normalized_emotions = {
            k: round((v / total_emotion_weight) * 100, 1) if total_emotion_weight > 0 else 0.0
            for k, v in emotion_scores.items()
        }

        # Find dominant emotion
        dominant_emotion = max(normalized_emotions.items(), key=lambda x: x[1])[0]
        if normalized_emotions[dominant_emotion] < 20.0 and sentiment_label == 'neutral':
            dominant_emotion = 'neutral'

        return {
            'text': cleaned,
            'sentiment': sentiment_label,
            'polarity': round(final_polarity, 3),
            'energy_score': round(energy_score, 2),
            'dominant_emotion': dominant_emotion,
            'emotions': normalized_emotions,
            'timestamp': None
        }


# Global instance
analyzer = SentimentAnalyzer()

if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    tests = [
        "This song is amazing! Let's play more dance music! 🔥",
        "Loving this party, the drop is fire! 💃⚡",
        "So chill and relaxing, perfect study vibes ☕🎧",
        "Ugh please skip this track, it's so boring and terrible 👎",
        "I'm feeling so sad today, this melody hurts 💔😢",
        "Not bad, pretty decent track",
        "Let's turn up the bass! 🕺"
    ]
    for t in tests:
        res = analyzer.analyze(t)
        print(f"[{res['sentiment'].upper():8}] dominant: {res['dominant_emotion']:10} (polarity: {res['polarity']}) -> '{t}'")
