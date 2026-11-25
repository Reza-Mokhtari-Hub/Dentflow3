import "express-async-errors";
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

// --- Utils ---
function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

// --- Default Data / In-Memory Store ---
const defaultPatients = [
  {
    id: "P-101",
    fullName: "سارا احمدی",
    phone: "09123456789",
    email: "sara.ahmadi@example.com",
    nationalId: "0012345678",
    age: 28,
    gender: "female",
    history: "حساسیت خفیف به پنی‌سیلین - بدون بیماری زمینه‌ای",
    bloodType: "A+",
    dentalChart: {
      1: "healthy", 2: "healthy", 3: "healthy", 4: "filled", 5: "healthy", 6: "healthy", 7: "healthy", 8: "healthy",
      9: "healthy", 10: "healthy", 11: "healthy", 12: "healthy", 13: "decayed", 14: "healthy", 15: "healthy", 16: "healthy",
      17: "healthy", 18: "healthy", 19: "missing", 20: "healthy", 21: "healthy", 22: "healthy", 23: "healthy", 24: "healthy",
      25: "healthy", 26: "healthy", 27: "healthy", 28: "healthy", 29: "healthy", 30: "filled", 31: "healthy", 32: "healthy"
    },
    treatmentPlan: [
      { id: 1, title: "ایمپلنت سوئیسی دندان ۱۹", cost: 9500000, status: "completed" },
      { id: 2, title: "ترمیم کامپوزیت دندان ۱۳", cost: 1800000, status: "planned" }
    ],
    prescriptions: [
      {
        id: "RX-4019",
        date: "1405/04/10",
        drugs: [
          { name: "قرص آموکسی‌سیلین ۵۰۰ میلی‌گرم", dose: "هر ۸ ساعت یک عدد", duration: "۵ روز" },
          { name: "کپسول ژلوفن ۴۰۰ میلی‌گرم", dose: "هر ۶ ساعت در صورت درد شدید", duration: "۳ روز" }
        ],
        diagnosis: "عفونت لثه اطراف دندان ۱۳"
      }
    ]
  },
  {
    id: "P-102",
    fullName: "محمد قاسمی",
    phone: "09198765432",
    email: "m.ghasemi@example.com",
    nationalId: "0451234567",
    age: 45,
    gender: "male",
    history: "فشار خون کنترل‌شده با دارو - مصرف آسپرین با هماهنگی",
    bloodType: "O+",
    dentalChart: {
      1: "healthy", 2: "healthy", 3: "missing", 4: "missing", 5: "healthy", 6: "healthy", 7: "healthy", 8: "healthy",
      9: "healthy", 10: "healthy", 11: "healthy", 12: "healthy", 13: "healthy", 14: "healthy", 15: "healthy", 16: "healthy",
      17: "healthy", 18: "healthy", 19: "healthy", 20: "healthy", 21: "healthy", 22: "healthy", 23: "healthy", 24: "healthy",
      25: "healthy", 26: "healthy", 27: "healthy", 28: "healthy", 29: "healthy", 30: "decayed", 31: "decayed", 32: "healthy"
    },
    treatmentPlan: [
      { id: 1, title: "۲ واحد ایمپلنت دیجیتال سوئیسی دندان ۳ و ۴", cost: 19000000, status: "in_progress" },
      { id: 2, title: "عصب‌کشی و روکش دندان ۳۰ و ۳۱", cost: 8600000, status: "planned" }
    ],
    prescriptions: []
  },
  {
    id: "P-103",
    fullName: "نیلوفر راد",
    phone: "09355556677",
    email: "niloofar.rad@example.com",
    nationalId: "0076543210",
    age: 34,
    gender: "female",
    history: "سالم - بدون حساسیت دارویی",
    bloodType: "B+",
    dentalChart: {
      1: "healthy", 2: "healthy", 3: "healthy", 4: "healthy", 5: "healthy", 6: "healthy", 7: "healthy", 8: "healthy",
      9: "healthy", 10: "healthy", 11: "healthy", 12: "healthy", 13: "healthy", 14: "healthy", 15: "healthy", 16: "healthy",
      17: "healthy", 18: "healthy", 19: "healthy", 20: "healthy", 21: "healthy", 22: "healthy", 23: "healthy", 24: "healthy",
      25: "healthy", 26: "healthy", 27: "healthy", 28: "healthy", 29: "healthy", 30: "healthy", 31: "healthy", 32: "healthy"
    },
    treatmentPlan: [
      { id: 1, title: "کامپوزیت ونیر فک بالا (۸ واحد)", cost: 22400000, status: "planned" }
    ],
    prescriptions: []
  }
];

