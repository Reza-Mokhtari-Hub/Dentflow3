import express from "express";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { createHash, randomUUID } from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

dotenv.config();


interface Booking {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceId: string;
  date: string;
  timeSlot: "morning" | "afternoon";
  notes?: string;
  status: "pending" | "approved" | "cancelled";
  createdAt: string;
  adminComment?: string;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl: string;
  content?: string;
}

interface AdminCredentials {
  username: string;
  passwordHash: string;
}

interface ClinicDataState {
  bookings: Booking[];
  blogPosts: BlogPost[];
  patients: any[];
  transactions: any[];
  adminCredentials: AdminCredentials;
  clinicConfig: any;
  services: any[];
  aiConfig: { name: string; greeting: string; prompt: string };
  messages: any[];
  testimonials: any[];
}

const stateFilePath = path.join(process.cwd(), "data", "clinic-data.json");

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function sanitizeBlogPosts(posts: any[]): any[] {
  if (!Array.isArray(posts)) return [];
  return posts.map(post => {
    let imageUrl = post.imageUrl || "";
    if (imageUrl.includes("photo-1588776814546-1ffcf47267a5") || imageUrl.includes("blog-implant")) {
      imageUrl = "/images/blog-implant.svg";
    } else if (imageUrl.includes("photo-1512223792601-592a9809eed4") || imageUrl.includes("blog-laminate")) {
      imageUrl = "/images/blog-laminate.svg";
    } else if (imageUrl.includes("photo-1579684389782-64d84b5e905d") || imageUrl.includes("blog-halitosis")) {
      imageUrl = "/images/blog-halitosis.svg";
    }
    return { ...post, imageUrl };
  });
}

function normalizeAdminCredentials(raw: any): AdminCredentials {
  if (raw?.passwordHash) {
    return {
      username: raw.username || "admin",
      passwordHash: raw.passwordHash,
    };
  }

  if (raw?.password) {
    return {
      username: raw.username || "admin",
      passwordHash: hashPassword(raw.password),
    };
  }

  return {
    username: "admin",
    passwordHash: hashPassword("admin"),
  };
}

async function downloadImageIfExternal(url: string): Promise<string> {
  if (!url || typeof url !== "string") return "";
  
  // If it's already a local path, don't download it
  if (url.startsWith("/") || url.startsWith("data:") || !url.startsWith("http")) {
    return url;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch external image from ${url}: ${response.status}`);
      return url;
    }

    const contentType = response.headers.get("content-type") || "";
    let extension = ".jpg";
    if (contentType.includes("png")) {
      extension = ".png";
    } else if (contentType.includes("webp")) {
      extension = ".webp";
    } else if (contentType.includes("gif")) {
      extension = ".gif";
    } else if (contentType.includes("svg")) {
      extension = ".svg";
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uniqueFileName = `downloaded-${randomUUID()}${extension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);
    console.log(`Successfully downloaded external image ${url} to /uploads/${uniqueFileName}`);
    
    // Save downloaded image to MongoDB for persistence across serverless restarts
    await saveImageToMongo(uniqueFileName, contentType || "image/jpeg", buffer.toString("base64"));
    
    return `/uploads/${uniqueFileName}`;
  } catch (err) {
    console.error(`Error downloading external image from ${url}:`, err);
    return url;
  }
}

const defaultPatients = [
  {
    id: "P-101",
    fullName: "سارا احمدی",
    phone: "09123456789",
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
    ],
    chat: [
      { id: 1, date: "1405/04/10", time: "10:30", sender: "clinic", subject: "نوبت فردا", text: "یادآوری نوبت معاینه فردا ساعت ۱۰ صبح", status: "read" }
    ],
    notes: "بیمار به پنی‌سیلین حساسیت دارد. در تجویز داروها دقت شود."
  },
  {
    id: "P-102",
    fullName: "محمد قاسمی",
    phone: "09198765432",
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
    prescriptions: [],
    chat: [],
    notes: "بیمار سابقه فشار خون دارد. فشار خون قبل از جراحی چک شود."
  },
  {
    id: "P-103",
    fullName: "نیلوفر راد",
    phone: "09355556677",
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
      { id: 1, title: "۱۰ واحد کامپوزیت زیبایی IPS فک بالا", cost: 28000000, status: "completed" }
    ],
    prescriptions: [],
    chat: [],
    notes: "بیمار از نتیجه کامپوزیت بسیار راضی است."
  }
];

const defaultTransactions = [
  { id: "T-1001", type: "income", amount: 9500000, category: "treatment", date: "1405/04/12", description: "پیش‌پرداخت ایمپلنت خانم سارا احمدی", patientId: "P-101" },
  { id: "T-1002", type: "income", amount: 28000000, category: "treatment", date: "1405/04/10", description: "تسویه حساب کامپوزیت خانم نیلوفر راد", patientId: "P-103" },
  { id: "T-1003", type: "expense", amount: 12500000, category: "materials", date: "1405/04/08", description: "خرید مواد مصرفی کامپوزیت IPS و گوتاپرکا از شرکت آذرطب" },
  { id: "T-1004", type: "expense", amount: 4800000, category: "other", date: "1405/04/05", description: "هزینه سرویس و استریل اتوکلاو بخش جراحی" },
  { id: "T-1005", type: "income", amount: 5000000, category: "treatment", date: "1405/04/04", description: "قسط دوم ایمپلنت آقای محمد قاسمی", patientId: "P-102" }
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
    description: "روشن کردن دندان‌ها تا چند درجه با پیشرفته‌ترین دستگاه‌های پلاسما لایت و مواد اصلی برند UltraDent آمریکا.",
    iconName: "Smile",
    details: [
      "سفید کردن دو فک در یک جلسه کمتر از ۱ ساعت",
      "بدون ایجاد حساسیت دندانی با ژل‌های ضد حساسیت",
      "ماندگاری بالا بین ۱ تا ۳ سال بسته به رژیم غذایی",
      "ارائه کیت بلیچینگ در منزل جهت تثبیت سفیدی"
    ],
    priceEst: "شروع از ۴,۵۰۰,۰۰۰ تومان"
  },
  {
    id: "pediatric",
    title: "دندانپزشکی اطفال",
    description: "درمان‌های پیشگیرانه و ترمیمی کودکان در محیطی شاد، کارتونی و بدون ترس همراه با تکنیک‌های روانشناسی خلاقانه.",
    iconName: "Baby",
    details: [
      "فلورایدتراپی جهت پیشگیری از پوسیدگی دندان",
      "فیشورسیلانت (شیارپوش) دندان‌های ۶ و ۱۲ سالگی",
      "ترمیم دندان‌های شیری و روکش‌های مخصوص کودکان",
      "امکان انجام درمان تحت سدیشن برای کودکان مضطرب"
    ],
    priceEst: "شروع از ۸۰۰,۰۰۰ تومان"
  },
  {
    id: "root-canal",
    title: "عصب‌کشی (اندودانتیکس)",
    description: "درمان ریشه دندان با دستگاه‌های روتاری مدرن و اپکس‌لوکیتور دیجیتال با بالاترین دقت و کاملاً بدون درد در یک جلسه.",
    iconName: "Activity",
    details: [
      "عصب‌کشی تخصصی دندان‌های چندکاناله و خلفی",
      "درمان مجدد ریشه دندان‌های عصب‌کشی شده ناموفق قدیمی",
      "استفاده از سیستم‌های روتاری جهت سرعت و کیفیت کار",
      "پرکردن سه بعدی کانال ریشه جهت جلوگیری از نفوذ میکروب"
    ],
    priceEst: "شروع از ۲,۵۰۰,۰۰۰ تومان"
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
    avatarUrl: "/images/alireza-avatar.svg",
    status: "approved"
  }
];

