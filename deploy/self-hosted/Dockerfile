FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3
# Patch the pinned base: CVE-2026-4775 is fixed in tiff 4.7.2-r0.
USER root
RUN apk add --no-cache --upgrade 'tiff>=4.7.2-r0'
ARG BASE_PATH=
COPY dist/ /usr/share/nginx/html${BASE_PATH}/
COPY deploy/generated/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/headers.conf /etc/nginx/headers.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/__health >/dev/null || exit 1
USER nginx
