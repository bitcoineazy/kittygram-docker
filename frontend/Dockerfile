# syntax=docker/dockerfile:1

# global build args (must precede the first FROM)
ARG NODE_VERSION=16
ARG NGINX_VERSION=1.30

# ---------- build stage ----------
# node 16: vue-cli 4 / webpack 4 do not run on the OpenSSL 3 of node >= 17
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# dependencies first: cached until package*.json change
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .

# where the browser sends API calls: a relative prefix keeps nginx as the single entry point
ARG VUE_APP_API_URL=/api
ARG VUE_APP_PUBLIC_PATH=/
ENV VUE_APP_API_URL=${VUE_APP_API_URL} \
    VUE_APP_PUBLIC_PATH=${VUE_APP_PUBLIC_PATH} \
    NODE_ENV=production
RUN npm run build

# ---------- runtime stage ----------
# unprivileged nginx: runs as uid 101, listens on 8080, writable dirs prepared
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine-slim

LABEL org.opencontainers.image.title="momo-store-frontend" \
      org.opencontainers.image.source="https://github.com/bitcoineazy/kittygram-docker"

# alpine-slim = nginx without the dynamic modules (xslt/image-filter/geoip/njs)
# and their libraries (libxml2, libxslt, libgd) - fewer packages, fewer CVEs.
# apk upgrade pulls the latest Alpine security fixes into the runtime layer.
USER root
RUN apk upgrade --no-cache

# nginx image renders /etc/nginx/templates/*.template with envsubst on start
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# runtime knobs (used by the template)
ENV BACKEND_URL=http://backend:8081 \
    NGINX_PORT=8080

EXPOSE 8080
USER nginx

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:${NGINX_PORT}/healthz || exit 1
