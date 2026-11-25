const fs = require('fs');

let code = fs.readFileSync('/tmp/server.ts', 'utf8');

// 1. Replace imports and setup mongoose
code = code.replace(/import { MongoClient } from "mongodb";/g, 'import mongoose from "mongoose";');
code = code.replace(/import { mkdir, readFile, writeFile } from "fs\/promises";/g, '');

const mongooseModels = `
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set!");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
    console.log("Connected to MongoDB.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

const bookingSchema = new mongoose.Schema({
  id: String, fullName: String, phone: String, email: String, serviceId: String,
  date: String, timeSlot: String, notes: String, status: { type: String, default: "pending" },
  createdAt: String, adminComment: String,
});
const Booking = mongoose.model("Booking", bookingSchema);

const blogPostSchema = new mongoose.Schema({
  id: Number, title: String, excerpt: String, category: String, date: String,
  readTime: String, imageUrl: String, content: String,
});
const BlogPost = mongoose.model("BlogPost", blogPostSchema);

const patientSchema = new mongoose.Schema({
  id: String, fullName: String, phone: String, nationalId: String, age: Number,
  gender: String, history: String, bloodType: String,
  dentalChart: mongoose.Schema.Types.Mixed, treatmentPlan: mongoose.Schema.Types.Mixed,
  prescriptions: mongoose.Schema.Types.Mixed
});
const Patient = mongoose.model("Patient", patientSchema);

const transactionSchema = new mongoose.Schema({
  id: String, type: String, amount: Number, category: String, date: String,
  description: String, patientId: String
});
const Transaction = mongoose.model("Transaction", transactionSchema);

const testimonialSchema = new mongoose.Schema({
  id: Number, name: String, treatment: String, rating: Number, comment: String,
  avatarUrl: String, status: String
});
const Testimonial = mongoose.model("Testimonial", testimonialSchema);

const messageSchema = new mongoose.Schema({
  id: String, name: String, phone: String, subject: String, message: String,
  status: String, date: String
});
const Message = mongoose.model("Message", messageSchema);

const configSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});
const Config = mongoose.model("Config", configSchema);

const imageSchema = new mongoose.Schema({
  fileName: { type: String, unique: true },
  mimeType: String,
  base64Data: String
});
const ImageModel = mongoose.model("Image", imageSchema);

const serviceSchema = new mongoose.Schema({
  id: String,
  name: String,
  shortDesc: String,
  iconName: String,
  description: String,
  benefits: [String],
  process: [String],
  priceRange: String,
  duration: String,
});
const Service = mongoose.model("Service", serviceSchema);
`;

code = code.replace(/let mongoClient: MongoClient \| null = null;/g, mongooseModels);

fs.writeFileSync('server.ts.new', code);
