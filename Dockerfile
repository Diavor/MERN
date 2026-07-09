# syntax=docker/dockerfile:1

# --- Stage 1: build the React frontend ------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV CI=false
RUN npm run build

# --- Stage 2: install production backend deps only ------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 3: lean runtime image ------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY backend/ ./backend/
COPY --from=frontend /app/frontend/build ./frontend/build

# Run as an unprivileged user; ensure the local upload dir exists & is writable.
RUN mkdir -p uploads \
  && addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app

EXPOSE 5001

# Liveness: hit the app's own health endpoint (Node 22 has global fetch).
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5001)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
