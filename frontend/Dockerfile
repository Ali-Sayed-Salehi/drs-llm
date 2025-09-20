# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /workspace

# pick up Vite vars as build args and export to env before build
ARG VITE_API_BASE
ARG VITE_SEQ_CLS_API_PATH
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_SEQ_CLS_API_PATH=$VITE_SEQ_CLS_API_PATH

# 1) Install deps (includes dev deps for Vite/TS)
COPY package*.json ./
RUN npm ci

# 2) Copy source and build the frontend (assumes vite.config.ts has base: '/drs/')
COPY . .
ENV CI=1
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production
ENV PORT=3173
ENV HOST=0.0.0.0

# Install bash (and coreutils for GNU 'date' etc.)
RUN apk add --no-cache bash coreutils

# 3) Install only runtime deps (express, compression, helmet, etc.)
COPY package*.json ./
RUN npm ci --omit=dev

# 4) Copy built assets and server file
COPY --from=builder /workspace/dist ./dist
COPY --from=builder /workspace/server.js ./server.js

EXPOSE 3173
ENTRYPOINT ["/bin/bash"]
