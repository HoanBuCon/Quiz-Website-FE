require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Prisma client (generated to ./generated/prisma)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Routers
const authRouter = require('./routes/auth');
const classesRouter = require('./routes/classes');
const quizzesRouter = require('./routes/quizzes');
const sessionsRouter = require('./routes/sessions');
const filesRouter = require('./routes/files');
const visibilityRouter = require('./routes/visibility');

const app = express();

// Enforce required secrets in production
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is required in production');
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(helmet());

// CORS
// - In production: set CORS_ORIGIN to a comma-separated list of allowed origins
//   e.g. "https://quiz.yourdomain.com,https://admin.yourdomain.com"
// - In development: default allow localhost:3000 if not specified
const allowedOriginsFromEnv = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const devDefaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = allowedOriginsFromEnv.length
  ? allowedOriginsFromEnv
  : (isProd ? [] : devDefaults);

app.use(cors({
  origin: corsOrigins,
  credentials: corsOrigins.length > 0,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 1000 }); // 1000 requests per minute
app.use(limiter);

// Inject prisma to req
app.use((req, _res, next) => { req.prisma = prisma; next(); });

// Base path for API
const BASE_PATH = process.env.BASE_PATH || '';

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(`${BASE_PATH}/auth`, authRouter);
app.use(`${BASE_PATH}/classes`, classesRouter);
app.use(`${BASE_PATH}/quizzes`, quizzesRouter);
app.use(`${BASE_PATH}/sessions`, sessionsRouter);
app.use(`${BASE_PATH}/files`, filesRouter);
app.use(`${BASE_PATH}/visibility`, visibilityRouter);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// const port = process.env.PORT || 4000;vâ
// const host = '0.0.0.0';
// app.listen(port, host, () => {
//   console.log(`API listening on http://${host}:${port}`);
// });

const port = process.env.PORT || 3000; // Passenger injects its own PORT
app.listen(port, '127.0.0.1', () => {
  console.log(`Server running via Passenger on port ${port}`);
});

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

