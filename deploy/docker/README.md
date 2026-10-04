# Self-hosted static serving

Build and serve from a clean checkout:

```sh
docker compose --profile prod up --build
```

Serve an existing build without rebuilding the website:

```sh
docker compose --profile static up -d --wait
```

Or use Caddy on the same artifact:

```sh
docker compose --profile caddy up --build -d --wait
```

Run one profile at a time on port 8080. Set `PROD_PORT` for another port.
All runtimes use non-root users, read-only filesystems, dropped capabilities,
no-new-privileges, health checks and gzip. Both generated configurations use
the same policy, including on static assets and error responses.

`nginx.conf` and `Caddyfile` are templates. The build renders them under
`deploy/generated/` for `BASE_PATH`, and generates `headers.conf` and
`headers.caddy` from `config/security.headers.json`. Keep these generated
files with their matching artifact. The Caddy image removes its default
privileged-port file capability because it listens on port 8080.
