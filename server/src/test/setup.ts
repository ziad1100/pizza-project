import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  memServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = memServer.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(memServer.getUri());
}, 60_000);

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await memServer?.stop();
});
