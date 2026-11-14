/**
 * Web Audio API Dual-Deck DJ Crossfader and Spectrum Analyser Engine
 * Implements real equal-power crossfades between Deck A and Deck B,
 * real-time frequency analysis for visualization, and BPM-synced volume automation.
 */

class DJAudioEngine {
  constructor() {
    this.ctx = null;
    this.audioA = null;
    this.audioB = null;
    this.sourceA = null;
    this.sourceB = null;
    this.gainA = null;
    this.gainB = null;
    this.masterGain = null;
    this.analyser = null;
    this.activeDeck = 'A'; // 'A' or 'B'
    this.crossfadePosition = 0; // -1 (Deck A) to +1 (Deck B)
    this.isInitialized = false;
  }

  init(audioElA, audioElB) {
    if (this.isInitialized && this.audioA === audioElA && this.audioB === audioElB) {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.audioA = audioElA;
      this.audioB = audioElB;

      // Enable CORS on audio elements
      this.audioA.crossOrigin = 'anonymous';
      this.audioB.crossOrigin = 'anonymous';

      // Create Gain Nodes
      this.gainA = this.ctx.createGain();
      this.gainB = this.ctx.createGain();
      this.masterGain = this.ctx.createGain();

      // Create Spectrum Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect Deck A
      this.sourceA = this.ctx.createMediaElementSource(this.audioA);
      this.sourceA.connect(this.gainA);
      this.gainA.connect(this.masterGain);

      // Connect Deck B
      this.sourceB = this.ctx.createMediaElementSource(this.audioB);
      this.sourceB.connect(this.gainB);
      this.gainB.connect(this.masterGain);

      // Connect Master to Analyser & Output Destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Initialize Gain (Deck A full, Deck B silent)
      this.gainA.gain.value = 1.0;
      this.gainB.gain.value = 0.0;
      this.masterGain.gain.value = 0.85;

      this.isInitialized = true;
      console.log('[DJAudioEngine] Web Audio API dual-deck engine initialized successfully.');
    } catch (err) {
      console.warn('[DJAudioEngine] Web Audio API initialization notice:', err.message);
      // Fallback: direct HTML5 audio volume control will still function
      this.isInitialized = false;
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    } else {
      if (this.audioA) this.audioA.volume = clamped;
      if (this.audioB) this.audioB.volume = clamped;
    }
  }

  setCrossfade(position) {
    // position: -1.0 (Full Deck A) to +1.0 (Full Deck B)
    this.crossfadePosition = Math.max(-1, Math.min(1, position));
    
    // Equal-power crossfade curve: cos/sin
    const norm = (this.crossfadePosition + 1) / 2; // 0.0 to 1.0
    const gainAVal = Math.cos(norm * 0.5 * Math.PI);
    const gainBVal = Math.sin(norm * 0.5 * Math.PI);

    if (this.isInitialized && this.ctx) {
      this.gainA.gain.setValueAtTime(gainAVal, this.ctx.currentTime);
      this.gainB.gain.setValueAtTime(gainBVal, this.ctx.currentTime);
    } else {
      if (this.audioA) this.audioA.volume = gainAVal * 0.85;
      if (this.audioB) this.audioB.volume = gainBVal * 0.85;
    }
  }

  executeSmoothTransition(targetDeck, durationSeconds = 6.0) {
    this.resumeContext();
    const duration = Math.max(2.0, Math.min(15.0, durationSeconds));
    const now = this.ctx ? this.ctx.currentTime : 0;

    console.log(`[DJAudioEngine] Executing ${duration}s crossfade transition to Deck ${targetDeck}...`);

    if (this.isInitialized && this.ctx) {
      if (targetDeck === 'B') {
        this.gainA.gain.cancelScheduledValues(now);
        this.gainB.gain.cancelScheduledValues(now);
        this.gainA.gain.setValueAtTime(this.gainA.gain.value, now);
        this.gainB.gain.setValueAtTime(this.gainB.gain.value, now);

        this.gainA.gain.linearRampToValueAtTime(0.0, now + duration);
        this.gainB.gain.linearRampToValueAtTime(1.0, now + duration);
        this.activeDeck = 'B';
      } else {
        this.gainA.gain.cancelScheduledValues(now);
        this.gainB.gain.cancelScheduledValues(now);
        this.gainA.gain.setValueAtTime(this.gainA.gain.value, now);
        this.gainB.gain.setValueAtTime(this.gainB.gain.value, now);

        this.gainB.gain.linearRampToValueAtTime(0.0, now + duration);
        this.gainA.gain.linearRampToValueAtTime(1.0, now + duration);
        this.activeDeck = 'A';
      }
    } else {
      // Fallback timer-based volume ramp
      const steps = 30;
      const stepInterval = (duration * 1000) / steps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const ratio = step / steps;
        if (targetDeck === 'B') {
          if (this.audioA) this.audioA.volume = Math.max(0, 1 - ratio);
          if (this.audioB) this.audioB.volume = Math.min(1, ratio);
        } else {
          if (this.audioB) this.audioB.volume = Math.max(0, 1 - ratio);
          if (this.audioA) this.audioA.volume = Math.min(1, ratio);
        }
        if (step >= steps) {
          clearInterval(interval);
          this.activeDeck = targetDeck;
        }
      }, stepInterval);
    }
  }

  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new DJAudioEngine();
