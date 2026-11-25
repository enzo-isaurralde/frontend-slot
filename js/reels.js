// =========================================================
// REELS — carretes verticales con strip infinito simulado.
// Giro: tween de translateY + motion blur en eje Y (filtro SVG).
// Frenado: escalonado con ease back.out (overshoot de pieza pesada).
// Wild stack: si las 3 filas del carrete son WILD, se ocultan las
// celdas y se reproduce UNA animación 1x3 encima (frames del tema).
// =========================================================

import { CONFIG } from './config.js';
import { getTheme, symbolUrl } from './theme.js';
import { audio } from './audio.js';

const REEL_FILTERS = ['#gy-0', '#gy-1', '#gy-2', '#gy-3', '#gy-4'];

export class ReelsEngine {
  constructor(container) {
    this.reels = [];
    this.container = container;
    this.cellH = 0;

    for (let i = 0; i < CONFIG.REELS; i++) {
      const reelEl = document.createElement('div');
      reelEl.className = 'reel';
      const strip = document.createElement('div');
      strip.className = 'reel-strip';
      reelEl.appendChild(strip);

      // Capa del WILD STACK (oculta hasta que aplica)
      const stack = document.createElement('div');
      stack.className = 'wild-stack';
      const stackImg = document.createElement('img');
      stackImg.alt = 'WILD STACK';
      stack.appendChild(stackImg);
      reelEl.appendChild(stack);

      container.appendChild(reelEl);
      this.reels.push({ el: reelEl, strip, stack, stackImg, cells: [], final: [] });
    }
  }

  // Medir altura de celda tras el layout (necesario para el tween)
  measure() {
    const first = this.reels[0].strip.querySelector('.cell');
    this.cellH = first ? first.offsetHeight : this.reels[0].el.clientHeight / CONFIG.ROWS;
  }

  // Construir strip: filas aleatorias + resultado final abajo
  build(grid) {
    const theme = getTheme();
    this.reels.forEach((reel, i) => {
      reel.el.classList.remove('is-stack');   // reset de stack anterior
      reel.final = grid[i];
      reel.strip.innerHTML = '';
      reel.cells = [];

      const ids = [];
      for (let r = 0; r < CONFIG.REEL_EXTRA_ROWS; r++) {
        ids.push(this._randomId(theme));
      }
      ids.push(...grid[i]);

      for (const id of ids) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.symbol = id;
        const img = document.createElement('img');
        img.src = symbolUrl(id);
        img.alt = id;
        img.draggable = false;
        cell.appendChild(img);
        reel.strip.appendChild(cell);
        reel.cells.push(cell);
      }
      gsap.set(reel.strip, { y: 0 });
    });
    this.measure();
  }

  _randomId(theme) {
    const total = theme.symbols.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (const s of theme.symbols) { r -= s.weight; if (r <= 0) return s.id; }
    return theme.symbols.at(-1).id;
  }

  // Gira todos los carretes, escalonado. Devuelve una Promise.
  spinAll(turbo = false) {
    const factor = turbo ? CONFIG.TURBO_FACTOR : 1;
    const travel = CONFIG.REEL_EXTRA_ROWS * this.cellH;
    const last = this.reels.length - 1;

    return new Promise((resolve) => {
      this.reels.forEach((reel, i) => {
        const dur = (CONFIG.SPIN_BASE + i * CONFIG.SPIN_STAGGER) * factor;
        const delay = i * 0.12 * factor;
        const blurEl = document.querySelector(REEL_FILTERS[i]);

        // Encender blur vertical al arrancar
        gsap.to(blurEl, { attr: { stdDeviation: `0 ${turbo ? 6 : 12}` }, duration: 0.25, delay });

        // Tween principal: back.out da un pequeño overshoot al frenar (pieza pesada)
        gsap.to(reel.strip, {
          y: -travel,
          duration: dur,
          delay,
          ease: 'back.out(0.55)',
          onComplete: () => {
            // Apagar blur y clic mecánico
            gsap.to(blurEl, { attr: { stdDeviation: '0 0' }, duration: 0.15 });
            audio.reelStop();
            this._applyWildStack(reel);
            if (i === last) resolve();
          },
        });
      });
    });
  }

  // Si el carrete quedó WILD en las 3 filas → animación única 1x3
  _applyWildStack(reel) {
    if (!reel.final.every(id => id === 'wild')) return;
    const theme = getTheme();
    reel.el.classList.add('is-stack');
    reel.stackImg.src = theme.wildStack.frames[0];

    // Placeholder por frames. PARA TU ANIMACIÓN DE AFTER EFFECTS:
    // 1) Exportá la animación 1x3 como secuencia PNG con alfa
    //    (o WebM con alfa) desde AE (plugin: Bodymovin no aplica a
    //    secuencias; usá "Exportar > Render Queue > PNG sequence").
    // 2) Guardá los frames en themes/<tema>/wild-stack/.
    // 3) Listalos en theme.json → "wildStack.frames" y ajustá "fps".
    // Si usás sprite sheet, reemplazá este timeline por un tween de
    // backgroundPosition con steps().
    if (reel.stackTl) reel.stackTl.kill();
    const step = 1 / theme.wildStack.fps;
    reel.stackTl = gsap.timeline({ repeat: -1 });
    theme.wildStack.frames.forEach((src, idx) => {
      reel.stackTl.set(reel.stackImg, { attr: { src } }, idx * step);
    });
    reel.stackTl.set({}, {}, theme.wildStack.frames.length * step);
  }
}