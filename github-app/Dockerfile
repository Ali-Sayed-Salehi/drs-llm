# github-app/Dockerfile
FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

WORKDIR /workspace

# tini for proper signal handling, curl for healthcheck
RUN apk add --no-cache tini curl bash coreutils

COPY package*.json ./
COPY *.pem ./
RUN npm ic --omit=dev

COPY . .

# Probot listens on PORT (defaults to 3000)
EXPOSE 3000

USER node

ENTRYPOINT ["/bin/bash"]
# ENTRYPOINT ["/sbin/tini","--"]
# CMD ["npm","start"]