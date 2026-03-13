# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm (built into Node 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
# Copy SDK first as it's a dependency
COPY packages/sdk ./packages/sdk
# Copy services
COPY services ./services

# Install dependencies and build SDK
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @stbr/sss-token-sdk build

# Build services
WORKDIR /app/services
RUN pnpm build \
    && rm -rf node_modules \
    && rm -rf ../packages/sdk/node_modules

# Production stage - minimal size
FROM node:20-alpine
WORKDIR /app/services

# Install only runtime dependencies (no build tools)
RUN apk add --no-cache tini \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Copy only what's needed for production
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/
COPY --from=builder /app/packages/sdk/package.json /app/packages/sdk/
COPY --from=builder /app/packages/sdk/dist /app/packages/sdk/dist
COPY --from=builder /app/services/package.json /app/services/
COPY --from=builder /app/services/dist /app/services/dist
COPY --from=builder /app/services/drizzle.config.ts /app/services/

# Install production dependencies with aggressive optimization
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist --prefer-offline \
    && pnpm store prune \
    && rm -rf /root/.local/share/pnpm/store \
    && rm -rf /root/.cache \
    && rm -rf /tmp/* \
    && find /app -name "*.map" -type f -delete \
    && find /app -name "*.ts" -not -path "*/dist/*" -type f -delete \
    && find /app -name "README*" -type f -delete \
    && find /app -name "*.md" -type f -delete \
    && find /app -name "LICENSE*" -type f -delete \
    && find /app/node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -name "*.d.ts" -type f -delete \
    && find /app/node_modules -name "*.spec.js" -type f -delete \
    && find /app/node_modules -name "*.test.js" -type f -delete

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production \
    DATABASE_URL="file:./db/dev.db"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run as non-root user for security
USER node

# Start the server
CMD ["node", "dist/src/index.js"]
