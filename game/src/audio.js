// audio.js — tiny WebAudio synth for Dapur Senja. No sound files, no Phaser import.
// The context is created on the first user gesture; every call is safe before that.
let ctx = null;
let muted = false;
let musicTimer = null;

export function initAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch (e) { /* audio unavailable: the game still plays */ }
}

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  if (muted) stopMusic();
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch (e) { /* ignore */ }
}

function noiseBurst(dur = 0.18, vol = 0.08) {
  if (!ctx || muted) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  } catch (e) { /* ignore */ }
}

export function playSfx(name) {
  if (!ctx) initAudio();
  if (!ctx || muted) return;
  if (name === 'pickup') tone(660, 0.09, 'triangle', 0.1);
  else if (name === 'chop') { noiseBurst(0.12, 0.12); tone(180, 0.08, 'square', 0.05); }
  else if (name === 'cook') { noiseBurst(0.3, 0.06); tone(220, 0.2, 'sine', 0.05); }
  else if (name === 'place') tone(440, 0.08, 'triangle', 0.1);
  else if (name === 'trash') tone(140, 0.15, 'sawtooth', 0.06);
  else if (name === 'error') { tone(160, 0.16, 'square', 0.08); tone(120, 0.2, 'square', 0.07, 0.1); }
  else if (name === 'serve') { tone(523, 0.12, 'triangle', 0.12); tone(659, 0.12, 'triangle', 0.12, 0.1); tone(784, 0.22, 'triangle', 0.12, 0.2); }
  else if (name === 'click') tone(880, 0.05, 'sine', 0.08);
  else if (name === 'tick') tone(980, 0.05, 'square', 0.04);
  else if (name === 'rush') { tone(392, 0.15, 'square', 0.08); tone(523, 0.15, 'square', 0.08, 0.15); }
}

// A tiny pentatonic loop, one soft pluck every 0.45s. Started on first gesture.
export function startMusic() {
  if (!ctx || muted || musicTimer) return;
  const notes = [262, 294, 330, 392, 440, 392, 330, 294];
  let i = 0;
  musicTimer = setInterval(() => {
    if (muted) return;
    tone(notes[i % notes.length], 0.4, 'sine', 0.035);
    i++;
  }, 450);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
