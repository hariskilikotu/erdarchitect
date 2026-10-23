# ---- Contribution app: production image ----
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies (cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application code
COPY src ./src
COPY public ./public

# Run as the unprivileged "node" user that ships with the base image
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/health || exit 1

# Apply any pending migrations, then start the server.
# "exec" lets Node receive SIGTERM so the container shuts down cleanly.
CMD ["sh", "-c", "node src/db/migrate.js && exec node src/server.js"]
