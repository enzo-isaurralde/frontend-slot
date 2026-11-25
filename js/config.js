// =========================================================
// CONFIG — constantes del MOTOR (no son temática).
// La temática vive en themes/<tema>/theme.json.
// =========================================================

export const CONFIG = {
  REELS: 5,
  ROWS: 3,

  // Saldo y apuestas
  START_BALANCE: 10000,
  MIN_BET: 100,
  BET_STEP: 100,
  MAX_BET: 1000,

  // Bonus
  SCATTERS_FOR_BONUS: 3,
  FREE_SPINS_AWARD: 10,

  // Animación de carretes
  REEL_EXTRA_ROWS: 14,      // filas "de relleno" que giran por carrete
  SPIN_BASE: 1.0,           // duración base por carrete (s)
  SPIN_STAGGER: 0.22,       // delay escalonado entre carretes (s)
  TURBO_FACTOR: 0.45,       // multiplicador de duración en turbo

  // Umbral de "premio grande" (múltiplos de la apuesta)
  BIG_WIN_TIMES: 10,
};

// 10 líneas de pago (índice de fila por carrete, 0 = arriba)
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