const defaultClinicState: ClinicDataState = {
  bookings: [
    {
      id: "DF-749210",
      fullName: "امیرحسین رضایی",
      phone: "09121112233",
      serviceId: "implant",
      date: "2026-07-06",
      timeSlot: "morning",
      notes: "نیاز به ایمپلنت فوری سوئیسی فک بالا دارم. آیا امکان درمان بدون درد وجود دارد؟",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      adminComment: ""
    },
    {
      id: "DF-183029",
      fullName: "مهسا کریمی",
      phone: "09354445566",
      serviceId: "laminate",
      date: "2026-07-07",
      timeSlot: "afternoon",
      notes: "برای معاینه لمینت سرامیکی E-Max نوبت می‌خواهم.",
      status: "approved",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      adminComment: "تایید شد. منتظر تشریف‌فرمایی شما در ساعت ۱۴:۳۰ هستیم. لطفاً مدارک دندانپزشکی قبلی را همراه داشته باشید."
    },
    {
      id: "DF-394021",
      fullName: "سینا باقری",
      phone: "09197778899",
      serviceId: "orthodontics",
      date: "2026-07-10",
      timeSlot: "afternoon",
      notes: "درباره هزینه الاینر نامرئی ارتودنسی سوال دارم.",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      adminComment: ""
    }
  ],
  blogPosts: [
    {
      id: 1,
      title: "مراقبت‌های حیاتی پس از کاشت ایمپلنت دندان که باید بدانید",
      excerpt: "کاشت ایمپلنت یک جراحی ظریف است. رعایت این ۵ نکته طلایی در هفته اول می‌تواند شانس موفقیت جوش خوردن پایه را تا ۹۹٪ تضمین کند.",
      category: "ایمپلنت",
      date: "۱۴ تیر ۱۴۰۵",
      readTime: "مطالعه ۵ دقیقه",
      imageUrl: "/images/blog-implant.svg",
      content: `## راهنمای جامع مراقبت‌های پس از جراحی ایمپلنت دندان

کاشت ایمپلنت دندان یکی از بهترین و ماندگارترین روش‌ها برای جایگزین کردن دندان‌های از دست رفته است. با این حال، موفقیت نهایی این درمان به شدت به **مراقبت‌های پس از جراحی** در هفته‌های اول وابسته است. فرآیند جوش خوردن فیکسچر (پایه ایمپلنت) به استخوان فک که به آن *اسئواینتگریشن* می‌گویند، نیازمند یک محیط آرام و بدون فشار است.

در ادامه به بررسی مهم‌ترین نکات طلایی مراقبت‌های بعد از ایمپلنت می‌پردازیم:

### ۱. کنترل خونریزی و تورم در ۲۴ ساعت اول
* **استفاده از گاز استریل:** پس از اتمام جراحی، گاز استریل قرار داده شده روی ناحیه را به مدت حداقل ۱ الی ۲ ساعت با فشار ملایم دهان نگه دارید. از تف کردن مکرر خودداری کنید زیرا فشار منفی باعث تشدید خونریزی می‌شود.
* **کمپرس یخ:** برای کاهش تورم و کبودی احتمالی، در ۲۴ ساعت اول هر ۲۰ دقیقه یک‌بار کمپرس یخ را روی گونه خود (سمت جراحی شده) قرار دهید.

### ۲. رژیم غذایی مناسب و ایمن
در هفته اول پس از جراحی، از جویدن غذا در سمت جراحی شده به شدت پرهیز کنید. رژیم غذایی شما باید شامل غذاهای نرم، ولرم یا خنک باشد:
* **غذاهای مجاز:** سوپ‌های ولرم و صاف شده، پوره سیب‌زمینی خنک، ماست، فرنی، شیک‌های پروتئینی (بدون استفاده از نی) و ژله.
* **غذاهای غیرمجاز:** غذاهای داغ، تند، اسیدی، و غذاهای سفت یا دانه‌دار (مانند تخمه و کنجد) که ممکن است در ناحیه زخم گیر کنند.

> **نکته بسیار مهم:** هرگز در روزهای اول از **نی** برای نوشیدن استفاده نکنید. مکش ناشی از نی می‌تواند لخته خون محافظ را جدا کرده و منجر به خونریزی مجدد یا عفونت شود.

### ۳. بهداشت دهان و دندان کنترل شده
* **۲۴ ساعت اول:** از مسواک زدن مستقیم روی ناحیه جراحی و شستشوی شدید دهان خودداری کنید.
* **از روز دوم:** می‌توانید بقیه دندان‌ها را با مسواک نرم به آرامی مسواک بزنید. ناحیه جراحی را دست نزنید.
* **شستشو با آب‌نمک ولرم:** از روز دوم، روزی ۳ الی ۴ بار دهان خود را با آب‌نمک بسیار ملایم (یا دهان‌شویه تجویز شده توسط پزشک مانند کلرهگزیدین) بدون غرغره شدید شستشو دهید. فقط آب را در دهان بچرخانید و آرام بیرون بریزید.

### ۴. پرهیز از دخانیات و الکل
مصرف سیگار و قلیان به دلیل داشتن نیکوتین و ایجاد مکش شدید در دهان، باعث کاهش جریان خون در بافت‌های لثه شده و احتمال شکست جراحی ایمپلنت را تا **۳ برابر** افزایش می‌دهد. ترجیحاً تا ۲ هفته پس از کاشت ایمپلنت از دخانیات کاملاً پرهیز کنید.

### ۵. مصرف دقیق داروهای تجویز شده
پزشک معالج برای شما آنتی‌بیوتیک و مسکن‌های ضدالتهاب تجویز خواهد کرد. دوره مصرف آنتی‌بیوتیک را حتی در صورت عدم وجود درد یا علائم عفونت، کاملاً به پایان برسانید تا از بروز عفونت‌های پنهان استخوانی جلوگیری شود.
`
    },
    {
      id: 2,
      title: "تفاوت لمینت سرامیکی و کامپوزیت ونیر چیست؟ کدام مناسب شماست؟",
      excerpt: "بررسی کامل مقایسه قیمت، میزان تراش دندان، ثبات رنگ، طول عمر و تفاوت زیبایی لمینت‌های شیشه‌ای و کامپوزیت‌های سوئیسی.",
      category: "زیبایی",
      date: "۱۰ تیر ۱۴۰۵",
      readTime: "مطالعه ۷ دقیقه",
      imageUrl: "/images/blog-laminate.svg",
      content: `## راهنمای مقایسه: لمینت سرامیکی در برابر کامپوزیت ونیر

داشتن لبخندی درخشان و هماهنگ، نقش بسزایی در اعتماد به نفس و زیبایی چهره دارد. امروزه دو روش محبوب برای اصلاح طرح لبخند وجود دارد: **لمینت سرامیکی (Porcelain Veneers)** و **کامپوزیت ونیر (Composite Veneers)**. هر دو روش عیوب دندانی مانند بدرنگی، فاصله بین دندان‌ها، ترک‌ها و نامنظمی‌های جزیی را برطرف می‌کنند، اما تفاوت‌های ساختاری عمیقی دارند.

در این مقاله تخصصی به مقایسه همه‌جانبه این دو درمان پرطرفدار می‌پردازیم:

### جدول مقایسه سریع مشخصات فنی

| ویژگی | لمینت سرامیکی (پرسی یا کادکام) | کامپوزیت ونیر (دست‌ساز مطب) |
| :--- | :--- | :--- |
| **میزان تراش دندان** | بسیار کم تا متوسط (حدود ۰.۳ تا ۰.۷ میلی‌متر) | بدون تراش یا حداقل تراش ممکن |
| **طول عمر مفید** | ۱۰ الی ۱۵ سال (و حتی بیشتر با مراقبت خوب) | ۵ الی ۷ سال (نیازمند پولیش دوره‌ای) |
| **ثبات رنگ و درخشش** | فوق‌العاده بالا (در برابر چای، قهوه و دخانیات) | متوسط (به مرور زمان کدر شده و رنگ می‌گیرد) |
| **تعداد جلسات درمان** | ۲ الی ۳ جلسه (نیازمند کار قالب‌گیری و لابراتوار) | ۱ جلسه (مستقیماً روی دندان توسط دندانپزشک) |
| **قابلیت ترمیم‌پذیری** | در صورت شکستگی باید کاملاً تعویض شود | به راحتی در مطب قابل ترمیم و اصلاح است |
| **هزینه نهایی** | بالاتر (به دلیل هزینه‌های لابراتوار و متریال پرسلن) | اقتصادی‌تر و ارزان‌تر |

---

### بررسی جزئیات تفاوت‌ها

#### ۱. طبیعی بودن و بازتاب نور
لمینت‌های سرامیکی به دلیل داشتن ساختار شیشه‌ای و نیمه‌شفاف، رفتار نوری بسیار شبیهی به مینای طبیعی دندان دارند. نور از لایه‌های نازک سرامیک عبور کرده و جلوه‌ای فوق‌العاده زنده، درخشان و طبیعی ایجاد می‌کند. کامپوزیت‌ها کمی مات‌تر هستند و اگرچه زیبا به نظر می‌رسند، اما مهارت پزشک در لایه‌گذاری برای رسیدن به جلوه طبیعی دندان بسیار تعیین‌کننده است.

#### ۲. مقاومت در برابر لکه و تغییر رنگ
پرسلن یا سرامیک متریالی کاملاً غیرمتخلخل است. این یعنی ذرات رنگی موجود در قهوه، چای، رب گوجه‌فرنگی و سیگار نمی‌توانند به ساختار آن نفوذ کنند. در مقابل، رزین کامپوزیت تخلخل‌های میکروسکوپی دارد و پس از مدتی رنگ غذاها را به خود جذب می‌کند و نیازمند پولیش سالانه در مطب است.

#### ۳. فرآیند نصب و محافظه‌کارانه بودن
در درمان کامپوزیت ونیر، دندانپزشک مواد رزینی خمیری را به صورت هنرمندانه‌ای روی دندان شما فرم می‌دهد و با نور مخصوص سفت می‌کند. این کار معمولاً بدون هیچ‌گونه تراش روی مینای دندان انجام می‌شود. اما در لمینت سرامیکی، لایه‌ای بسیار نازک از روی دندان تراشیده می‌شود تا دندان‌ها پس از چسباندن لمینت، ضخیم و برجسته به نظر نرسند. بنابراین لمینت یک درمان برگشت‌ناپذیر به شمار می‌رود.

### نتیجه‌گیری: کدام روش برای شما بهتر است؟
* **لمینت سرامیکی مناسب شماست اگر:** به دنبال یک تغییر دائمی، فوق‌العاده لوکس، با ثبات رنگ همیشگی و طول عمر بسیار بالا هستید و با بودجه بیشتر و فرآیند تراش جزئی دندان مشکلی ندارید.
* **کامپوزیت ونیر مناسب شماست اگر:** می‌خواهید در یک جلسه و با هزینه‌ای مناسب‌تر لبخند خود را اصلاح کنید، مایل به تراش خوردن دندان‌هایتان نیستید و مشکلی با مراقبت‌های بیشتر و پولیش‌های دوره‌ای ندارید.
`
    },
    {
      id: 3,
      title: "چگونه بوی بد دهان را یکبار برای همیشه درمان کنیم؟",
      excerpt: "بوی بد دهان همیشه به خاطر مسواک نزدن نیست! علل پنهان مانند بیماری‌های لثه، سنگ لوزه‌ها و مشکلات گوارشی را بشناسید و درمان کنید.",
      category: "سلامت دهان",
      date: "۰۵ تیر ۱۴۰۵",
      readTime: "مطالعه ۴ دقیقه",
      imageUrl: "/images/blog-halitosis.svg",
      content: `## راهنمای علمی ریشه‌یابی و درمان بوی بد دهان (هالیتوزیس)

بوی بد دهان یا **هالیتوزیس (Halitosis)** یکی از مشکلات شایع اجتماعی و بهداشتی است که می‌تواند اعتماد به نفس افراد را در روابط روزمره به شدت تحت تاثیر قرار دهد. بسیاری از افراد تصور می‌کنند بوی بد دهان صرفاً ناشی از عدم رعایت بهداشت یا خوردن غذاهای بودار است، اما حقیقت علمی این است که این مشکل دلایل پنهان و بسیار متنوعی دارد.

در این مقاله به بررسی علت‌های پنهان بوی دهان و راه‌حل‌های قطعی و علمی برای درمان همیشگی آن می‌پردازیم:

### علت‌های اصلی بوی بد دهان چیست؟

۸۵ تا ۹۰ درصد علت بوی بد دهان به مسائل داخل حفره دهان مربوط می‌شود:

1. **تجمع پلاک و جرم‌های دندانی:** فعالیت باکتری‌های بی‌هوازی روی ذرات باقیمادۀ غذا، گازهای فرار گوگردی تولید می‌کند که بوی ناخوشایندی دارند.
2. **بیماری‌های لثه (پریودنتیت):** التهاب و عفونت لثه‌ها و تشکیل پاکت‌های عمیق لثه که محل تجمع باکتری‌هاست، از عوامل اصلی بوی بد مزمن است.
3. **پوشش روی زبان:** سطح زبان به خصوص بخش عقبی آن دارای پرزهایی است که سلول‌های مرده، باکتری‌ها و ذرات غذا در آن به تله می‌افتند.
4. **خشکی دهان (گزروستومی):** بزاق دهان یک پاک‌کننده طبیعی و آنتی‌باکتریال است. کاهش جریان بزاق (به دلیل مصرف برخی داروا، تنفس از دهان یا کم‌آبی بدن) باعث افزایش فعالیت باکتری‌ها می‌شود.
5. **سنگ لوزه (Tonsilloliths):** تجمع کلسیم، ذرات غذا و باکتری در حفره‌های لوزه‌ها که تشکیل توده‌های کوچک زرد رنگ و بسیار بدبو می‌دهد.

### ۱۰ گام کلیدی برای درمان قطعی بوی بد دهان

برای اینکه یک بار برای همیشه از شر بوی بد دهان خلاص شوید، این اصول علمی را در برنامه روزانه خود قرار دهید:

#### ۱. از زبان‌شوی (مسواک زبان) استفاده کنید
تمیز کردن سطح زبان به اندازه مسواک زدن دندان‌ها اهمیت دارد. روزی یک‌بار با مسواک مخصوص زبان یا لبه پشتی مسواک‌های معمولی، پوشش سفید یا زرد روی زبان خود را به آرامی از عقب به جلو تمیز کنید.

#### ۲. نخ دندان را هرگز فراموش نکنید
باکتری‌ها عاشق فضاهای تنگ بین دندانی هستند، جایی که موهای مسواک به آن دسترسی ندارند. اگر نخ دندان نکشید، عملاً ۴۰ درصد از سطح دندان‌های خود را تمیز نکرده‌اید!

#### ۳. درمان بیماری‌های لثه و پوسیدگی‌های دندان
دندان‌های پوسیده که توخالی شده‌اند محل ایدهآلی برای پوسیدن غذا و رشد باکتری‌ها هستند. همچنین جرم‌گیری تخصصی (بروساژ) در مطب دندانپزشکی هر ۶ ماه یک‌بار برای از بین بردن جرم‌های سخت زیر لثه الزامی است.

#### ۴. هیدراته نگه داشتن بدن
نوشیدن آب کافی در طول روز باعث تولید مداوم بزاق می‌شود. جویدن آدامس‌های بدون قند زایلیتول نیز ترشح بزاق را تحریک می‌کند.

#### ۵. بررسی مشکلات گوارشی و ریوی
اگر دندانپزشک تایید کرد که دهان و دندان شما کاملاً سالم است، باید به پزشک داخلی مراجعه کنید. مشکلاتی نظیر رفلاکس معده (GERD)، عفونت میکروب معده (H. pylori)، دیابت کنترل‌نشده یا عفونت‌های سینوسی و ریوی نیز می‌توانند عامل هالیتوزیس باشند.
`
    }
  ],
  patients: defaultPatients,
  transactions: defaultTransactions,
  adminCredentials: {
    username: "admin",
    passwordHash: hashPassword("admin"),
  },
  clinicConfig: {
    phone: "۰۲۱-۲۲۰۰۰۰۰۰ | ۰۲۱-۲۲۰۰۰۰۰۱",
    phoneRaw: "02122000000",
    address: "تهران، الهیه، خیابان فرشته، ساختمان پزشکان مریم، طبقه سوم",
    telegram: "۰۹۱۲۳۴۵۶۷۸۹",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۲۱:۰۰ | پنجشنبه ۹:۰۰ الی ۱۵:۰۰",
    doctorName: "دکتر مختاری",
    doctorTitle: "جراح و دندانپزشک زیبایی - فلوشیپ ایمپلنتولوژی دیجیتال از سوئیس",
    aboutDesc: "هدف ما در دنت فلو برطرف کردن ترس‌ها و دغدغه‌های همیشگی شما از دندانپزشکی است. ما معتقدیم کیفیت و دقت در درمان حق بیمار است و با گردهم‌آوری بهترین متخصصان، به کارگیری فناوری سه‌بعدی دیجیتال و دکوراسیون پزشکی آرامش‌بخش، فضایی رویایی برای درمان به وجود آورده‌ایم.",
    installmentInfo: "۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره و سود",
    shiftMorningName: "شیفت صبح",
    shiftMorningCapacity: 10,
    shiftAfternoonName: "شیفت عصر / بعد از ظهر",
    shiftAfternoonCapacity: 10
  },
  services: defaultServices,
  aiConfig: {
    name: "دستیار هوشمند دنت فلو",
    greeting: "سلام! من دستیار هوشمند و تخصصی کلینیک دندانپزشکی دنت فلو هستم. هر سوالی درباره طرح درمان، هزینه‌ها، اقساط، ترس از دندانپزشکی یا خدمات ما دارید بپرسید؛ من با عشق راهنمایی‌تان می‌کنم! ✨",
    prompt: `شما دستیار تخصصی، دلسوز و فوق‌العاده باهوش کلینیک دندانپزشکی دیجیتال "دنت فلو" (DentFlow) هستید. نام شما "دستیار هوشمند دنت فلو" است.
وظایف شما:
۱. پاسخ به سوالات مراجعین و بیماران درباره مشکلات دندانی، بیماری‌های دهان، خدمات کلینیک، هزینه‌ها، و شرايط اقساطی به زبان فارسی شیوا، صمیمی، دلسوزانه و کاملاً محترمانه.
۲. معرفی خدمات مختلف کلینیک دنت فلو (ایمپلنت دیجیتال سوئیسی، لمینت سرامیکی E-max، ونیر کامپوزیت IPS، ارتودنسی نامرئی الاینر، عصب‌کشی روتاری بدون درد، اطفال و جراحی‌های لثه).
۳. دندانپزشک ارشد کلینیک "دکتر مختاری" (جراح و دندانپزشک زیبایی، دارای فلوشیپ ایمپلنتولوژی دیجیتال از سوئیس با بیش از ۱۰ سال سابقه و ثبت بیش از ۵۰۰۰ مورد ترمیم موفق لبخند) است.
۴. شماره تماس کلینیک: ۰۲۱-۲۲۰۰۰۰۰۰ است. آدرس کلینیک در شهر تهران (منطقه الهیه، خیابان فرشته) می‌باشد.
۵. شرایط پرداخت اقساطی بسیار منعطف است: ۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره و سود.
۶. برای بیماران با ترس و اضطراب شدید دندانپزشکی، توضیح دهید که ما مجهز به سیستم "سدیشن" (سودیشن یا خواب مصنوعی بسیار ایمن و آرام‌بخش با نظارت متخصص بیهوشی) هستیم تا درمان کاملاً بدون درد و بدون کوچکترین استرسی سپری شود.

به یاد داشته باشید شما سفیر برند دنت فلو هستید و آرامش دادن به بیمار اولویت اول شماست.`
  },
  messages: [
    {
      id: "M-101",
      name: "حسین حسینی",
      phone: "09123456789",
      message: "سلام، من مایل هستم برای مشاوره ایمپلنت قسطی حضوراً خدمت برسم. آیا فردا ساعت ۱۷ تایم خالی دارید؟",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: "unread"
    },
    {
      id: "M-102",
      name: "مریم کرمی",
      phone: "09129876543",
      message: "درود بر شما، هزینه بلیچینگ دندان برای هر دو فک چقدر می‌شود و آیا شامل تخفیف تابستانه هست؟",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: "read"
    }
  ],
  testimonials: defaultTestimonials
};

