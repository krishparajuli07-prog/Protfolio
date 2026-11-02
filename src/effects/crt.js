// TUNING: CRT intensity lives in crt.css; preference is independent of the global mode.
export const CONFIG = { storageKey: 'cyber-crt', default: 'on' };
import { read, write, active, full, root, decorative } from './core.js';
export function crt() {
  const layer = decorative('div', 'cyber-crt');
  document.body.append(layer);
  let preference = read(CONFIG.storageKey, CONFIG.default);
  const button = document.getElementById('cyber-crt-toggle');
  function sync() {
    const on = active() && preference === 'on';
    root.dataset.crt = on ? 'on' : 'off';
    layer.hidden = !on;
    layer.classList.toggle('cyber-crt-full', full());
    if (button) {
      button.textContent = `CRT: ${on ? 'ON' : 'OFF'}`;
      button.setAttribute('aria-pressed', String(on));
    }
  }
  button?.addEventListener('click', () => {
    preference = preference === 'on' ? 'off' : 'on';
    write(CONFIG.storageKey, preference);
    sync();
  });
  document.addEventListener('fxchange', sync);
  sync();
}
