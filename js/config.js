// =========================================================
// CONFIG — Constantes del MOTOR
// =========================================================

export const CONFIG = {
  REELS: 5,
  ROWS: 3,

  // Saldo y apuestas (TODO EN CENTAVOS)
  START_BALANCE: 1000000,  // $10.000.00 en centavos
  MIN_BET: 10000,          // $100.00
  BET_STEP: 10000,         // $100.00
  MAX_BET: 100000,         // $1.000.00

  // Bonus
  SCATTERS_FOR_BONUS: 3,
  FREE_SPINS_AWARD: 10,

  // Animación de carretes
  REEL_EXTRA_ROWS: 14,
  SPIN_BASE: 1.0,
  SPIN_STAGGER: 0.22,
  TURBO_FACTOR: 0.45,

  // Umbral de "premio grande" (múltiplos de la apuesta)
  BIG_WIN_TIMES: 10,
};

export const PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 0, 1],
];