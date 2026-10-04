import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Build Output API v3: wrap the artifact, never rebuild or rewrite its bytes.
const destination = resolve('deploy/vercel/.vercel/output');
const { base } = JSON.parse(await readFile('deploy/generated/site.json', 'utf8'));
const headers = JSON.parse(await readFile('deploy/generated/headers.json', 'utf8'));
await rm(destination, { recursive: true, force: true });
await mkdir(`${destination}/static${base}`, { recursive: true });
await cp('dist', `${destination}/static${base}`, { recursive: true });
await writeFile(
  `${destination}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '/(.*)',
          headers: Object.fromEntries(headers.map((h) => [h.name, h.value])),
          continue: true
        },
        { handle: 'filesystem' },
        { src: '/(.*)', status: 404, dest: `${base}/404.html` }
      ]
    },
    null,
    2
  ) + '\n'
);
console.log(`Vercel envelope prepared at ${destination}; dist/ is unchanged.`);
