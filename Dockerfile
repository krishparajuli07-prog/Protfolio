# syntax=docker/dockerfile:1.7
# Multi-stage: node build -> nginx-unprivileged runtime. No secrets in image.
# Vendor-neutral app: pure static dist/, no vendor SDK. Base images pinned by digest.
ARG NODE_TAG=22-alpine
ARG NGINX_TAG=stable-alpine
FROM node:${NODE_TAG}@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=https://krishparajuli.com.np
ARG BASE_PATH=
ENV SITE_URL=${SITE_URL} BASE_PATH=${BASE_PATH}
RUN npm run build

FROM nginxinc/nginx-unprivileged:${NGINX_TAG}@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3 AS runtime
ARG BASE_PATH=
COPY --from=build /app/dist /usr/share/nginx/html${BASE_PATH}/
COPY --from=build /app/deploy/generated/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/deploy/docker/headers.conf /etc/nginx/headers.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/__health >/dev/null || exit 1
USER nginx
