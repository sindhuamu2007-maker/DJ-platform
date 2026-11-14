"""
Flask REST API Microservice for AI-Powered Collaborative DJ Engine
Exposes NLP Sentiment, Emotion-Adaptive Group Mood, Music Conflict Resolution,
Harmonic DJ Transitions, Soundclash AI Predictions, and Hybrid Recommendations.
"""

import os
import sys
import json
import time
from flask import Flask, request, jsonify

# Set UTF-8 encoding for Windows terminals
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Import modules
from sentiment.sentiment_analyzer import analyzer
from emotion_detection.group_mood import mood_engine
from conflict_resolution.preference_balancer import conflict_resolver
from dj_engine.transition_engine import transition_engine
from dj_engine.personalities import DJ_PERSONALITIES, get_personality
from dj_engine.soundclash_predictor import clash_predictor
from recommendation.hybrid_recommender import recommender

app = Flask(__name__)

# Standard CORS handler for zero external dependencies
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'ai-collaborative-dj-engine',
        'timestamp': time.time(),
        'capabilities': [
            'sentiment_analysis',
            'emotion_detection',
            'conflict_resolution',
            'harmonic_mixing',
            'dj_personalities',
            'soundclash_prediction',
            'hybrid_recommendations'
        ]
    })

@app.route('/api/sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json(force=True) or {}
        text = data.get('text', '')
        reaction_type = data.get('reactionType')
        result = analyzer.analyze(text, reaction_type)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/emotion/room-mood', methods=['POST'])
def calculate_room_mood():
    try:
        data = request.get_json(force=True) or {}
        events = data.get('events', [])
        result = mood_engine.calculate_group_mood(events)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/conflict-resolution/balance', methods=['POST'])
def balance_preferences():
    try:
        data = request.get_json(force=True) or {}
        participants = data.get('participants', [])
        candidate_tracks = data.get('candidateTracks', [])
        recent_genres = data.get('recentGenres', [])
        current_mood = data.get('currentMood', {})
        soundclash_history = data.get('soundclashHistory', [])
        dj_settings = data.get('djSettings', {})
        
        result = conflict_resolver.resolve_conflicts(
            participants=participants,
            candidate_tracks=candidate_tracks,
            recent_played_genres=recent_genres,
            current_mood=current_mood,
            soundclash_history=soundclash_history,
            dj_personality=dj_settings
        )
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/dj/transition', methods=['POST'])
def calculate_transition():
    try:
        data = request.get_json(force=True) or {}
        current_track = data.get('currentTrack', {})
        next_track = data.get('nextTrack', {})
        dj_settings = data.get('djSettings', {})

        result = transition_engine.calculate_transition(
            current_track=current_track,
            next_track=next_track,
            dj_settings=dj_settings
        )
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/dj/personalities', methods=['GET'])
def list_personalities():
    return jsonify({'success': True, 'data': list(DJ_PERSONALITIES.values())})

@app.route('/api/dj/next-track', methods=['POST'])
def select_next_track():
    """
    Intelligent AI DJ Next-Track Decision:
    Combines Personality + Conflict Resolution + Harmonic Transition Compatibility.
    """
    try:
        data = request.get_json(force=True) or {}
        current_track = data.get('currentTrack', {})
        queue = data.get('queue', [])
        catalog = data.get('catalog', [])
        participants = data.get('participants', [])
        recent_genres = data.get('recentGenres', [])
        room_mood = data.get('roomMood', {})
        personality_id = data.get('personalityId', 'party')

        personality = get_personality(personality_id)
        
        # If queue has tracks, evaluate transition to top of queue
        if queue:
            next_candidate = queue[0]
            transition = transition_engine.calculate_transition(current_track, next_candidate)
            return jsonify({
                'success': True,
                'source': 'queue',
                'selected_track': next_candidate,
                'transition': transition,
                'explanation': f"Next in queue. AI DJ prepared a {transition['transition_type']} with {transition['crossfade_duration']}s crossfade."
            })

        # If queue is empty, use Conflict Resolver + Personality to pick from catalog
        candidates = [t for t in catalog if t.get('id') != current_track.get('id')]
        balanced = conflict_resolver.resolve_conflicts(
            participants=participants,
            candidate_tracks=candidates,
            recent_played_genres=recent_genres,
            current_mood=room_mood
        )

        top_track_item = balanced.get('top_recommendation')
        if top_track_item:
            selected_track = top_track_item['track']
            transition = transition_engine.calculate_transition(current_track, selected_track)
            explanation = f"[{personality['name']}] {top_track_item['explanation']} Harmonic blend: {transition['transition_type']}."
            return jsonify({
                'success': True,
                'source': 'ai_dj_generated',
                'selected_track': selected_track,
                'transition': transition,
                'explanation': explanation,
                'personality': personality
            })
        else:
            return jsonify({'success': False, 'error': 'No candidate tracks available in catalog.'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/recommendations/hybrid', methods=['POST'])
def get_hybrid_recommendations():
    try:
        data = request.get_json(force=True) or {}
        user = data.get('user', {})
        catalog = data.get('catalog', [])
        participants = data.get('participants', [])
        room_mood = data.get('roomMood', {})
        history = data.get('listeningHistory', [])
        personality_id = data.get('personalityId', 'party')
        
        personality = get_personality(personality_id)
        result = recommender.get_recommendations(
            user=user,
            catalog=catalog,
            room_participants=participants,
            room_mood=room_mood,
            listening_history=history,
            dj_personality=personality
        )
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/soundclash/predict', methods=['POST'])
def predict_soundclash():
    try:
        data = request.get_json(force=True) or {}
        song_a = data.get('songA', {})
        song_b = data.get('songB', {})
        participants = data.get('participants', [])
        room_mood = data.get('roomMood', {})
        past_battles = data.get('pastBattles', [])

        result = clash_predictor.predict_battle(
            song_a=song_a,
            song_b=song_b,
            participants=participants,
            room_mood=room_mood,
            past_battles=past_battles
        )
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"AI Engine Microservice starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
