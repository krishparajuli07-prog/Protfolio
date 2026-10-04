import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';

describe('content integrity', () => {
  it('uses only owner data facts', async () => {
    const certs = JSON.parse(await readFile('src/data/certifications.json', 'utf8'));
    const titles = certs.map((c) => c.title);
    assert.ok(titles.includes('Junior Penetration Tester'));
    assert.ok(!JSON.stringify(certs).includes('OSCP'));
  });
  it('stats are not hardcoded on home', async () => {
    const home = await readFile('src/pages/index.astro', 'utf8');
    assert.ok(home.includes('getCollection'));
    assert.ok(!home.includes('CEH'));
    assert.ok(home.includes('Top 100'));
  });
});
