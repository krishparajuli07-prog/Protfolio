// TUNING: staged scan/counters; tilt degrees; brief click delay only for plain internal link activation.
export const CONFIG = {
  rowDelay: 105,
  rowDuration: 260,
  counterDuration: 900,
  tilt: 4,
  accessDelay: 120
};
import { active, full, coarse, tween, visible, decorative, clamp } from './core.js';
export function scrollEffects() {
  const scan = document.querySelector('.port-scan');
  if (scan)
    visible(
      scan,
      () => {
        const rows = [...scan.querySelectorAll('.port-list li')],
          status = scan.querySelector('.scan-status');
        if (!active()) {
          if (status) status.textContent = `Scan complete: ${rows.length} services identified`;
          return;
        }
        const ports = rows.map((r) => r.querySelector('.port')),
          text = ports.map((p) => p.textContent);
        ports.forEach((port, i) => port.setAttribute('aria-label', text[i]));
        rows.forEach((r) => r.classList.add('cyber-scan-pending'));
        status?.classList.add('cyber-scanning');
        const final = `Scan complete: ${rows.length} services identified`;
        const total = rows.length * CONFIG.rowDelay + CONFIG.rowDuration + 500;
        tween(
          total,
          (p) => {
            const t = p * total;
            rows.forEach((row, i) => {
              const n = active() ? clamp((t - i * CONFIG.rowDelay) / CONFIG.rowDuration) : 1;
              row.classList.toggle('cyber-scan-pending', n === 0);
              row.style.opacity = String(0.15 + 0.85 * n);
              row.style.transform = `translateY(${(1 - n) * 6}px)`;
              const port = Number(text[i].split('/')[0]);
              ports[i].textContent = n === 1 ? text[i] : `${Math.round(port * n)}/tcp`;
              row.classList.toggle('cyber-port-open', n > 0.6 && n < 1);
            });
            if (status)
              status.textContent =
                t < total - 500 && active()
                  ? 'scanning...'
                  : final.slice(
                      0,
                      active()
                        ? Math.ceil(clamp((t - total + 500) / 500) * final.length)
                        : final.length
                    );
          },
          () => {
            rows.forEach((r, i) => {
              r.classList.remove('cyber-scan-pending', 'cyber-port-open');
              r.style.removeProperty('opacity');
              r.style.removeProperty('transform');
              ports[i].textContent = text[i];
            });
            if (status) {
              status.textContent = final;
              status.classList.remove('cyber-scanning');
            }
          }
        );
      },
      true
    );
  document.querySelectorAll('[data-count]').forEach((el) =>
    visible(
      el,
      () => {
        const original = el.textContent,
          n = Number(el.dataset.count);
        if (!active() || !Number.isFinite(n)) return;
        el.setAttribute('aria-label', original);
        const ghost = decorative('span', 'cyber-counter');
        ghost.textContent = original;
        const real = document.createElement('span');
        real.textContent = original;
        real.style.opacity = '0';
        el.replaceChildren(real, ghost);
        el.classList.add('cyber-counter-host');
        let last = -1;
        tween(
          CONFIG.counterDuration,
          (p) => {
            const step = Math.floor(p * 22);
            if (step !== last) {
              ghost.textContent =
                p < 0.3
                  ? String(Math.floor(Math.random() * 10 ** original.length)).padStart(
                      original.length,
                      '0'
                    )
                  : String(Math.round(n * (1 - (1 - p) ** 3)));
              last = step;
            }
          },
          () => el.replaceChildren(document.createTextNode(original))
        );
      },
      true
    )
  );
  document
    .querySelectorAll('.section-heading,.method-strip,.stat-strip,.terminal-divider')
    .forEach((el) => {
      el.classList.add('cyber-circuit');
      visible(el, () => el.classList.add('cyber-circuit-drawn'), true);
    });
  document.querySelectorAll('.project-card').forEach((card) => {
    card.classList.add('cyber-card');
    card.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (
        !a ||
        !active() ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        a.target ||
        a.hasAttribute('download')
      )
        return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      e.preventDefault();
      const flash = decorative('span', 'cyber-access-flash');
      flash.textContent = 'ACCESSING FILE...';
      card.append(flash);
      setTimeout(() => {
        flash.remove();
        location.assign(a.href);
      }, CONFIG.accessDelay);
    });
  });
  let bar = document.querySelector('.reading-progress > div');
  if (!bar) {
    const host = decorative('div', 'reading-progress');
    bar = document.createElement('div');
    host.append(bar);
    document.body.append(host);
  }
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max) : 0})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(document.body);
  update();
}
