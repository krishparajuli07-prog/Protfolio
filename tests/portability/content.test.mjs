import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { siteConfig } from '../../scripts/site-config.mjs';

// Inspect the publishable artifact, so collection migrations cannot silently
// change existing feed URLs or ship a placeholder as a downloadable PDF.
test('RSS entries point to published writeups', async () => {
  const { site, base } = siteConfig();
  const feed = await readFile('dist/rss.xml', 'utf8');
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  assert.equal(items.length, 3);
  for (const [, item] of items) {
    const link = item.match(/<link>([^<]+)<\/link>/)?.[1];
    assert.ok(link, 'Each RSS item needs a link');
    const url = new URL(link);
    assert.equal(url.origin, site);
    assert.ok(url.pathname.startsWith(`${base}/writeups/`));
    const page = await readFile(`dist${url.pathname.slice(base.length)}index.html`, 'utf8');
    assert.match(page, /<h1>/);
  }
});

test('resume supports printing without inline event handlers or a fake PDF', async () => {
  const page = await readFile('dist/resume/index.html', 'utf8');
  assert.match(page, /Print \/ Save as PDF/);
  assert.doesNotMatch(page, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(page, /href=["'].*resume\.pdf/);
  await assert.rejects(access('dist/resume.pdf'), { code: 'ENOENT' });
});
