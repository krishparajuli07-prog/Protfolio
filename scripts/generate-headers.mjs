import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { siteConfig } from './site-config.mjs';

// Read the built bytes, so formatting changes and JSON-LD are covered too.
const hashes = new Set();
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await collect(path);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      for (const [, attributes, script] of html.matchAll(
        /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
      )) {
        if (!/\bsrc\s*=/i.test(attributes)) {
          hashes.add(`'sha256-${createHash('sha256').update(script).digest('base64')}'`);
        }
      }
    }
  }
}
await collect('dist');
const { base } = siteConfig();
const config = JSON.parse(await readFile('config/security.headers.json', 'utf8'));
const csp = Object.entries(config.csp)
  .map(([name, values]) => {
    const sources = values.flatMap((value) =>
      value === "'THEME_HASH'" ? [...hashes].sort() : [value]
    );
    return [name, ...sources].join(' ');
  })
  .join('; ');
const headers = [...config.headers, { name: 'Content-Security-Policy', value: csp }];
const headerText = `/*\n${headers.map((h) => `  ${h.name}: ${h.value}`).join('\n')}\n`;
const nginxHeaders = headers
  .map((h) => `add_header ${h.name} ${JSON.stringify(h.value)} always;`)
  .join('\n');
const caddyHeaders = headers.map((h) => `  ${h.name} ${JSON.stringify(h.value)}`).join('\n');
const nginxTemplate = await readFile('deploy/docker/nginx.conf', 'utf8');
const caddyTemplate = await readFile('deploy/docker/Caddyfile', 'utf8');
const outputs = {
  'dist/_headers': headerText,
  'dist/.nojekyll': '',
  'deploy/cloudflare/_headers': headerText,
  'deploy/netlify/_headers': headerText,
  'deploy/github-pages/.nojekyll': '',
  'deploy/generated/site.json': JSON.stringify({ base }, null, 2) + '\n',
  'deploy/generated/headers.json': JSON.stringify(headers, null, 2) + '\n',
  'deploy/docker/headers.conf': nginxHeaders + '\n',
  'deploy/docker/headers.caddy': `header {\n${caddyHeaders}\n}\n`,
  'deploy/generated/nginx.conf': nginxTemplate.replaceAll('__BASE__', base),
  'deploy/generated/Caddyfile': caddyTemplate.replaceAll('__BASE__', base),
  'deploy/vercel/vercel.json':
    JSON.stringify(
      {
        headers: [
          { source: '/(.*)', headers: headers.map((h) => ({ key: h.name, value: h.value })) }
        ]
      },
      null,
      2
    ) + '\n'
};
for (const [path, text] of Object.entries(outputs)) {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  await writeFile(path, text);
}
console.log(`Generated host adapters from one policy (${hashes.size} script hashes).`);
