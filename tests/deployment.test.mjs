import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentTargets } from '../scripts/deployment-targets.mjs';

test('deployment cannot succeed without a publishing target', () => {
  assert.throws(() => deploymentTargets({}), /No deployment target/);
  assert.throws(() => deploymentTargets({ CF_TOKEN: 'test-token' }), /Incomplete cloudflare/);
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
