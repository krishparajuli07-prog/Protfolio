// TUNING: shared frame ceilings; use Lite by default on narrow/coarse-pointer devices.
export const CONFIG = { fullFPS: 60, liteFPS: 30, slowFrameMS: 24, slowFrameLimit: 45 };
export const root = document.documentElement;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');
export const coarse = matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)');
export const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
export const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Optional storage. */
  }
};
let preference = read(
  'cyber-effects',
  read('portfolio-fx', '') === 'off' ? 'off' : coarse.matches ? 'lite' : 'full'
);
if (!['full', 'lite', 'off'].includes(preference)) preference = 'lite';
export const mode = () => (reduced.matches ? 'off' : preference);
export const active = () => mode() !== 'off';
export const full = () => mode() === 'full';
export const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const tasks = new Set();
let raf = 0,
  last = 0,
  slow = 0,
  throttled = false;
export function frame(fn) {
  tasks.add(fn);
  wake();
  return () => tasks.delete(fn);
}
function wake() {
  if (!raf && tasks.size && !document.hidden) raf = requestAnimationFrame(tick);
}
function tick(now) {
  raf = 0;
  if (document.hidden) return;
  const gap = now - last;
  const fps = full() && !throttled ? CONFIG.fullFPS : CONFIG.liteFPS;
  if (gap < 1000 / fps - 1) {
    wake();
    return;
  }
  const dt = Math.min(gap, 64);
  last = now;
  if (full() && gap > CONFIG.slowFrameMS) slow++;
  else slow = Math.max(0, slow - 1);
  if (slow > CONFIG.slowFrameLimit) {
    throttled = true;
    root.dataset.cyberBudget = 'low';
  }
  for (const fn of tasks) {
    try {
      fn(now, dt);
    } catch (error) {
      tasks.delete(fn);
      console.warn('Decorative effect stopped:', error);
    }
  }
  wake();
}
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(raf);
  raf = 0;
  last = performance.now();
  wake();
});
export function tween(duration, update, done = () => {}) {
  const start = performance.now();
  const stop = frame((now) => {
    const p = active() ? clamp((now - start) / duration) : 1;
    update(p);
    if (p === 1) {
      stop();
      done();
    }
  });
  return stop;
}
export function visible(element, fn, once = false) {
  if (!element) return;
  if (!('IntersectionObserver' in window)) {
    fn(true);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const on = entries[0].isIntersecting;
      if (on || !once) fn(on);
      if (on && once) observer.disconnect();
    },
    { threshold: 0.12 }
  );
  observer.observe(element);
}
export function decorative(tag, cls) {
  const el = document.createElement(tag);
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  return el;
}
export function palette() {
  const s = getComputedStyle(root);
  return Object.fromEntries(
    ['bg', 'primary', 'text', 'muted', 'border'].map((k) => [
      k,
      s.getPropertyValue(`--${k}`).trim()
    ])
  );
}
function sync() {
  root.dataset.effects = mode();
  root.dataset.fx = active() ? 'on' : 'off';
  root.classList.toggle('fx-on', active());
  document.querySelectorAll('[data-effects-choice]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.effectsChoice === preference));
    b.disabled = reduced.matches;
  });
  const old = document.getElementById('fx-toggle');
  if (old) {
    old.textContent = `FX ${mode()}`;
    old.setAttribute('aria-label', `Effects ${mode()}; switch mode`);
    old.setAttribute('aria-pressed', String(active()));
  }
  document.dispatchEvent(new Event('fxchange'));
}
export function setMode(value) {
  preference = value;
  write('cyber-effects', value);
  write('portfolio-fx', value === 'off' ? 'off' : 'on');
  sync();
}
export function initControls() {
  const controls = document.getElementById('cyber-controls');
  controls
    ?.querySelectorAll('[data-effects-choice]')
    .forEach((b) => b.addEventListener('click', () => setMode(b.dataset.effectsChoice)));
  document
    .getElementById('fx-toggle')
    ?.addEventListener('click', () =>
      setMode(['full', 'lite', 'off'][(['full', 'lite', 'off'].indexOf(preference) + 1) % 3])
    );
  reduced.addEventListener('change', sync);
  window.portfolioFX = { active };
  sync();
}

export const basePath =
  document.querySelector('script[data-portfolio-effects]')?.dataset.base || '/';
export const sitePath = (path) => `${basePath}${path.replace(/^\//, '')}`;
