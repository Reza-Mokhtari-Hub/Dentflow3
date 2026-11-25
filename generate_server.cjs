const fs = require('fs');

const code = `import express from "express";
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

// --- Mongoose Setup & Schemas ---
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set! Ensure it is set in the environment.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
    console.log("Connected to MongoDB successfully.");
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
  prescriptions: mongoose.Schema.Types.Mixed, medicalPhotos: mongoose.Schema.Types.Mixed
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
  status: { type: String, default: "unread" }, date: String
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
  id: String, name: String, shortDesc: String, iconName: String, description: String,
  benefits: [String], process: [String], priceRange: String, duration: String,
});
const Service = mongoose.model("Service", serviceSchema);

// --- Utils ---
function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  // Simple token check
  if (token !== "admin-token-12345" && token !== "admin-token") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- File/Image Routes ---
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
    const base64Data = image.replace(/^data:image\\/\\w+;base64,/, "");
    await ImageModel.findOneAndUpdate(
      { fileName },
      { fileName, mimeType, base64Data },
      { upsert: true, new: true }
    );
    res.json({ success: true, url: \`/uploads/\${fileName}\` });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- Core App Routes ---
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const adminConf = await Config.findOne({ key: "adminCredentials" });
  let validUser = "admin";
  let validPassHash = hashPassword("admin");
  if (adminConf && adminConf.value) {
    validUser = adminConf.value.username || validUser;
    validPassHash = adminConf.value.passwordHash || validPassHash;
  }
  if (username === validUser && hashPassword(password) === validPassHash) {
    res.json({ ok: true, token: "admin-token", username });
  } else {
    res.status(401).json({ ok: false, error: "نام کاربری یا کلمه عبور نادرست است." });
  }
});

app.post("/api/admin/update-password", authenticateAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  await Config.findOneAndUpdate(
    { key: "adminCredentials" },
    { value: { username, passwordHash: hashPassword(password) } },
    { upsert: true }
  );
  res.json({ success: true });
});

// Bulk Clinic State
app.get("/api/clinic-state", async (req, res) => {
  const [patients, transactions, blogPosts, testimonials, messages, services, bookings] = await Promise.all([
    Patient.find({}).lean(),
    Transaction.find({}).lean(),
    BlogPost.find({}).lean(),
    Testimonial.find({}).lean(),
    Message.find({}).lean(),
    Service.find({}).lean(),
    Booking.find({}).lean()
  ]);
  const configs = await Config.find({}).lean();
  const getConf = (k: string) => configs.find((c: any) => c.key === k)?.value;

  res.json({
    patients,
    transactions,
    blogPosts,
    testimonials,
    messages,
    services,
    bookings,
    adminCredentials: getConf("adminCredentials"),
    clinicConfig: getConf("clinicConfig"),
    aiConfig: getConf("aiConfig"),
  });
});

app.post("/api/clinic-state", authenticateAdmin, async (req, res) => {
  const { patients, transactions, blogPosts, testimonials, services, clinicConfig, aiConfig, adminCredentials } = req.body;
  
  try {
    // Bulk sync patients
    if (patients && Array.isArray(patients)) {
      await Patient.bulkWrite(patients.map((p: any) => ({
        updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true }
      })));
      const ids = patients.map((p: any) => p.id);
      await Patient.deleteMany({ id: { $nin: ids } });
    }
    // Bulk sync transactions
    if (transactions && Array.isArray(transactions)) {
      await Transaction.bulkWrite(transactions.map((t: any) => ({
        updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true }
      })));
      const ids = transactions.map((t: any) => t.id);
      await Transaction.deleteMany({ id: { $nin: ids } });
    }
    // Bulk sync blogPosts
    if (blogPosts && Array.isArray(blogPosts)) {
      await BlogPost.bulkWrite(blogPosts.map((b: any) => ({
        updateOne: { filter: { id: b.id }, update: { $set: b }, upsert: true }
      })));
      const ids = blogPosts.map((b: any) => b.id);
      await BlogPost.deleteMany({ id: { $nin: ids } });
    }
    // Bulk sync testimonials
    if (testimonials && Array.isArray(testimonials)) {
      await Testimonial.bulkWrite(testimonials.map((t: any) => ({
        updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true }
      })));
      const ids = testimonials.map((t: any) => t.id);
      await Testimonial.deleteMany({ id: { $nin: ids } });
    }
    // Bulk sync services
    if (services && Array.isArray(services)) {
      await Service.bulkWrite(services.map((s: any) => ({
        updateOne: { filter: { id: s.id }, update: { $set: s }, upsert: true }
      })));
      const ids = services.map((s: any) => s.id);
      await Service.deleteMany({ id: { $nin: ids } });
    }
    // Sync configs
    if (clinicConfig) await Config.findOneAndUpdate({ key: "clinicConfig" }, { value: clinicConfig }, { upsert: true });
    if (aiConfig) await Config.findOneAndUpdate({ key: "aiConfig" }, { value: aiConfig }, { upsert: true });
    if (adminCredentials) {
      // Don't overwrite password if not passed
      const current = await Config.findOne({ key: "adminCredentials" });
      const currentVal = current?.value || {};
      await Config.findOneAndUpdate({ key: "adminCredentials" }, { 
        value: { username: adminCredentials.username || currentVal.username, passwordHash: currentVal.passwordHash }
      }, { upsert: true });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync failed" });
  }
});

// --- Individual Routes (Bookings) ---
app.post("/api/bookings", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Math.random().toString(36).substr(2, 9);
  data.createdAt = new Date().toISOString();
  data.status = "pending";
  const booking = new Booking(data);
  await booking.save();
  res.json({ success: true, booking });
});

app.put("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const { status, adminComment } = req.body;
  await Booking.findOneAndUpdate({ id }, { status, adminComment });
  res.json({ success: true });
});

app.delete("/api/bookings/:id", async (req, res) => {
  await Booking.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// --- Individual Routes (Messages) ---
app.get("/api/messages", authenticateAdmin, async (req, res) => {
  const messages = await Message.find({});
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "unread";
  const msg = new Message(data);
  await msg.save();
  res.json({ success: true, message: msg });
});

app.put("/api/messages/:id", authenticateAdmin, async (req, res) => {
  await Message.findOneAndUpdate({ id: req.params.id }, { status: req.body.status });
  res.json({ success: true });
});

app.delete("/api/messages/:id", authenticateAdmin, async (req, res) => {
  await Message.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// --- Individual Routes (Articles) ---
app.get("/api/articles", async (req, res) => {
  res.json(await BlogPost.find({}));
});

app.post("/api/articles", authenticateAdmin, async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Date.now();
  await new BlogPost(data).save();
  res.json({ success: true });
});

app.put("/api/articles/:id", authenticateAdmin, async (req, res) => {
  await BlogPost.findOneAndUpdate({ id: parseInt(req.params.id) }, req.body);
  res.json({ success: true });
});

app.delete("/api/articles/:id", authenticateAdmin, async (req, res) => {
  await BlogPost.findOneAndDelete({ id: parseInt(req.params.id) });
  res.json({ success: true });
});

// --- Individual Routes (Testimonials) ---
app.post("/api/testimonials", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Date.now();
  data.status = "pending";
  await new Testimonial(data).save();
  res.json({ success: true });
});

app.put("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
  await Testimonial.findOneAndUpdate({ id: parseInt(req.params.id) }, req.body);
  res.json({ success: true });
});

app.delete("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
  await Testimonial.findOneAndDelete({ id: parseInt(req.params.id) });
  res.json({ success: true });
});

// --- Gemini API endpoints ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context, aiConfig, patientData } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key missing" });
    
    // Quick fix for SDK
    const tempKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = tempKey;

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    let prompt = \`شما دستیار هوشمند کلینیک دندانپزشکی دنت فلو هستید.\\n\`;
    if (aiConfig?.prompt) prompt += aiConfig.prompt + "\\n";
    if (patientData) prompt += \`\\nاطلاعات بیمار فعلی: \${JSON.stringify(patientData)}\\n\`;
    prompt += \`\\nپیام کاربر: \${message}\`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.7 }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate reply" });
  }
});

app.post("/api/articles/generate", authenticateAdmin, async (req, res) => {
  try {
    const { topic, keywords, length } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key missing" });
    
    const tempKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = tempKey;

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    const prompt = \`لطفا یک مقاله تخصصی دندانپزشکی بنویسید.
    موضوع: \${topic}
    کلمات کلیدی: \${keywords || "دندانپزشکی، سلامت دهان"}
    طول مقاله: \${length === "short" ? "کوتاه (حدود ۳۰۰ کلمه)" : length === "medium" ? "متوسط (حدود ۶۰۰ کلمه)" : "طولانی (حدود ۱۰۰۰ کلمه)"}
    
    مقاله را با فرمت HTML (فقط تگ های داخلی بدون <html> و <body>) تولید کن و از تگ های <h2>, <h3>, <p>, <ul>, <li> استفاده کن.\`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    res.json({ content: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// --- Patient Portal (OTP via Email) ---
const sendEmail = async (to: string, subject: string, text: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("GMAIL variables missing.");
    return false;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
  });
  await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, text });
  return true;
};

app.post("/api/patient/request-otp", async (req, res) => {
  const { nationalId } = req.body;
  const patient = await Patient.findOne({ nationalId }).lean();
  if (!patient || !patient.email) {
    return res.status(404).json({ error: "بیمار یافت نشد یا ایمیل ثبت نشده است." });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Config.findOneAndUpdate({ key: \`otp_\${nationalId}\` }, { value: otp }, { upsert: true });
  
  const success = await sendEmail(patient.email, "کد ورود دنت فلو", \`کد تایید شما: \${otp}\`);
  if (!success) return res.status(500).json({ error: "خطا در ارسال ایمیل." });
  
  res.json({ success: true, email: patient.email });
});

app.post("/api/patient/verify-otp", async (req, res) => {
  const { nationalId, code } = req.body;
  const otpConf = await Config.findOne({ key: \`otp_\${nationalId}\` });
  if (otpConf && otpConf.value === code) {
    const patient = await Patient.findOne({ nationalId }).lean();
    const token = "patient-token-" + nationalId; // simplified
    res.json({ success: true, token, patient });
  } else {
    res.status(400).json({ error: "کد نامعتبر است." });
  }
});

// Fallback to Vite
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Server running on http://localhost:\${PORT}\`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}
`;

fs.writeFileSync('server.ts', code);
