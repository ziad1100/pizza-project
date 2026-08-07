import mongoose, { Schema } from 'mongoose';

const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;