import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { Script } from 'node:vm';

async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(`${dir}/${prefix}`, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(dir, `${path}/`)));
    else result.push(path);
  }
  return result;
}
const { base } = JSON.parse(await readFile('deploy/generated/site.json', 'utf8'));
const headers = JSON.parse(await readFile('deploy/generated/headers.json', 'utf8'));
const csp = headers.find((h) => h.name === 'Content-Security-Policy').value;

test('hosting envelopes preserve every artifact byte', async () => {
  for (const file of await files('dist')) {
    const original = await readFile(`dist/${file}`);
    for (const root of ['deploy/generated/publish', 'deploy/vercel/.vercel/output/static']) {
      assert.deepEqual(await readFile(`${root}${base}/${file}`), original, `${root}: ${file}`);
    }
  }
});

test('every hosting adapter receives the same security policy', async () => {
  const nginx = await readFile('deploy/docker/headers.conf', 'utf8');
  const caddy = await readFile('deploy/docker/headers.caddy', 'utf8');
  const edge = await readFile('dist/_headers', 'utf8');
  const vercel = JSON.parse(await readFile('deploy/vercel/.vercel/output/config.json', 'utf8'));
  for (const { name, value } of headers) {
    assert.ok(nginx.includes(`${name} ${JSON.stringify(value)}`));
    assert.ok(caddy.includes(`${name} ${JSON.stringify(value)}`));
    assert.ok(edge.includes(`${name}: ${value}`));
    assert.equal(vercel.routes[0].headers[name], value);
  }
});

test('runtime assets are self-hosted and inline scripts match CSP', async () => {
  for (const file of (await files('dist')).filter((path) => path.endsWith('.html'))) {
    const html = await readFile(`dist/${file}`, 'utf8');
    assert.doesNotMatch(html, /(?:src|srcset)=["'](?:https?:)?\/\//i, file);
    for (const [, attributes, script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/i.test(attributes)) continue;
      const hash = createHash('sha256').update(script).digest('base64');
      assert.ok(csp.includes(`'sha256-${hash}'`), `${file}: script is blocked`);
    }
  }
  new Script(await readFile('dist/js/main.js', 'utf8'));
});

test('metadata respects the configured mount path', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const [, location] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
    assert.ok(new URL(location).pathname.startsWith(`${base}/`));
  }
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.doesNotMatch(robots, /\{\{/);
  assert.ok(robots.includes(`${base}/sitemap.xml`));
});
