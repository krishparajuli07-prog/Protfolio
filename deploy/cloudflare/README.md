# Cloudflare Pages (optional)

1. Create a Pages project using direct upload.
2. Run the build and `npm run deploy:prepare` from the repository root.
3. Set `CLOUDFLARE_API_TOKEN` (Pages edit permission), `CLOUDFLARE_ACCOUNT_ID`
   and `CLOUDFLARE_PROJECT_NAME` in your shell.
4. With Node 24 available, deploy:

```sh
npx --yes wrangler@4.145.0 pages deploy deploy/generated/publish --project-name="$CLOUDFLARE_PROJECT_NAME" --branch=main
```

The generated `_headers` is applied by Pages. For GitHub automation, use the
same named token/account secrets and project-name variable. The app itself
does not import Wrangler or contact Cloudflare at runtime.
