# Deploy & CI/CD

Theo mẫu **B. Docker** của VPS `kun.io.vn` (giống Mivo / `chat.kun.io.vn`): image build trên GitHub Actions → GHCR → VPS chỉ `docker compose pull` + `up`. Nginx trên host lo HTTPS (certbot), DNS qua Cloudflare (Proxied, SSL **Full (Strict)**).

| Thành phần | Domain               | Container → host         |
| ---------- | -------------------- | ------------------------ |
| Web (Next) | `room.kun.io.vn`     | `3000` → `127.0.0.1:3200` |
| API (Nest) | `room-api.kun.io.vn` | `5000` → `127.0.0.1:5200` |

- Cổng `3100`/`5100` đã thuộc Mivo — không dùng.
- API ở subdomain riêng (1 cấp — SSL Cloudflare free chỉ phủ `*.kun.io.vn`) vì API không có tiền tố `/api` và socket nối `${NEXT_PUBLIC_API_URL}/chat`.
- MongoDB: Atlas (đã cho phép IP VPS), database riêng `tro-oi`.
- Ảnh upload: volume Docker `uploads` (→ `/app/apps/api/uploads`), hoặc S3/R2 nếu điền `S3_*`.

## File trong repo

| File                                   | Dùng để                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `apps/api/Dockerfile`, `apps/web/Dockerfile` | Đóng gói từng app; build context là gốc repo (`yarn.lock`)        |
| `.dockerignore`                        | Loại `**/.env*`, `node_modules`, `.next`, `dist`, `apps/mobile`…        |
| `deploy/docker-compose.yml`            | Stack trên VPS (CI chép lên `/opt/tro-oi/` mỗi lần deploy)              |
| `deploy/.env.example`                  | Danh sách biến bí mật cho `/opt/tro-oi/.env` (giá trị để trống)         |
| `deploy/nginx/room.kun.io.vn.conf`     | 2 server: `room` → web, `room-api` → API (+ `/socket.io/` websocket)    |
| `.github/workflows/ci-cd.yml`          | Kiểm tra (audit, lint, typecheck, test) → build image → GHCR → deploy, chỉ app nào thay đổi |
| `scripts/audit-prod.mjs`               | Lọc `yarn audit --json`: critical trong api/web → CI đỏ (trừ mục `REVIEWED` có ghi lý do), high chỉ in ra |

Web build ra `output: 'standalone'` (`next.config.ts`, trace từ gốc monorepo). API đọc `TRUST_PROXY` (compose đặt `1`) để `req.ip` là IP thật sau nginx.

## Cài lần đầu

1. **Cloudflare → DNS**: A `room` và A `room-api` → IP VPS, **Proxied**.
2. **VPS** — thư mục + bí mật:
   ```bash
   mkdir -p /opt/tro-oi && chown deploy:deploy /opt/tro-oi
   nano /opt/tro-oi/.env            # điền theo deploy/.env.example; JWT_SECRET: openssl rand -hex 32
   chown deploy:deploy /opt/tro-oi/.env && chmod 600 /opt/tro-oi/.env
   ```
3. **Nginx + HTTPS** (file chỉ `listen 80`, certbot tự thêm 443):
   ```powershell
   scp deploy/nginx/room.kun.io.vn.conf root@<IP-VPS>:/tmp/      # máy của bạn
   ```
   ```bash
   cp /tmp/room.kun.io.vn.conf /etc/nginx/sites-available/room.kun.io.vn
   ln -sf /etc/nginx/sites-available/room.kun.io.vn /etc/nginx/sites-enabled/room.kun.io.vn
   nginx -t && systemctl reload nginx
   certbot --nginx -d room.kun.io.vn -d room-api.kun.io.vn
   ```
   Tới khi deploy xong, site báo **502** — bình thường.
4. **SSH key riêng cho CI** (VPS):
   ```bash
   su - deploy -c 'ssh-keygen -t ed25519 -f ~/.ssh/trooi_actions -N "" -C trooi-actions && cat ~/.ssh/trooi_actions.pub >> ~/.ssh/authorized_keys'
   su - deploy -c 'ssh -i ~/.ssh/trooi_actions -o BatchMode=yes deploy@127.0.0.1 "echo KEY_LOGIN_OK; id -nG"'   # phải có "docker"
   base64 -w0 /home/deploy/.ssh/trooi_actions; echo      # → VPS_SSH_KEY
   ssh-keyscan -t ed25519 <IP-VPS> 2>/dev/null           # → VPS_KNOWN_HOSTS
   ```
5. **GitHub repo → Settings → Secrets and variables → Actions**
   - Secrets: `VPS_HOST` (IP, không dùng domain), `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
   - Variables:

     | Biến                                       | Giá trị                                   |
     | ------------------------------------------ | ----------------------------------------- |
     | `DEPLOY_ENABLED`                           | `true`                                    |
     | `NEXT_PUBLIC_SITE_URL`                     | `https://room.kun.io.vn`                  |
     | `NEXT_PUBLIC_API_URL`                      | `https://room-api.kun.io.vn`              |
     | `NEXT_PUBLIC_FIREBASE_*` (6 biến)          | như `apps/web/.env.local`                 |
     | `NEXT_PUBLIC_UPLOAD_URL`                   | chỉ khi dùng S3/R2 (= `S3_PUBLIC_URL`)    |
     | `NEXT_PUBLIC_MAP_STYLE_URL`                | tuỳ chọn — style bản đồ khác OpenFreeMap  |

     `NEXT_PUBLIC_*` gắn vào bundle lúc build → đặt ở đây, **không** đặt trong `.env` trên VPS. Đổi giá trị → chạy lại workflow để build lại web.
6. **Actions → CI/CD → Run workflow** (nhánh `main`, tick `deploy_all`). Khi xanh:
   ```bash
   cd /opt/tro-oi && docker compose ps     # 2 container "healthy"
   rm -f /home/deploy/.ssh/trooi_actions   # xoá private key như portfolio
   ```

## Sau khi lên

- Firebase → Authentication → Settings → **Authorized domains**: thêm `room.kun.io.vn`.
- Facebook app: App domains `kun.io.vn`, Privacy URL `https://room.kun.io.vn/chinh-sach-bao-mat`, Terms URL `/dieu-khoan-su-dung`, chuyển **Live**.
- Không chạy `seed` trên production. Tạo admin: đăng nhập bằng tài khoản thật rồi `mongosh "<MONGODB_URI>"` → `db.users.updateOne({ email: "..." }, { $set: { role: "admin" } })`; sau đó đăng 2 trang chính sách ở `/quan-tri/trang-chinh-sach`.
- Search Console (domain `kun.io.vn` đã xác minh): gửi `https://room.kun.io.vn/sitemap.xml` và các phần `/phong-tro/sitemap/<n>.xml`, `/cho-oi/sitemap/<n>.xml` (danh sách đầy đủ trong `/robots.txt`; Google cũng tự đọc từ robots.txt).

## Hằng ngày

- Push / merge vào `main` → tự build + deploy app nào đổi. `dev` và PR chỉ chạy kiểm tra.
- Quay về bản cũ 1 service: đặt `API_TAG=<sha>` / `WEB_TAG=<sha>` trong `/opt/tro-oi/.env` → `docker compose up -d api`.
- Log: `cd /opt/tro-oi && docker compose logs -f api` (hoặc `web`).
- Xoá hẳn: `docker compose down -v` (`-v` xoá cả volume ảnh upload!), xoá `/opt/tro-oi`, file nginx, `certbot delete --cert-name room.kun.io.vn`, dòng `trooi-actions` trong `authorized_keys`.