// Application Global State variables
let bookings: Booking[] = [...defaultClinicState.bookings];
let blogPosts: BlogPost[] = sanitizeBlogPosts([...defaultClinicState.blogPosts]);
let patients: any[] = [];
let transactions: any[] = [];
let adminCredentials = { ...defaultClinicState.adminCredentials };
let clinicConfig = { ...defaultClinicState.clinicConfig };
let services: any[] = [];
let aiConfig = { ...defaultClinicState.aiConfig };
let messages: any[] = [];
let testimonials: any[] = [];

// Temporary in-memory storage for patient OTPs
// In production, use a database with TTL or Redis
const patientOtps = new Map<string, { code: string; expires: number }>();

let mongoClient: MongoClient | null = null;

async function getMongoCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
      console.log("Successfully connected to MongoDB.");
    }
    const dbName = uri.split("/").pop()?.split("?")[0] || "dentflow";
    const db = mongoClient.db(dbName);
    return db.collection("clinic_state");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return null;
  }
}

async function getMongoImagesCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
    }
    const dbName = uri.split("/").pop()?.split("?")[0] || "dentflow";
    const db = mongoClient.db(dbName);
    return db.collection("uploaded_images");
  } catch (error) {
    console.error("Failed to connect to MongoDB for images:", error);
    return null;
  }
}

