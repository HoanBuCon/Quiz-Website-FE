// ====== Load environment first ======
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// ====== Detect Passenger environment ======
const runningUnderPassenger =
  !!process.env.PASSENGER_APP_ENV || !!process.env.PASSENGER_BASE_URI;

// ====== Prevent multiple instances (SAFE MODE for Passenger) ======
const LOCK_FILE = path.join(require('os').tmpdir(), 'quiz_api.lock');

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      try {
        process.kill(pid, 0);
        if (runningUnderPassenger) {
          console.warn(
            `[WARN] Another instance (${pid}) detected under Passenger. Skipping lock enforcement.`
          );
          return true;
        } else {
          console.log(`Another instance (PID: ${pid}) is running. Exiting...`);
          process.exit(0);
        }
      } catch {
        console.log(`Removing stale lock file (PID ${pid} not found)`);
        fs.unlinkSync(LOCK_FILE);
      }
    }
    fs.writeFileSync(LOCK_FILE, process.pid.toString());
    console.log(`Lock acquired (PID: ${process.pid})`);
    return true;
  } catch (err) {
    console.error('Failed to acquire lock:', err);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockPid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      if (lockPid === process.pid.toString()) {
        fs.unlinkSync(LOCK_FILE);
        console.log(`Lock released (PID: ${process.pid})`);
      }
    }
  } catch (err) {
    console.error('Failed to release lock:', err);
  }
}

let acquiredLock = false;
if (!runningUnderPassenger) {
  if (!acquireLock()) {
    console.error('Cannot acquire lock. Exiting...');
    process.exit(1);
  }
  acquiredLock = true;
} else {
  console.log('[INFO] Running under Passenger — skipping lock enforcement.');
}

// ====== Check production requirements ======
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is required in production');
  process.exit(1);
}

// ====== Base path setup ======
const BASE_PATH =
  process.env.PASSENGER_BASE_URI ||
  process.env.BASE_PATH ||
  (isProd ? '/api' : '');
console.log('Base path (for cPanel mapping):', BASE_PATH || '(root)');

// ====== THAY ĐỔI 1: Eager Prisma Initialization ======
// Khởi tạo Prisma ngay lập tức
const prisma = new PrismaClient();
console.log('[INIT] PrismaClient initialized eagerly');

// Chủ động kết nối tới DB ngay khi server khởi động
async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('[INIT] Prisma database connected successfully');
  } catch (e) {
    console.error('[FATAL] Failed to connect to database on startup', e);
    process.exit(1); // Thoát nếu không kết nối được DB khi khởi động
  }
}
// Gọi kết nối ngay, không chờ request
connectPrisma();
// ===================================================

// ====== Express app setup ======
const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const devDefaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : devDefaults,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ====== THAY ĐỔI 2: Cập nhật Prisma Middleware ======
// Gán instance đã khởi tạo, không cần 'async' và 'await'
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});
// =================================================

// ====== Static file serving ======
const uploadPath = isProd
  ? path.join(__dirname, '../uploads')
  : path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const chatUploadPath = isProd
  ? path.join(__dirname, '../chatbox/uploads')
  : path.join(__dirname, 'public/chatbox/uploads');
if (!fs.existsSync(chatUploadPath))
  fs.mkdirSync(chatUploadPath, { recursive: true });

app.use(
  `${BASE_PATH}/uploads`,
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(uploadPath)
);

app.use(
  `${BASE_PATH}/chatbox/uploads`,
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(chatUploadPath)
);

// ====== THAY ĐỔI 3: Tối ưu Health Check ======
// Gỡ bỏ truy vấn DB, chỉ kiểm tra server Express
app.get(`${BASE_PATH}/health`, (_req, res) => {
  try {
    // const db = await getPrisma(); // Xóa
    // await db.$queryRaw`SELECT 1`; // Xóa
    res.json({
      status: 'ok',
      basePath: BASE_PATH || '',
      env: process.env.NODE_ENV,
      pid: process.pid,
      uptime: process.uptime(),
    });
  } catch (err) {
    // Vẫn giữ lại catch để phòng trường hợp res.json lỗi
    res.status(500).json({ status: 'error', message: err.message });
  }
});
// ===========================================

// ====== Load routers ======
const authRouter = require('./routes/auth');
const classesRouter = require('./routes/classes');
const quizzesRouter = require('./routes/quizzes');
const sessionsRouter = require('./routes/sessions');
const filesRouter = require('./routes/files');
const visibilityRouter = require('./routes/visibility');
const imagesRouter = require('./routes/images');
const chatRouter = require('./routes/chat');

// ====== Mount routers ======
console.log(`Mounting routers at: ${BASE_PATH || '(root)'}`);
app.use(`${BASE_PATH}/auth`, authRouter);
app.use(`${BASE_PATH}/classes`, classesRouter);
app.use(`${BASE_PATH}/quizzes`, quizzesRouter);
app.use(`${BASE_PATH}/sessions`, sessionsRouter);
app.use(`${BASE_PATH}/files`, filesRouter);
app.use(`${BASE_PATH}/visibility`, visibilityRouter);
app.use(`${BASE_PATH}/images`, imagesRouter);
app.use(`${BASE_PATH}/chat`, chatRouter);

// ====== 404 handler ======
app.use((req, res) => {
  res.status(404).json({
    message: 'Not Found',
    path: req.path,
    method: req.method,
    availablePaths: [
      `${BASE_PATH}/health`,
      `${BASE_PATH}/auth/*`,
      `${BASE_PATH}/classes/*`,
      `${BASE_PATH}/quizzes/*`,
      `${BASE_PATH}/sessions/*`,
      `${BASE_PATH}/files/*`,
      `${BASE_PATH}/visibility/*`,
      `${BASE_PATH}/images/*`,
      `${BASE_PATH}/chat/*`,
      `${BASE_PATH}/uploads/*`,
      `${BASE_PATH}/chatbox/uploads/*`,
    ],
  });
});

// ====== Global error handler ======
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ====== Start server ======
const port = Number(process.env.PORT || 4000);
let server;
try {
  server = app.listen(port, () => {
    console.log(`Quiz API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}${BASE_PATH}/health`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  if (acquiredLock) releaseLock();
  process.exit(1);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    console.error(`Try: killall node (or taskkill /F /IM node.exe on Windows)`);
    if (acquiredLock) releaseLock();
    process.exit(1);
  } else {
    console.error('Server error:', err);
    if (acquiredLock) releaseLock();
    throw err;
  }
});

// ====== Graceful shutdown ======
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed');
  });
  try {
    // ====== THAY ĐỔI 4: Cập nhật Shutdown ======
    // const db = await getPrisma(); // Xóa
    await prisma.$disconnect(); // Dùng instance toàn cục
    console.log('Database disconnected');
  } catch (err) {
    console.error('Error disconnecting database:', err);
  }
  releaseLock();
  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV === 'development') {
  process.on('SIGUSR2', () => {
    console.log('Nodemon restart detected...');
    releaseLock();
    process.kill(process.pid, 'SIGTERM');
  });
}