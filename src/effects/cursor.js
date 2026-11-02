// TUNING: lerp speed, trail frequency and fixed pool size; no per-frame DOM allocation.
export const CONFIG = { lerp: 12, trailEvery: 75, trailLife: 480, pool: 8 };
import { full, coarse, frame, decorative } from './core.js';
export function cursor() {
  if (coarse.matches) return;
  const cross = decorative('div', 'cyber-cursor'),
    ring = decorative('div', 'cyber-ring');
  const trails = Array.from({ length: CONFIG.pool }, () => {
    const el = decorative('span', 'cyber-hex');
    document.body.append(el);
    return { el, born: -Infinity, x: 0, y: 0 };
  });
  document.body.append(cross, ring);
  let x = 0,
    y = 0,
    rx = 0,
    ry = 0,
    shown = false,
    link = false,
    lastTrail = 0,
    i = 0,
    cancel = () => {};
  function hide() {
    shown = false;
    cancel();
    cancel = () => {};
    document.documentElement.classList.remove('cyber-pointer');
    cross.hidden = ring.hidden = true;
    trails.forEach((t) => {
      t.el.style.opacity = '0';
    });
  }
  function tick(now, dt) {
    const ease = 1 - Math.exp((-CONFIG.lerp * dt) / 1000);
    rx += (x - rx) * ease;
    ry += (y - ry) * ease;
    cross.style.transform = `translate3d(${x}px,${y}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${link ? 1.5 : 1})`;
    if (now - lastTrail > CONFIG.trailEvery && Math.hypot(x - rx, y - ry) > 3) {
      lastTrail = now;
      const t = trails[i++ % trails.length];
      t.born = now;
      t.x = x;
      t.y = y;
      t.el.textContent = Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0');
    }
    trails.forEach((t) => {
      const age = (now - t.born) / CONFIG.trailLife;
      t.el.style.opacity = String(Math.max(0, (1 - age) * 0.45));
      if (age < 1) t.el.style.transform = `translate3d(${t.x}px,${t.y + age * 14}px,0)`;
    });
  }
  document.addEventListener(
    'pointermove',
    (e) => {
      if (
        !full() ||
        coarse.matches ||
        e.pointerType !== 'mouse' ||
        e.target.closest('input,textarea,select,[contenteditable],.cyber-boot')
      ) {
        hide();
        return;
      }
      x = e.clientX;
      y = e.clientY;
      link = !!e.target.closest('a,button');
      cross.classList.toggle('cyber-cursor-link', link);
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        cross.hidden = ring.hidden = false;
        document.documentElement.classList.add('cyber-pointer');
        cancel = frame(tick);
      }
    },
    { passive: true }
  );
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') hide();
  });
  document.addEventListener('fxchange', hide);
  coarse.addEventListener('change', hide);
  hide();
}
