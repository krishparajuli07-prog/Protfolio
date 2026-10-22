// A self-contained, dependency-free opening. The page remains usable without JS.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || location.hash) return;
  const host = document.querySelector('[data-scorpion-intro]');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const skip = host.querySelector('button');
  let frame = 0;
  let finished = false;
  let start;
  let w, h, scale;
  const priorFocus = document.activeElement;
  const blocked = [...document.body.children].filter((el) => el !== host && !el.contains(host));
  const previousInert = blocked.map((el) => el.inert);
  const originalOverflow = document.documentElement.style.overflow;
  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    clearTimeout(failsafe);
    host.remove();
    document.documentElement.style.overflow = originalOverflow;
    blocked.forEach((el, i) => {
      el.inert = previousInert[i];
    });
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', keydown);
    motion.removeEventListener('change', finish);
    if (document.activeElement === document.body && priorFocus instanceof HTMLElement)
      priorFocus.focus();
  };
  const keydown = (event) => {
    if (event.key === 'Escape') finish();
  };
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(1.25, w / 560, h / 540);
  };
  const failsafe = setTimeout(finish, 5500);
  resize();
  host.hidden = false;
  blocked.forEach((el) => {
    el.inert = true;
  });
  document.documentElement.style.overflow = 'hidden';
  skip.focus({ preventScroll: true });
  skip.addEventListener('click', finish);
  window.addEventListener('resize', resize);
  document.addEventListener('keydown', keydown);
  motion.addEventListener('change', finish);
  window.addEventListener('pagehide', finish, { once: true });
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = (n) => 1 - (1 - clamp(n)) ** 3;
  const line = (points, color, width = 1) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const armor = (x, y, rx, ry, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(-rx, -ry, rx, ry);
    gradient.addColorStop(0, '#7a9898');
    gradient.addColorStop(0.28, '#263f43');
    gradient.addColorStop(0.7, '#101d24');
    gradient.addColorStop(1, '#04090e');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#74d7ba';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  function scorpion(t) {
    const walk = clamp(t / 2100);
    const x = -220 * scale + (w / 2 + 220 * scale) * (walk < 1 ? walk : 1);
    const strike = ease((t - 2450) / 180);
    ctx.save();
    ctx.translate(x, h / 2 + 38 * scale);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 1 - clamp((t - 2910) / 230);
    ctx.shadowColor = '#40e9b43b';
    ctx.shadowBlur = 12;
    // Four articulated legs on each side, with alternating walking phases.
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const phase = t < 2100 ? Math.sin(t / 88 + i * 2.1 + side * 1.8) : 0;
        const bx = -36 + i * 18;
        line(
          [
            [bx, side * 12],
            [bx - 17 + phase * 8, side * (34 + i * 2)],
            [bx + 4 + phase * 12, side * (62 - i * 3)]
          ],
          '#080f16',
          8
        );
        line(
          [
            [bx, side * 12],
            [bx - 17 + phase * 8, side * (34 + i * 2)],
            [bx + 4 + phase * 12, side * (62 - i * 3)]
          ],
          '#638f87',
          2
        );
        armor(bx - 17 + phase * 8, side * (34 + i * 2), 4, 4);
      }
      line(
        [
          [26, side * 12],
          [52, side * 29],
          [72, side * 25]
        ],
        '#56776f',
        10
      );
      armor(80, side * 27, 22, 12, -side * 0.3);
      line(
        [
          [91, side * 23],
          [111, side * 13],
          [104, side * 27]
        ],
        '#8cba9e',
        4
      );
      line(
        [
          [90, side * 33],
          [111, side * 35],
          [105, side * 27]
        ],
        '#607f73',
        5
      );
    }
    for (let i = 0; i < 6; i++) armor(-49 + i * 13, 0, 11, 16 + i * 0.8);
    armor(30, 0, 17, 19);
    ctx.fillStyle = '#afffe1';
    for (const y of [-7, 7]) {
      ctx.beginPath();
      ctx.arc(40, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // The tip lands at the exact crack origin (viewport centre).
    const rest = [
      [-58, 0],
      [-81, -14],
      [-91, -42],
      [-82, -72],
      [-59, -92],
      [-29, -94],
      [-8, -76],
      [0, -58]
    ];
    const hit = [
      [-58, 0],
      [-80, -20],
      [-83, -51],
      [-60, -77],
      [-30, -79],
      [-7, -67],
      [0, -49],
      [0, -38]
    ];
    const tail = rest.map(([a, b], i) => [
      a + (hit[i][0] - a) * strike,
      b + (hit[i][1] - b) * strike
    ]);
    line(tail, '#0a171e', 18);
    tail.slice(0, -1).forEach(([a, b], i) => armor(a, b, 11 - i * 0.7, 10 - i * 0.5, i * 0.36));
    const tip = tail[7];
    line([tail[6], tip], '#d3f8de', 3);
    ctx.restore();
  }
  // Irregular radial glass wedges share their boundaries, avoiding gaps before impact.
  const radius = () => Math.hypot(w, h) * 0.8;
  const angles = Array.from(
    { length: 15 },
    (_, i) => (i * Math.PI * 2) / 15 + Math.sin(i * 7) * 0.09
  );
  const ray = (i) => {
    const a = angles[(i + 15) % 15];
    const r = radius();
    return [
      [0, 0],
      [Math.cos(a + 0.11) * r * 0.15, Math.sin(a + 0.11) * r * 0.15],
      [Math.cos(a - 0.06) * r * 0.4, Math.sin(a - 0.06) * r * 0.4],
      [Math.cos(a) * r, Math.sin(a) * r]
    ];
  };
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    if (t <= 3040) {
      ctx.fillStyle = '#05090e';
      ctx.fillRect(0, 0, w, h);
    }
    const breakTime = clamp((t - 3040) / 1050);
    const crack = ease((t - 2630) / 350);
    for (let i = 0; i < 15; i++) {
      const points = [
        ...ray(i),
        ...ray(i + 1)
          .slice(1)
          .reverse()
      ];
      const angle = (angles[i] + (angles[i + 1] ?? Math.PI * 2)) / 2;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.translate(
        Math.cos(angle) * w * breakTime ** 2,
        (Math.sin(angle) * h + h * 0.65) * breakTime ** 2
      );
      ctx.rotate(Math.sin(i * 12) * breakTime * 0.6);
      ctx.globalAlpha = 1 - breakTime;
      ctx.beginPath();
      points.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = '#05090e';
      ctx.fill();
      if (crack > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius() * crack, 0, Math.PI * 2);
        ctx.clip();
        line(ray(i), '#8cc8b4', 1.2);
        const p = ray(i)[2];
        line([p, [p[0] * 1.3 + 32, p[1] * 0.8], [p[0] * 1.55 + 40, p[1] * 0.9]], '#456d69', 0.7);
        ctx.restore();
      }
      ctx.restore();
    }
    if (t < 3140) scorpion(t);
    if (t > 2630 && t < 2910) {
      const pulse = (t - 2630) / 280;
      ctx.strokeStyle = `rgba(130,255,206,${(1 - pulse) * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 5 + pulse * 55, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (t < 2850) {
      ctx.globalAlpha = Math.min(1, t / 450) * (1 - clamp((t - 2400) / 450));
      ctx.fillStyle = '#8da8a2';
      ctx.textAlign = 'center';
      ctx.font = '11px monospace';
      ctx.fillText('B I C C H U   /   E N T E R I N G', w / 2, h / 2 + 155 * scale);
      ctx.globalAlpha = 1;
    }
  }
  function tick(now) {
    if (finished) return;
    start ??= now;
    const elapsed = now - start;
    try {
      draw(elapsed);
    } catch {
      finish();
      return;
    }
    if (elapsed >= 4150) finish();
    else frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
})();