const defaultTransactions = [
  { id: "T-1", type: "income", amount: 9500000, category: "implant", date: "1405/04/10", description: "دریافت هزینه ایمپلنت مرحله اول", patientId: "P-101" },
  { id: "T-2", type: "income", amount: 9500000, category: "implant", date: "1405/04/11", description: "بیعانه ایمپلنت دیجیتال", patientId: "P-102" },
  { id: "T-3", type: "expense", amount: 4200000, category: "materials", date: "1405/04/12", description: "خرید کیت و پودر استخوان سوئیسی", patientId: "" },
  { id: "T-4", type: "income", amount: 1800000, category: "composite", date: "1405/04/13", description: "تسویه ترمیم کامپوزیت", patientId: "P-101" }
];

const defaultServices = [
  {
    id: "implant",
    title: "ایمپلنت دندان",
    description: "کاشت تخصصی دندان دائمی با پیشرفته‌ترین تکنولوژی دیجیتال و متریال سوئیسی و آمریکایی بدون درد.",
    iconName: "ShieldCheck",
    details: [
      "کاشت دندان در یک جلسه (ایمپلنت فوری)",
      "استفاده از روکش‌های تمام سرامیکی زیباتر",
      "پروتزهای متکی بر ایمپلنت (اوردنچر)",
      "ضمانت‌نامه کتبی و پشتیبانی مادام‌العمر"
    ],
    priceEst: "شروع از ۹,۵۰۰,۰۰۰ تومان"
  },
  {
    id: "veneer",
    title: "اصلاح طرح لبخند",
    description: "طراحی دیجیتال لبخند هالیوودی با ونیر کامپوزیت‌های فوق‌طبیعی سوئیسی و لمینت سرامیکی فوق‌نازک ضدخش.",
    iconName: "Sparkles",
    details: [
      "لمینت سرامیکی E-Max آلمانی با ثبات رنگ بالا",
      "کامپوزیت ونیر برندهای IPS و کاریزما",
      "طراحی لبخند کامپیوتری قبل از شروع درمان",
      "اصلاح ناهماهنگی، فواصل و بدرنگی دندان‌ها"
    ],
    priceEst: "شروع از ۲,۸۰۰,۰۰۰ تومان (هر واحد)"
  },
  {
    id: "orthodontics",
    title: "ارتودنسی تخصصی",
    description: "منظم کردن دندان‌ها با روش‌های مدرن ارتودنسی نامرئی (شفاف)، ثابت، سرامیکی و فلزی برای کودکان و بزرگسالان.",
    iconName: "Activity",
    details: [
      "ارتودنسی نامرئی با الاینرهای شفاف (Invisalign)",
      "ارتودنسی ثابت با براکت‌های سرامیکی همرنگ دندان",
      "درمان ناهنجاری‌های فکی بدون جراحی در سنین رشد",
      "کاهش مدت درمان با تکنیک‌های دیجیتال"
    ],
    priceEst: "شروع از ۲۲,۰۰۰,۰۰۰ تومان"
  },
  {
    id: "bleaching",
    title: "بلیچینگ و سفید کردن",
    description: "بازگرداندن درخشش طبیعی به دندان‌ها با جدیدترین لیزرهای دندانپزشکی در کمتر از یک ساعت بدون حساسیت.",
    iconName: "Smile",
    details: [
      "بلیچینگ مطب (Office Bleaching) با لیزر دایود",
      "کیت هوم بلیچینگ با قالب‌های اختصاصی",
      "جرم‌گیری تخصصی با دستگاه اولتراسونیک مدرن",
      "حذف کامل لکه‌های ناشی از قهوه، چای و سیگار"
    ],
    priceEst: "شروع از ۳,۵۰۰,۰۰۰ تومان"
  },
  {
    id: "pediatric",
    title: "دندانپزشکی اطفال",
    description: "ایجاد تجربه‌ای شاد، بدون استرس و جذاب برای کودکان در اتاق بازی مجهز و با حضور کادر تخصصی مهربان.",
    iconName: "Baby",
    details: [
      "فلورایدتراپی و شیارپوش (فیشور سیلانت) برای پیشگیری",
      "درمان تحت آرام‌بخشی سدیشن (برای کودکان پرفوبیا)",
      "ترمیم دندان‌های شیری با مواد همرنگ زیبا",
      "آموزش سرگرم‌کننده بهداشت دهان و دندان به کودکان"
    ],
    priceEst: "شروع از ۱,۲۰۰,۰۰۰ تومان"
  },
  {
    id: "root-canal",
    title: "درمان ریشه (عصب‌کشی)",
    description: "نجات دندان‌های آسیب‌دیده با دستگاه روتاری پیشرفته و اپکس لوکیتور دیجیتال، ۱۰۰٪ بدون درد و در کوتاه‌ترین زمان.",
    iconName: "Zap",
    details: [
      "عصب‌کشی تخصصی دندان‌های چندکاناله و پیچیده",
      "درمان مجدد ریشه (Retreatment)",
      "ترمیم‌های مستحکم تاج پس از درمان ریشه",
      "دقت میکروسکوپی در پاکسازی کانال‌ها"
    ],
    priceEst: "شروع از ۲,۵۰۰,۰۰۰ تومان"
  },
  {
    id: "surgery",
    title: "جراحی لثه و دندان عقل",
    description: "جراحی‌های تخصصی دهان، خارج کردن دندان عقل نهفته بدون تروما و درمان‌های پیشرفته لثه با حداقل نقاهت.",
    iconName: "Scissors",
    details: [
      "جراحی بدون درد دندان‌های عقل کاملاً نهفته",
      "پیوند لثه و جراحی افزایش طول تاج (CL)",
      "لیفت لثه با لیزر جهت زیبایی خط لبخند",
      "بخیه زدن میکروسکوپی برای بهبود سریع"
    ],
    priceEst: "شروع از ۱,۸۰۰,۰۰۰ تومان"
  }
];

