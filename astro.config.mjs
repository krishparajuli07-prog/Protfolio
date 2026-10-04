import { defineConfig } from 'astro/config';
import { siteConfig } from './scripts/site-config.mjs';

// SITE_URL and BASE_PATH come from environment so the same dist/
// works on any static host. No trailing slash on SITE_URL.
const { site: SITE_URL, base: BASE_PATH } = siteConfig();

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH ? `${BASE_PATH}/` : '/',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true
    }
  },
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  }
});
