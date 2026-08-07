import mongoose, { Schema } from 'mongoose';

const roleSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, enum: ['admin', 'manager', 'employee', 'customer'] },
    description: String,
    permissions: {
      type: Map,
      of: [String],
      required: true,
    },
  },
  { timestamps: true },
);

export type IRole = mongoose.InferSchemaType<typeof roleSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Role = mongoose.model('Role', roleSchema);
export default Role;