# ---- Stage 1: build project React (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app

# Path di-prefix "frontend/" karena build context adalah ROOT REPO
# (dipakai saat context: URL Git, yang selalu clone keseluruhan repo,
# bukan hanya subfolder frontend/ ini).
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
ARG VITE_APP_VERSION=""
ARG APP_VERSION=""
RUN EFFECTIVE_VER="${VITE_APP_VERSION:-$APP_VERSION}"; \
    if [ -n "$EFFECTIVE_VER" ]; then VITE_APP_VERSION="$EFFECTIVE_VER" npm run build; else npm run build; fi

# ---- Stage 2: serve hasil build pakai nginx ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.d/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-env-config.sh && chmod +x /docker-entrypoint.d/40-env-config.sh
EXPOSE 80
