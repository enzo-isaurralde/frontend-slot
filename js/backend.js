// =========================================================
// BACKEND SIMULADO
// Reemplazo por API real (Spring Boot): borrar el cuerpo de
// requestSpin y hacer fetch, manteniendo la misma firma y shape:
//
//   const res = await fetch('/api/spin', { method:'POST',
//     headers:{'Content-Type':'application/json'},
//     body: JSON.stringify({ bet, force, free }) });
//   return res.json(); // { grid, wins, scatters, totalWin, balance, freeSpins, bonusTriggered }
// =========================================================

import { CONFIG, PAYLINES } from './config.js';
import { getTheme } from './theme.js';

// ---- Estado interno (en el backend real vive en el servidor) ----
const state = {
  balance: CONFIG.START_BALANCE,
  freeSpins: 0,
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- RNG ponderado ----
function randomSymbol() {
  const syms = getTheme().symbols;
  const total = syms.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * total;
  for (const s of syms) { r -= s.weight; if (r <= 0) return s.id; }
  return syms[syms.length - 1].id;
}

// ---- Generación de grilla ----
function randomGrid() {
  return Array.from({ length: CONFIG.REELS }, () =>
    Array.from({ length: CONFIG.ROWS }, randomSymbol));
}

function gridWithScatter(count) {
  const g = randomGrid();
  const cols = [...Array(CONFIG.REELS).keys()].sort(() => Math.random() - .5).slice(0, count);
  cols.forEach(c => { g[c][Math.floor(Math.random() * CONFIG.ROWS)] = 'scatter'; });
  return g;
}

function forcedGrid(force) {
  switch (force) {
    case 'bigwin': { // 3 carretes de Wilds apilados + RATA en los dos últimos
      const g = Array.from({ length: 5 }, () => ['wild', 'wild', 'wild']);
      g[3] = ['rata', 'rata', 'rata'];
      g[4] = ['rata', 'rata', 'rata'];
      return g;
    }
    case 'bonus':
      return gridWithScatter(CONFIG.SCATTERS_FOR_BONUS);
    case 'noprize': {
      // Intentar hasta 20 veces una grilla sin premios
      for (let i = 0; i < 20; i++) {
        const g = randomGrid();
        if (evaluate(g, 100).wins.length === 0) return g;
      }
      const g = randomGrid();
      for (let c = 0; c < 5; c++) g[c] = ['radio', 'chaleco', 'radio'];
      g[2] = ['scatter', 'radio', 'chaleco'];
      return g;
    }
    default:
      return randomGrid();
  }
}

// ---- Evaluación de líneas (de izquierda a derecha, wild sustituye) ----
function evaluate(grid, bet) {
  const byId = Object.fromEntries(getTheme().symbols.map(s => [s.id, s]));
  const betPerLine = bet / PAYLINES.length;
  const wins = [];

  PAYLINES.forEach((rows, lineIdx) => {
    const first = grid[0][rows[0]];
    if (!first || byId[first].isScatter) return;

    // Símbolo objetivo: si empieza con wild, se paga como wild
    const target = first;
    let count = 0;
    const positions = [];

    for (let reel = 0; reel < CONFIG.REELS; reel++) {
      const sym = grid[reel][rows[reel]];
      if (sym === target || byId[sym].isWild) {
        count++; positions.push([reel, rows[reel]]);
      } else break;
    }

    if (count >= 3) {
      const amount = (byId[target].pay[count] || 0) * betPerLine;
      if (amount > 0) wins.push({ line: lineIdx, symbol: target, count, positions, amount });
    }
  });

  const totalWin = wins.reduce((a, w) => a + w.amount, 0);
  return { wins, totalWin };
}

function countScatters(grid) {
  let n = 0;
  for (const col of grid) for (const s of col) if (s === 'scatter') n++;
  return n;
}

// ---- API pública ----
export async function requestSpin({ bet, force = '', free = false }) {
  await sleep(120 + Math.random() * 180); // latencia simulada de red

  const grid = forcedGrid(force);
  const { wins, totalWin } = evaluate(grid, bet);
  const scatters = countScatters(grid);

  // Saldo: se descuenta la apuesta salvo en giros gratis; se suma lo ganado
  if (!free) state.balance -= bet;
  state.balance += totalWin;

  // Bonus y retrigger
  const bonusTriggered = scatters >= CONFIG.SCATTERS_FOR_BONUS;
  if (bonusTriggered) state.freeSpins += CONFIG.FREE_SPINS_AWARD;
  if (free && state.freeSpins > 0) state.freeSpins--;

  return {
    grid,            // grid[5][3] de ids de símbolo
    wins,            // [{line, symbol, count, positions, amount}]
    scatters,
    totalWin,
    balance: state.balance,
    freeSpins: state.freeSpins,
    bonusTriggered,
  };
}

export function getBalance() { return state.balance; }
export function getFreeSpins() { return state.freeSpins; }