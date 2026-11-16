# Deploy & CI/CD

Mô hình: 1 VPS Ubuntu chạy web + API bằng **PM2**, sau **Nginx**, DNS/HTTPS qua **Cloudflare**.

| Thành phần | Domain               | Cổng nội bộ                               |
| ---------- | -------------------- | ----------------------------------------- |
| Web (Next) | `room.kun.io.vn`     | 3100 (`WEB_PORT` của `scripts/deploy.sh`) |
| API (Nest) | `room-api.kun.io.vn` | 5100 (`PORT` trong `apps/api/.env.local`) |

> API dùng subdomain 1 cấp (`room-api.`), không dùng `api.room.` — SSL miễn phí của Cloudflare chỉ phủ `*.kun.io.vn`.

## 1. Chuẩn bị VPS (một lần)

- Node ≥ 20 (khuyên 24), `npm i -g yarn pm2`, Nginx. RAM ≤ 2GB → thêm swap 2GB (build Next tốn RAM).
- MongoDB chỉ nghe `127.0.0.1` (hoặc MongoDB Atlas). Không mở cổng Mongo ra Internet.
- Cloudflare DNS: bản ghi A `room` và `room-api` → IP VPS, Proxied. SSL/TLS: Full (strict).
- `git clone` repo vào `APP_DIR` (vd `/var/www/tro-oi`). Repo private → thêm **Deploy key** (read-only) của VPS vào GitHub.

### Env production

`apps/api/.env.local`: như `.env.example`, khác dev ở:

```env
PORT=5100
WEB_ORIGIN=https://room.kun.io.vn
API_PUBLIC_URL=https://room-api.kun.io.vn
JWT_SECRET=<openssl rand -hex 32>
AUTH_DEV_LOGIN=false
```

`apps/web/.env.local`: `NEXT_PUBLIC_API_URL=https://room-api.kun.io.vn` + các `NEXT_PUBLIC_FIREBASE_*`. Biến `NEXT_PUBLIC_*` gắn vào lúc build → đổi thì phải build lại.

### Nginx

```nginx
server {
    listen 80;
    server_name room.kun.io.vn;
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server {
    listen 80;
    server_name room-api.kun.io.vn;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;   # websocket /chat
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

HTTPS: `certbot --nginx -d room.kun.io.vn -d room-api.kun.io.vn` hoặc Cloudflare Origin Certificate (`listen 443 ssl` + `ssl_certificate*`).

### Lần deploy đầu

```bash
cd /var/www/tro-oi && bash scripts/deploy.sh   # build + tạo 2 tiến trình PM2 trooi-api, trooi-web
pm2 startup                                      # chạy lệnh nó in ra (tự bật lại khi VPS khởi động)
```

### Sau khi lên

- Firebase → Authentication → Settings → **Authorized domains**: thêm `room.kun.io.vn`.
- Facebook app: App domains `kun.io.vn`, Privacy URL `/chinh-sach-bao-mat`, Terms URL `/dieu-khoan-su-dung`, chuyển **Live**.
- Không chạy `seed` trên production. Tạo admin: đăng nhập bằng tài khoản thật rồi `mongosh` → `db.users.updateOne({ email: "..." }, { $set: { role: "admin" } })`; sau đó đăng 2 trang chính sách ở `/quan-tri/trang-chinh-sach`.

## 2. CI/CD — `.github/workflows/ci-cd.yml`

| Job      | Khi nào                             | Làm gì                                                                                          |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `check`  | push / PR vào `main`, `dev`         | `yarn install --frozen-lockfile`; API: lint, tsc, jest, build; web: `next typegen`, tsc, eslint |
| `deploy` | push vào `main` **và** `check` xanh | SSH vào VPS: `git fetch` + `git reset --hard origin/main` + `bash scripts/deploy.sh`            |

`scripts/deploy.sh`: `yarn install` → build API → restart `trooi-api` → build web → restart `trooi-web` → `pm2 save`. API lên trước vì Next gọi API lúc build. `git reset --hard` không đụng file bị gitignore (`.env.local`, `apps/api/uploads/`).

### Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret            | Giá trị                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `VPS_HOST`        | **IP** của VPS (domain qua Cloudflare proxy không SSH được)                        |
| `VPS_PORT`        | Cổng SSH (bỏ trống = 22)                                                           |
| `VPS_USER`        | User SSH chạy PM2 (cùng user đã `pm2 start`)                                       |
| `VPS_APP_DIR`     | Thư mục repo trên VPS, vd `/var/www/tro-oi`                                        |
| `VPS_SSH_KEY`     | Private key riêng cho GitHub Actions (xem dưới)                                    |
| `VPS_KNOWN_HOSTS` | Kết quả `ssh-keyscan -p <cổng> <IP>` chạy **trên máy bạn** (chống giả mạo máy chủ) |

Tạo khoá SSH riêng cho CI (trên VPS):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N "" -C github-actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions        # dán toàn bộ (cả dòng BEGIN/END) vào secret VPS_SSH_KEY
```

Lỗi deploy: xem log job `deploy` trên tab Actions, hoặc `pm2 logs trooi-api` / `pm2 logs trooi-web` trên VPS.