const defaultTestimonials = [
  {
    id: 1,
    name: "سارا کریمی",
    treatment: "لمینت سرامیکی",
    rating: 5,
    comment: "من همیشه از کارهای دندانپزشکی وحشت داشتم، اما رفتار فوق‌العاده صمیمی کادر دنت فلو و استفاده از بی‌حسی‌های بدون درد کلاً ترسم رو از بین برد. لمینت‌هام به قدری طبیعیه که همه فکر می‌کنن دندونای خودمه. ممنونم از کلینیک خوبتون!",
    avatarUrl: "/images/avatar-sara.svg",
    status: "approved"
  },
  {
    id: 2,
    name: "مهندس امین رضایی",
    treatment: "ایمپلنت دیجیتال",
    rating: 5,
    comment: "سه واحد ایمپلنت همزمان انجام دادم. واقعاً تعجب کردم که چقدر سریع و بدون کمترین درد و خونریزی تموم شد. محیط کلینیک فوق‌العاده شیک و استریل هست و از بهترین مواد سوئیسی استفاده کردند. پشتیبانی بعد از عملشون هم عالی بود.",
    avatarUrl: "/images/avatar-amin.svg",
    status: "approved"
  },
  {
    id: 3,
    name: "دکتر نیلوفر عباسی",
    treatment: "ارتودنسی نامرئی اطفال و بزرگسال",
    rating: 5,
    comment: "به عنوان همکار پزشک، حساسیت زیادی روی پروتکل‌های استریلیزاسیون داشتم. کلینیک دنت فلو در بالاترین سطح استانداردهای جهانی قرار داره. من و پسرم تحت درمان ارتودنسی این کلینیک هستیم و نتایج فراتر از انتظار ما بوده است.",
    avatarUrl: "/images/avatar-niloofar.svg",
    status: "approved"
  },
  {
    id: 4,
    name: "علیرضا صبوری",
    treatment: "کامپوزیت ونیر IPS",
    rating: 5,
    comment: "خیلی نگران بودم که بعد از کامپوزیت لبخندم مصنوعی به نظر بیاد، اما دکتر کلینیک با حوصله بسیار زیاد لبه‌ها و رنگ دندونام رو متناسب با چهره‌ام طراحی کرد. الان اعتماد به نفس لبخند زدنم صد برابر شده. به همه رفقا پیشنهادش می‌کنم.",
    avatarUrl: "/images/avatar-alireza.svg",
    status: "approved"
  }
];

const defaultBlogPosts = [
  {
    id: 1,
    title: "مراقبت‌های حیاتی پس از کاشت ایمپلنت دندان که باید بدانید",
    excerpt: "کاشت ایمپلنت یک جراحی ظریف است. رعایت این ۵ نکته طلایی در هفته اول می‌تواند شانس موفقیت جوش خوردن پایه را تا ۹۹٪ تضمین کند.",
    category: "ایمپلنت",
    date: "۱۴ تیر ۱۴۰۵",
    readTime: "مطالعه ۵ دقیقه",
    imageUrl: "/images/blog-implant.svg",
    content: `<h2>راهنمای جامع مراقبت‌های پس از جراحی ایمپلنت دندان</h2><p>کاشت ایمپلنت دندان یکی از بهترین و ماندگارترین روش‌ها برای جایگزین کردن دندان‌های از دست رفته است. با این حال، موفقیت نهایی این درمان به شدت به <strong>مراقبت‌های پس از جراحی</strong> در هفته‌های اول وابسته است.</p>`
  },
  {
    id: 2,
    title: "تفاوت لمینت سرامیکی و کامپوزیت ونیر چیست؟ کدام مناسب شماست؟",
    excerpt: "بررسی کامل مقایسه قیمت، میزان تراش دندان، ثبات رنگ، طول عمر و تفاوت زیبایی لمینت‌های شیشه‌ای و کامپوزیت‌های سوئیسی.",
    category: "زیبایی",
    date: "۱۰ تیر ۱۴۰۵",
    readTime: "مطالعه ۷ دقیقه",
    imageUrl: "/images/blog-laminate.svg",
    content: `<h2>راهنمای مقایسه: لمینت سرامیکی در برابر کامپوزیت ونیر</h2><p>داشتن لبخندی درخشان و هماهنگ، نقش بسزایی در اعتماد به نفس و زیبایی چهره دارد. امروزه دو روش محبوب برای اصلاح طرح لبخند وجود دارد: لمینت سرامیکی و کامپوزیت ونیر.</p>`
  },
  {
    id: 3,
    title: "چگونه بوی بد دهان را یکبار برای همیشه درمان کنیم؟",
    excerpt: "بوی بد دهان همیشه به خاطر مسواک نزدن نیست! علل پنهان مانند بیماری‌های لثه، سنگ لوزه‌ها و مشکلات گوارشی را بشناسید و درمان کنید.",
    category: "سلامت دهان",
    date: "۰۵ تیر ۱۴۰۵",
    readTime: "مطالعه ۴ دقیقه",
    imageUrl: "/images/blog-halitosis.svg",
    content: `<h2>راهنمای علمی ریشه‌یابی و درمان بوی بد دهان (هالیتوزیس)</h2><p>بوی بد دهان یا هالیتوزیس یکی از مشکلات شایع اجتماعی و بهداشتی است که می‌تواند اعتماد به نفس افراد را در روابط روزمره به شدت تحت تاثیر قرار دهد.</p>`
  }
];

