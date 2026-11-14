/**
 * Dual-deck audio controller with native media output and equal-power crossfades.
 */

class DJAudioEngine {
  constructor() {
    this.audioA = null;
    this.audioB = null;
    this.activeDeck = 'A'; // 'A' or 'B'
    this.masterVolume = 0.85;
    this.deckGainA = 1;
    this.deckGainB = 0;
    this.transitionTimer = null;
  }

  init(audioElA, audioElB) {
    if (this.audioA === audioElA && this.audioB === audioElB) {
      return;
    }

    this.audioA = audioElA;
    this.audioB = audioElB;
    this._applyVolumes();
    console.log('[DJAudioEngine] Native audio output initialized successfully.');
  }

  resumeContext() {
    return Promise.resolve();
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    this._applyVolumes();
  }

  setCrossfade(position) {
    // position: -1.0 (Full Deck A) to +1.0 (Full Deck B)
    const clampedPosition = Math.max(-1, Math.min(1, position));

    // Equal-power crossfade curve: cos/sin
    const norm = (clampedPosition + 1) / 2; // 0.0 to 1.0
    this.deckGainA = Math.cos(norm * 0.5 * Math.PI);
    this.deckGainB = Math.sin(norm * 0.5 * Math.PI);
    this._applyVolumes();
  }

  executeSmoothTransition(targetDeck, durationSeconds = 6.0) {
    const duration = Math.max(2.0, Math.min(15.0, durationSeconds));
    console.log(`[DJAudioEngine] Executing ${duration}s crossfade transition to Deck ${targetDeck}...`);

    if (this.transitionTimer) clearInterval(this.transitionTimer);

    const startGainA = this.deckGainA;
    const startGainB = this.deckGainB;
    const targetGainA = targetDeck === 'A' ? 1 : 0;
    const targetGainB = targetDeck === 'B' ? 1 : 0;
    const startTime = Date.now();

    this.transitionTimer = setInterval(() => {
      const progress = Math.min((Date.now() - startTime) / (duration * 1000), 1);
      this.deckGainA = startGainA + (targetGainA - startGainA) * progress;
      this.deckGainB = startGainB + (targetGainB - startGainB) * progress;
      this._applyVolumes();

      if (progress === 1) {
        clearInterval(this.transitionTimer);
        this.transitionTimer = null;
        this.activeDeck = targetDeck;
      }
    }, 50);
  }

  getFrequencyData() {
    return new Uint8Array(32);
  }

  _applyVolumes() {
    if (this.audioA) this.audioA.volume = this.masterVolume * this.deckGainA;
    if (this.audioB) this.audioB.volume = this.masterVolume * this.deckGainB;
  }
}

export const audioEngine = new DJAudioEngine();
