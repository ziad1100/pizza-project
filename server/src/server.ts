import app from './app';
import env from './config/env';
import { connectDB, disconnectDB } from './database/connection';
import { ensureRolePermissions } from './database/roleSync';
import { perfSummaryTimer, reportLatencies } from './middlewares/diagnostics';

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await ensureRolePermissions();
    const server = app.listen(env.port, () => {
       
      console.log(`[server] API running at http://localhost:${env.port} (${env.nodeEnv})`);
    });
    perfSummaryTimer(60_000, console.log);

    const shutdown = async (signal: string): Promise<void> => {
       
      console.log(`[server] ${signal} received, shutting down...`);
      console.log(reportLatencies());
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
     
    console.error('[server] Failed to start', err);
    process.exit(1);
  }
};

void start();