async function saveImageToMongo(fileName: string, mimeType: string, base64Data: string) {
  try {
    const imagesCollection = await getMongoImagesCollection();
    if (imagesCollection) {
      await imagesCollection.replaceOne(
        { _id: fileName as any },
        { _id: fileName, mimeType, base64Data } as any,
        { upsert: true }
      );
      console.log(`Saved image ${fileName} to MongoDB successfully.`);
    }
  } catch (err) {
    console.error(`Failed to save image ${fileName} to MongoDB:`, err);
  }
}

async function loadState() {
  try {
    let parsed: any = null;
    const collection = await getMongoCollection();
    
    if (collection) {
      console.log("Attempting to load state from MongoDB...");
      try {
        const doc = await collection.findOne({ _id: "global_state" as any });
        if (doc) {
          parsed = doc;
          console.log("State successfully loaded from MongoDB.");
        } else {
          console.log("No existing state found in MongoDB. Initializing with default state...");
          const payload = {
            _id: "global_state",
            bookings: defaultClinicState.bookings,
            blogPosts: defaultClinicState.blogPosts,
            patients: defaultClinicState.patients,
            transactions: defaultClinicState.transactions,
            adminCredentials: defaultClinicState.adminCredentials,
            clinicConfig: defaultClinicState.clinicConfig,
            services: defaultClinicState.services,
            aiConfig: defaultClinicState.aiConfig,
            messages: defaultClinicState.messages,
            testimonials: defaultClinicState.testimonials
          };
          await collection.insertOne(payload as any);
          parsed = payload;
          console.log("Initialized MongoDB state with default state.");
        }
      } catch (dbError) {
        console.error("Error communicating with MongoDB during loadState, will fallback to local file:", dbError);
      }
    }

    if (!parsed) {
      await mkdir(path.dirname(stateFilePath), { recursive: true });
      let rawData: string;
      try {
        rawData = await readFile(stateFilePath, "utf-8");
      } catch {
        rawData = JSON.stringify(defaultClinicState, null, 2);
        await writeFile(stateFilePath, rawData, "utf-8");
      }
      parsed = JSON.parse(rawData);
      console.log("State loaded from local file storage.");
    }

    bookings = parsed.bookings || [];
    blogPosts = sanitizeBlogPosts(parsed.blogPosts || []);
    messages = parsed.messages || [...defaultClinicState.messages];
    
    let needsSave = false;
    if (parsed.patients && Array.isArray(parsed.patients) && parsed.patients.length > 0) {
      patients = parsed.patients;
    } else {
      patients = [...defaultClinicState.patients];
      needsSave = true;
    }

    if (parsed.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
      transactions = parsed.transactions;
    } else {
      transactions = [...defaultClinicState.transactions];
      needsSave = true;
    }

    if (parsed.services && Array.isArray(parsed.services) && parsed.services.length > 0) {
      services = parsed.services;
    } else {
      services = [...defaultClinicState.services];
      needsSave = true;
    }

    if (parsed.testimonials && Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0) {
      testimonials = parsed.testimonials;
    } else {
      testimonials = [...defaultClinicState.testimonials];
      needsSave = true;
    }

    adminCredentials = normalizeAdminCredentials(parsed.adminCredentials);
    clinicConfig = parsed.clinicConfig || defaultClinicState.clinicConfig;
    aiConfig = parsed.aiConfig || defaultClinicState.aiConfig;

    if (needsSave) {
      console.log("Seeding missing default records (patients/transactions/services/testimonials) to MongoDB...");
      // We will perform persist inline since persistState might call getMongoCollection
      const payload = {
        bookings,
        blogPosts,
        patients,
        transactions,
        adminCredentials,
        clinicConfig,
        services,
        aiConfig,
        messages,
        testimonials
      };
      const collection = await getMongoCollection();
      if (collection) {
        try {
          await collection.replaceOne(
            { _id: "global_state" as any },
            { _id: "global_state", ...payload } as any,
            { upsert: true }
          );
          console.log("Successfully seeded default state to MongoDB.");
        } catch (dbError) {
          console.error("Error seeding default state to MongoDB:", dbError);
        }
      }
    }
  } catch (error) {
    console.error("Error loading state, using defaults:", error);
    bookings = [...defaultClinicState.bookings];
    blogPosts = sanitizeBlogPosts([...defaultClinicState.blogPosts]);
    patients = [...defaultClinicState.patients];
    transactions = [...defaultClinicState.transactions];
    adminCredentials = { ...defaultClinicState.adminCredentials };
    clinicConfig = { ...defaultClinicState.clinicConfig };
    services = [...defaultClinicState.services];
    aiConfig = { ...defaultClinicState.aiConfig };
    testimonials = [...defaultClinicState.testimonials];
  }
}

