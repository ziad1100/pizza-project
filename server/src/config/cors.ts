import env from './env';

export const allowedOrigins = env.isProd ? [env.clientUrl] : [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];

const devLocalhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed = allowedOrigins.includes(origin) || (!env.isProd && devLocalhostPattern.test(origin));
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};