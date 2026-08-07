import mongoose, { Schema } from 'mongoose';
import { DEFAULT_SETTINGS } from '../constants';

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

const Setting = mongoose.model('Setting', settingSchema);

export const getSettingsMap = async (): Promise<Record<string, unknown>> => {
  const docs = await Setting.find().lean();
  const map: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const doc of docs) {
    map[doc.key] = doc.value;
  }
  return map;
};

export const upsertSetting = async (key: string, value: unknown): Promise<void> => {
  await Setting.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

export default Setting;