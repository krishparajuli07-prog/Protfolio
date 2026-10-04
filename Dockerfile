# syntax=docker/dockerfile:1.7
# Multi-stage: node build -> nginx-unprivileged runtime. No secrets in image.
# Vendor-neutral app: pure static dist/, no vendor SDK. Base images pinned by digest.
ARG NODE_TAG=22.12.0-alpine3.20
ARG NGINX_TAG=1.27.3-alpine3.20
FROM node:${NODE_TAG}@sha256:027911463b296bdaf6df82b5ccf2c6b290fee725d5fba6513a037ed019400625 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=https://example.com
ARG BASE_PATH=
ENV SITE_URL=${SITE_URL} BASE_PATH=${BASE_PATH}
RUN npm run build

FROM nginxinc/nginx-unprivileged:${NGINX_TAG}@sha256:9e7238f579a54582263a960d1b0094b4a3ecce641342eda3f8e2ff82b1703d2b AS runtime
ARG BASE_PATH=
COPY --from=build /app/dist /usr/share/nginx/html${BASE_PATH}/
COPY --from=build /app/deploy/generated/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/deploy/docker/headers.conf /etc/nginx/headers.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/__health >/dev/null || exit 1
USER nginx
