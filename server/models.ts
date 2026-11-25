import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  id: String,
  fullName: String,
  phone: String,
  email: String,
  serviceId: String,
  date: String,
  timeSlot: String,
  notes: String,
  status: { type: String, default: "pending" },
  createdAt: String,
  adminComment: String,
}, { timestamps: true });

const blogPostSchema = new mongoose.Schema({
  id: Number,
  title: String,
  excerpt: String,
  category: String,
  date: String,
  readTime: String,
  imageUrl: String,
  content: String,
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  id: String,
  fullName: String,
  phone: String,
  nationalId: String,
  age: Number,
  gender: String,
  history: String,
  bloodType: String,
  dentalChart: mongoose.Schema.Types.Mixed,
  treatmentPlan: [mongoose.Schema.Types.Mixed],
  prescriptions: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  id: String,
  type: String,
  amount: Number,
  category: String,
  date: String,
  description: String,
  patientId: String
}, { timestamps: true });

const testimonialSchema = new mongoose.Schema({
  id: Number,
  name: String,
  treatment: String,
  rating: Number,
  comment: String,
  avatarUrl: String,
  status: { type: String, default: "approved" }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  id: String,
  name: String,
  phone: String,
  subject: String,
  message: String,
  status: { type: String, default: "unread" },
  date: String
}, { timestamps: true });

const configSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const imageSchema = new mongoose.Schema({
  fileName: { type: String, unique: true },
  mimeType: String,
  base64Data: String
}, { timestamps: true });

export const Booking = mongoose.model("Booking", bookingSchema);
export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
export const Patient = mongoose.model("Patient", patientSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
export const Message = mongoose.model("Message", messageSchema);
export const Config = mongoose.model("Config", configSchema);
export const ImageModel = mongoose.model("Image", imageSchema);