async function persistState() {
  try {
    const payload = {
      bookings,
      blogPosts,
      patients,
      transactions,
      adminCredentials,
      clinicConfig,
      services,
      aiConfig,
      messages,
      testimonials
    };

    const collection = await getMongoCollection();
    if (collection) {
      console.log("Saving state to MongoDB...");
      try {
        await collection.replaceOne(
          { _id: "global_state" as any },
          { _id: "global_state", ...payload } as any,
          { upsert: true }
        );
        console.log("State successfully saved to MongoDB.");
      } catch (dbError) {
        console.error("Error communicating with MongoDB during persistState:", dbError);
      }
    }

    await mkdir(path.dirname(stateFilePath), { recursive: true });
    await writeFile(stateFilePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.error("Error persisting state:", error);
  }
}

// Session authentication management
const activeSessions = new Map<string, string>(); // token -> username

async function sendEmail(to: string, subject: string, body: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("GMAIL_USER or GMAIL_PASS environment variables are missing, cannot send email.");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

function createAdminSession(username: string): string {
  const token = randomUUID();
  activeSessions.set(token, username);
  return token;
}

function verifyAdminSession(token: string): boolean {
  return activeSessions.has(token);
}

const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "شما به این بخش دسترسی ندارید. لطفاً مجدداً وارد شوید." });
  }
  const token = authHeader.substring(7);
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: "نشست شما منقضی شده است. لطفا دوباره وارد شوید." });
  }
  next();
};

