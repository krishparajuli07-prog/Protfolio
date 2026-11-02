// TUNING: variable command keystrokes; short demo; bounded transcript.
export const CONFIG = { minKeyMS: 28, maxKeyMS: 85, maxLines: 80, demoDelay: 350 };
import { active, full, coarse, sitePath } from './core.js';
export function terminal(ready) {
  const form = document.getElementById('explorer-form'),
    input = document.getElementById('terminal-command'),
    output = document.getElementById('terminal-output');
  if (!form || !input || !output) return;
  const commands = [
    'help',
    'projects',
    'skills',
    'about',
    'contact',
    'clear',
    'whoami',
    'cat resume',
    'resume',
    'ls',
    'github',
    'linkedin',
    'banner',
    'sudo hire krish',
    'sudo rm -rf /',
    'hack the planet'
  ];
  const readable = (el) => {
    if (!el) return '';
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[aria-hidden=true]').forEach((node) => node.remove());
    return copy.textContent.trim();
  };
  const history = [];
  let index = 0,
    draft = '',
    completion = '',
    demoToken = 0,
    demoTimer;
  output.setAttribute('role', 'log');
  output.setAttribute('aria-live', 'polite');
  output.setAttribute('aria-relevant', 'additions');
  const projects = [...document.querySelectorAll('.project-card')].map((c) => ({
    text: c.querySelector('h3')?.textContent.trim(),
    href: c.querySelector('a')?.getAttribute('href')
  }));
  const skills = [...document.querySelectorAll('.port-list li')].map((el) =>
    el.textContent.replace(/\s+/g, ' ').trim()
  );
  function line(text, href, label, demo = false) {
    const p = document.createElement('p');
    p.textContent = text;
    if (demo) {
      p.setAttribute('aria-hidden', 'true');
      p.dataset.demo = '';
    }
    if (href) {
      const a = document.createElement('a');
      a.href = href.startsWith('/') && !href.startsWith(sitePath('')) ? sitePath(href) : href;
      a.textContent = label || 'Open →';
      p.append(a);
    }
    output.append(p);
    while (output.children.length > CONFIG.maxLines) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
    return p;
  }
  function cancelDemo() {
    demoToken++;
    clearTimeout(demoTimer);
    output.querySelectorAll('[data-demo]').forEach((el) => el.remove());
  }
  function run(raw) {
    cancelDemo();
    const c = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (c === 'clear') {
      output.replaceChildren();
      return;
    }
    line('❯ ' + raw);
    switch (c) {
      case 'help':
        line(commands.join(' · '));
        line('↑/↓ history · Tab autocomplete · Enter run');
        break;
      case 'whoami':
        line(readable(document.querySelector('.hero-name')) || 'Krish Parajuli');
        line(
          document.querySelector('.hero-summary')?.textContent.trim() ||
            'Authorized security testing.'
        );
        break;
      case 'projects':
        projects.forEach((p) => line(p.text, p.href, 'Read case study →'));
        break;
      case 'skills':
        skills.forEach((s) => line(s));
        break;
      case 'about':
        line(
          document.querySelector('#about>p')?.textContent.trim() || 'Read the about page.',
          '/about/',
          'About →'
        );
        break;
      case 'contact':
        line('Contact', '/contact/', 'Start a conversation →');
        break;
      case 'sudo hire krish':
        line(
          '[ SUCCESS ] Excellent judgment detected. Interview protocol ready.',
          '/contact/',
          'Contact Krish →'
        );
        output.classList.add('cyber-terminal-granted');
        setTimeout(() => output.classList.remove('cyber-terminal-granted'), 200);
        break;
      case 'resume':
      case 'cat resume':
        line('Résumé', '/resume/', 'View résumé →');
        break;
      case 'ls':
        line('about/  projects/  skills/  writeups/  resume/  contact/');
        break;
      case 'github':
      case 'linkedin': {
        const a = document.querySelector(`a[href*="${c}.com/"]`);
        line(a ? c : 'Link unavailable.', a?.href, 'Visit →');
        break;
      }
      case 'banner':
        line('BICCHU // Curiosity. Code. Cybersecurity.');
        break;
      case 'sudo rm -rf /':
        line('Permission denied: this portfolio has dreams, backups, and boundaries.');
        break;
      case 'hack the planet':
        line('Start with your own lab. The planet forgot to sign the scope agreement.');
        break;
      default:
        line(`command not found: ${raw}. Type help.`);
    }
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    history.push(raw);
    if (history.length > 100) history.shift();
    index = history.length;
    draft = '';
    input.value = '';
    run(raw);
  });
  input.addEventListener('focus', cancelDemo);
  input.addEventListener('input', () => {
    cancelDemo();
    completion = '';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === history.length) draft = input.value;
      index = Math.max(0, index - 1);
      input.value = history[index] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = Math.min(history.length, index + 1);
      input.value = index === history.length ? draft : history[index];
    } else if (e.key === 'Tab' && input.value.trim() && !e.shiftKey && completion !== input.value) {
      const matches = commands.filter((c) => c.startsWith(input.value.toLowerCase()));
      if (matches.length === 1 && matches[0] !== input.value) {
        e.preventDefault();
        input.value = matches[0];
        completion = input.value;
      } else if (matches.length > 1) {
        e.preventDefault();
        completion = input.value;
        line(matches.join(' · '));
      }
    }
  });
  document.querySelector('.console-panel')?.addEventListener('click', (e) => {
    if (!e.target.closest('a,button,input') && !getSelection()?.toString())
      input.focus({ preventScroll: true });
  });
  line('Portfolio shell ready. Type help to explore.');
  ready.then(() => {
    if (!active() || coarse.matches || document.activeElement === input) return;
    const token = demoToken,
      command = 'nmap --demo portfolio.local';
    let n = 0;
    const p = line('❯ ', null, null, true);
    function type() {
      if (token !== demoToken || !active() || document.hidden) return;
      p.textContent = '❯ ' + command.slice(0, ++n);
      if (n < command.length)
        demoTimer = setTimeout(
          type,
          CONFIG.minKeyMS + Math.random() * (CONFIG.maxKeyMS - CONFIG.minKeyMS)
        );
      else {
        line('SIMULATED SCAN / no network requests', null, null, true);
        line('22/tcp open curiosity · 443/tcp open security', null, null, true);
        line('ACCESS GRANTED', null, null, true);
        output.classList.add('cyber-terminal-granted');
        demoTimer = setTimeout(() => output.classList.remove('cyber-terminal-granted'), 200);
      }
    }
    demoTimer = setTimeout(type, CONFIG.demoDelay);
  });
  document.addEventListener('fxchange', () => {
    if (!active()) cancelDemo();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelDemo();
  });
  const code = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a'
  ];
  let position = 0;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,[contenteditable]') || e.altKey || e.ctrlKey || e.metaKey)
      return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    position = key === code[position] ? position + 1 : key === code[0] ? 1 : 0;
    if (position === code.length) {
      position = 0;
      if (full()) document.dispatchEvent(new Event('cybermatrix'));
    }
  });
}