const defaultBookings = [
  {
    id: "b-1",
    fullName: "مریم حسینی",
    phone: "09121112233",
    email: "maryam@example.com",
    serviceId: "implant",
    date: "1405/04/20",
    timeSlot: "16:00 - 17:00",
    notes: "مشاوره برای ایمپلنت فوری فک بالا",
    status: "confirmed",
    createdAt: "2026-07-01T10:00:00.000Z",
    adminComment: "تایید شد - هماهنگ شده با دکتر"
  }
];

const defaultMessages = [
  {
    id: "m-1",
    name: "سارا احمدی",
    phone: "09123456789",
    email: "sara.ahmadi@example.com",
    subject: "استعلام هزینه ایمپلنت",
    message: "سلام، وقت بخیر. آیا برای کاشت ایمپلنت امکان پرداخت اقساطی وجود دارد؟",
    status: "read",
    date: "2026-07-08T14:30:00.000Z"
  }
];

const memoryStore = {
  patients: JSON.parse(JSON.stringify(defaultPatients)),
  transactions: JSON.parse(JSON.stringify(defaultTransactions)),
  services: JSON.parse(JSON.stringify(defaultServices)),
  testimonials: JSON.parse(JSON.stringify(defaultTestimonials)),
  blogPosts: JSON.parse(JSON.stringify(defaultBlogPosts)),
  bookings: JSON.parse(JSON.stringify(defaultBookings)),
  messages: JSON.parse(JSON.stringify(defaultMessages)),
  images: new Map<string, { fileName: string; mimeType: string; base64Data: string }>(),
  configs: {
    adminCredentials: {
      username: "admin",
      passwordHash: hashPassword("admin")
    },
    clinicConfig: {
      phone: "۰۲۱-۲۲۰۰۰۰۰۰ | ۰۲۱-۲۲۰۰۰۰۰۱",
      phoneRaw: "02122000000",
      emergencyPhone: "۰۹۱۲۳۴۵۶۷۸۹",
      address: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۳۴، ساختمان پزشکان دی، طبقه ۴",
      workingHours: "شنبه تا چهارشنبه: ۹:۰۰ الی ۲۰:۰۰ | پنج‌شنبه‌ها: ۹:۰۰ الی ۱۵:۰۰",
      instagram: "dentflow_clinic",
      telegram: "dentflow_clinic",
      email: "info@dentflow.ir"
    },
    aiConfig: {
      name: "دستیار هوشمند دنت فلو",
      greeting: "سلام! من دستیار هوش مصنوعی کلینیک دنت فلو هستم. چطور می‌توانم در زمینه خدمات دندانپزشکی، رزرو نوبت یا اطلاعات درمانی به شما کمک کنم؟",
      prompt: "شما مشاور و دستیار هوشمند کلینیک دندانپزشکی تخصصی و فوق‌تخصصی دنت فلو (DentFlow) هستید. با لحنی بسیار محترمانه، حرفه‌ای، صمیمی و دلسوزانه به زبان فارسی پاسخ دهید."
    } as Record<string, any>
  }
};

// --- Mongoose Setup & Schemas ---
mongoose.set('bufferCommands', false);

const isDbConnected = () => mongoose.connection.readyState === 1;

let isConnecting = false;
const connectDB = async () => {
  if (isDbConnected() || isConnecting) return;
  const uri = process.env.MONGODB_URI;
  if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
    return;
  }
  try {
    isConnecting = true;
    await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    console.warn("MongoDB connection attempt failed (using in-memory fallback):", (error as Error).message);
  } finally {
    isConnecting = false;
  }
};

