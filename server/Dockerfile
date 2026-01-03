# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Add labels for container metadata
LABEL org.opencontainers.image.source="https://github.com/wavilikhin/bookmarks-index"
LABEL org.opencontainers.image.description="Bookmarks Index API Server"

WORKDIR /app

# Create non-root user for security (Debian syntax for bun:slim)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/false bunuser

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R bunuser:nodejs /app/logs

# Copy built artifacts and dependencies
COPY --from=builder --chown=bunuser:nodejs /app/dist ./dist
COPY --from=builder --chown=bunuser:nodejs /app/package.json ./
COPY --from=builder --chown=bunuser:nodejs /app/node_modules ./node_modules

# Copy drizzle config and schema for runtime migrations
COPY --from=builder --chown=bunuser:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=bunuser:nodejs /app/src/db ./src/db

# Copy drizzle migrations folder (will be empty if not generated yet)
COPY --from=builder --chown=bunuser:nodejs /app/drizzle ./drizzle

# Set production environment
ENV NODE_ENV=production
ENV LOG_TO_FILE=true
ENV LOG_DIR=/app/logs

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3000

# Health check using bun (curl/wget not available in slim image)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server (migrations run on startup if RUN_MIGRATIONS=true)
CMD ["bun", "run", "start"]
