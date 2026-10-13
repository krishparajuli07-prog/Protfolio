FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3
# Patch the pinned base: CVE-2026-4775 is fixed in tiff 4.7.2-r0.
USER root
RUN apk add --no-cache --upgrade 'tiff>=4.7.2-r0'
USER nginx
