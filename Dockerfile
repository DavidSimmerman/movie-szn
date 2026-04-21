# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS base
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --omit=optional

FROM base AS build
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM base AS run
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    BODY_SIZE_LIMIT=1M \
    PROTOCOL_HEADER=x-forwarded-proto \
    HOST_HEADER=x-forwarded-host \
    ADDRESS_HEADER=x-forwarded-for \
    OG_CACHE_DIR=/app/og-cache
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.js ./scripts/migrate.js
COPY --from=build /app/scripts/og-screenshot.js ./scripts/og-screenshot.js
RUN mkdir -p /app/og-cache
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["sh", "-c", "node scripts/migrate.js && node build"]
