import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Build-time stats builder (informational; pages compute their own stats).
const projs = await readdir('src/content/projects');
let findings = 0;
for (const f of projs) {
  const t = await readFile(join('src/content/projects', f), 'utf8');
  findings += Number(t.match(/findingsCount:\s*(\d+)/)?.[1] ?? 0);
}
console.log(
  JSON.stringify({ projectsCompleted: projs.length, findingsDocumented: findings }, null, 2)
);
