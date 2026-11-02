import { build } from 'rolldown';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/effects', { recursive: true });
for (const [input, file] of [
  ['src/effects/index.js', 'public/effects/bundle.js'],
  ['src/effects/scene-entry.js', 'public/effects/scene.bundle.js']
]) {
  await build({ input, output: { file, format: 'iife', minify: true } });
}
await copyFile('node_modules/three/LICENSE', 'public/effects/THREE-LICENSE.txt');
console.log('Built core effects and lazy 3D scene.');
