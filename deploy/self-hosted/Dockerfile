FROM nginxinc/nginx-unprivileged:1.27.3-alpine3.20@sha256:9e7238f579a54582263a960d1b0094b4a3ecce641342eda3f8e2ff82b1703d2b
ARG BASE_PATH=
COPY dist/ /usr/share/nginx/html${BASE_PATH}/
COPY deploy/generated/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/headers.conf /etc/nginx/headers.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/__health >/dev/null || exit 1
USER nginx
