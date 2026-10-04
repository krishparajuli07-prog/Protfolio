import { loadEnvFile } from 'node:process';

// Keep Astro and standalone build scripts on the same configuration.
// Exported environment variables take precedence over local .env values.
try {
  loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

export function siteConfig(env = process.env) {
  const site = new URL(env.SITE_URL || 'http://localhost:4321');
  if (
    !['http:', 'https:'].includes(site.protocol) ||
    site.pathname !== '/' ||
    site.search ||
    site.hash ||
    site.username ||
    site.password
  ) {
    throw new Error('SITE_URL must be an HTTP(S) origin; use BASE_PATH for a subdirectory.');
  }
  const base = `/${(env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`;
  if (!/^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?$/.test(base)) {
    throw new Error(
      'BASE_PATH must contain only slash-separated letters, numbers, underscores or hyphens.'
    );
  }
  return { site: site.origin, base: base === '/' ? '' : base };
}
