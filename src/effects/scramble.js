// TUNING: bounded left-to-right reveal; character boxes reserve the original glyph widths.
export const CONFIG = {
  duration: 800,
  hoverDuration: 320,
  glyphs: '#@$%X701ABCDEF',
  maxCharacters: 500
};
import { active, tween, visible } from './core.js';
export function scramble() {
  document.querySelectorAll('h1,h2').forEach((heading) => {
    const readable = heading.cloneNode(true);
    readable.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(' ')));
    heading.setAttribute('aria-label', readable.textContent.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT),
      nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const chars = [];
    nodes.forEach((node) => {
      if (!node.textContent.trim()) return;
      const fragment = document.createDocumentFragment();
      for (const word of node.textContent.split(/(\s+)/)) {
        if (/^\s+$/.test(word)) {
          fragment.append(document.createTextNode(word));
          continue;
        }
        const wordBox = document.createElement('span');
        wordBox.className = 'cyber-word';
        fragment.append(wordBox);
        for (const letter of word) {
          if (/\s/.test(letter) || chars.length >= CONFIG.maxCharacters) {
            fragment.append(document.createTextNode(letter));
            continue;
          }
          const box = document.createElement('span');
          box.className = 'cyber-char';
          const real = document.createElement('span');
          real.textContent = letter;
          const visual = document.createElement('span');
          visual.className = 'cyber-glyph';
          visual.setAttribute('aria-hidden', 'true');
          box.append(real, visual);
          wordBox.append(box);
          chars.push({ box, visual, letter });
        }
      }
      node.replaceWith(fragment);
    });
    let cancel = () => {},
      running = false;
    const final = () => {
      chars.forEach(({ box, visual }) => {
        box.classList.remove('cyber-decoding');
        visual.textContent = '';
      });
      running = false;
    };
    const play = (duration) => {
      if (!active() || running) return;
      running = true;
      let last = -1;
      cancel = tween(
        duration,
        (p) => {
          const step = Math.floor(p * 24);
          if (step === last && p !== 1) return;
          last = step;
          const n = Math.floor(chars.length * p);
          chars.forEach(({ box, visual }, i) => {
            box.classList.toggle('cyber-decoding', i >= n);
            if (i >= n)
              visual.textContent = CONFIG.glyphs[Math.floor(Math.random() * CONFIG.glyphs.length)];
          });
        },
        final
      );
    };
    visible(heading, () => play(CONFIG.duration), true);
    heading.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') play(CONFIG.hoverDuration);
    });
    document.addEventListener('fxchange', () => {
      if (!active()) {
        cancel();
        final();
      }
    });
  });
}
