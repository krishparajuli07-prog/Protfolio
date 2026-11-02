// TUNING: reveal duration in ms; sweep interval is --cyber-scan-duration in effects.css.
export const CONFIG = { revealDuration: 850 };
import { active, visible, tween, decorative } from './core.js';
export function portrait() {
  const box = document.querySelector('.identity-viewport');
  const img = box?.querySelector('img');
  if (!img) return;
  box.classList.add('cyber-portrait');
  const brackets = decorative('div', 'cyber-brackets');
  box.append(brackets);
  let played = false,
    stop = () => {};
  function reveal() {
    if (played || !img.complete) return;
    played = true;
    if (!active()) return;
    const ghost = decorative('canvas', 'cyber-pixel-photo');
    const ctx = ghost.getContext('2d');
    if (!ctx) return;
    ghost.width = 18;
    ghost.height = 18;
    const b = img.getBoundingClientRect(),
      parent = box.getBoundingClientRect();
    Object.assign(ghost.style, {
      left: `${b.left - parent.left}px`,
      top: `${b.top - parent.top}px`,
      width: `${b.width}px`,
      height: `${b.height}px`,
      borderRadius: getComputedStyle(img).borderRadius
    });
    try {
      ctx.drawImage(img, 0, 0, 18, 18);
    } catch {
      return;
    }
    box.append(ghost);
    stop = tween(
      CONFIG.revealDuration,
      (p) => {
        ghost.style.opacity = String(1 - p);
      },
      () => ghost.remove()
    );
  }
  visible(box, (on) => {
    box.classList.toggle('cyber-in-view', on);
    if (on) reveal();
  });
  img.addEventListener('load', reveal, { once: true });
  document.addEventListener('fxchange', () => {
    if (!active()) {
      stop();
      box.querySelector('.cyber-pixel-photo')?.remove();
    }
  });
}
