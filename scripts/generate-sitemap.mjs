import { readdir, writeFile } from 'node:fs/promises';
import { siteConfig } from './site-config.mjs';
const { site, base } = siteConfig();
const origin = `${site}${base}`;
const urls = [];
async function walk(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await walk(`${dir}/${entry.name}`, relative);
    else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
      urls.push(`${origin}${relative.replace(/index\.html$/, '').replace(/\.html$/, '/')}`);
    }
  }
}
await walk('dist');
urls.sort();
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const sitemap = `${xml}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escape(url)}</loc></url>`).join('')}</urlset>\n`;
await writeFile('dist/sitemap.xml', sitemap);
await writeFile(
  'dist/sitemap-index.xml',
  `${xml}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${escape(origin)}/sitemap.xml</loc></sitemap></sitemapindex>\n`
);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`sitemap-ok: ${urls.length} urls`);