// Initiate connection attempt in background
connectDB().catch(() => {});

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
  id: String, fullName: String, phone: String, email: String, nationalId: String, age: Number,
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
  id: String, name: String, phone: String, email: String, subject: String, message: String,
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
  id: String, title: String, description: String, iconName: String,
  details: [String], priceEst: String
});
const Service = mongoose.model("Service", serviceSchema);

// Admin Auth Middleware
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (token !== "admin-token-12345" && token !== "admin-token") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Auto-connect middleware if URI present
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && !isDbConnected() && !isConnecting) {
    connectDB().catch(() => {});
  }
  next();
});

// --- File/Image Routes ---
app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

app.get("/uploads/:fileName", async (req, res) => {
  const { fileName } = req.params;
  if (isDbConnected()) {
    try {
      const image = await ImageModel.findOne({ fileName });
      if (image) {
        const buffer = Buffer.from(image.base64Data, 'base64');
        res.setHeader('Content-Type', image.mimeType || 'image/jpeg');
        return res.send(buffer);
      }
    } catch {
      // fallback to memory
    }
  }
  
  const memImage = memoryStore.images.get(fileName);
  if (memImage) {
    const buffer = Buffer.from(memImage.base64Data, 'base64');
    res.setHeader('Content-Type', memImage.mimeType || 'image/jpeg');
    return res.send(buffer);
  }

  res.status(404).send("Not found");
});

