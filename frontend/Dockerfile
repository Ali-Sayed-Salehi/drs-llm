# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 1) Install deps (includes dev deps for Vite/TS)
COPY package*.json ./
RUN npm ci

# 2) Copy source and build the frontend (assumes vite.config.ts has base: '/drs/')
COPY . .
ENV CI=1
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3173
ENV HOST=0.0.0.0

# 3) Install only runtime deps (express, compression, helmet, etc.)
COPY package*.json ./
RUN npm ci --omit=dev

# 4) Copy built assets and server file
COPY --from=builder /app/dist ./dist
# If your server is JS already:
COPY --from=builder /app/server.js ./server.js


# 5) (Optional) run as non-root user for security
# The "node" user exists in the node image
USER node

EXPOSE 3173
CMD ["node", "server.js"]
