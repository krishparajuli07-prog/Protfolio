(() => {
  'use strict';
  const scriptURL = document.currentScript.src;
  const atlas = new Image();
  atlas.src = new URL('../images/scorpion-atlas.webp', scriptURL).href;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const enabled = () => !motion.matches && document.documentElement.dataset.fx !== 'off';
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  function sprite(ctx, frame, x, y, size, angle = 0, opacity = 1) {
    const sw = atlas.naturalWidth / 4;
    const row = Math.floor(frame / 4);
    const sy = ([0, 352, 710][row] * atlas.naturalHeight) / 1088;
    const sh = ([340, 350, 378][row] * atlas.naturalHeight) / 1088;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;
    ctx.drawImage(atlas, (frame % 4) * sw, sy, sw, sh, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  function hero() {
    const button = document.querySelector('.scorpion-trigger');
    if (!button) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    button.replaceChildren(canvas);
    let raf = 0,
      start = 0;
    function draw(frame = 5) {
      const size = button.clientWidth,
        dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprite(ctx, frame, size / 2, size / 2, size * 0.94);
    }
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      button.classList.remove('is-striking');
      draw();
    };
    function tick(now) {
      const t = now - start;
      draw(t < 220 ? 8 : t < 400 ? 9 : t < 560 ? 10 : 11);
      if (t < 780 && enabled() && !document.hidden) raf = requestAnimationFrame(tick);
      else stop();
    }
    function strike() {
      if (!enabled() || raf) return;
      start = performance.now();
      button.classList.add('is-striking');
      raf = requestAnimationFrame(tick);
    }
    button.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') strike();
    });
    button.addEventListener('click', strike);
    // Native button Enter/Space generates click; focus alone doesn't consume that click.
    document.addEventListener('fxchange', () => {
      if (!enabled()) stop();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
    new ResizeObserver(() => {
      if (!raf) draw();
    }).observe(button);
    draw();
  }
  function intro() {
    const host = document.querySelector('[data-scorpion-intro]');
    if (!host || !enabled() || location.hash) return;
    const canvas = host.querySelector('canvas'),
      ctx = canvas.getContext('2d');
    if (!ctx) return;
    const skip = host.querySelector('button');
    let w,
      h,
      size,
      path,
      impact,
      raf = 0,
      start,
      finished = false;
    const previousFocus = document.activeElement;
    const siblings = [...document.body.children].filter(
      (el) => el !== host && !el.contains(host) && el.tagName !== 'SCRIPT'
    );
    const inertBefore = siblings.map((el) => el.inert);
    const oldOverflow = document.documentElement.style.overflow;
    // Choose a different edge from the last visit, even when two random samples agree.
    let edge = Math.floor(Math.random() * 4);
    try {
      const previous = Number(sessionStorage.getItem('scorpion-entry-edge') ?? -1);
      if (edge === previous) edge = (edge + 1 + Math.floor(Math.random() * 3)) % 4;
      sessionStorage.setItem('scorpion-entry-edge', String(edge));
    } catch {
      /* Storage is optional. */
    }
    host.dataset.entryEdge = ['left', 'right', 'top', 'bottom'][edge];
    const along = 0.15 + Math.random() * 0.7;
    const target = [0.43 + Math.random() * 0.14, 0.42 + Math.random() * 0.12];
    const bend = (Math.random() - 0.5) * 0.4;
    const angles = Array.from(
      { length: 18 },
      (_, i) => (i * Math.PI * 2) / 18 + (Math.random() - 0.5) * 0.13
    );
    function resize() {
      w = innerWidth;
      h = innerHeight;
      size = Math.min(300, w * 0.55, h * 0.43);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      impact = { x: w * target[0], y: h * target[1] };
      const p0 = [
        { x: -size, y: h * along },
        { x: w + size, y: h * along },
        { x: w * along, y: -size },
        { x: w * along, y: h + size }
      ][edge];
      const angle = Math.atan2(impact.y - p0.y, impact.x - p0.x);
      const dx = Math.cos(angle),
        dy = Math.sin(angle);
      const end = { x: impact.x - dx * size * 0.4, y: impact.y - dy * size * 0.4 };
      path = [
        p0,
        {
          x: p0.x + (end.x - p0.x) * 0.4 - dy * w * bend,
          y: p0.y + (end.y - p0.y) * 0.4 + dx * h * bend
        },
        { x: end.x - dx * size, y: end.y - dy * size },
        end
      ];
    }
    function point(t) {
      const u = 1 - t;
      return {
        x:
          u ** 3 * path[0].x +
          3 * u * u * t * path[1].x +
          3 * u * t * t * path[2].x +
          t ** 3 * path[3].x,
        y:
          u ** 3 * path[0].y +
          3 * u * u * t * path[1].y +
          3 * u * t * t * path[2].y +
          t ** 3 * path[3].y
      };
    }
    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      host.remove();
      document.documentElement.style.overflow = oldOverflow;
      siblings.forEach((el, i) => {
        el.inert = inertBefore[i];
      });
      window.removeEventListener('resize', resize);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('fxchange', fxchange);
      motion.removeEventListener('change', fxchange);
      window.removeEventListener('pagehide', finish);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
      document.dispatchEvent(new Event('scorpionintroend'));
    }
    const keydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    const fxchange = () => {
      if (!enabled()) finish();
    };
    const failsafe = setTimeout(finish, 6500);
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', keydown);
    document.addEventListener('fxchange', fxchange);
    motion.addEventListener('change', fxchange);
    window.addEventListener('pagehide', finish, { once: true });
    window.addEventListener('resize', resize);
    resize();
    host.hidden = false;
    siblings.forEach((el) => {
      el.inert = true;
    });
    document.documentElement.style.overflow = 'hidden';
    skip.focus({ preventScroll: true });
    function ray(i) {
      const a = angles[(i + angles.length) % angles.length],
        r = Math.hypot(w, h) * 1.2;
      return [
        [0, 0],
        [Math.cos(a + 0.09) * r * 0.12, Math.sin(a + 0.09) * r * 0.12],
        [Math.cos(a - 0.04) * r * 0.32, Math.sin(a - 0.04) * r * 0.32],
        [Math.cos(a) * r, Math.sin(a) * r]
      ];
    }
    function line(points, color, width) {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    function draw(t) {
      const crack = smooth((t - 3230) / 320),
        fall = clamp((t - 3650) / 1000);
      ctx.clearRect(0, 0, w, h);
      if (!fall) {
        const light = ctx.createRadialGradient(
          impact.x,
          impact.y,
          0,
          impact.x,
          impact.y,
          Math.max(w, h) * 0.75
        );
        light.addColorStop(0, '#202a29');
        light.addColorStop(0.5, '#101617');
        light.addColorStop(1, '#050809');
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, w, h);
      }
      for (let i = 0; i < angles.length; i++) {
        ctx.save();
        ctx.translate(impact.x, impact.y);
        const a = angles[i];
        ctx.translate(Math.cos(a) * w * fall ** 2 * 0.8, (Math.sin(a) * h + h * 0.85) * fall ** 2);
        ctx.rotate(Math.sin(i * 7) * fall * 0.6);
        ctx.globalAlpha = 1 - fall;
        if (fall) {
          const vertices = [
            ...ray(i),
            ...ray(i + 1)
              .slice(1)
              .reverse()
          ];
          ctx.beginPath();
          vertices.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.fillStyle = '#101617';
          ctx.fill();
          ctx.strokeStyle = '#89999a55';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        if (crack) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, Math.hypot(w, h) * crack, 0, Math.PI * 2);
          ctx.clip();
          line(ray(i), '#c4d6d5a0', 1.1);
          const p = ray(i)[1],
            q = ray(i)[2];
          line(
            [p, [p[0] * 1.5 + 15, p[1] * 1.3 - 18], [q[0] * 0.8, q[1] * 0.85]],
            '#718b8c77',
            0.65
          );
          ctx.restore();
        }
        ctx.restore();
      }
      if (t < 3650) {
        const progress = clamp(t / 2650),
          pos = point(progress),
          before = point(Math.max(0, progress - 0.005)),
          after = point(Math.min(1, progress + 0.005));
        const heading = Math.atan2(after.y - before.y, after.x - before.x) + Math.PI / 2;
        const frame =
          t < 2650
            ? [5, 6, 7, 4][Math.floor(t / 100) % 4]
            : t < 2850
              ? 5
              : t < 3060
                ? 8
                : t < 3230
                  ? 9
                  : t < 3410
                    ? 10
                    : 11;
        ctx.save();
        ctx.shadowColor = '#000b';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 7;
        ctx.shadowOffsetY = 10;
        sprite(ctx, frame, pos.x, pos.y, size, heading, 1 - clamp((t - 3440) / 210));
        ctx.restore();
      }
      if (t > 3230 && t < 3410) {
        const p = (t - 3230) / 180;
        ctx.strokeStyle = `rgba(215,230,225,${(1 - p) * 0.55})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(impact.x, impact.y, 2 + p * 28, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    function tick(now) {
      if (finished) return;
      start ??= now;
      try {
        draw(now - start);
      } catch {
        finish();
        return;
      }
      if (now - start >= 4650) finish();
      else raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }
  // Failed or slow image loading never blocks access to the portfolio.
  let ready = false;
  const deadline = performance.now() + 1800;
  function loaded() {
    if (ready) return;
    ready = true;
    hero();
    if (performance.now() < deadline) intro();
  }
  atlas.addEventListener('load', loaded, { once: true });
  if (atlas.complete && atlas.naturalWidth) loaded();
})();
