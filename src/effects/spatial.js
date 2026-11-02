// TUNING: restrained perspective, fixed-budget effects, lazy-loaded WebGL.
export const CONFIG = {
  terminalTilt: 5,
  cardTilt: 7,
  response: 9,
  fractureDuration: 1500,
  fractureRays: 12,
  networkFPS: 30,
  particles: 32
};
import {
  active,
  full,
  coarse,
  frame,
  visible,
  decorative,
  palette,
  clamp,
  sitePath
} from './core.js';
export function spatial(ready) {
  const hero = document.querySelector('.hacker-hero');
  if (!hero) return;
  let scene,
    loading = false,
    destroyed = false,
    failed = false,
    fallbackTimer;
  const host = document.querySelector('.scorpion-trigger');
  function loadScene() {
    if (loading || scene || failed || !host || !active() || destroyed) return;
    loading = true;
    host.dataset.scene = 'loading';
    const script = document.createElement('script');
    script.src = sitePath('effects/scene.bundle.js');
    script.async = true;
    script.onload = () => {
      loading = false;
      try {
        scene = window.initBicchuScene?.({
          host,
          frame,
          full,
          active,
          coarse,
          palette,
          onImpact: fracture
        });
        failed = !scene;
      } catch (error) {
        failed = true;
        host.dataset.scene = 'fallback';
        console.warn('3D fallback:', error);
      }
    };
    script.onerror = () => {
      loading = false;
      failed = true;
      host.dataset.scene = 'fallback';
    };
    document.head.append(script);
  }
  ready.then(() => {
    visible(host, (on) => {
      if (on) loadScene();
    });
  });
  document.addEventListener('fxchange', loadScene);
  document.querySelectorAll('.console-panel,.project-card').forEach((el) => {
    el.classList.add('spatial-panel');
    let x = 0,
      y = 0,
      cx = 0,
      cy = 0,
      stop = null,
      bounds;
    const max = el.matches('.console-panel') ? CONFIG.terminalTilt : CONFIG.cardTilt;
    function tick(now, dt) {
      const a = 1 - Math.exp((-CONFIG.response * dt) / 1000);
      cx += (x - cx) * a;
      cy += (y - cy) * a;
      el.style.setProperty('--depth-rx', `${-cy * max}deg`);
      el.style.setProperty('--depth-ry', `${cx * max}deg`);
      if (Math.abs(cx - x) + Math.abs(cy - y) < 0.002) {
        stop?.();
        stop = null;
      }
    }
    function wake() {
      if (!stop) stop = frame(tick);
    }
    function reset() {
      x = y = 0;
      if (!active()) {
        cx = cy = 0;
        el.style.removeProperty('--depth-rx');
        el.style.removeProperty('--depth-ry');
        stop?.();
        stop = null;
      } else wake();
    }
    el.addEventListener('pointerenter', () => {
      bounds = el.getBoundingClientRect();
    });
    el.addEventListener(
      'pointermove',
      (e) => {
        if (!full() || coarse.matches || e.pointerType !== 'mouse' || !bounds) return;
        x = clamp((e.clientX - bounds.left) / bounds.width) * 2 - 1;
        y = clamp((e.clientY - bounds.top) / bounds.height) * 2 - 1;
        wake();
      },
      { passive: true }
    );
    el.addEventListener('pointerleave', reset);
    el.addEventListener('focusin', reset);
    document.addEventListener('fxchange', reset);
  });
  // All portrait layers use existing public content; the rings are decoration only.
  const portrait = document.querySelector('.identity-viewport');
  if (portrait) {
    const rings = decorative('div', 'holo-orbits');
    rings.append(
      decorative('i', 'holo-ring-one'),
      decorative('i', 'holo-ring-two'),
      decorative('i', 'holo-ring-three')
    );
    portrait.append(rings);
  }
  let fractureStop = null,
    fractureCanvas = null;
  function clearFracture() {
    fractureStop?.();
    fractureStop = null;
    fractureCanvas?.remove();
    fractureCanvas = null;
    document.documentElement.classList.remove('spatial-impact');
  }
  function fracture(x, y) {
    if (!full() || coarse.matches) return;
    clearFracture();
    const canvas = decorative('canvas', 'spatial-fracture'),
      ctx = canvas.getContext('2d');
    if (!ctx) return;
    fractureCanvas = canvas;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    document.body.append(canvas);
    const p = palette(),
      w = canvas.width,
      h = canvas.height,
      max = Math.min(680, Math.hypot(w, h) * 0.55),
      rays = [];
    for (let i = 0; i < CONFIG.fractureRays; i++) {
      const angle = (i / CONFIG.fractureRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.22,
        points = [[x, y]],
        length = max * (0.45 + Math.random() * 0.55);
      for (let j = 1; j <= 5; j++) {
        const d = (j / 5) * length,
          a = angle + (Math.random() - 0.5) * 0.12;
        points.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
      }
      rays.push(points);
    }
    const start = performance.now();
    document.documentElement.classList.add('spatial-impact');
    fractureStop = frame((now) => {
      const t = (now - start) / CONFIG.fractureDuration;
      if (t >= 1 || !full()) {
        clearFracture();
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const growth = clamp(t / 0.24),
        fade = 1 - clamp((t - 0.45) / 0.55);
      ctx.strokeStyle = p.primary;
      ctx.lineWidth = 0.85;
      ctx.globalAlpha = 0.6 * fade;
      rays.forEach((pts, i) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 1; j < pts.length; j++) {
          const local = clamp(growth * 5 - (j - 1));
          if (!local) break;
          ctx.lineTo(
            pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * local,
            pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * local
          );
        }
        ctx.stroke();
        if (growth > 0.65) {
          const next = rays[(i + 1) % rays.length];
          for (let j = 1; j < 4; j++) {
            ctx.globalAlpha = 0.18 * fade;
            ctx.beginPath();
            ctx.moveTo(...pts[j]);
            ctx.lineTo((pts[j][0] + next[j][0]) * 0.5 + 8, (pts[j][1] + next[j][1]) * 0.5 - 6);
            ctx.lineTo(...next[j]);
            ctx.stroke();
          }
        }
      });
      if (t > 0.35) {
        ctx.fillStyle = p.primary;
        for (let i = 0; i < rays.length; i++) {
          const a = rays[i][2],
            b = rays[(i + 1) % rays.length][2],
            fall = (t - 0.35) ** 2 * 140;
          ctx.save();
          ctx.translate((a[0] + b[0] + x) / 3, (a[1] + b[1] + y) / 3 + fall);
          ctx.rotate((t - 0.35) * (i % 2 ? 1 : -1) * 0.3);
          ctx.globalAlpha = 0.035 * fade;
          ctx.beginPath();
          ctx.moveTo(-16, -12);
          ctx.lineTo(18, 0);
          ctx.lineTo(-3, 25);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    });
  }
  document.addEventListener('fxchange', () => {
    if (!full()) {
      clearTimeout(fallbackTimer);
      clearFracture();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearFracture();
  });
  host?.addEventListener('click', () => {
    if (host.dataset.scene !== 'fallback' || !full() || coarse.matches) return;
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      const b = host.getBoundingClientRect();
      fracture(b.left + b.width * 0.7, b.top + b.height * 0.3);
    }, 280);
  });
  initNetwork();
  initAtmosphere(hero);
  window.addEventListener(
    'pagehide',
    (e) => {
      if (!e.persisted) {
        destroyed = true;
        scene?.dispose();
        clearFracture();
      }
    },
    { once: true }
  );
}
function initNetwork() {
  const host = document.querySelector('.toolkit-map'),
    canvas = host?.querySelector('canvas'),
    rows = [...document.querySelectorAll('.port-list li')];
  if (!host || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let w = 0,
    h = 0,
    shown = false,
    stop = () => {},
    last = 0,
    angle = 0,
    selected = -1,
    p = palette();
  const nodes = rows.map((r, i) => {
    const y = 1 - (i / Math.max(rows.length - 1, 1)) * 2,
      rad = Math.sqrt(1 - y * y),
      a = i * 2.399963;
    return {
      x: Math.cos(a) * rad,
      y,
      z: Math.sin(a) * rad,
      label: r.querySelector('strong').textContent
    };
  });
  const label = host.querySelector('.toolkit-map-label');
  function resize() {
    w = host.clientWidth;
    h = host.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const radius = Math.min(h * 0.46, w * 0.25),
      center = w * (w > 650 ? 0.34 : 0.5);
    const points = nodes.map((n) => {
      const x = n.x * Math.cos(angle) - n.z * Math.sin(angle),
        z = n.x * Math.sin(angle) + n.z * Math.cos(angle),
        k = 2.8 / (2.8 + z * 0.6);
      return { x: center + x * radius * k, y: h * 0.48 + n.y * radius * 0.72 * k, z, k };
    });
    ctx.strokeStyle = p.primary;
    ctx.fillStyle = p.primary;
    points.forEach((a, i) => {
      points.forEach((b, j) => {
        if (j <= i || Math.abs(i - j) > 3) return;
        ctx.globalAlpha = selected === i || selected === j ? 0.5 : 0.18;
        ctx.lineWidth = selected === i || selected === j ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    });
    points.forEach((n, i) => {
      ctx.globalAlpha = i === selected ? 1 : 0.4 + (1 - n.z) * 0.16;
      ctx.beginPath();
      ctx.arc(n.x, n.y, i === selected ? 5 : 2.5 * n.k, 0, Math.PI * 2);
      ctx.fill();
      if (i === selected) {
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '10px monospace';
      ctx.globalAlpha = i === selected ? 0.9 : 0.45;
      ctx.fillText(String(i + 1).padStart(2, '0'), n.x + 8, n.y + 3);
    });
    ctx.globalAlpha = 1;
  }
  function tick(now, dt) {
    if (now - last < 1000 / CONFIG.networkFPS) return;
    last = now;
    if (selected < 0) angle += dt * 0.00013;
    draw();
  }
  function sync() {
    stop();
    stop = () => {};
    if (shown && active() && !document.hidden) stop = frame(tick);
    else draw();
  }
  rows.forEach((row, i) => {
    const select = () => {
      selected = i;
      label.textContent = nodes[i].label;
      row.classList.add('network-selected');
      draw();
    };
    const reset = () => {
      selected = -1;
      label.textContent = '10 SERVICES / AUTHORIZED LAB';
      row.classList.remove('network-selected');
      draw();
    };
    row.addEventListener('pointerenter', select);
    row.addEventListener('pointerleave', reset);
  });
  new ResizeObserver(resize).observe(host);
  visible(host, (on) => {
    shown = on;
    sync();
  });
  document.addEventListener('fxchange', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(() => {
    p = palette();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
}
function initAtmosphere(hero) {
  if (coarse.matches) return;
  const canvas = decorative('canvas', 'spatial-atmosphere'),
    ctx = canvas.getContext('2d');
  if (!ctx) return;
  hero.prepend(canvas);
  const stars = Array.from({ length: CONFIG.particles }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.3 + Math.random() * 0.7
  }));
  let w = 0,
    h = 0,
    tx = 0,
    ty = 0,
    x = 0,
    y = 0,
    last = 0,
    shown = false,
    stop = () => {},
    color = palette().primary;
  const resize = () => {
    w = hero.clientWidth;
    h = hero.clientHeight;
    canvas.width = w;
    canvas.height = h;
  };
  function tick(now, dt) {
    if (now - last < 33) return;
    last = now;
    x += (tx - x) * 0.04;
    y += (ty - y) * 0.04;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    stars.forEach((s, i) => {
      const px = s.x * w + x * s.z * 18,
        py = s.y * h + y * s.z * 18 + Math.sin(now * 0.0003 + i) * 4;
      ctx.globalAlpha = 0.1 + s.z * 0.15;
      ctx.fillRect(px, py, s.z * 2, s.z * 2);
      if (i % 5 === 0) {
        ctx.globalAlpha = 0.065;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 25 * s.z, py);
        ctx.lineTo(px + 40 * s.z, py - 18 * s.z);
        ctx.stroke();
      }
    });
  }
  function sync() {
    stop();
    stop = () => {};
    canvas.hidden = !full();
    if (full() && shown && !document.hidden) stop = frame(tick);
  }
  hero.addEventListener(
    'pointermove',
    (e) => {
      const b = hero.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width) * 2 - 1;
      ty = ((e.clientY - b.top) / b.height) * 2 - 1;
    },
    { passive: true }
  );
  hero.addEventListener('pointerleave', () => {
    tx = ty = 0;
  });
  new ResizeObserver(resize).observe(hero);
  visible(hero, (on) => {
    shown = on;
    sync();
  });
  document.addEventListener('fxchange', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(() => {
    color = palette().primary;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
}
