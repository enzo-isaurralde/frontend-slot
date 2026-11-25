// =========================================================
// EFFECTS — líneas ganadoras (SVG), pops de símbolos,
// chispas doradas, screen shake y "visión nocturna".
// Todo con GSAP; canvas solo para partículas.
// =========================================================

import { CONFIG, PAYLINES } from './config.js';

const svgNS = 'http://www.w3.org/2000/svg';

// ---- Líneas de pago: dibujo progresivo izq → der ----
export function drawPayline(lineIdx, reelEls, cellH, color = '#d4af37') {
  const svg = document.getElementById('lines-svg');
  const stage = document.getElementById('stage');
  const pad = 14; // padding del stage

  svg.setAttribute('viewBox', `0 0 ${stage.clientWidth - pad * 2} ${stage.clientHeight - pad * 2}`);

  const rows = PAYLINES[lineIdx];
  let d = '';
  reelEls.forEach((reel, i) => {
    const x = reel.offsetLeft + reel.offsetWidth / 2;
    const y = rows[i] * cellH + cellH / 2;
    d += (i === 0 ? 'M' : ' L') + ` ${x} ${y}`;
  });

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '5');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('opacity', '0.9');
  path.style.filter = 'drop-shadow(0 0 6px gold)';
  svg.appendChild(path);

  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;

  // Dibujo progresivo + brillo que queda pulsando
  return gsap.timeline()
    .to(path, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' })
    .to(path, { opacity: 0.45, duration: 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

export function clearPaylines() {
  document.getElementById('lines-svg').innerHTML = '';
}

// ---- Símbolos ganadores: pop + brillo pulsante ----
export function popCells(cells) {
  const imgs = cells.map(c => c.querySelector('img')).filter(Boolean);
  cells.forEach(c => c.classList.add('win-cell'));
  return gsap.timeline()
    .to(imgs, { scale: 1.25, duration: 0.18, ease: 'back.out(3)', stagger: 0.06 })
    .to(imgs, { scale: 1, duration: 0.3, ease: 'power2.out' })
    // brillo pulsante persistente (mientras se muestra el premio)
    .to(imgs, { filter: 'drop-shadow(0 0 16px #ffd700)', duration: 0.4, repeat: -1, yoyo: true }, '<');
}

export function clearWinCells() {
  document.querySelectorAll('.cell.win-cell').forEach(c => c.classList.remove('win-cell'));
  gsap.set('.cell img', { clearProps: 'all' });
}

// ---- Premio grande: explosión de chispas doradas + shake ----
export function bigWinFX() {
  sparksBurst();
  shakeStage();
}

function sparksBurst() {
  const cv = document.getElementById('fx-canvas');
  const stage = document.getElementById('stage');
  cv.width = stage.clientWidth - 28;
  cv.height = stage.clientHeight - 28;
  const ctx = cv.getContext('2d');
  const cx = cv.width / 2, cy = cv.height / 2;

  const parts = Array.from({ length: 110 }, () => {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 9;
    return { x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
             life: 1, size: 1.5 + Math.random() * 3 };
  });

  const step = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.018;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.life > 0.5 ? '#ffd75e' : '#d4af37';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  };
  step();
}

function shakeStage() {
  gsap.fromTo('#stage', { x: 0, y: 0 }, {
    keyframes: [{ x: -7, y: 4 }, { x: 7, y: -4 }, { x: -5, y: 2 }, { x: 4, y: -2 }, { x: 0, y: 0 }],
    duration: 0.5, ease: 'power2.out',
  });
}

// ---- Visión nocturna (giros gratis) ----
export function nightVision(on) {
  const scan = document.getElementById('scanlines');
  const tl = gsap.timeline();
  if (on) {
    document.body.classList.add('free');
    tl.to(scan, { opacity: 0.55, duration: 0.8 }, 0)
      .to('#stage', { filter: 'hue-rotate(95deg) saturate(1.7) brightness(1.05)', duration: 1 }, 0);
  } else {
    document.body.classList.remove('free');
    tl.to(scan, { opacity: 0, duration: 0.8 }, 0)
      .to('#stage', { filter: 'none', duration: 1 }, 0);
  }
  return tl;
}

// ---- Cartel de bonus ----
export function showBonusBanner(text) {
  const ov = document.getElementById('bonus-overlay');
  const txt = document.getElementById('bonus-text');
  txt.textContent = text;
  ov.classList.add('show');
  return gsap.timeline()
    .fromTo(txt, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' })
    .to(ov, { opacity: 0, duration: 0.5, delay: 1.2, onComplete: () => {
      ov.classList.remove('show'); gsap.set(ov, { opacity: 1 });
    }});
}

// ---- Contadores animados (saldo / premio) ----
export function setCounter(el, value) {
  const from = parseFloat(el.dataset.v || 0);
  const obj = { v: from };
  el.dataset.v = value;
  gsap.to(obj, {
    v: value, duration: 1.1, ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('es-AR'); },
  });
}