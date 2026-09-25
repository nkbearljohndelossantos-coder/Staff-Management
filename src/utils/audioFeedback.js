// Web Audio API Synthesizer for POS Barcode Scanners, Cashier Terminals, and Attendance Kiosks
// 100% offline, zero network requests, zero external audio assets required.

let sharedAudioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Mute & Volume preferences persisted in localStorage
export const isAudioMuted = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nkb_pos_sound_muted') === 'true';
};

export const setAudioMuted = (muted) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nkb_pos_sound_muted', muted ? 'true' : 'false');
  // Dispatch custom event so all active components sync their mute state immediately
  window.dispatchEvent(new CustomEvent('nkb_pos_audio_state_change', { detail: { muted } }));
};

export const toggleAudioMute = () => {
  const current = isAudioMuted();
  setAudioMuted(!current);
  return !current;
};

export const getAudioVolume = () => {
  if (typeof window === 'undefined') return 0.2;
  const val = parseFloat(localStorage.getItem('nkb_pos_sound_volume') || '0.2');
  return isNaN(val) ? 0.2 : Math.max(0.01, Math.min(1.0, val));
};

export const setAudioVolume = (vol) => {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0.01, Math.min(1.0, vol));
  localStorage.setItem('nkb_pos_sound_volume', clamped.toString());
};

/**
 * Play a crisp supermarket laser barcode scanner beep (1760 Hz / 50ms)
 */
export const playScanBeep = () => {
  if (isAudioMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = getAudioVolume();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High A6 note
    
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // Audio suppressed or unsupported
  }
};

/**
 * Play a pleasant cash register checkout completion chime (C5 -> E5 -> G5 -> C6 arpeggio)
 */
export const playSuccessChime = () => {
  if (isAudioMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.10 }, // C5
      { freq: 659.25, time: 0.07, dur: 0.10 }, // E5
      { freq: 783.99, time: 0.14, dur: 0.12 }, // G5
      { freq: 1046.50, time: 0.21, dur: 0.28 } // C6
    ];

    const masterVol = getAudioVolume();

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(masterVol * 1.1, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch {
    // Audio suppressed
  }
};

/**
 * Play a low dual-tone alert buzz for unrecognized barcodes or validation errors
 */
export const playErrorBuzz = () => {
  if (isAudioMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = getAudioVolume();

    // Two rapid low pulses
    [0, 0.10].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime + delay);

      gain.gain.setValueAtTime(masterVol * 1.2, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.08);
    });
  } catch {
    // Audio suppressed
  }
};

/**
 * Play a distinct descending tone for item void or cart cancellation
 */
export const playVoidTone = () => {
  if (isAudioMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = getAudioVolume();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio suppressed
  }
};

/**
 * Play a two-tone punch confirmation chime for employee timeclock kiosks
 */
export const playPunchChime = () => {
  if (isAudioMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = getAudioVolume();

    [
      { freq: 880, delay: 0.00, dur: 0.07 }, // A5
      { freq: 1320, delay: 0.07, dur: 0.12 } // E6
    ].forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(masterVol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  } catch {
    // Audio suppressed
  }
};
