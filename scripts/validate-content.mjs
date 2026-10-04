import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Validates src/content data files against the same rules as Astro schemas.
// Fails CI on invented/missing fields, bad dates, or empty required sections.
const fail = (m) => {
  console.error(`content-error: ${m}`);
  process.exitCode = 1;
};

const certs = JSON.parse(await readFile('src/data/certifications.json', 'utf8'));
const allowed = new Set(['Complete', 'Next', 'Planned']);
for (const c of certs) {
  if (!c.title || !c.issuer || !c.status) fail(`cert missing field: ${JSON.stringify(c)}`);
  if (!allowed.has(c.status)) fail(`bad cert status: ${c.status}`);
  if (c.date && Number.isNaN(Date.parse(c.date))) fail(`bad cert date: ${c.date}`);
}

const hacks = JSON.parse(await readFile('src/data/hacktivities.json', 'utf8'));
for (const h of hacks) {
  if (!h.title || !h.type || !h.date) fail(`hacktivity missing field: ${JSON.stringify(h)}`);
}

const projs = await readdir('src/content/projects');
if (projs.length === 0) fail('no projects found');
for (const f of projs) {
  const t = await readFile(`src/content/projects/${f}`, 'utf8');
  if (!t.startsWith('---')) fail(`${f}: missing frontmatter`);
  for (const k of ['title', 'year', 'summary', 'tags', 'scope', 'methodology', 'tools']) {
    if (!t.includes(`${k}:`)) fail(`${f}: missing ${k}`);
  }
  if (/password|passwd.*root|BEGIN .*PRIVATE KEY/i.test(t))
    fail(`${f}: looks like real secret material`);
}

const posts = await readdir('src/content/writeups');
if (posts.length === 0) fail('no writeups found');

// Stats sanity: recompute and print (never hardcoded in components)
let findings = 0;
for (const f of projs) {
  const t = await readFile(`src/content/projects/${f}`, 'utf8');
  const m = t.match(/findingsCount:\s*(\d+)/);
  if (m) findings += Number(m[1]);
}
console.log(
  `content-ok: projects=${projs.length} findings=${findings} certsComplete=${certs.filter((c) => c.status === 'Complete').length} posts=${posts.length}`
);
if (!existsSync('src/data/site.yaml')) fail('site.yaml missing');
