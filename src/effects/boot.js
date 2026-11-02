// TUNING: total runtime includes the CRT reveal. Storage key controls once-per-session behavior.
export const CONFIG = {
  duration: 2500,
  mobileDuration: 1200,
  exitDuration: 260,
  sessionKey: 'cyber-boot-v1'
};
import { active, coarse, decorative, tween } from './core.js';
export function boot() {
  if (!document.querySelector('.hacker-hero') || !active() || location.hash)
    return Promise.resolve();
  try {
    if (sessionStorage.getItem(CONFIG.sessionKey)) return Promise.resolve();
    sessionStorage.setItem(CONFIG.sessionKey, '1');
  } catch {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'cyber-boot';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Portfolio startup; press any key or click to skip');
    const panel = document.createElement('div');
    panel.className = 'cyber-boot-panel';
    const label = document.createElement('p');
    label.textContent = 'BICCHU // SYSTEM BOOT';
    const subtitle = document.createElement('p');
    subtitle.className = 'cyber-boot-sub';
    subtitle.textContent = 'VISUAL SIMULATION / LOCAL SESSION';
    const log = decorative('pre', 'cyber-boot-log');
    const address = decorative('div', 'cyber-boot-address');
    const track = decorative('div', 'cyber-boot-track');
    const bar = document.createElement('span');
    track.append(bar);
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.textContent = 'Press any key or click to skip';
    panel.append(label, subtitle, log, address, track, skip);
    overlay.append(panel);
    document.body.append(overlay);
    const focusBefore = document.activeElement,
      overflowBefore = document.documentElement.style.overflow;
    const siblings = [...document.body.children].filter(
      (el) => el !== overlay && el.tagName !== 'SCRIPT'
    );
    const inert = siblings.map((el) => el.inert);
    siblings.forEach((el) => {
      el.inert = true;
    });
    document.documentElement.style.overflow = 'hidden';
    skip.focus({ preventScroll: true });
    const lines = [
      '[ OK ] mounting /dev/portfolio',
      '[ OK ] loading exploit-free modules',
      'bypassing firewall... [visual simulation]',
      '[ OK ] checking authorized scope',
      '[ OK ] indexing projects',
      '[ OK ] loading security toolkit',
      '[ OK ] synchronizing field notes',
      '[ OK ] ACCESS GRANTED'
    ];
    let ended = false,
      cancel = () => {},
      fail;
    const cleanup = () => {
      overlay.remove();
      siblings.forEach((el, i) => {
        el.inert = inert[i];
      });
      document.documentElement.style.overflow = overflowBefore;
      if (focusBefore instanceof HTMLElement && focusBefore.isConnected)
        focusBefore.focus({ preventScroll: true });
      resolve();
    };
    function finish(immediate = false) {
      if (ended) return;
      ended = true;
      cancel();
      clearTimeout(fail);
      document.removeEventListener('keydown', skipEvent, true);
      overlay.removeEventListener('pointerdown', skipEvent);
      document.removeEventListener('fxchange', off);
      window.removeEventListener('pagehide', skipEvent);
      if (immediate || !active()) cleanup();
      else {
        overlay.classList.add('cyber-boot-exit');
        setTimeout(cleanup, CONFIG.exitDuration);
      }
    }
    function skipEvent(event) {
      if (event.type === 'keydown') event.preventDefault();
      finish(true);
    }
    function off() {
      if (!active()) finish(true);
    }
    document.addEventListener('keydown', skipEvent, true);
    overlay.addEventListener('pointerdown', skipEvent);
    skip.addEventListener('click', () => finish(true));
    document.addEventListener('fxchange', off);
    window.addEventListener('pagehide', skipEvent);
    fail = setTimeout(() => finish(true), 3500);
    let previous = -1;
    cancel = tween(
      (coarse.matches ? CONFIG.mobileDuration : CONFIG.duration) - CONFIG.exitDuration,
      (p) => {
        const step = Math.floor(p * 28);
        bar.style.transform = `scaleX(${p})`;
        if (step === previous) return;
        previous = step;
        log.textContent = [
          ...Array.from(
            { length: Math.floor(p * 12) },
            (_, i) =>
              `0x${(4096 + i * 256).toString(16)}  CHECKSUM ${Math.floor(Math.random() * 65535)
                .toString(16)
                .padStart(4, '0')}`
          ),
          ...lines.slice(0, Math.max(1, Math.ceil(p * lines.length)))
        ]
          .slice(-10)
          .join('\n');
        address.textContent = `0x${Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')}  [ ${Math.floor(p * 100)
          .toString()
          .padStart(3, '0')}% ]`;
      },
      () => finish()
    );
  });
}
