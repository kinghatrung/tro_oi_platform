#!/usr/bin/env bash
# Chạy trên VPS sau khi đã có code mới (GitHub Actions gọi qua SSH, hoặc chạy tay sau git pull).
# Cài thư viện, build API + web, rồi khởi động lại (lần đầu thì tạo) 2 tiến trình PM2.
# shortcut: web build ngay trên thư mục đang chạy nên trang có thể lỗi ~1-2 phút lúc build,
# cần zero-downtime thì build trong CI rồi rsync, hoặc build ra thư mục riêng rồi đổi tên.
set -euo pipefail

cd "$(dirname "$0")/.."
WEB_PORT="${WEB_PORT:-3100}" # cổng API lấy từ PORT trong apps/api/.env.local

yarn install --frozen-lockfile

# API lên trước: lúc build, Next gọi API để render sẵn các trang tĩnh
yarn workspace api build
# API phải chạy với cwd = apps/api: ảnh upload lưu ở apps/api/uploads
if pm2 describe trooi-api >/dev/null 2>&1; then
  pm2 restart trooi-api --update-env
else
  (cd apps/api && pm2 start dist/main.js --name trooi-api)
fi

yarn workspace web build
if pm2 describe trooi-web >/dev/null 2>&1; then
  pm2 restart trooi-web --update-env
else
  (cd apps/web && pm2 start "yarn start -p $WEB_PORT" --name trooi-web)
fi

pm2 save
echo "Deploy xong: $(git log -1 --format='%h %s')"
