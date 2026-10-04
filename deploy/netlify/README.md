# Netlify (optional)

1. Create a Netlify site.
2. Build and run `npm run deploy:prepare` from the repository root.
3. Export `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` in your shell.
4. With Node 24 available, deploy:

```sh
npx --yes netlify-cli@27.10.2 deploy --dir deploy/generated/publish --prod --no-build
```

For a root build you can also upload `dist/` through the dashboard. `_headers`
is generated from the shared policy and applied natively. GitHub automation
uses the same secret names. Netlify CLI is deployment tooling only.