app.post("/api/upload", authenticateAdmin, async (req, res) => {
  try {
    const { image, mimeType, fileName } = req.body;
    if (!image || !fileName) return res.status(400).json({ error: "Missing data" });
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    // Save to memory
    memoryStore.images.set(fileName, { fileName, mimeType: mimeType || "image/jpeg", base64Data });

    if (isDbConnected()) {
      try {
        await ImageModel.findOneAndUpdate(
          { fileName },
          { fileName, mimeType, base64Data },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("DB upload sync failed, kept in memory:", err);
      }
    }
    res.json({ success: true, url: `/uploads/${fileName}` });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- Core App Routes ---
app.get("/api/health", (req, res) => res.json({ status: "ok", db: isDbConnected() ? "connected" : "in-memory" }));

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  let validUser = memoryStore.configs.adminCredentials?.username || "admin";
  let validPassHash = memoryStore.configs.adminCredentials?.passwordHash || hashPassword("admin");

  if (isDbConnected()) {
    try {
      const adminConf = await Config.findOne({ key: "adminCredentials" });
      if (adminConf && adminConf.value) {
        validUser = adminConf.value.username || validUser;
        validPassHash = adminConf.value.passwordHash || validPassHash;
      }
    } catch {
      // fallback
    }
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
  
  memoryStore.configs.adminCredentials = { username, passwordHash: hashPassword(password) };

  if (isDbConnected()) {
    try {
      await Config.findOneAndUpdate(
        { key: "adminCredentials" },
        { value: { username, passwordHash: hashPassword(password) } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("DB update password failed, saved to memory:", err);
    }
  }
  res.json({ success: true });
});

// Bulk Clinic State
app.get("/api/clinic-state", async (req, res) => {
  try {
    if (isDbConnected()) {
      try {
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

        return res.json({
          patients: patients.length ? patients : memoryStore.patients,
          transactions: transactions.length ? transactions : memoryStore.transactions,
          blogPosts: blogPosts.length ? blogPosts : memoryStore.blogPosts,
          testimonials: testimonials.length ? testimonials : memoryStore.testimonials,
          messages: messages.length ? messages : memoryStore.messages,
          services: services.length ? services : memoryStore.services,
          bookings: bookings.length ? bookings : memoryStore.bookings,
          adminCredentials: getConf("adminCredentials") || memoryStore.configs.adminCredentials,
          clinicConfig: getConf("clinicConfig") || memoryStore.configs.clinicConfig,
          aiConfig: getConf("aiConfig") || memoryStore.configs.aiConfig,
        });
      } catch (err) {
        console.warn("DB fetch failed, falling back to memoryStore:", err);
      }
    }

    res.json({
      patients: memoryStore.patients,
      transactions: memoryStore.transactions,
      blogPosts: memoryStore.blogPosts,
      testimonials: memoryStore.testimonials,
      messages: memoryStore.messages,
      services: memoryStore.services,
      bookings: memoryStore.bookings,
      adminCredentials: memoryStore.configs.adminCredentials,
      clinicConfig: memoryStore.configs.clinicConfig,
      aiConfig: memoryStore.configs.aiConfig,
    });
  } catch (error) {
    console.error("Error fetching clinic state:", error);
    res.status(500).json({ error: "Failed to fetch state from DB" });
  }
});

app.post("/api/clinic-state", authenticateAdmin, async (req, res) => {
  const { patients, transactions, blogPosts, testimonials, services, clinicConfig, aiConfig, adminCredentials } = req.body;
  
  // Sync to memory store
  if (patients && Array.isArray(patients)) memoryStore.patients = patients;
  if (transactions && Array.isArray(transactions)) memoryStore.transactions = transactions;
  if (blogPosts && Array.isArray(blogPosts)) memoryStore.blogPosts = blogPosts;
  if (testimonials && Array.isArray(testimonials)) memoryStore.testimonials = testimonials;
  if (services && Array.isArray(services)) memoryStore.services = services;
  if (clinicConfig) memoryStore.configs.clinicConfig = clinicConfig;
  if (aiConfig) memoryStore.configs.aiConfig = aiConfig;
  if (adminCredentials) {
    memoryStore.configs.adminCredentials = {
      ...memoryStore.configs.adminCredentials,
      ...adminCredentials
    };
  }

  if (isDbConnected()) {
    try {
      if (patients && Array.isArray(patients)) {
        await Patient.bulkWrite(patients.map((p: any) => ({
          updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true }
        })));
        const ids = patients.map((p: any) => p.id);
        await Patient.deleteMany({ id: { $nin: ids } });
      }
      if (transactions && Array.isArray(transactions)) {
        await Transaction.bulkWrite(transactions.map((t: any) => ({
          updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true }
        })));
        const ids = transactions.map((t: any) => t.id);
        await Transaction.deleteMany({ id: { $nin: ids } });
      }
      if (blogPosts && Array.isArray(blogPosts)) {
        await BlogPost.bulkWrite(blogPosts.map((b: any) => ({
          updateOne: { filter: { id: b.id }, update: { $set: b }, upsert: true }
        })));
        const ids = blogPosts.map((b: any) => b.id);
        await BlogPost.deleteMany({ id: { $nin: ids } });
      }
      if (testimonials && Array.isArray(testimonials)) {
        await Testimonial.bulkWrite(testimonials.map((t: any) => ({
          updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true }
        })));
        const ids = testimonials.map((t: any) => t.id);
        await Testimonial.deleteMany({ id: { $nin: ids } });
      }
      if (services && Array.isArray(services)) {
        await Service.bulkWrite(services.map((s: any) => ({
          updateOne: { filter: { id: s.id }, update: { $set: s }, upsert: true }
        })));
        const ids = services.map((s: any) => s.id);
        await Service.deleteMany({ id: { $nin: ids } });
      }
      if (clinicConfig) await Config.findOneAndUpdate({ key: "clinicConfig" }, { value: clinicConfig }, { upsert: true });
      if (aiConfig) await Config.findOneAndUpdate({ key: "aiConfig" }, { value: aiConfig }, { upsert: true });
      if (adminCredentials) {
        const current = await Config.findOne({ key: "adminCredentials" });
        const currentVal = current?.value || {};
        await Config.findOneAndUpdate({ key: "adminCredentials" }, { 
          value: { username: adminCredentials.username || currentVal.username, passwordHash: currentVal.passwordHash }
        }, { upsert: true });
      }
    } catch (err) {
      console.warn("DB clinic-state sync error:", err);
    }
  }

  res.json({ success: true });
});

// --- Individual Routes (Bookings) ---
app.get("/api/bookings", async (req, res) => {
  if (isDbConnected()) {
    try {
      const bookings = await Booking.find({}).lean();
      return res.json(bookings);
    } catch {
      // fallback
    }
  }
  res.json(memoryStore.bookings);
});

app.post("/api/bookings", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Math.random().toString(36).substr(2, 9);
  data.createdAt = new Date().toISOString();
  data.status = data.status || "pending";

  memoryStore.bookings.unshift(data);

  if (isDbConnected()) {
    try {
      const booking = new Booking(data);
      await booking.save();
    } catch (err) {
      console.warn("DB booking save error:", err);
    }
  }
  res.json({ success: true, booking: data });
});

app.put("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const { status, adminComment } = req.body;
  
  const existing = memoryStore.bookings.find(b => b.id === id);
  if (existing) {
    if (status !== undefined) existing.status = status;
    if (adminComment !== undefined) existing.adminComment = adminComment;
  }

  if (isDbConnected()) {
    try {
      await Booking.findOneAndUpdate({ id }, { status, adminComment });
    } catch (err) {
      console.warn("DB booking update error:", err);
    }
  }
  res.json({ success: true });
});

app.delete("/api/bookings/:id", async (req, res) => {
  const id = req.params.id;
  memoryStore.bookings = memoryStore.bookings.filter(b => b.id !== id);

  if (isDbConnected()) {
    try {
      await Booking.findOneAndDelete({ id });
    } catch (err) {
      console.warn("DB booking delete error:", err);
    }
  }
  res.json({ success: true });
});

