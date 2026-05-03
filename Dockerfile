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

# Copy compiled assets
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run uses PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
