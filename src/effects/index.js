// TUNING: initialize only on pages that contain the existing hero. Modules export their CONFIG.
import { initControls } from './core.js';
import { boot } from './boot.js';
import { rain } from './rain.js';
import { scramble } from './scramble.js';
import { glitch } from './glitch.js';
import { crt } from './crt.js';
import { terminal } from './terminal.js';
import { portrait } from './portrait.js';
import { cursor } from './cursor.js';
import { scrollEffects } from './scroll.js';
import { ambient } from './ambient.js';
import { spatial } from './spatial.js';
initControls();
const ready = boot();
// Individual failures must never block the page or its other controls.
for (const init of [rain, glitch, crt, portrait, cursor, scrollEffects, ambient]) {
  try {
    init();
  } catch (error) {
    console.warn('Effect unavailable:', error);
  }
}
terminal(ready);
ready.then(scramble);

try {
  spatial(ready);
} catch (error) {
  console.warn('Spatial effects unavailable:', error);
}
