// =========================================================
// UI — consola, modales, contadores y botones.
// =========================================================

import { CONFIG } from './config.js';
import { getTheme, symbolUrl } from './theme.js';
import { setCounter } from './effects.js';
import { audio } from './audio.js';

// Función auxiliar para formatear centavos a pesos
function formatMoney(centavos) {
  return (centavos / 100).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  });
}

export function initUI(callbacks) {
  const betEl = document.getElementById('bet-val');
  let bet = CONFIG.MIN_BET; // En centavos
  let turbo = false;

  // ----- Apuesta -----
  const renderBet = () => {
  // Mostramos el valor en pesos (dividido por 100)
  betEl.textContent = (bet / 100).toLocaleString('es-AR');
  // Pero enviamos el valor en centavos al callback
  callbacks.onBetChange(bet);
};
  document.getElementById('btn-bet-minus').addEventListener('click', () => {
    bet = Math.max(CONFIG.MIN_BET, bet - CONFIG.BET_STEP); renderBet();
  });
  document.getElementById('btn-bet-plus').addEventListener('click', () => {
    bet = Math.min(CONFIG.MAX_BET, bet + CONFIG.BET_STEP); renderBet();
  });
  renderBet();

  // ----- Giro / turbo -----
  document.getElementById('btn-spin').addEventListener('click', () => {
    callbacks.onSpin();
  });
  const turboBtn = document.getElementById('btn-turbo');
  turboBtn.addEventListener('click', () => {
    turbo = !turbo;
    turboBtn.classList.toggle('active', turbo);
  });

  // ----- Sonido -----
  const sndBtn = document.getElementById('btn-sound');
  sndBtn.addEventListener('click', () => {
    sndBtn.textContent = audio.toggle() ? 'SND ON' : 'SND OFF';
  });

  // ----- Modales -----
  bindModal('btn-paytable', 'modal-paytable');
  bindModal('btn-demo', 'modal-demo');
  document.querySelectorAll('.modal-close').forEach(b =>
    b.addEventListener('click', () => document.getElementById(b.dataset.close).classList.add('hidden')));

  // ----- Panel demo: fuerza el próximo resultado -----
  document.querySelectorAll('.demo-force').forEach(b =>
    b.addEventListener('click', () => {
      callbacks.onForce(b.dataset.force);
      document.getElementById('modal-demo').classList.add('hidden');
      callbacks.onSpin();
    }));

  // ----- Tabla de pagos (generada desde el theme) -----
  buildPaytable();

  return {
    getBet: () => bet,
    isTurbo: () => turbo,
    setSpinning(spinning) {
      document.getElementById('btn-spin').disabled = spinning;
      document.getElementById('btn-bet-minus').disabled = spinning;
      document.getElementById('btn-bet-plus').disabled = spinning;
    },
    // Formateamos los contadores para mostrar pesos
    setBalance: (v) => setCounter(document.getElementById('balance-val'), v / 100),
    setWin: (v) => setCounter(document.getElementById('win-val'), v / 100),
    setFreeSpins(n) {
      document.getElementById('fs-badge').classList.toggle('hidden', n <= 0);
      document.getElementById('fs-count').textContent = n;
    },
  };
}

function bindModal(btnId, modalId) {
  document.getElementById(btnId).addEventListener('click', () =>
    document.getElementById(modalId).classList.remove('hidden'));
}

function buildPaytable() {
  const theme = getTheme();
  const body = document.getElementById('paytable-body');
  body.innerHTML = '';
  theme.symbols.forEach(s => {
    const row = document.createElement('div');
    row.className = 'pay-row';
    const pays = s.pay
      ? `3=${s.pay[3]} · 4=${s.pay[4]} · 5=${s.pay[5]}`
      : (s.isWild ? 'SUSTITUYE A TODOS' : '3+ = 10 GIROS GRATIS');
    row.innerHTML = `<img src="${symbolUrl(s.id)}" alt="${s.name}" />
                     <span>${s.name}</span><span class="pays">${pays}</span>`;
    body.appendChild(row);
  });
}