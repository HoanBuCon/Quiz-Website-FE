## Hướng dẫn triển khai Database, API Server và Deploy (PostgreSQL + Express + Prisma)

### 1) Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL 14+ (hoặc Docker)
- npm (hoặc pnpm/yarn)

### 2) Cấu trúc thư mục liên quan
```
quiz-backend/
  index.js                 # Entrypoint Express
  package.json             # Scripts chạy và Prisma
  prisma/
    schema.prisma          # Schema DB (Prisma)
  routes/                  # Auth, Classes, Quizzes, Sessions, Files
  middleware/auth.js       # JWT middleware
```

### 3) Chuẩn bị Database
#### 3.1 Chạy PostgreSQL (Docker Compose ví dụ)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: quiz
      POSTGRES_PASSWORD: quizpass
      POSTGRES_DB: quizdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```
Khởi động: `docker compose up -d`

#### 3.2 Tạo .env cho Backend
Tạo file `quiz-backend/.env`:
```
DATABASE_URL=postgresql://quiz:quizpass@localhost:5432/quizdb?schema=public
JWT_SECRET=please-change-me
CORS_ORIGIN=http://localhost:3000
PORT=4000
```

### 4) Cài đặt và migrate schema
```bash
cd quiz-backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

Ghi chú:
- `schema.prisma` đã định nghĩa các model: User, Class, Quiz, Question, QuizSession, UploadedFile.
- Mỗi lần thay đổi schema cần chạy lại `prisma:generate` và `prisma:migrate` (dev) hoặc `prisma:deploy` (prod).

### 5) Chạy API Server (Dev/Prod)
Dev (nodemon):
```bash
cd quiz-backend
npm run dev
# Server chạy tại http://localhost:4000, kiểm tra health: /health
```

Prod (Node):
```bash
cd quiz-backend
npm run prisma:deploy
npm run start
```

Systemd (tuỳ chọn):
```
[Unit]
Description=Quiz API
After=network.target

[Service]
Environment=NODE_ENV=production
WorkingDirectory=/path/to/quiz-website/quiz-backend
ExecStart=/usr/bin/node index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### 6) Cấu hình Frontend để gọi API
Tạo/điều chỉnh biến môi trường FE:
- `REACT_APP_API_BASE_URL=http://localhost:4000`

FE đã có client gọi API sẵn ở:
- `src/utils/api.ts` (hàm `apiRequest` và `REACT_APP_API_BASE_URL`)
- `src/utils/auth.ts` (lưu/đọc JWT `auth_token`)

Luồng hiện tại:
- `EditQuizPage`: nếu có token → gọi API tạo/cập nhật quiz + (tạo lớp nếu cần). Nếu không có token → fallback localStorage.
- `ClassesPage`: nếu có token → gọi `/classes?mine=true` và `/quizzes/by-class/:id`. Nếu không có token → fallback localStorage.

### 7) API chính (tóm tắt)
- Auth
  - `POST /auth/signup` { email, password, name? } → { token, user }
  - `POST /auth/login`  { email, password } → { token, user }
- Classes (cần Bearer token)
  - `GET /classes?mine=true` → lớp của tôi (include quizzes lấy riêng)
  - `POST /classes` { name, description?, isPublic? }
  - `PUT /classes/:id` { name?, description?, isPublic? }
  - `DELETE /classes/:id`
- Quizzes (cần Bearer token)
  - `GET /quizzes/by-class/:classId` → danh sách quiz + questions
  - `POST /quizzes` { classId, title, description?, published, questions[] }
  - `PUT /quizzes/:id` { title?, description?, published?, questions[] (replace) }
  - `DELETE /quizzes/:id`
- Sessions (cần Bearer token)
  - `POST /sessions/start` { quizId }
  - `POST /sessions/submit` { quizId, timeSpent, answers: { [questionId]: string[] } }
  - `GET /sessions/by-quiz/:quizId`
- Files (cần Bearer token)
  - `GET /files`
  - `POST /files` { name, type: 'docs'|'json'|'txt', size, content? (base64 cho docx) }
  - `DELETE /files/:id`

### 8) Bảo mật & cấu hình
- Thay `JWT_SECRET` bằng chuỗi mạnh, duy nhất cho môi trường production.
- Giới hạn CORS qua `CORS_ORIGIN` (danh sách domain, phân tách bằng dấu phẩy).
- Điều chỉnh `helmet`, `rate-limit` nếu cần lưu lượng lớn.

### 9) Deploy production
Tuỳ chọn A – VM (Ubuntu + Docker Compose):
1. Chạy Postgres bằng Compose (mục 3.1).
2. Tạo `.env` và migrate (mục 3.2, 4).
3. Chạy `npm run prisma:deploy && npm run start` dưới `pm2`/`systemd`.
4. Đặt reverse-proxy (Nginx/Caddy) trỏ đến `localhost:4000`, bật HTTPS (Let's Encrypt).

Tuỳ chọn B – PaaS (Railway/Render/Fly):
1. Tạo Postgres managed.
2. Set env: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`.
3. Build & run command: `npm install && npm run prisma:deploy && npm run start`.

### 10) Seed dữ liệu (tuỳ chọn)
- Có thể viết script seed sử dụng Prisma Client:
```js
// quiz-backend/seed.js
require('dotenv').config();
const { PrismaClient } = require('./generated/prisma/client');
const prisma = new PrismaClient();
(async () => {
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', passwordHash: '$2a$10$...', name: 'Admin' }
  });
  console.log('Seeded user:', user.email);
  await prisma.$disconnect();
})();
```
Chạy: `node seed.js`

---
Gặp lỗi? Kiểm tra lần lượt:
1) Kết nối DB (`DATABASE_URL`). 2) Migrate đã chạy chưa. 3) `CORS_ORIGIN` trùng domain FE. 4) Token đính kèm header `Authorization: Bearer <jwt>`.


