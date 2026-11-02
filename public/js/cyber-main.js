document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('print-resume')?.addEventListener('click', () => window.print());

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
