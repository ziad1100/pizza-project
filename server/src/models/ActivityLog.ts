import mongoose, { Schema } from 'mongoose';

const activityLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, default: '' },
    action: { type: String, required: true },
    resource: { type: String, required: true, index: true },
    targetId: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    ip: { type: String, default: '' },
    changes: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;