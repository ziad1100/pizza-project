import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { sanitizeJson } from './middlewares/sanitize';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { uploadsDir } from './middlewares/upload';
import { requestIdMiddleware, latencyMiddleware } from './middlewares/diagnostics';
import routes from './routes';

const app = express();

app.disable('x-powered-by');

app.use(requestIdMiddleware);
app.use(latencyMiddleware);

app.use(helmet());
const corsHandler = cors(corsOptions);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get('host');
  let sameOrigin = false;
  if (origin && host) {
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
      sameOrigin = false;
    }
  }
  if (!origin || sameOrigin) return next();
  corsHandler(req, res, next);
});
app.options('*', corsHandler);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(uploadsDir));

app.use(sanitizeJson);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const API_WINDOW_MS = Number(process.env.API_WINDOW_MS) || 15 * 60 * 1000;
const API_LIMIT = Number(process.env.API_LIMIT) || 300;
const apiLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  limit: API_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.DISABLE_RATE_LIMIT === '1',
});
app.use('/api', apiLimiter);

app.use('/api/v1', routes);

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const clientIndex = path.join(clientDist, 'index.html');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist, { maxAge: '7d', immutable: true, setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
  } }));
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => {
    res.sendFile(clientIndex);
  });
  console.log(`[client] serving production build from ${clientDist}`);
}

app.use(notFound);
app.use(errorHandler);

export default app;