# Deploy the static artifact

`dist/` is the portable website: HTML, CSS, JavaScript and local assets.
No hosting account, GitHub account, application server or vendor SDK is
needed to build or serve it. GitHub Actions and each hosting adapter are optional.

## Build once

```sh
npm ci
SITE_URL=https://portfolio.example BASE_PATH= npm run build
npm run deploy:prepare
npm run test:portability
```

Use your actual public origin for `SITE_URL`. `BASE_PATH` is empty for a root
deployment or, for example, `/portfolio` for a subdirectory. Local `.env` is
supported; exported variables override it. These settings apply to canonical
URLs, RSS, sitemap, robots and asset paths.

`npm run deploy:prepare` copies the artifact into hosting-specific directory
layouts. It never rewrites its bytes or runs a second Astro build:

- `deploy/generated/publish/`: a static document root, mounted at `BASE_PATH`.
- `deploy/vercel/.vercel/output/`: Vercel Build Output API v3 packaging.
- GitHub project Pages already mounts at the repository path, so upload `dist/`
  directly rather than the document-root copy.

## Hosting choices

| Host                  | Published directory                 | Header support                   |
| --------------------- | ----------------------------------- | -------------------------------- |
| Any static web server | `dist/`, mounted at `BASE_PATH`     | Configure server headers         |
| Cloudflare Pages      | `deploy/generated/publish/`         | Generated `_headers`             |
| Netlify               | `deploy/generated/publish/`         | Generated `_headers`             |
| Vercel                | `deploy/vercel/.vercel/output/`     | Generated `config.json` routes   |
| GitHub Pages          | `dist/`                             | No configurable response headers |
| nginx                 | `dist/` or multi-stage Docker build | Generated `headers.conf`         |
| Caddy                 | `dist/`                             | Generated `headers.caddy`        |

See each platform's README in this directory for commands and account setup.

Security headers have one source, `config/security.headers.json`. The generator
hashes inline scripts from the actual built HTML, including JSON-LD, and writes
nginx, Caddy, Cloudflare, Netlify and Vercel configuration. GitHub Pages does not
apply `_headers`; HTTP-only protections such as HSTS and frame-ancestors require
a header-capable hosting layer. There is no meta-tag substitute for these headers.

## Self-host without a hosting account

After building, serve the existing artifact with either runtime:

```sh
docker compose --profile static up -d --wait
docker compose --profile static down
docker compose --profile caddy up --build -d --wait
docker compose --profile caddy down
```

Both use port 8080 and the same read-only `dist/`. For a single-command build and
serve, use `docker compose --profile prod up --build`. The nginx runtime copies
headers from its own build stage, so a clean checkout needs no generated files.
Set the same `BASE_PATH` in Compose that was used for the artifact. Put an HTTPS
terminating reverse proxy in front for public deployment.

For a quick file-only preview, `python3 -m http.server 8080 --directory dist`
works for root builds. This preview does not enforce the generated security
headers. No Node runtime is required to serve the finished website.

## GitHub CI/CD on Debian

Validation, security checks and artifact preparation run on GitHub-hosted runners.
Only the optional Debian publishing job uses `[self-hosted, linux, debian]`.
Set `ENABLE_DEBIAN_DEPLOY=true` to enable it. In this repository's
**Settings → Actions → Runners**, register your Debian runner and add the custom
label `debian`. The runner name alone does not select it. Keep this label unique
to the deployment machine, and install the runner as a service.

The runner needs Git, Docker Engine with the Compose v2 and Buildx plugins, and
permission for its service user to run Docker. `actions/setup-node` installs the
Node version from `.nvmrc`. Node 24 Actions require runner version 2.327.1 or
newer. Lighthouse is a required CI check on a GitHub-hosted runner.
Configure public HTTPS `SITE_URL`, optional `BASE_PATH`, and optional
`PROD_PORT` (default `8080`) under **Settings → Secrets and variables → Actions →
Variables**. All enabled deployment targets require `SITE_URL`.

Push to `main` to run validation, linting, type checks, tests, build and link checks.
After `ci` succeeds, `deploy.yml` checks out that exact commit, builds and validates
the production artifact, and publishes it to the configured hosts. Docker
deployment on the Debian runner runs only when explicitly enabled. Pull
requests only run CI. To deploy manually, run the **ci** workflow on **main**;
deployment still requires successful CI.

The `production-debian` job uses `deploy/self-hosted/compose.yml`, waits for the
nginx health check, and serves the site on `http://<debian-server>:8080` by default.
The image contains the built files; no runner workspace is mounted into production.
The container restarts after a server reboot if Docker is enabled at boot. Images
are tagged with the deployed commit SHA. Deployments are serialized, and a failed
health check fails the workflow and prints container logs. Set up HTTPS at your
reverse proxy and point `SITE_URL` to that public origin.

To run the same deployment locally after building and preparing the artifact:

```sh
docker compose -f deploy/self-hosted/compose.yml build
docker compose -f deploy/self-hosted/compose.yml up -d --wait --wait-timeout 90
```

## Optional managed-host deployments

The deployment workflow also publishes the same artifact to configured managed
hosts. Unconfigured hosts are skipped. If no host is configured, the configuration
job reports "Deployment disabled" and skips the production build and all
publishing jobs without raising a failure alert. Its summary explicitly says
that the website was not deployed. Partial host credentials, invalid public
URLs and actual publishing errors still fail the workflow.

Set repository variables `SITE_URL` and optional `BASE_PATH`. Set only the
credentials for the hosts you choose (repository secrets are used for detection):

- Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; repository variable
  `CLOUDFLARE_PROJECT_NAME`.
- Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Netlify: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.
- GitHub Pages: repository variable `ENABLE_GITHUB_PAGES=true`; enable Actions
  as the Pages source. GitHub supplies the job-scoped token.

Configure approval rules on `production-cloudflare`, `production-vercel`,
`production-netlify` and/or `github-pages` environments as appropriate.
The production workflow does not publish pull requests.

## Host migration

1. Keep the public domain and path: reuse `dist/` byte-for-byte on the new host.
2. Copy its generated header configuration or run `npm run deploy:prepare`
   for a platform directory layout. No application changes are needed.
3. Verify the home page, a case-study URL, an asset, a 404 and response headers.
4. Switch DNS after the destination is ready. DNS propagation is external.

If the public origin or path changes, update `SITE_URL` / `BASE_PATH` and rebuild
so canonical URLs, feeds and asset URLs are correct. This is a URL configuration
change, not a host-specific application build.
