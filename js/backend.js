// =========================================================
// BACKEND REAL - Conexión con Spring Boot
// =========================================================

import { CONFIG } from './config.js';

const API_URL = 'http://localhost:8080/api';

// Mapeo de IDs del backend a IDs del tema
const SYMBOL_MAP = {
  'SYM_1': 'rata',
  'SYM_2': 'casco',
  'SYM_3': 'granada',
  'SYM_4': 'mira',
  'SYM_5': 'cuchillo',
  'SYM_6': 'botas',
  'SYM_7': 'chaleco',
  'SYM_8': 'radio',
  'WILD': 'wild',
  'SCATTER': 'scatter'
};

const state = {
  balance: CONFIG.START_BALANCE, // En centavos
  freeSpins: 0,
};

export async function requestSpin({ bet, force = '', free = false }) {
  // 'bet' ya viene en centavos desde el frontend
  const betCentavos = bet;

  try {
    const response = await fetch(`${API_URL}/spins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameCode: 'SLOT_MILITAR',
        betAmount: betCentavos,
        idempotencyKey: crypto.randomUUID()
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    // 1. Parseamos el grid (viene como string JSON en formato [columna][fila])
    const rawGrid = JSON.parse(data.gridJson);
    
    // 2. Transponemos: de [columna][fila] a [fila][columna]
    const grid = [];
    for (let fila = 0; fila < 3; fila++) {
      grid[fila] = [];
      for (let col = 0; col < 5; col++) {
        // Mapeamos el ID del backend al ID del tema
        const backendId = rawGrid[col][fila];
        grid[fila][col] = SYMBOL_MAP[backendId] || backendId;
      }
    }

    // 3. Devolvemos el objeto con el formato que espera el frontend
    return {
      grid: grid, // Ahora es [fila][columna] (3x5)
      wins: [], 
      scatters: 0,
      totalWin: data.winAmount, // En centavos
      balance: data.balanceAfter, // En centavos
      freeSpins: 0,
      bonusTriggered: false
    };

  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    throw error;
  }
}

export function getBalance() { return state.balance; }
export function getFreeSpins() { return state.freeSpins; }