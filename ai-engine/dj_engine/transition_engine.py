"""
Intelligent AI DJ Track Transition & Harmonic Mixing Engine
Calculates BPM compatibility, Camelot harmonic key matching, energy delta,
and outputs real Web Audio transition instructions (crossfade duration, EQ ramp).
"""

import math
from typing import Dict, Any, Optional

# Camelot Wheel Mapping (Pitch Class + Mode -> Camelot Code)
CAMELOT_MAP = {
    'Abm': '1A', 'B': '1B', 'Ebm': '2A', 'F#': '2B',
    'Bbm': '3A', 'Db': '3B', 'Fm': '4A', 'Ab': '4B',
    'Cm': '5A', 'Eb': '5B', 'Gm': '6A', 'Bb': '6B',
    'Dm': '7A', 'F': '7B', 'Am': '8A', 'C': '8B',
    'Em': '9A', 'G': '9B', 'Bm': '10A', 'D': '10B',
    'F#m': '11A', 'A': '11B', 'C#m': '12A', 'E': '12B',
    # Common alternate spellings
    'G#m': '1A', 'D#m': '2A', 'Gb': '2B', 'A#m': '3A',
    'C#': '3B', 'D#': '5B', 'A#': '6B'
}

def parse_camelot(key_str: str) -> tuple:
    """Returns (number: int, letter: str) e.g., (8, 'A')"""
    if not key_str:
        return (8, 'B')
    key_str = key_str.strip()
    # If already Camelot code like "8A" or "8B"
    if len(key_str) in (2, 3) and key_str[-1].upper() in ('A', 'B'):
        try:
            return (int(key_str[:-1]), key_str[-1].upper())
        except ValueError:
            pass
    code = CAMELOT_MAP.get(key_str, '8B')
    return (int(code[:-1]), code[-1].upper())

def camelot_distance(key1: str, key2: str) -> float:
    """Calculates harmonic distance on Camelot wheel (0 = identical, 1 = adjacent/relative, etc.)"""
    num1, mode1 = parse_camelot(key1)
    num2, mode2 = parse_camelot(key2)
    
    # Distance around circular 12-hour clock
    clock_diff = abs(num1 - num2)
    if clock_diff > 6:
        clock_diff = 12 - clock_diff
        
    mode_diff = 0 if mode1 == mode2 else 1
    
    # 0 = exact match (e.g. 8A to 8A)
    # 1 = same number relative key (8A to 8B) OR adjacent number same mode (8A to 7A or 9A)
    if clock_diff == 0 and mode_diff == 0:
        return 0.0
    elif (clock_diff == 0 and mode_diff == 1) or (clock_diff == 1 and mode_diff == 0):
        return 1.0
    elif clock_diff == 1 and mode_diff == 1:
        return 1.8
    elif clock_diff == 2 and mode_diff == 0:
        return 2.0
    else:
        return 2.5 + clock_diff * 0.5


