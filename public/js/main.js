document.addEventListener('DOMContentLoaded', () => {
  // Persisted theme toggle (progressive enhancement; site works without JS).
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  if (btn) {
    const label = () =>
      root.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    btn.setAttribute('aria-label', label());
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {}
      btn.setAttribute('aria-label', label());
    });
  }

  document.querySelector('[data-print-resume]')?.addEventListener('click', () => window.print());

  // Typing effect for $ whoami card — skipped under reduced motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typed = document.querySelector('[data-typed]');
  if (typed && !reduce) {
    const full = typed.getAttribute('data-typed') || '';
    typed.textContent = '';
    let i = 0;
    const tick = () => {
      if (i <= full.length) {
        typed.textContent = full.slice(0, i);
        i += 1;
        setTimeout(tick, 18);
      }
    };
    tick();
  }

  // Count-up enhancement — final values already in HTML for no-JS.
  if (!reduce) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.getAttribute('data-count'));
      if (!Number.isFinite(target)) return;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const id = setInterval(() => {
        cur += step;
        if (cur >= target) {
          cur = target;
          clearInterval(id);
        }
        el.textContent = String(cur);
      }, 30);
    });
  }

  // Only hide sections when scroll animations can reveal them.
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('scroll-animations');

  // Fade-in on scroll.
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
          { threshold: 0.1 }
        )
      : null;
  document.querySelectorAll('.fade-in').forEach((el) => {
    if (reduce) el.classList.add('visible');
    else if (io) io.observe(el);
    else el.classList.add('visible');
  });

  // Project tag filter (progressive enhancement).
  const filter = document.getElementById('project-filter');
  if (filter) {
    const cards = Array.from(document.querySelectorAll('[data-tags]'));
    filter.addEventListener('change', (e) => {
      const v = e.target.value;
      cards.forEach((c) => {
        const tags = (c.getAttribute('data-tags') || '').split(' ');
        c.toggleAttribute('hidden', v !== 'all' && !tags.includes(v));
      });
    });
  }
});
