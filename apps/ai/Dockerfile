# syntax=docker/dockerfile:1
# Build từ gốc repo:  docker build -f apps/ai/Dockerfile .
# (yarn.lock nằm ở gốc; chỉ chép package.json của ai → yarn chỉ cài workspace ai-service)

# ── 1. Biên dịch TypeScript ─────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/ai/package.json apps/ai/
RUN yarn install --frozen-lockfile --non-interactive
COPY apps/ai apps/ai
RUN yarn workspace ai-service build

# ── 2. Chỉ thư viện chạy production ─────────────────────────────────────────────
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/ai/package.json apps/ai/
RUN yarn install --frozen-lockfile --non-interactive --production && yarn cache clean

# ── 3. Runtime (node:sqlite có sẵn trong Node 24 — log hội thoại không cần thư viện ngoài) ──
FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    PORT=5300 \
    AI_DATA_DIR=/app/apps/ai/data
WORKDIR /app
COPY --from=deps --chown=node:node /app ./
COPY --from=build --chown=node:node /app/apps/ai/dist ./apps/ai/dist
WORKDIR /app/apps/ai
# Thư mục log hội thoại — tạo sẵn với quyền node để volume mới mang đúng chủ sở hữu
RUN mkdir data && chown node:node data
USER node
EXPOSE 5300
CMD ["node", "dist/main.js"]
