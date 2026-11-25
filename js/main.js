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

  // Grilla inicial estática (la del primer giro ya viene del backend)
  const first = await requestSpin({ bet: ui.getBet() });
  await requestSpin({ bet: 0 });          // no-op para no tocar saldo real
  reels.build(first.grid);
}

// Celda cuadrada y responsiva según el ancho disponible
function sizeCells() {
  const wrap = document.getElementById('stage');
  const gap = 8 * (CONFIG.REELS - 1) + 28 + 8; // gaps + paddings + bordes
  const cell = Math.max(56, Math.min(110, Math.floor((wrap.clientWidth - gap) / CONFIG.REELS)));
  document.documentElement.style.setProperty('--cell', cell + 'px');
  reels.measure();
}

// ---- Loop principal de un giro ----
async function doSpin() {
  if (spinning) return;
  spinning = true;
  ui.setSpinning(true);
  cleanupFx();
  audio.spinStart();

  const free = getFreeSpins() > 0;
  const res = await requestSpin({ bet: ui.getBet(), force: pendingForce, free });
  pendingForce = '';

  // Animación de carretes
  reels.build(res.grid);
  await reels.spinAll(ui.isTurbo());

  // Resultado
  ui.setBalance(res.balance);
  if (res.totalWin > 0) {
    ui.setWin(res.totalWin);
    showWins(res);
    if (res.totalWin >= ui.getBet() * CONFIG.BIG_WIN_TIMES) {
      audio.bigWin(); fx.bigWinFX();
    } else {
      audio.win();
    }
    await gsap.delayedCall(1.6);          // deja respirar la celebración
  } else {
    ui.setWin(0);
  }

  // Bonus / giros gratis
  ui.setFreeSpins(res.freeSpins);
  if (res.bonusTriggered) {
    audio.bonus();
    await fx.showBonusBanner(getTheme().texts.bonusTitle);
    fx.nightVision(true);
    spinning = false; ui.setSpinning(false);
    await runFreeSpins();                  // entra en el loop de FS
    return;
  }

  if (free && res.freeSpins === 0) fx.nightVision(false);

  spinning = false;
  ui.setSpinning(false);
}

// ---- Secuencia de giros gratis con retrigger ----
async function runFreeSpins() {
  while (getFreeSpins() > 0) {
    await doSpin();                        // doSpin ya maneja retrigger
  }
}

// ---- Resaltar líneas y símbolos ganadores ----
function showWins(res) {
  const cellH = reels.cellH;
  const reelEls = [...document.querySelectorAll('.reel')];

  res.wins.forEach((w, i) => {
    const cells = w.positions.map(([r, row]) => reels.reels[r].cells[
      CONFIG.REEL_EXTRA_ROWS + row          // offset: filas extra arriba
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