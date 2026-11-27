// =========================================================
// MAIN — orquestador: carga tema, arma la UI y corre el loop.
// =========================================================

import { CONFIG } from './config.js';
import { loadTheme, getTheme } from './theme.js';
import { requestSpin, getFreeSpins } from './backend.js';
import { ReelsEngine } from './reels.js';
import * as fx from './effects.js';
import { audio } from './audio.js';
import { initUI } from './ui.js';

let ui, reels;
let spinning = false;
let pendingForce = '';      // fuerza del panel demo
let popTl = null, lineTls = [];

async function boot() {
  await loadTheme();                    // tema por defecto: militar
  reels = new ReelsEngine(document.getElementById('reels'));
  
  ui = initUI({
    onSpin: () => doSpin(),
    onBetChange: () => {},
    onForce: (f) => { pendingForce = f; },
  });
  
  ui.setBalance(CONFIG.START_BALANCE);
  ui.setWin(0);
  sizeCells();
  window.addEventListener('resize', sizeCells);

  // Grilla inicial estática (sin tocar el saldo del backend)
  const initialGrid = [
    ['rata', 'casco', 'granada', 'mira', 'cuchillo'],
    ['botas', 'chaleco', 'radio', 'wild', 'scatter'],
    ['rata', 'casco', 'granada', 'mira', 'cuchillo']
  ];
  reels.build(initialGrid);
}

// Celdas más altas que anchas; el tamaño sale del espacio real disponible
const CELL_RATIO = 1.5;            // alto = ancho × 1.2 (si querés, pasalo a config.js)

function sizeCells() {
  const stage = document.getElementById('stage');
  const cs = getComputedStyle(stage);
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 4;

  // Espacio interno real (sin números mágicos)
  const w = stage.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = stage.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom);

  const cellW = Math.floor((w - gap * (CONFIG.REELS - 1)) / CONFIG.REELS);
  const cellH = Math.min(Math.floor(cellW * CELL_RATIO), Math.floor(h / CONFIG.ROWS));

  const root = document.documentElement.style;
  root.setProperty('--cell-w', cellW + 'px');
  root.setProperty('--cell',   cellH + 'px');   // se mantiene como ALTO para no romper reels.js
  reels.measure();
}
// ---- Loop principal de un giro ----
async function doSpin() {
  if (spinning) return;
  spinning = true;
  ui.setSpinning(true);
  cleanupFx();
  // audio.spinStart();

  const free = getFreeSpins() > 0;
  
  try {
    // Pedimos el giro al backend real
    const res = await requestSpin({ 
      bet: ui.getBet(), 
      force: pendingForce, 
      free 
    });
    pendingForce = '';

    // Animación de carretes
    reels.build(res.grid);
    await reels.spinAll(ui.isTurbo());

    // Actualizamos la UI con los resultados
    ui.setBalance(res.balance);
    
    if (res.totalWin > 0) {
      ui.setWin(res.totalWin);
      showWins(res);
      if (res.totalWin >= ui.getBet() * CONFIG.BIG_WIN_TIMES) {
        audio.bigWin(); 
        fx.bigWinFX();
      } else {
        audio.win();
      }
      await gsap.delayedCall(1.6); // Deja respirar la celebración
    } else {
      ui.setWin(0);
    }

    // Bonus / giros gratis
    ui.setFreeSpins(res.freeSpins);
    if (res.bonusTriggered) {
      audio.bonus();
      await fx.showBonusBanner(getTheme().texts.bonusTitle);
      fx.nightVision(true);
      spinning = false; 
      ui.setSpinning(false);
      await runFreeSpins(); // Entra en el loop de FS
      return;
    }

    if (free && res.freeSpins === 0) fx.nightVision(false);

  } catch (error) {
    console.error("Error en el giro:", error);
    ui.setWin(0);
  } finally {
    spinning = false;
    ui.setSpinning(false);
  }
}

// ---- Secuencia de giros gratis con retrigger ----
async function runFreeSpins() {
  while (getFreeSpins() > 0) {
    await doSpin(); // doSpin ya maneja retrigger
  }
}

// ---- Resaltar líneas y símbolos ganadores ----
function showWins(res) {
  const cellH = reels.cellH;
  const reelEls = [...document.querySelectorAll('.reel')];

  res.wins.forEach((w, i) => {
    const cells = w.positions.map(([r, row]) => reels.reels[r].cells[
      CONFIG.REEL_EXTRA_ROWS + row // offset: filas extra arriba
    ]);
    lineTls.push(fx.drawPayline(w.line, reelEls, cellH, i % 2 ? '#ffd75e' : '#d4af37'));
    popTl = fx.popCells(cells);
  });
}

function cleanupFx() {
  fx.clearPaylines();
  fx.clearWinCells();
  lineTls.forEach(tl => tl && tl.kill());
  lineTls = [];
  if (popTl) { popTl.kill(); popTl = null; }
}

boot();