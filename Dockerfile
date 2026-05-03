FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source
COPY . .

# Set build arguments for Vite
ARG VITE_GEMINI_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_TRANSLATION_API_KEY
ARG VITE_APP_ENV=production

# Run build with env vars available
RUN VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_GOOGLE_TRANSLATION_API_KEY=$VITE_GOOGLE_TRANSLATION_API_KEY \
    VITE_APP_ENV=$VITE_APP_ENV \
    npm run build

# ---- Production stage: nginx with security hardening ----
FROM nginx:1.27-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid

# Copy compiled assets
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html
COPY --chown=appuser:appgroup nginx.conf.template /etc/nginx/templates/default.conf.template

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/health || exit 1

# Cloud Run uses PORT env var
ENV PORT=8080
EXPOSE 8080

USER appuser

CMD ["nginx", "-g", "daemon off;"]
