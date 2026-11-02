// TUNING: columns per px, glyph size, frame ceiling, local pointer boost, scroll boost.
export const CONFIG = {
  columnGap: 26,
  mobileGap: 42,
  glyphSize: 13,
  fps: 30,
  opacity: 0.085,
  pointerRadius: 160,
  speed: 45,
  scrollBoost: 0.025,
  maxColumns: 70,
  matrixDuration: 5000
};
import { active, full, coarse, frame, visible, decorative, palette, clamp } from './core.js';
export function rain() {
  const hero = document.querySelector('.hacker-hero');
  if (!hero) return;
  const canvas = decorative('canvas', 'cyber-rain');
  hero.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    canvas.remove();
    return;
  }
  let w = 0,
    h = 0,
    columns = [],
    color,
    cancel = () => {},
    shown = false,
    last = 0,
    burstUntil = 0,
    px = -1000,
    py = -1000,
    velocity = 0,
    lastY = scrollY;
  const glyphs = ['0', '1', 'A', 'F', '7', 'カ', 'キ', 'ツ', 'ミ', 'SQLi', 'XSS', 'LFI', 'CVSS'];
  const updateColor = () => {
    color = palette().primary;
  };
  updateColor();
  new MutationObserver(updateColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  function resize() {
    w = canvas.classList.contains('cyber-matrix-mode') ? innerWidth : hero.clientWidth;
    h = canvas.classList.contains('cyber-matrix-mode') ? innerHeight : hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, coarse.matches ? 1 : 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = coarse.matches || !full() ? CONFIG.mobileGap : CONFIG.columnGap;
    const count = Math.min(CONFIG.maxColumns, Math.ceil(w / gap));
    columns = Array.from({ length: count }, (_, i) => ({
      x: (i * w) / count,
      y: Math.random() * h,
      speed: CONFIG.speed * (0.65 + Math.random() * 0.7)
    }));
  }
  function tick(now, dt) {
    if (canvas.classList.contains('cyber-matrix-mode') && now >= burstUntil) {
      restore();
      sync();
      return;
    }
    if (!active() || (!shown && now >= burstUntil)) return;
    if (now - last < 1000 / CONFIG.fps) return;
    const elapsed = Math.min(now - last || dt, 80);
    last = now;
    velocity *= 0.9;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = `${CONFIG.glyphSize}px monospace`;
    columns.forEach((c, i) => {
      const near =
        full() && !coarse.matches
          ? clamp(1 - Math.hypot(c.x - px, c.y - py) / CONFIG.pointerRadius)
          : 0;
      c.y =
        (c.y +
          (c.speed * (1 + near * 2 + Math.min(velocity * CONFIG.scrollBoost, 2)) * elapsed) /
            1000) %
        (h + 180);
      for (let j = 0; j < (full() ? 9 : 5); j++) {
        ctx.globalAlpha =
          (1 - j / 10) * (CONFIG.opacity + near * 0.12 + (now < burstUntil ? 0.24 : 0));
        ctx.fillText(glyphs[(i + j + Math.floor(now / 140)) % glyphs.length], c.x, c.y - j * 18);
      }
    });
    ctx.globalAlpha = 1;
  }
  function restore() {
    canvas.classList.remove('cyber-matrix-mode');
    hero.prepend(canvas);
    resize();
  }
  function sync() {
    cancel();
    cancel = () => {};
    if (active() && (shown || performance.now() < burstUntil)) cancel = frame(tick);
    else {
      ctx.clearRect(0, 0, w, h);
      if (canvas.classList.contains('cyber-matrix-mode')) restore();
    }
  }
  hero.addEventListener(
    'pointermove',
    (e) => {
      const b = hero.getBoundingClientRect();
      px = e.clientX - b.left;
      py = e.clientY - b.top;
    },
    { passive: true }
  );
  hero.addEventListener('pointerleave', () => {
    px = py = -1000;
  });
  window.addEventListener(
    'scroll',
    () => {
      velocity = Math.min(120, Math.abs(scrollY - lastY));
      lastY = scrollY;
    },
    { passive: true }
  );
  new ResizeObserver(resize).observe(hero);
  window.addEventListener('resize', resize);
  resize();
  visible(hero, (on) => {
    shown = on;
    sync();
  });
  document.addEventListener('fxchange', () => {
    if (!active()) burstUntil = 0;
    resize();
    sync();
  });
  document.addEventListener('cybermatrix', () => {
    if (!active()) return;
    burstUntil = performance.now() + CONFIG.matrixDuration;
    document.body.append(canvas);
    canvas.classList.add('cyber-matrix-mode');
    resize();
    sync();
  });
}