class TrackTransitionEngine:
    def __init__(self):
        pass

    def calculate_transition(
        self,
        current_track: Dict[str, Any],
        next_track: Dict[str, Any],
        dj_settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes current track and next track to determine transition compatibility,
        optimal crossfade duration (for Web Audio API Gain nodes), and DJ mixing technique.
        """
        bpm1 = float(current_track.get('bpm', 120))
        bpm2 = float(next_track.get('bpm', 120))
        
        energy1 = float(current_track.get('energy', 0.5))
        energy2 = float(next_track.get('energy', 0.5))
        
        key1 = str(current_track.get('key', 'Am'))
        key2 = str(next_track.get('key', 'C'))
        
        # 1. BPM Compatibility
        # Check direct tempo delta and half/double time harmonic relations
        direct_ratio = bpm2 / max(1.0, bpm1)
        half_ratio = (bpm2 * 2.0) / max(1.0, bpm1)
        double_ratio = (bpm2 / 2.0) / max(1.0, bpm1)

        best_ratio = direct_ratio
        tempo_mode = 'direct'
        if abs(half_ratio - 1.0) < abs(direct_ratio - 1.0) and abs(half_ratio - 1.0) < 0.15:
            best_ratio = half_ratio
            tempo_mode = 'half_time'
        elif abs(double_ratio - 1.0) < abs(direct_ratio - 1.0) and abs(double_ratio - 1.0) < 0.15:
            best_ratio = double_ratio
            tempo_mode = 'double_time'

        bpm_diff_pct = abs(best_ratio - 1.0) * 100.0  # percentage difference
        
        # 2. Harmonic Key Distance
        key_dist = camelot_distance(key1, key2)
        code1 = f"{parse_camelot(key1)[0]}{parse_camelot(key1)[1]}"
        code2 = f"{parse_camelot(key2)[0]}{parse_camelot(key2)[1]}"

        # 3. Energy Delta
        energy_delta = energy2 - energy1  # positive = build up, negative = cool down

        # 4. Determine Transition Type & Crossfade Duration
        base_crossfade = 6.0  # seconds
        if dj_settings and 'transitionDuration' in dj_settings:
            base_crossfade = float(dj_settings['transitionDuration'])

        if bpm_diff_pct <= 4.0 and key_dist <= 1.0:
            transition_type = 'Seamless Harmonic Blend'
            crossfade_duration = max(4.0, min(14.0, base_crossfade * 1.3))
            eq_technique = 'Equal-power crossfade with gradual low-end bass swap at midpoint'
            compatibility_score = 96 - int(bpm_diff_pct * 2)
            tempo_nudge = round((bpm1 - bpm2) / bpm2 * 100, 1)
        elif bpm_diff_pct <= 8.0 and key_dist <= 2.0:
            transition_type = 'Rhythm-Synced Beatmatch'
            crossfade_duration = max(3.5, min(10.0, base_crossfade * 1.0))
            eq_technique = 'Mid-frequency crossover with high-pass sweep'
            compatibility_score = 85 - int(bpm_diff_pct * 2.5)
            tempo_nudge = round((bpm1 - bpm2) / bpm2 * 100, 1)
        elif tempo_mode in ('half_time', 'double_time'):
            transition_type = f'Harmonic Tempo Shift ({tempo_mode.replace("_", " ").title()})'
            crossfade_duration = max(3.0, min(8.0, base_crossfade * 0.8))
            eq_technique = 'Echo out on phrase boundary into heavy downbeat drop'
            compatibility_score = 80
            tempo_nudge = 0.0
        elif abs(energy_delta) > 0.45:
            transition_type = 'Dynamic Energy Drop' if energy_delta < 0 else 'High-Impact Drop'
            crossfade_duration = max(2.5, min(6.0, base_crossfade * 0.6))
            eq_technique = 'Sharp filter cut with 1-bar crash reverb wash'
            compatibility_score = 72
            tempo_nudge = 0.0
        else:
            transition_type = 'Direct Bar-Cut Transition'
            crossfade_duration = max(2.0, min(5.0, base_crossfade * 0.5))
            eq_technique = 'Quick volume ramp at bar marker'
            compatibility_score = 65
            tempo_nudge = 0.0

        # Energy trajectory description
        if energy_delta > 0.2:
            energy_description = f"Builds energy (+{int(energy_delta * 100)}%) towards dance floor peak"
        elif energy_delta < -0.2:
            energy_description = f"Cool-down relaxation ({int(energy_delta * 100)}%) for pacing"
        else:
            energy_description = f"Maintains stable energy groove ({int(energy2 * 100)}%)"

        return {
            'transition_type': transition_type,
            'crossfade_duration': round(crossfade_duration, 1),
            'compatibility_score': max(50, min(100, compatibility_score)),
            'bpm_analysis': {
                'track1_bpm': bpm1,
                'track2_bpm': bpm2,
                'diff_percentage': round(bpm_diff_pct, 1),
                'tempo_mode': tempo_mode,
                'recommended_nudge_pct': tempo_nudge
            },
            'harmonic_analysis': {
                'track1_key': key1,
                'track1_camelot': code1,
                'track2_key': key2,
                'track2_camelot': code2,
                'harmonic_distance': round(key_dist, 1),
                'is_harmonically_compatible': key_dist <= 1.0
            },
            'energy_trajectory': {
                'start_energy': energy1,
                'target_energy': energy2,
                'delta': round(energy_delta, 2),
                'description': energy_description
            },
            'dj_eq_technique': eq_technique
        }


transition_engine = TrackTransitionEngine()
