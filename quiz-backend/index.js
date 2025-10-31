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

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

// Inject prisma to req
app.use((req, _res, next) => { req.prisma = prisma; next(); });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/classes', classesRouter);
app.use('/quizzes', quizzesRouter);
app.use('/sessions', sessionsRouter);
app.use('/files', filesRouter);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

