import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function deploymentTargets(env) {
  const groups = {
    cloudflare: ['CF_TOKEN', 'CF_ACCOUNT', 'CF_PROJECT'],
    vercel: ['VC_TOKEN', 'VC_ORG', 'VC_PROJECT'],
    netlify: ['NL_TOKEN', 'NL_SITE']
  };
  const targets = {};
  for (const [host, keys] of Object.entries(groups)) {
    const present = keys.filter((key) => env[key]?.trim());
    if (present.length && present.length !== keys.length) {
      throw new Error(`Incomplete ${host} deployment configuration. See deploy/README.md.`);
    }
    targets[host] = present.length === keys.length;
  }
  targets.pages = env.PAGES === 'true';
  targets.debian = env.DEBIAN === 'true';
  if (!Object.values(targets).some(Boolean)) {
    throw new Error(
      'No deployment target configured. Set hosting credentials or enable GitHub Pages or Debian. See deploy/README.md.'
    );
  }
  let origin;
  try {
    origin = new URL(env.PUBLIC_SITE);
  } catch {
    throw new Error('Set the public SITE_URL repository variable before deploying.');
  }
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
  ) {
    throw new Error('SITE_URL must be a public HTTPS origin; set subdirectories with BASE_PATH.');
  }
  return targets;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const targets = deploymentTargets(process.env);
    for (const [host, enabled] of Object.entries(targets)) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${host}=${enabled}\n`);
    }
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Configured deployment targets: ${Object.keys(targets)
        .filter((host) => targets[host])
        .join(', ')}.\n`
    );
  } catch (error) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Deployment blocked: ${error.message}\n`);
    console.error(error.message);
    process.exitCode = 1;
  }
}
