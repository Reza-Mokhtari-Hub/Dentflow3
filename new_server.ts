import express from "express";
import path from "path";
import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// --- MongoDB Setup ---
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

// Utils
function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

// Authentication Middleware
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (token !== "admin-token-12345") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// APIs
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Image Serving
app.use("/images", express.static(path.join(process.cwd(), "public", "images")));
app.get("/uploads/:fileName", async (req, res) => {
  const { fileName } = req.params;
  const image = await ImageModel.findOne({ fileName });
  if (image) {
    const buffer = Buffer.from(image.base64Data, 'base64');
    res.setHeader('Content-Type', image.mimeType);
    return res.send(buffer);
  }
  res.status(404).send("Not found");
});

app.post("/api/upload", authenticateAdmin, async (req, res) => {
  try {
    const { image, mimeType, fileName } = req.body;
    if (!image || !fileName) return res.status(400).json({ error: "Missing data" });
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    await ImageModel.findOneAndUpdate(
      { fileName },
      { fileName, mimeType, base64Data },
      { upsert: true, new: true }
    );
    res.json({ success: true, url: `/uploads/${fileName}` });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

