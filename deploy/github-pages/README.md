# GitHub Pages (optional)

1. Set Settings → Pages → Source to GitHub Actions.
2. Set repository variable `ENABLE_GITHUB_PAGES=true`.
3. Set `SITE_URL` to your public origin. For project Pages, set `BASE_PATH`
   to `/repository-name`; for a root custom domain leave it empty.
4. Run the optional deployment workflow after CI succeeds on main.

The Pages artifact is `dist/`. The generated `.nojekyll` marker prevents Jekyll
processing when uploading through a branch-based deployment instead.

Pages cannot apply custom HTTP response headers. `_headers` is ignored, and
this app does not inject a fallback CSP meta tag. Use a header-capable proxy
or another hosting target when response-header enforcement is required.
