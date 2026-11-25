// =========================================================
// THEME — carga un theme.json y aplica colores/fuentes al DOM.
// Para crear un tema "argentino" (u otro): duplicar la carpeta
// themes/militar con otro nombre y cambiar SOLO el JSON y arte.
// =========================================================

let current = null;

export async function loadTheme(path = 'themes/militar/theme.json') {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar el tema: ${path}`);
  current = await res.json();
  applyCssVars(current.cssVars);
  document.getElementById('game-title').textContent = current.title;
  return current;
}

function applyCssVars(vars) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

export function getTheme() {
  if (!current) throw new Error('Tema no cargado. Llamá a loadTheme() primero.');
  return current;
}

// Helper: URL de imagen de un símbolo
export function symbolUrl(id) {
  return getTheme().symbolImg.replace('{id}', id);
}