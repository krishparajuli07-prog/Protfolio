import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function checkPublicFiles(root) {
  const problems = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = relative(root, path);
      if (
        entry.isSymbolicLink() ||
        /^\.(?:env(?:\.|$)|git(?:$|ignore$)|npmrc$)/i.test(entry.name) ||
        /\.(?:pem|key|p12|pfx|sqlite3?|db|sql|bak|map)$/i.test(entry.name)
      ) {
        problems.push(`${name}: private, backup or debug file`);
      } else if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        const contents = await readFile(path, 'utf8');
        if (
          /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/.test(contents) ||
          /\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|sk_live_[A-Za-z0-9]{20,})\b/.test(
            contents
          )
        ) {
          // Never include the suspected secret in a public Actions log.
          problems.push(`${name}: possible credential material`);
        }
      }
    }
  }
  await visit(root);
  if (problems.length) throw new Error(`Unsafe public files:\n${problems.join('\n')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkPublicFiles(process.argv[2] || 'dist');
  console.log('Public-file exposure checks passed.');
}
