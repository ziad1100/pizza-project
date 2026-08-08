import { query } from './index';
import { DEFAULT_SETTINGS } from '../constants';

export const getSettingsMap = async (): Promise<Record<string, unknown>> => {
  const docs = await query<{ key: string; value: unknown }>('SELECT key, value FROM settings');
  const map: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const doc of docs) map[doc.key] = doc.value;
  return map;
};

export const upsertSetting = async (key: string, value: unknown): Promise<void> => {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
};