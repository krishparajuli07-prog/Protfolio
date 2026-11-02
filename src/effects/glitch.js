// TUNING: sparse bursts, no repeated high-contrast full-screen flashes.
export const CONFIG = { minDelay: 3000, maxDelay: 6000, burst: 200 };
import { active, full, visible } from './core.js';
export function glitch() {
  document.querySelectorAll('.hero-name,.sigil-name').forEach((el) => {
    el.classList.add('cyber-glitch');
    const text = el.textContent;
    ['accent', 'split'].forEach((channel) => {
      const layer = document.createElement('span');
      layer.className = `cyber-glitch-layer glitch-${channel}`;
      layer.textContent = text;
      layer.setAttribute('aria-hidden', 'true');
      el.append(layer);
    });
    let shown = false,
      timer,
      end;
    const reset = () => {
      clearTimeout(timer);
      clearTimeout(end);
      el.classList.remove('cyber-glitching');
    };
    const schedule = () => {
      reset();
      if (!shown || !full() || document.hidden) return;
      timer = setTimeout(
        () => {
          el.classList.add('cyber-glitching');
          end = setTimeout(() => {
            el.classList.remove('cyber-glitching');
            schedule();
          }, CONFIG.burst);
        },
        CONFIG.minDelay + Math.random() * (CONFIG.maxDelay - CONFIG.minDelay)
      );
    };
    visible(el, (on) => {
      shown = on;
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('fxchange', schedule);
  });
  const scorpion = document.querySelector('.scorpion-trigger');
  if (scorpion) {
    let timer;
    const strike = () => {
      if (!active() || scorpion.classList.contains('scene-ready')) return;
      clearTimeout(timer);
      scorpion.classList.remove('is-striking');
      requestAnimationFrame(() => {
        scorpion.classList.add('is-striking');
        timer = setTimeout(() => scorpion.classList.remove('is-striking'), 840);
      });
    };
    scorpion.addEventListener('pointerenter', strike);
    scorpion.addEventListener('click', strike);
  }
}
