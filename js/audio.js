// =========================================================
// AUDIO — SFX sintetizados con Web Audio API (sin archivos).
// Para usar sonidos reales: reemplazar los cuerpos de las
// funciones por `new Audio(theme.sounds.xxx).play()`.
// =========================================================

let ctx = null;
let enabled = true;

// El AudioContext debe crearse tras un gesto del usuario
export function unlock() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}

function beep(freq, dur, type = 'square', vol = 0.06, delay = 0) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + dur);
}

export const audio = {
  // Clic mecánico al frenar cada carrete (doble golpe metálico)
  reelStop() {
    beep(1600, 0.03, 'square', 0.09);
    beep(280, 0.06, 'triangle', 0.10, 0.015);
  },
  spinStart() { beep(120, 0.25, 'sawtooth', 0.05); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'triangle', 0.08, i * 0.09));
  },
  bigWin() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.22, 'sawtooth', 0.07, i * 0.11));
  },
  bonus() {
    beep(220, 0.6, 'sine', 0.10);
    beep(440, 0.6, 'sine', 0.08, 0.25);
    beep(880, 0.8, 'sine', 0.07, 0.5);
  },
  toggle() { enabled = !enabled; return enabled; },
  get enabled() { return enabled; },
};