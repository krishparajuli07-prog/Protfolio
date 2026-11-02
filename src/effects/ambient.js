// TUNING: low-opacity, preallocated margin fragments; no animation on phones or Lite.
export const CONFIG = { count: 6, opacity: 0.05, duration: 22000 };
import { full, coarse, decorative } from './core.js';
export function ambient() {
  if (coarse.matches) return;
  const host = decorative('div', 'cyber-ambient');
  const labels = [
    '0x0041  7F 45 4C 46',
    '[ OK ] scope verified',
    '0x00A0  48 65 6C 6C',
    '[ OK ] session local',
    '0x0F20  01 00 FF 7E',
    '[ OK ] modules ready'
  ];
  labels.slice(0, CONFIG.count).forEach((text, i) => {
    const el = document.createElement('span');
    el.textContent = text;
    el.style.top = `${12 + i * 14}%`;
    el.style.animationDelay = `${-i * 3}s`;
    el.style.animationDuration = `${CONFIG.duration}ms`;
    if (i % 2) el.style.right = '3px';
    else el.style.left = '3px';
    host.append(el);
  });
  host.style.opacity = String(CONFIG.opacity);
  document.body.append(host);
  const sync = () => {
    host.hidden = !full() || document.hidden;
  };
  document.addEventListener('fxchange', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
