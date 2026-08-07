import mongoose from 'mongoose';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import env from '../config/env';
import { resolveDbPath } from '../utils/dbPath';

let memServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  let uri = env.mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = resolveDbPath(fileURLToPath(import.meta.url));
    fs.mkdirSync(dbPath, { recursive: true });
    memServer = await MongoMemoryServer.create({ instance: { dbPath } });
    uri = memServer.getUri();
     
    console.log('[mongo] Using persistent in-memory MongoDB (mongodb-memory-server)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
   
  console.log(`[mongo] Connected: ${uri.split('@').pop()?.split('/')[0] ?? 'local'}`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop({ doCleanup: false, force: false });
  }
};