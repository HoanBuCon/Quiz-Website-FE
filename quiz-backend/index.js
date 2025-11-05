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

// ====== Prevent multiple instances (IMPROVED) ======
const LOCK_FILE = path.join(require('os').tmpdir(), 'quiz_api.lock');

function acquireLock() {
  try {
    // Check if lock file exists
    if (fs.existsSync(LOCK_FILE)) {
      const pid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      
      // Check if that PID is still running
      try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        console.log(`Another instance (PID: ${pid}) is running. Exiting...`);
        process.exit(0);
      } catch (e) {
        // PID not running - stale lock file, remove it
        console.log(`Removing stale lock file (PID ${pid} not found)`);
        fs.unlinkSync(LOCK_FILE);
      }
    }
    
    // Create lock file with current PID
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

// Acquire lock at startup
if (!acquireLock()) {
  console.error('Cannot acquire lock. Exiting...');
  process.exit(1);
}

// Release lock on exit
process.on('exit', releaseLock);
process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down...');
  releaseLock();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  releaseLock();
  process.exit(0);
});

// Nodemon restart signal
if (process.env.NODE_ENV === 'development') {
  process.on('SIGUSR2', () => {
    console.log('Nodemon restart detected...');
    releaseLock();
    process.kill(process.pid, 'SIGTERM');
  });
}

// ====== Check production requirements ======
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is required in production');
  process.exit(1);
}

// ====== Initialize Prisma ======
const prisma = new PrismaClient();

// ====== Express app setup ======
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const devDefaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : devDefaults,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parsing
app.use(cookieParser());

// Rate limiting
app.use(rateLimit({ 
  windowMs: 60 * 1000, 
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Attach Prisma to request
app.use((req, _res, next) => { 
  req.prisma = prisma; 
  next(); 
});

// ====== Static file serving ======
const uploadPath = isProd
  ? path.join(__dirname, '../public_html/uploads')
  : path.join(__dirname, 'public/uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`Created upload directory: ${uploadPath}`);
}

app.use('/uploads', express.static(uploadPath));

// ====== Base path setup ======
const BASE_PATH = process.env.BASE_PATH || '/api';

// ====== Health check ======
app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.json({ 
    status: 'ok', 
    basePath: BASE_PATH, 
    env: process.env.NODE_ENV,
    pid: process.pid,
    uptime: process.uptime()
  });
});

// ====== Load routers ======
const authRouter = require('./routes/auth');
const classesRouter = require('./routes/classes');
const quizzesRouter = require('./routes/quizzes');
const sessionsRouter = require('./routes/sessions');
const filesRouter = require('./routes/files');
const visibilityRouter = require('./routes/visibility');
const imagesRouter = require('./routes/images');

// ====== Mount routers ======
console.log(`Mounting routers at base path: ${BASE_PATH}`);
app.use(`${BASE_PATH}/auth`, authRouter);
app.use(`${BASE_PATH}/classes`, classesRouter);
app.use(`${BASE_PATH}/quizzes`, quizzesRouter);
app.use(`${BASE_PATH}/sessions`, sessionsRouter);
app.use(`${BASE_PATH}/files`, filesRouter);
app.use(`${BASE_PATH}/visibility`, visibilityRouter);
app.use(`${BASE_PATH}/images`, imagesRouter);

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
    ]
  });
});

// ====== Global error handler ======
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ====== Start server ======
const port = Number(process.env.PORT || 4000);

let server;
try {
  server = app.listen(port, () => {
    console.log(`Quiz API running on port ${port}`);
    console.log(`Base path: ${BASE_PATH}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${port}${BASE_PATH}/health`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  releaseLock();
  process.exit(1);
}

// ====== Handle server errors ======
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    console.error(`Try: killall node (or taskkill /F /IM node.exe on Windows)`);
    releaseLock();
    process.exit(1);
  } else {
    console.error('Server error:', err);
    releaseLock();
    throw err;
  }
});

// ====== Graceful shutdown ======
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (err) {
    console.error('Error disconnecting database:', err);
  }
  
  // Release lock
  releaseLock();
  
  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));