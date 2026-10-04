import { cp, mkdir, readFile, rm } from 'node:fs/promises';

// Mount the unmodified artifact at BASE_PATH on hosts with a fixed web root.
const { base } = JSON.parse(await readFile('deploy/generated/site.json', 'utf8'));
const root = 'deploy/generated/publish';
await rm(root, { recursive: true, force: true });
await mkdir(`${root}${base}`, { recursive: true });
await cp('dist', `${root}${base}`, { recursive: true });
if (base) {
  await cp('dist/_headers', `${root}/_headers`);
  await cp('dist/404.html', `${root}/404.html`);
}
console.log(`Static hosting envelope prepared at ${root}; dist/ is unchanged.`);