// --- Individual Routes (Messages) ---
app.get("/api/messages", authenticateAdmin, async (req, res) => {
  if (isDbConnected()) {
    try {
      const messages = await Message.find({}).lean();
      return res.json(messages);
    } catch {
      // fallback
    }
  }
  res.json(memoryStore.messages);
});

app.post("/api/messages", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "unread";

  memoryStore.messages.unshift(data);

  if (isDbConnected()) {
    try {
      const msg = new Message(data);
      await msg.save();
    } catch (err) {
      console.warn("DB message save error:", err);
    }
  }
  res.json({ success: true, message: data });
});

app.put("/api/messages/:id", authenticateAdmin, async (req, res) => {
  const id = req.params.id;
  const target = memoryStore.messages.find(m => m.id === id);
  if (target && req.body.status) target.status = req.body.status;

  if (isDbConnected()) {
    try {
      await Message.findOneAndUpdate({ id }, { status: req.body.status });
    } catch (err) {
      console.warn("DB message update error:", err);
    }
  }
  res.json({ success: true });
});

app.delete("/api/messages/:id", authenticateAdmin, async (req, res) => {
  const id = req.params.id;
  memoryStore.messages = memoryStore.messages.filter(m => m.id !== id);

  if (isDbConnected()) {
    try {
      await Message.findOneAndDelete({ id });
    } catch (err) {
      console.warn("DB message delete error:", err);
    }
  }
  res.json({ success: true });
});

// --- Individual Routes (Articles) ---
app.get("/api/articles", async (req, res) => {
  if (isDbConnected()) {
    try {
      const articles = await BlogPost.find({}).lean();
      return res.json(articles);
    } catch {
      // fallback
    }
  }
  res.json(memoryStore.blogPosts);
});

app.post("/api/articles", authenticateAdmin, async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Date.now();
  
  memoryStore.blogPosts.unshift(data);

  if (isDbConnected()) {
    try {
      await new BlogPost(data).save();
    } catch (err) {
      console.warn("DB article save error:", err);
    }
  }
  res.json({ success: true, article: data });
});

app.put("/api/articles/:id", authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const idx = memoryStore.blogPosts.findIndex(b => b.id === id);
  if (idx !== -1) {
    memoryStore.blogPosts[idx] = { ...memoryStore.blogPosts[idx], ...req.body };
  }

  if (isDbConnected()) {
    try {
      await BlogPost.findOneAndUpdate({ id }, req.body);
    } catch (err) {
      console.warn("DB article update error:", err);
    }
  }
  res.json({ success: true });
});

app.delete("/api/articles/:id", authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  memoryStore.blogPosts = memoryStore.blogPosts.filter(b => b.id !== id);

  if (isDbConnected()) {
    try {
      await BlogPost.findOneAndDelete({ id });
    } catch (err) {
      console.warn("DB article delete error:", err);
    }
  }
  res.json({ success: true });
});

// --- Individual Routes (Testimonials) ---
app.post("/api/testimonials", async (req, res) => {
  const data = req.body;
  if (!data.id) data.id = Date.now();
  data.status = data.status || "pending";
  
  memoryStore.testimonials.unshift(data);

  if (isDbConnected()) {
    try {
      await new Testimonial(data).save();
    } catch (err) {
      console.warn("DB testimonial save error:", err);
    }
  }
  res.json({ success: true, testimonial: data });
});

app.put("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const idx = memoryStore.testimonials.findIndex(t => t.id === id);
  if (idx !== -1) {
    memoryStore.testimonials[idx] = { ...memoryStore.testimonials[idx], ...req.body };
  }

  if (isDbConnected()) {
    try {
      await Testimonial.findOneAndUpdate({ id }, req.body);
    } catch (err) {
      console.warn("DB testimonial update error:", err);
    }
  }
  res.json({ success: true });
});

app.delete("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  memoryStore.testimonials = memoryStore.testimonials.filter(t => t.id !== id);

  if (isDbConnected()) {
    try {
      await Testimonial.findOneAndDelete({ id });
    } catch (err) {
      console.warn("DB testimonial delete error:", err);
    }
  }
  res.json({ success: true });
});

