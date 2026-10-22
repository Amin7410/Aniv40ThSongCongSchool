# syntax=docker/dockerfile:1.7
# Image chạy non-root, chỉ chứa bản build standalone của Next.js + Payload.
FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build không cần CSDL (mọi trang render động); biến dưới chỉ để config khởi tạo được.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build PAYLOAD_SECRET=build-only-secret-build-only-secret-xx pnpm build

# Image phụ để chạy migration + seed (có đủ node_modules, tsx)
FROM builder AS tools
RUN apk add --no-cache poppler-utils
ENV NODE_ENV=production
CMD ["pnpm", "migrate"]

FROM node:25-alpine AS runner
WORKDIR /app
# poppler: tách PDF kỷ yếu thành ảnh từng trang
RUN apk add --no-cache poppler-utils
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app && mkdir -p /data/media /data/quarantine && chown -R app:app /data
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
