# Vercel (optional)

1. Create a Vercel project. Record its project ID and team/account ID.
2. From the repository root, build and run `npm run deploy:prepare`.
3. Export `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
4. With Node 24 available, deploy the prepared output:

```sh
cd deploy/vercel
npx --yes vercel@62.0.0 deploy --prebuilt --prod --yes --token "$VERCEL_TOKEN"
```

`--prebuilt` requires `.vercel/output/config.json` and `.vercel/output/static/`;
passing `dist/` directly is insufficient. `prepare.mjs` creates that structure
with the original artifact bytes and generated response headers. Its Build
Output API routes apply headers and the custom 404. The adjacent `vercel.json`
is a generated header reference for conventional Vercel deployments.

GitHub automation uses the same secret names. No Vercel adapter, runtime,
function or SDK is part of the website.