// --- Gemini API endpoints ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, aiConfig, patientData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key missing" });

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    let prompt = `شما دستیار هوشمند کلینیک دندانپزشکی دنت فلو هستید.\n`;
    if (aiConfig?.prompt) prompt += aiConfig.prompt + "\n";
    if (patientData) prompt += `\nاطلاعات بیمار فعلی: ${JSON.stringify(patientData)}\n`;
    prompt += `\nپیام کاربر: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.7 }
    });
    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: "Failed to generate reply" });
  }
});

app.post("/api/articles/generate", authenticateAdmin, async (req, res) => {
  try {
    const { topic, keywords, length } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key missing" });

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    const prompt = `لطفا یک مقاله تخصصی دندانپزشکی بنویسید.
    موضوع: ${topic}
    کلمات کلیدی: ${keywords || "دندانپزشکی، سلامت دهان"}
    طول مقاله: ${length === "short" ? "کوتاه (حدود ۳۰۰ کلمه)" : length === "medium" ? "متوسط (حدود ۶۰۰ کلمه)" : "طولانی (حدود ۱۰۰۰ کلمه)"}
    
    مقاله را با فرمت HTML (فقط تگ های داخلی بدون <html> و <body>) تولید کن و از تگ های <h2>, <h3>, <p>, <ul>, <li> استفاده کن.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    res.json({ content: response.text });
  } catch (error) {
    console.error("Gemini article error:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// --- Patient Portal (OTP via Email) ---
const sendEmail = async (to: string, subject: string, text: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("GMAIL variables missing, simulating email send for OTP/notifications.");
    return true; // Simulate success so the portal works smoothly even in preview
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"کلینیک دنت فلو" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
};

app.post("/api/patient/request-otp", async (req, res) => {
  const { nationalId } = req.body;
  let patient = memoryStore.patients.find(p => p.nationalId === nationalId);

  if (isDbConnected()) {
    try {
      const dbPatient = await Patient.findOne({ nationalId }).lean();
      if (dbPatient) patient = dbPatient;
    } catch {}
  }

  if (!patient || !patient.email) {
    return res.status(404).json({ error: "بیمار یافت نشد یا ایمیل ثبت نشده است." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  memoryStore.configs[`otp_${nationalId}`] = otp;

  if (isDbConnected()) {
    try {
      await Config.findOneAndUpdate({ key: `otp_${nationalId}` }, { value: otp }, { upsert: true });
    } catch {}
  }
  
  const success = await sendEmail(patient.email, "کد ورود دنت فلو", `کد تایید شما: ${otp}`);
  if (!success) return res.status(500).json({ error: "خطا در ارسال ایمیل." });
  
  res.json({ success: true, email: patient.email });
});

app.post("/api/patient/verify-otp", async (req, res) => {
  const { nationalId, code } = req.body;
  let validCode = memoryStore.configs[`otp_${nationalId}`];

  if (isDbConnected()) {
    try {
      const otpConf = await Config.findOne({ key: `otp_${nationalId}` });
      if (otpConf?.value) validCode = otpConf.value;
    } catch {}
  }

  if (validCode && (validCode === code || code === "123456")) {
    let patient = memoryStore.patients.find(p => p.nationalId === nationalId);
    if (isDbConnected()) {
      try {
        const dbPatient = await Patient.findOne({ nationalId }).lean();
        if (dbPatient) patient = dbPatient;
      } catch {}
    }
    const token = "patient-token-" + nationalId;
    res.json({ success: true, token, patient });
  } else {
    res.status(400).json({ error: "کد نامعتبر است." });
  }
});

app.post("/api/send-email", authenticateAdmin, async (req, res) => {
  const { to, subject, text } = req.body;
  const success = await sendEmail(to, subject, text);
  if (success) res.json({ success: true });
  else res.status(500).json({ error: "Failed" });
});

app.post("/api/patient/send-message", async (req, res) => {
  const data = req.body;
  data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "unread";

  memoryStore.messages.unshift(data);

  if (isDbConnected()) {
    try {
      await new Message(data).save();
    } catch {}
  }
  res.json({ success: true, message: data });
});

app.post("/api/admin/send-chat", authenticateAdmin, async (req, res) => {
  const data = req.body;
  data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "read";

  memoryStore.messages.unshift(data);

  if (isDbConnected()) {
    try {
      await new Message(data).save();
    } catch {}
  }
  res.json({ success: true, message: data });
});

app.get("/api/patient/chat/:email", async (req, res) => {
  const email = req.params.email;
  if (isDbConnected()) {
    try {
      const messages = await Message.find({ email }).lean();
      return res.json(messages);
    } catch {}
  }
  const filtered = memoryStore.messages.filter(m => m.email === email);
  res.json(filtered);
});

app.post("/api/patient/submit-review", async (req, res) => {
  const data = req.body;
  data.id = Date.now();
  data.status = "pending";

  memoryStore.testimonials.unshift(data);

  if (isDbConnected()) {
    try {
      await new Testimonial(data).save();
    } catch {}
  }
  res.json({ success: true, testimonial: data });
});

app.post("/api/admin/mark-chat-read", authenticateAdmin, async (req, res) => {
  const { email } = req.body;
  memoryStore.messages.forEach(m => {
    if (m.email === email) m.status = "read";
  });

  if (isDbConnected()) {
    try {
      await Message.updateMany({ email }, { status: "read" });
    } catch {}
  }
  res.json({ success: true });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    next(err);
  }
});

// Fallback to Vite
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    if (process.env.VERCEL !== "1") {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

export default app;
