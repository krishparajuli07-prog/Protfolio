import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkPublicFiles } from '../scripts/check-public-files.mjs';
import { serializeJson } from '../src/utils/serialize-json.ts';

test('JSON-LD cannot terminate its script element through content', () => {
  const value = { title: '</script><script>alert(1)</script>' };
  const serialized = serializeJson(value);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), value);
});

test('public-file guard permits disclosure contacts but rejects private files and credentials', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-public-'));
  try {
    await mkdir(join(root, '.well-known'));
    await writeFile(join(root, '.well-known/security.txt'), 'Contact: mailto:hello@example.com');
    await checkPublicFiles(root);
    for (const name of ['.env.local', 'backup.sql', 'bundle.js.map', 'key.pem']) {
      await writeFile(join(root, name), 'fixture');
      await assert.rejects(checkPublicFiles(root), /private, backup or debug file/);
      await rm(join(root, name));
    }
    const token = 'ghp_' + 'A'.repeat(36);
    await writeFile(join(root, 'config.json'), JSON.stringify({ token }));
    await assert.rejects(checkPublicFiles(root), (error) => {
      assert.match(error.message, /possible credential material/);
      assert.ok(!error.message.includes(token));
      return true;
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
