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

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy drizzle config and migrations (if needed for runtime migrations)
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/db ./src/db

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the server
CMD ["bun", "run", "start"]