// Initialize Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

  app.get("/uploads/:fileName", async (req, res, next) => {
    const fileName = req.params.fileName;
    const localPath = path.join(process.cwd(), "public", "uploads", fileName);
    
    try {
      res.sendFile(localPath, (err) => {
        if (err) {
          // If sending fails (file doesn't exist on disk), serve from MongoDB
          serveFromMongo();
        }
      });
    } catch {
      serveFromMongo();
    }

    async function serveFromMongo() {
      try {
        const imagesCollection = await getMongoImagesCollection();
        if (!imagesCollection) {
          return res.status(404).send("File not found and database not available");
        }

        const doc = await imagesCollection.findOne({ _id: fileName as any });
        if (!doc) {
          return res.status(404).send("File not found in database");
        }

        const mimeType = doc.mimeType || "image/jpeg";
        const buffer = Buffer.from(doc.base64Data, "base64");

        // Attempt to restore file to local disk for future fast serving
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await mkdir(uploadsDir, { recursive: true });
          await writeFile(localPath, buffer);
          console.log(`Restored image ${fileName} from MongoDB to disk.`);
        } catch (writeErr) {
          console.warn("Could not cache file to disk (expected on Vercel/serverless):", writeErr);
        }

        res.contentType(mimeType);
        res.send(buffer);
      } catch (err) {
        console.error("Error serving image from MongoDB:", err);
        res.status(500).send("Internal server error serving file");
      }
    }
  });
  app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

  // Load persistence state from JSON file
  await loadState();

  // API Route: Upload image as base64
  app.post("/api/upload", authenticateAdmin, async (req, res) => {
    try {
      const { file, fileName } = req.body;
      if (!file) {
        return res.status(400).json({ error: "هیچ فایلی ارسال نشده است." });
      }

      // Check base64 format and strip prefix
      const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let base64Data = file;
      let extension = ".png";

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        base64Data = matches[2];
        if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
          extension = ".jpg";
        } else if (mimeType.includes("webp")) {
          extension = ".webp";
        } else if (mimeType.includes("gif")) {
          extension = ".gif";
        }
      } else {
        if (fileName) {
          const ext = path.extname(fileName);
          if (ext) extension = ext;
        }
      }

      const buffer = Buffer.from(base64Data, "base64");
      
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      
      const uniqueFileName = `${randomUUID()}${extension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);
      
      await writeFile(filePath, buffer);
      
      // Determine mimetype to store in MongoDB
      let detectedMime = "image/png";
      if (extension === ".jpg" || extension === ".jpeg") {
        detectedMime = "image/jpeg";
      } else if (extension === ".webp") {
        detectedMime = "image/webp";
      } else if (extension === ".gif") {
        detectedMime = "image/gif";
      } else if (extension === ".svg") {
        detectedMime = "image/svg+xml";
      }
      
      // Save uploaded image to MongoDB
      await saveImageToMongo(uniqueFileName, detectedMime, base64Data);
      
      res.json({ url: `/uploads/${uniqueFileName}` });
    } catch (error: any) {
      console.error("Upload failed:", error);
      res.status(500).json({ error: "خطا در آپلود فایل: " + error.message });
    }
  });

  // API Route: Get complete clinic state
  app.get("/api/clinic-state", (req, res) => {
    res.json({
      bookings,
      blogPosts,
      patients,
      transactions,
      adminCredentials: {
        username: adminCredentials.username,
      },
      clinicConfig,
      services,
      aiConfig,
      messages,
      testimonials,
    });
  });

  // API Route: Update testimonial status
  app.put("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const index = testimonials.findIndex(t => t.id === Number(id));
      if (index === -1) return res.status(404).json({ error: "دیدگاه یافت نشد." });

      testimonials[index].status = status;
      await persistState();
      res.json(testimonials[index]);
    } catch (error) {
      res.status(500).json({ error: "خطا در به‌روزرسانی دیدگاه." });
    }
  });

  // API Route: Delete testimonial
  app.delete("/api/testimonials/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      testimonials = testimonials.filter(t => t.id !== Number(id));
      await persistState();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف دیدگاه." });
    }
  });

  // API Route: Synchronize complete state (protected)
  app.post("/api/clinic-state", authenticateAdmin, async (req, res) => {
    try {
      const { patients: p, transactions: t, blogPosts: b, adminCredentials: ac, clinicConfig: cc, services: s, aiConfig: aiC, messages: m, testimonials: tm } = req.body || {};
      if (Array.isArray(p)) patients = p;
      if (Array.isArray(t)) transactions = t;
      if (Array.isArray(b)) {
        const processedPosts = [];
        for (const post of b) {
          if (post.imageUrl && post.imageUrl.startsWith("http")) {
            post.imageUrl = await downloadImageIfExternal(post.imageUrl);
          }
          processedPosts.push(post);
        }
        blogPosts = sanitizeBlogPosts(processedPosts);
      }
      if (cc) clinicConfig = cc;
      if (Array.isArray(s)) services = s;
      if (aiC) aiConfig = aiC;
      if (Array.isArray(m)) messages = m;
      if (Array.isArray(tm)) testimonials = tm;
      if (ac && ac.username) {
        adminCredentials.username = ac.username;
      }
      await persistState();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Sync state error:", error);
      res.status(500).json({ error: error.message || "خطا در همگام‌سازی اطلاعات کلینیک" });
    }
  });

  // API Route: Admin login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "نام کاربری و کلمه عبور الزامی هستند." });
    }

    const isValid = username.trim().toLowerCase() === adminCredentials.username.trim().toLowerCase() && 
                    hashPassword(password) === adminCredentials.passwordHash;

    if (!isValid) {
      return res.status(401).json({ error: "نام کاربری یا کلمه عبور نادرست است." });
    }

    const token = createAdminSession(adminCredentials.username);
    return res.json({ ok: true, token, username: adminCredentials.username });
  });

  // API Route: Admin update password
  app.post("/api/admin/update-password", authenticateAdmin, async (req, res) => {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body || {};

    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: "اطلاعات وارد شده ناقص است." });
    }

    const isCurrentValid = currentUsername.trim().toLowerCase() === adminCredentials.username.trim().toLowerCase() && 
                           hashPassword(currentPassword) === adminCredentials.passwordHash;
    if (!isCurrentValid) {
      return res.status(401).json({ error: "کلمه عبور فعلی نادرست است." });
    }

    adminCredentials.username = newUsername.trim();
    adminCredentials.passwordHash = hashPassword(newPassword);
    await persistState();
    res.json({ success: true, username: adminCredentials.username });
  });

  // API Route: Chat with AI Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, customSystemInstruction } = req.body || {};

      if (!message) {
        return res.status(400).json({ error: "پیام کاربر الزامی است." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ text: "سلام! هم‌اکنون کلید هوش مصنوعی در سرور فعال نیست؛ کادر درمان ما به زودی با شما تماس خواهند گرفت یا می‌توانید از پنل رزرو آنلاین نوبت خود را نهایی کنید. 🦷✨" });
      }

      const defaultSystemInstruction = `شما دستیار تخصصی، دلسوز و فوق‌العاده باهوش کلینیک دندانپزشکی دیجیتال "دنت فلو" (DentFlow) هستید. نام شما "دستیار هوشمند دنت فلو" است.
وظایف شما:
۱. پاسخ به سوالات مراجعین و بیماران درباره مشکلات دندانی، بیماری‌های دهان، خدمات کلینیک، هزینه‌ها، و شرايط اقساطی به زبان فارسی شیوا، صمیمی، دلسوزانه و کاملاً محترمانه.
۲. معرفی خدمات مختلف کلینیک دنت فلو (ایمپلنت دیجیتال سوئیسی، لمینت سرامیکی E-max، ونیر کامپوزیت IPS، ارتودنسی نامرئی الاینر، عصب‌کشی روتاری بدون درد، اطفال و جراحی‌های لثه).
۳. دندانپزشک ارشد کلینیک "دکتر مختاری" (جراح و دندانپزشک زیبایی، دارای فلوشیپ ایمپلنتولوژی دیجیتال از سوئیس با بیش از ۱۰ سال سابقه و ثبت بیش از ۵۰۰۰ مورد ترمیم موفق لبخند) است.
۴. شماره تماس کلینیک: ۰۲۱-۲۲۰۰۰۰۰۰ است. آدرس کلینیک در شهر تهران (منطقه الهیه، خیابان فرشته) می‌باشد.
۵. شرایط پرداخت اقساطی بسیار منعطف است: ۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره و سود.
۶. برای بیماران با ترس و اضطراب شدید دندانپزشکی، توضیح دهید که ما مجهز به سیستم "سدیشن" (سودیشن یا خواب مصنوعی بسیار ایمن و آرام‌بخش با نظارت متخصص بیهوشی) هستیم تا درمان کاملاً بدون درد و بدون کوچکترین استرسی سپری شود.

به یاد داشته باشید شما سفیر برند دنت فلو هستید و آرامش دادن به بیمار اولویت اول شماست.`;

      const formattedContents = [];
      if (Array.isArray(history)) {
        for (const turn of history) {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: customSystemInstruction || aiConfig.prompt || defaultSystemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error);
      return res.status(500).json({ error: error.message || "An error occurred during generating content." });
    }
  });
  
  // API Route: Track booking by ID
  app.get("/api/bookings/track/:id", async (req, res) => {
    const { id } = req.params;
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      return res.status(404).json({ error: "نوبتی با این کد رهگیری یافت نشد." });
    }

    // Lookup corresponding patient record by phone
    const normalizePhone = (p: string) => {
      if (!p) return "";
      return p.replace(/[\s\-\(\)\+]/g, "").replace(/^0098|^98/, "0").trim();
    };

    const bookingPhone = normalizePhone(booking.phone);
    const patient = patients.find(p => normalizePhone(p.phone) === bookingPhone);

    if (patient) {
      return res.json({
        ...booking,
        patientRecord: {
          id: patient.id,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          history: patient.history,
          bloodType: patient.bloodType,
          treatmentPlan: patient.treatmentPlan || [],
          prescriptions: patient.prescriptions || [],
          medicalPhotos: patient.medicalPhotos || []
        }
      });
    }

    res.json(booking);
  });

  // API Route: Update booking
  app.put("/api/bookings/:id", async (req, res) => {
    const { id } = req.params;
    const { status, notes, adminComment, date, timeSlot } = req.body;

    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "نوبت پیدا نشد." });
    }

    const previousStatus = bookings[bookingIndex].status;

    if (status) {
      bookings[bookingIndex].status = status;
    }
    if (notes !== undefined) {
      bookings[bookingIndex].notes = notes;
    }
    if (adminComment !== undefined) {
      bookings[bookingIndex].adminComment = adminComment;
    }
    if (date) {
      bookings[bookingIndex].date = date;
    }
    if (timeSlot) {
      bookings[bookingIndex].timeSlot = timeSlot;
    }

    // Send email if status changed to approved and email exists
    if (status === "approved" && previousStatus !== "approved" && bookings[bookingIndex].email) {
      const shiftName = bookings[bookingIndex].timeSlot === "morning" ? (clinicConfig.shiftMorningName || "شیفت صبح") : (clinicConfig.shiftAfternoonName || "شیفت عصر");
      const emailHtml = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; line-height: 1.6; padding: 20px;">
          <h2>سلام ${bookings[bookingIndex].fullName} عزیز،</h2>
          <p>نوبت شما در کلینیک دندانپزشکی دنت فلو <b>تایید شد</b>.</p>
          <p><b>تاریخ نوبت:</b> ${bookings[bookingIndex].date}</p>
          <p><b>زمان:</b> ${shiftName}</p>
          ${bookings[bookingIndex].adminComment ? `<p><b>پیام کلینیک:</b> ${bookings[bookingIndex].adminComment}</p>` : ""}
          <hr style="border: 1px solid #eee; my: 20px;"/>
          <p style="font-size: 12px; color: #777;">با تشکر،<br/>کلینیک دنت فلو</p>
        </div>
      `;
      sendEmail(bookings[bookingIndex].email!, "✅ نوبت شما در دنت فلو تایید شد", emailHtml);
    } else if (status === "cancelled" && previousStatus !== "cancelled" && bookings[bookingIndex].email) {
      const emailHtml = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; line-height: 1.6; padding: 20px;">
          <h2>سلام ${bookings[bookingIndex].fullName} عزیز،</h2>
          <p>متاسفانه نوبت شما در تاریخ ${bookings[bookingIndex].date} در کلینیک دنت فلو لغو شد.</p>
          <p>لطفاً برای هماهنگی مجدد با ما تماس بگیرید.</p>
          <hr style="border: 1px solid #eee; my: 20px;"/>
          <p style="font-size: 12px; color: #777;">با تشکر،<br/>کلینیک دنت فلو</p>
        </div>
      `;
      sendEmail(bookings[bookingIndex].email!, "❌ لغو نوبت در دنت فلو", emailHtml);
    }

    await persistState();
    res.json(bookings[bookingIndex]);
  });

  // API Route: Delete booking
  app.delete("/api/bookings/:id", async (req, res) => {
    const { id } = req.params;
    const initialLength = bookings.length;
    bookings = bookings.filter(b => b.id !== id);

    if (bookings.length === initialLength) {
      return res.status(404).json({ error: "نوبت پیدا نشد." });
    }

    await persistState();
    res.json({ success: true, message: "نوبت با موفقیت حذف شد." });
  });

  // API Route: Send custom email
  app.post("/api/send-email", authenticateAdmin, async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "گیرنده، موضوع و متن پیام الزامی است." });
      }
      const success = await sendEmail(to, subject, body);
      if (success) {
        // Save to patient chat history
        const patient = patients.find(p => p.email && p.email.toLowerCase() === to.toLowerCase());
        if (patient) {
          if (!patient.chat) patient.chat = [];
          patient.chat.unshift({
            id: Date.now(),
            date: new Date().toLocaleDateString("fa-IR"),
            time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }),
            sender: "clinic",
            subject,
            text: body.replace(/<[^>]*>/g, ""),
            status: "read"
          });
          await persistState();
        }
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "خطا در ارسال ایمیل. مطمئن شوید که اکانت جیمیل به درستی متصل شده است." });
      }
    } catch (error) {
      res.status(500).json({ error: "خطا در ارسال ایمیل." });
    }
  });

  // API Route: Submit new contact message
  app.post("/api/messages", async (req, res) => {
    try {
      const { name, phone, message } = req.body || {};
      if (!name || !phone || !message) {
        return res.status(400).json({ error: "وارد کردن تمامی فیلدهای نام، شماره تماس و متن پیام الزامی است." });
      }

      const newId = "M-" + Math.floor(100 + Math.random() * 900);
      const newMessage = {
        id: newId,
        name,
        phone,
        message,
        createdAt: new Date().toISOString(),
        status: "unread"
      };

      messages.unshift(newMessage);

      // Link to patient chat if patient exists
      const patient = patients.find(p => 
        (p.phone && p.phone.replace(/[\s\-\(\)\+]/g, "") === phone.replace(/[\s\-\(\)\+]/g, "")) ||
        (p.email && p.email.toLowerCase() === (req.body.email || "").toLowerCase())
      );

      if (patient) {
        if (!patient.chat) patient.chat = [];
        patient.chat.unshift({
          id: Date.now(),
          date: new Date().toLocaleDateString("fa-IR"),
          time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }),
          sender: "patient",
          text: `[پیام از فرم تماس]: ${message}`,
          status: "unread"
        });
      }

      await persistState();
      res.status(201).json(newMessage);
    } catch (error: any) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ error: "خطا در ثبت پیام. لطفاً دوباره تلاش کنید." });
    }
  });

  // API Route: Submit new testimonial
  app.post("/api/testimonials", async (req, res) => {
    try {
      const { name, treatment, rating, comment, avatarUrl } = req.body || {};
      if (!name || !treatment || !rating || !comment) {
        return res.status(400).json({ error: "وارد کردن تمامی فیلدهای نام، درمان، امتیاز و متن دیدگاه الزامی است." });
      }

      const newTestimonial = {
        id: Date.now(),
        name: name.trim(),
        treatment: treatment.trim(),
        rating: Number(rating) || 5,
        comment: comment.trim(),
        avatarUrl: avatarUrl || "/images/avatar-default.svg",
        status: "pending"
      };

      testimonials.unshift(newTestimonial);
      await persistState();
      res.status(201).json(newTestimonial);
    } catch (error: any) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ error: "خطا در ثبت دیدگاه. لطفاً دوباره تلاش کنید." });
    }
  });

  // API Route: Get all contact messages
  app.get("/api/messages", authenticateAdmin, (req, res) => {
    res.json(messages);
  });

  // API Route: Update contact message status
  app.put("/api/messages/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      const index = messages.findIndex(m => m.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "پیام یافت نشد." });
      }
      if (status) {
        messages[index].status = status;
      }
      await persistState();
      res.json(messages[index]);
    } catch (error: any) {
      console.error("Error updating contact message:", error);
      res.status(500).json({ error: "خطا در به‌روزرسانی پیام." });
    }
  });

  // API Route: Delete contact message
  app.delete("/api/messages/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = messages.length;
      messages = messages.filter(m => m.id !== id);
      if (messages.length === initialLength) {
        return res.status(404).json({ error: "پیام یافت نشد." });
      }
      await persistState();
      res.json({ success: true, message: "پیام با موفقیت حذف شد." });
    } catch (error: any) {
      console.error("Error deleting contact message:", error);
      res.status(500).json({ error: "خطا در حذف پیام." });
    }
  });

  // API Route: Get all articles
  app.get("/api/articles", (req, res) => {
    res.json(blogPosts);
  });

  // API Route: Create new article
  app.post("/api/articles", async (req, res) => {
    const { title, excerpt, category, date, readTime, imageUrl, content } = req.body;

    if (!title || !excerpt || !category) {
      return res.status(400).json({ error: "عنوان، خلاصه و دسته‌بندی مقاله الزامی هستند." });
    }

    const finalImageUrl = await downloadImageIfExternal(imageUrl);

    const newId = blogPosts.length > 0 ? Math.max(...blogPosts.map(p => p.id)) + 1 : 1;
    const newArticle: BlogPost = {
      id: newId,
      title,
      excerpt,
      category,
      date: date || new Date().toLocaleDateString("fa-IR"),
      readTime: readTime || "مطالعه ۵ دقیقه",
      imageUrl: finalImageUrl || "/images/blog-implant.svg",
      content: content || ""
    };

    blogPosts.unshift(newArticle);
    await persistState();
    res.status(201).json(newArticle);
  });

  // API Route: Update article
  app.put("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, excerpt, category, date, readTime, imageUrl, content } = req.body;

    const index = blogPosts.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "مقاله یافت نشد." });
    }

    let finalImageUrl = imageUrl;
    if (imageUrl) {
      finalImageUrl = await downloadImageIfExternal(imageUrl);
    }

    blogPosts[index] = {
      ...blogPosts[index],
      title: title || blogPosts[index].title,
      excerpt: excerpt || blogPosts[index].excerpt,
      category: category || blogPosts[index].category,
      date: date || blogPosts[index].date,
      readTime: readTime || blogPosts[index].readTime,
      imageUrl: finalImageUrl || blogPosts[index].imageUrl,
      content: content !== undefined ? content : blogPosts[index].content,
    };

    await persistState();
    res.json(blogPosts[index]);
  });

  // API Route: Delete article
  app.delete("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = blogPosts.length;
    blogPosts = blogPosts.filter(p => p.id !== id);

    if (blogPosts.length === initialLength) {
      return res.status(404).json({ error: "مقاله یافت نشد." });
    }

    await persistState();
    res.json({ success: true, message: "مقاله با موفقیت حذف شد." });
  });

  // API Route: Generate or Refine article content with Gemini
  app.post("/api/articles/generate", async (req, res) => {
    try {
      const { topic, category, existingContent, mode, tone, length } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        // Mock response if no API key
        if (mode === "refine") {
          return res.json({ content: (existingContent || "") + "\n\n[متن توسط هوش مصنوعی بهبود یافت - شبیه‌سازی]" });
        }
        return res.json({
          title: `راهنمای جامع ${topic || "موضوع جدید"}`,
          excerpt: "خلاصه تولید شده توسط هوش مصنوعی (شبیه‌سازی)",
          category: category || "عمومی",
          readTime: "مطالعه ۵ دقیقه",
          imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop",
          content: "محتوای تولید شده توسط هوش مصنوعی (شبیه‌سازی)"
        });
      }

      let prompt = "";
      if (mode === "refine") {
        prompt = `تو یک ویراستار حرفه‌ای هستی. متن زیر را که مربوط به یک کلینیک دندانپزشکی است، بازنویسی و اصلاح کن تا حرفه‌ای‌تر، جذاب‌تر و علمی‌تر به نظر برسد. 
لحن متن باید ${tone === "friendly" ? "دوستانه" : tone === "simple" ? "ساده و روان" : "علمی و تخصصی"} باشد.
خروجی باید فقط شامل متن اصلاح شده باشد و هیچ توضیح اضافه‌ای نده.

متن فعلی:
${existingContent}`;
      } else if (mode === "continue") {
        prompt = `متن زیر ناتمام است. بر اساس محتوای موجود، آن را به شکلی منطقی و جذاب ادامه بده و به پایان برسان.
موضوع: ${topic || "دندانپزشکی"}
متن موجود:
${existingContent}`;
      } else {
        // Original generation mode
        prompt = `یک مقاله علمی، کاملاً تخصصی، بسیار جذاب و مفید برای وبلاگ یک کلینیک دندانپزشکی پیشرفته با موضوع "${topic}" بنویس.
این مقاله متعلق به دسته‌بندی "${category}" است.
لحن: ${tone || "تخصصی"}، طول: ${length || "متوسط"}.
خروجی باید حتماً به صورت یک شیء JSON با ساختار زیر باشد و هیچ متنی به جز JSON در خروجی نباشد:
{
  "title": "یک عنوان جذاب، علمی و بسیار باکلاس به زبان فارسی",
  "excerpt": "یک خلاصه ترغیب‌کننده و جامع از مقاله شامل حداقل ۳ جمله کامل به زبان فارسی که کاربر را به خواندن کل مطلب تشویق کند",
  "category": "${category}",
  "readTime": "مدت زمان تقریبی مطالعه بر حسب دقیقه به فارسی",
  "imageUrl": "یک آدرس تصویر باکیفیت از Unsplash مرتبط",
  "content": "کل متن مقاله به صورت کامل در قالب فرمت HTML (فقط از تگ‌های h2, h3, p, ul, li, strong استفاده کن) به زبان فارسی."
}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: mode === "refine" || mode === "continue" ? undefined : {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              category: { type: Type.STRING },
              readTime: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "excerpt", "category", "readTime", "imageUrl", "content"]
          }
        }
      });

      if (mode === "refine" || mode === "continue") {
        res.json({ content: response.text });
      } else {
        res.json(JSON.parse(response.text || "{}"));
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "خطا در تولید محتوا با هوش مصنوعی." });
    }
  });
  // --- PATIENT PORTAL API ---

  // 1. Request Login Code
  app.post("/api/patient/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "ایمیل الزامی است." });

      // Find patient by email
      const patient = patients.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
      if (!patient) {
        return res.status(404).json({ error: "بیماری با این مشخصات یافت نشد. لطفا با کلینیک تماس بگیرید." });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      patientOtps.set(email.toLowerCase(), { code, expires });

      // Send Email using the helper function
      const bodyHtml = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; line-height: 1.6; padding: 20px; border: 1px solid #eee; border-radius: 15px;">
          <h2 style="color: #0d9488;">خوش آمدید به پورتال بیماران دنت فلو</h2>
          <p>سلام ${patient.fullName} عزیز،</p>
          <p>کد تایید شما جهت ورود به سامانه:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border-radius: 10px; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #666;">این کد تا ۱۰ دقیقه دیگر اعتبار دارد.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #999;">اگر شما درخواستی برای ورود نداده‌اید، لطفا این پیام را نادیده بگیرید.</p>
        </div>
      `;

      const emailSent = await sendEmail(email, "کد تایید ورود به داشبورد بیمار - دنت فلو", bodyHtml);
      
      if (!emailSent) {
        return res.status(500).json({ 
          error: "خطا در ارسال ایمیل تایید. لطفا از ادمین کلینیک بخواهید تنظیمات ایمیل (GMAIL_USER و GMAIL_PASS) را در تنظیمات پنل AI Studio وارد کند." 
        });
      }

      res.json({ success: true, message: "کد تایید به ایمیل شما ارسال شد." });
    } catch (err: any) {
      console.error("Patient OTP request error:", err);
      res.status(500).json({ error: "خطا در پردازش درخواست ورود." });
    }
  });

  // 2. Verify Login Code and Fetch Dashboard Data
  app.post("/api/patient/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: "ایمیل و کد تایید الزامی هستند." });

      const stored = patientOtps.get(email.toLowerCase());
      if (!stored || stored.code !== code || stored.expires < Date.now()) {
        return res.status(401).json({ error: "کد تایید اشتباه است یا منقضی شده است." });
      }

      // OTP verified - Find patient and gather all data
      const patient = patients.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
      if (!patient) return res.status(404).json({ error: "بیمار یافت نشد." });

      // Gather related data
      const patientBookings = bookings.filter(b => b.email && b.email.toLowerCase() === email.toLowerCase());
      const patientTransactions = transactions.filter(t => t.patientId === patient.id);
      
      // Clear OTP
      patientOtps.delete(email.toLowerCase());

      res.json({
        success: true,
        patient: {
          ...patient,
          bookings: patientBookings,
          transactions: patientTransactions
        }
      });
    } catch (error: any) {
      console.error("Patient verify error:", error);
      res.status(500).json({ error: "خطا در تایید کد ورود." });
    }
  });

  // 3. Patient sends message to clinic
  app.post("/api/patient/send-message", async (req, res) => {
    try {
      const { email, message } = req.body;
      if (!email || !message) return res.status(400).json({ error: "ایمیل و متن پیام الزامی است." });

      const patient = patients.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
      if (!patient) return res.status(404).json({ error: "بیمار یافت نشد." });

      if (!patient.chat) patient.chat = [];
      
      const newMsg = {
        id: Date.now(),
        date: new Date().toLocaleDateString("fa-IR"),
        time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }),
        sender: "patient",
        text: message,
        status: "unread"
      };

      patient.chat.unshift(newMsg);

      await persistState();
      res.json({ success: true, message: "پیام شما با موفقیت ارسال شد.", newMessage: newMsg });
    } catch (error: any) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "خطا در ارسال پیام." });
    }
  });

  // 4. Doctor sends message to patient via chat (Internal)
  app.post("/api/admin/send-chat", authenticateAdmin, async (req, res) => {
    try {
      const { patientId, message } = req.body;
      if (!patientId || !message) return res.status(400).json({ error: "شناسه بیمار و متن پیام الزامی است." });

      const patient = patients.find(p => p.id === patientId);
      if (!patient) return res.status(404).json({ error: "بیمار یافت نشد." });

      if (!patient.chat) patient.chat = [];
      
      const newMsg = {
        id: Date.now(),
        date: new Date().toLocaleDateString("fa-IR"),
        time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }),
        sender: "clinic",
        text: message,
        status: "read"
      };

      patient.chat.unshift(newMsg);

      await persistState();
      res.json({ success: true, newMessage: newMsg });
    } catch (error: any) {
      console.error("Admin send chat error:", error);
      res.status(500).json({ error: "خطا در ارسال پیام." });
    }
  });

  // 5. Fetch single patient chat history (for polling/refresh)
  app.get("/api/patient/chat/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const patient = patients.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
      if (!patient) return res.status(404).json({ error: "بیمار یافت نشد." });
      res.json({ chat: patient.chat || [] });
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت تاریخچه گفتگو." });
    }
  });

  // 6. Patient submits a review/testimonial
  app.post("/api/patient/submit-review", async (req, res) => {
    try {
      const { name, rating, comment, treatment } = req.body;
      if (!name || !rating || !comment) return res.status(400).json({ error: "تمامی موارد الزامی هستند." });

      const newReview = {
        id: Date.now(),
        name,
        treatment: treatment || "خدمات کلینیک",
        rating: Number(rating),
        comment,
        avatarUrl: `/images/avatar-default.svg`,
        status: "pending"
      };

      testimonials.unshift(newReview);
      await persistState();
      res.json({ success: true, message: "نظر شما با موفقیت ثبت شد و پس از تایید مدیریت نمایش داده خواهد شد." });
    } catch (error) {
      res.status(500).json({ error: "خطا در ثبت نظر." });
    }
  });

  // 7. Mark messages as read
  app.post("/api/admin/mark-chat-read", authenticateAdmin, async (req, res) => {
    try {
      const { patientId } = req.body;
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return res.status(404).json({ error: "بیمار یافت نشد." });
      
      if (patient.chat) {
        patient.chat = patient.chat.map((msg: any) => ({ ...msg, status: "read" }));
      }
      
      await persistState();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در بروزرسانی وضعیت پیام‌ها." });
    }
  });

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy." });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Start local server binding to port 3000
createExpressApp().then((app) => {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to start server:", err);
});
