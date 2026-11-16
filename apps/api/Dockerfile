# syntax=docker/dockerfile:1
# Build từ gốc repo:  docker build -f apps/api/Dockerfile .
# (yarn.lock nằm ở gốc; chỉ chép package.json của api → yarn chỉ cài workspace api)

# ── 1. Biên dịch TypeScript ─────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/
RUN yarn install --frozen-lockfile --non-interactive
COPY apps/api apps/api
RUN yarn workspace api build

# ── 2. Chỉ thư viện chạy production ─────────────────────────────────────────────
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/
RUN yarn install --frozen-lockfile --non-interactive --production && yarn cache clean

# ── 3. Runtime ──────────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
COPY --from=deps --chown=node:node /app ./
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
# Ảnh upload lưu ở <cwd>/uploads — tạo sẵn với quyền node để volume mới mang đúng chủ sở hữu
RUN mkdir uploads && chown node:node uploads
USER node
EXPOSE 5000
CMD ["node", "dist/main.js"]
