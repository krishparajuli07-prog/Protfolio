import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentTargets } from '../scripts/deployment-targets.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('unconfigured hosting disables publishing while partial configuration fails', () => {
  assert.ok(Object.values(deploymentTargets({})).every((enabled) => !enabled));
  assert.throws(() => deploymentTargets({ CF_TOKEN: 'test-token' }), /Incomplete cloudflare/);
});

test('unconfigured workflow reports disabled deployment and exits successfully', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-deploy-'));
  try {
    const output = join(directory, 'output');
    const summary = join(directory, 'summary');
    const result = spawnSync(process.execPath, ['scripts/deployment-targets.mjs'], {
      env: { GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(await readFile(output, 'utf8'), /enabled=false/);
    assert.match(await readFile(summary, 'utf8'), /website was not deployed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('configured deployment requires a public HTTPS origin', () => {
  for (const PUBLIC_SITE of [
    '',
    'http://localhost:8080',
    'https://localhost',
    'https://example.com/path'
  ]) {
    assert.throws(() => deploymentTargets({ PAGES: 'true', PUBLIC_SITE }), /SITE_URL/);
  }
});

test('managed hosting and explicit opt-in select only configured targets', () => {
  const targets = deploymentTargets({
    CF_TOKEN: 'test-token',
    CF_ACCOUNT: 'test-account',
    CF_PROJECT: 'test-project',
    PUBLIC_SITE: 'https://krishparajuli.com.np',
    DEBIAN: 'false'
  });
  assert.deepEqual(targets, {
    cloudflare: true,
    vercel: false,
    netlify: false,
    pages: false,
    debian: false
  });
  assert.equal(
    deploymentTargets({ DEBIAN: 'true', PUBLIC_SITE: 'https://krishparajuli.com.np' }).debian,
    true
  );
});
