import mongoose, { Schema } from 'mongoose';

const permissionSchema = new Schema(
  {
    resource: { type: String, required: true },
    action: { type: String, required: true },
    role: { type: String, required: true },
    description: String,
  },
  { timestamps: true },
);

permissionSchema.index({ resource: 1, action: 1, role: 1 }, { unique: true });

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;