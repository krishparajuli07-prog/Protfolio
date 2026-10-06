import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { statSync } from 'node:fs';
import { siteConfig } from './site-config.mjs';
const { base } = siteConfig();
// Internal link + asset checker: every absolute internal href/src in dist/*.html must exist on disk.
const root = process.argv[2] ?? 'dist';
const files = [];
async function walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
}
await walk(root);
let bad = 0;
for (const f of files) {
  const html = await readFile(f, 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (base && !ref.startsWith(`${base}/`) && ref !== base) {
      console.error(`link outside BASE_PATH in ${f}: ${ref}`);
      bad++;
      continue;
    }
    const clean = ref.slice(base.length) || '/';
    // try: exact file, .html variant, /index.html variant
    const cands = [`${root}${clean}`, `${root}${clean}.html`, `${root}${clean}/index.html`];
    if (
      cands.some((c) => {
        try {
          return statSync(c).isFile();
        } catch {
          return false;
        }
      })
    )
      continue;
    // directory with index.html (format: file still emits nested index? no, be permissive)
    console.error(`broken-link in ${f}: ${ref}`);
    bad++;
  }
}
if (bad) {
  console.error(`${bad} broken links`);
  process.exit(1);
}
console.log(`links-ok: ${files.length} html files checked`);
