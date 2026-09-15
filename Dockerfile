# Multi-stage Dockerfile for Dashboard-XB (Nginx Docker App)
# Repository context: https://github.com/Frandaken/Dashboard-XB

# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Metadata labels
LABEL org.opencontainers.image.title="Dashboard Jadwal Kelas XB"
LABEL org.opencontainers.image.source="https://github.com/Frandaken/Dashboard-XB"
LABEL org.opencontainers.image.url="https://github.com/Frandaken/Dashboard-XB"
LABEL org.opencontainers.image.licenses="MIT"

# Install dependencies (respecting lockfile if present)
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Copy application source code
COPY . .

# Build production assets (outputs to /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Production Nginx Server
# ==========================================
FROM nginx:alpine AS runner

LABEL org.opencontainers.image.title="Dashboard Jadwal Kelas XB"
LABEL org.opencontainers.image.source="https://github.com/Frandaken/Dashboard-XB"
LABEL org.opencontainers.image.url="https://github.com/Frandaken/Dashboard-XB"

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose container HTTP port
EXPOSE 80

# Health check against Nginx endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/api/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
