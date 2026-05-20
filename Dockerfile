# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm (固定版本以匹配本地环境)
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

# Install build dependencies for native modules (better-sqlite3 需要 node-gyp 编译)
# python3, g++, make 是编译 better-sqlite3 原生 C++ 模块的必需依赖
RUN apk add --no-cache python3 py3-pip g++ make

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml* .npmrc* ./

# Install dependencies
RUN pnpm approve-builds
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js application
RUN pnpm build

# ============================================
# Stage 2: Production
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm (固定版本以匹配本地环境)
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Copy node_modules for better-sqlite3 native addon
COPY --from=builder /app/node_modules ./node_modules

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 2025

# Set environment variable for host
ENV HOSTNAME="0.0.0.0"
ENV PORT=2025

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2025/ || exit 1

# Start the application
COPY scripts/docker-entrypoint.cjs ./scripts/docker-entrypoint.cjs
CMD ["node", "scripts/docker-entrypoint.cjs"]
