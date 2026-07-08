/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Phone, 
  Menu, 
  X, 
  Calendar,
  FolderHeart,
  BookOpen,
  DollarSign,
  Sliders,
  MapPin,
  Sparkles,
  Activity,
  Lock,
  Settings,
  ArrowRight,
  Info,
  Instagram,
  Send,
  PhoneCall,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  servicesData, 
  blogPosts, 
  testimonialsData,
  smileCases,
  Service,
  BlogPost
} from "./data";

// Sub-components
import HeroSection from "./components/HeroSection";
import ServicesSection from "./components/ServicesSection";
import AiAssistantSection from "./components/AiAssistantSection";
import AboutSection from "./components/AboutSection";
import GallerySection from "./components/GallerySection";
import TestimonialsFaqSection from "./components/TestimonialsFaqSection";
import ArticlesSection from "./components/ArticlesSection";
import BookingSection from "./components/BookingSection";
import ContactSection from "./components/ContactSection";

// Admin Panel Component
import AdminPanel from "./components/AdminPanel";
import PatientPortal from "./components/PatientPortal";
import ToastContainer from "./components/ToastContainer";

export default function App() {
  // Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPatientPortalMode, setIsPatientPortalMode] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem("df_dark_theme") === "true";
  });
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("implant");
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);

  // Clinic Admin Dashboard States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [storedAdminUsername, setStoredAdminUsername] = useState(() => {
    return localStorage.getItem("df_admin_username") || "admin";
  });
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [adminBookings, setAdminBookings] = useState<any[]>([]);

  // CLINIC PATIENTS DATABASE & DENTAL CHART STATES
  const [patients, setPatients] = useState<any[]>(() => {
    const saved = localStorage.getItem("df_patients");
    if (saved) return JSON.parse(saved);
    return [
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
        ]
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
        prescriptions: []
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
        prescriptions: []
      }
    ];
  });

  // CLINIC FINANCIALS & BOOKKEEPING LEDGER STATES
  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem("df_transactions");
    if (saved) return JSON.parse(saved);
    return [
      { id: "T-1001", type: "income", amount: 9500000, category: "treatment", date: "1405/04/12", description: "پیش‌پرداخت ایمپلنت خانم سارا احمدی", patientId: "P-101" },
      { id: "T-1002", type: "income", amount: 28000000, category: "treatment", date: "1405/04/10", description: "تسویه حساب کامپوزیت خانم نیلوفر راد", patientId: "P-103" },
      { id: "T-1003", type: "expense", amount: 12500000, category: "materials", date: "1405/04/08", description: "خرید مواد مصرفی کامپوزیت IPS و گوتاپرکا از شرکت آذرطب" },
      { id: "T-1004", type: "expense", amount: 4800000, category: "other", date: "1405/04/05", description: "هزینه سرویس و استریل اتوکلاو بخش جراحی" },
      { id: "T-1005", type: "income", amount: 5000000, category: "treatment", date: "1405/04/04", description: "قسط دوم ایمپلنت آقای محمد قاسمی", patientId: "P-102" }
    ];
  });

  // CLIENTS TESTIMONIALS & REVIEWS STATES
  const [testimonials, setTestimonials] = useState<any[]>(() => {
    const saved = localStorage.getItem("df_testimonials");
    if (saved) return JSON.parse(saved);
    return testimonialsData.map((t, index) => ({ 
      id: t.id || index + 1, 
      name: t.name, 
      treatment: t.treatment, 
      rating: t.rating, 
      comment: t.comment, 
      avatarUrl: t.avatarUrl || `/images/avatar-default.svg`,
      status: "approved" 
    }));
  });

  // Auto save patients, transactions, and testimonials to localStorage on change
  useEffect(() => {
    localStorage.setItem("df_patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("df_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("df_testimonials", JSON.stringify(testimonials));
  }, [testimonials]);

  // Determine if we should use local storage fallback
  const [useLocalDb, setUseLocalDb] = useState<boolean>(false);
  useEffect(() => {
    localStorage.removeItem("df_use_local_db");
  }, []);
  const [sharedStateLoaded, setSharedStateLoaded] = useState(false);

  // Dynamic Clinic Configuration
  const [clinicConfig, setClinicConfig] = useState(() => {
    const saved = localStorage.getItem("df_clinic_config");
    const defaultData = {
      phone: "۰۲۱-۲۲۰۰۰۰۰۰ | ۰۲۱-۲۲۰۰۰۰۰۱",
      phoneRaw: "02122000000",
      address: "تهران، الهیه، خیابان فرشته, ساختمان پزشکان مریم، طبقه سوم",
      telegram: "۰۹۱۲۳۴۵۶۷۸۹",
      workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۲۱:۰۰ | پنجشنبه ۹:۰۰ الی ۱۵:۰۰",
      doctorName: "دکتر مختاری",
      doctorTitle: "جراح و دندانپزشک زیبایی - فلوشیپ ایمپلنتولوژی دیجیتال از سوئیس",
      aboutDesc: "هدف ما در دنت فلو برطرف کردن ترس‌ها و دغدغه‌های همیشگی شما از دندانپزشکی است. ما معتقدیم کیفیت و دقت در درمان حق بیمار است و با گردهم‌آوری بهترین متخصصان، به کارگیری فناوری سه‌بعدی دیجیتال و دکوراسیون پزشکی آرامش‌بخش، فضایی رویایی برای درمان به وجود آورده‌ایم.",
      installmentInfo: "۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره و سود",
      shiftMorningName: "شیفت صبح",
      shiftMorningCapacity: 10,
      shiftAfternoonName: "شیفت عصر / بعد از ظهر",
      shiftAfternoonCapacity: 10,
      smileCases: smileCases
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.smileCases && Array.isArray(parsed.smileCases)) {
          parsed.smileCases = parsed.smileCases.map((item: any) => {
            if (item.beforeUrl && item.beforeUrl.endsWith(".svg") && item.beforeUrl.includes("/images/")) {
              item.beforeUrl = item.beforeUrl.replace(".svg", ".jpg");
            }
            if (item.afterUrl && item.afterUrl.endsWith(".svg") && item.afterUrl.includes("/images/")) {
              item.afterUrl = item.afterUrl.replace(".svg", ".jpg");
            }
            return item;
          });
        }
        return { ...defaultData, ...parsed };
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  });

  // Dynamic Services Data
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem("df_services");
    return saved ? JSON.parse(saved) : servicesData;
  });

  // Dynamic AI Bot Configurations
  const [aiName, setAiName] = useState(() => localStorage.getItem("df_ai_name") || "دستیار هوشمند دنت فلو");
  const [aiGreeting, setAiGreeting] = useState(() => localStorage.getItem("df_ai_greeting") || "سلام! من دستیار هوشمند و تخصصی کلینیک دندانپزشکی دنت فلو هستم. هر سوالی درباره طرح درمان، هزینه‌ها، اقساط، ترس از دندانپزشکی یا خدمات ما دارید بپرسید؛ من با عشق راهنمایی‌تان می‌کنم! ✨");
  const [aiPrompt, setAiPrompt] = useState(() => {
    return localStorage.getItem("df_ai_prompt") || `شما دستیار تخصصی، دلسوز و فوق‌العاده باهوش کلینیک دندانپزشکی دیجیتال "دنت فلو" (DentFlow) هستید. نام شما "دستیار هوشمند دنت فلو" است.
وظایف شما:
۱. پاسخ به سوالات مراجعین و بیماران درباره مشکلات دندانی، بیماری‌های دهان، خدمات کلینیک، هزینه‌ها، و شرايط اقساطی به زبان فارسی شیوا، صمیمی، دلسوزانه و کاملاً محترمانه.
۲. معرفی خدمات مختلف کلینیک دنت فلو (ایمپلنت دیجیتال سوئیسی، لمینت سرامیکی E-max، ونیر کامپوزیت IPS، ارتودنسی نامرئی الاینر، عصب‌کشی روتاری بدون درد، اطفال و جراحی‌های لثه).
۳. دندانپزشک ارشد کلینیک "دکتر مختاری" (جراح و دندانپزشک زیبایی، دارای فلوشیپ ایمپلنتولوژی دیجیتال از سوئیس با بیش از ۱۰ سال سابقه و ثبت بیش از ۵۰۰۰ مورد ترمیم موفق لبخند) است.
۴. شماره تماس کلینیک: ۰۲۱-۲۲۰۰۰۰۰۰ است. آدرس کلینیک در شهر تهران (منطقه الهیه، خیابان فرشته) می‌باشد.
۵. شرایط پرداخت اقساطی بسیار منعطف است: ۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره و سود.
۶. برای بیماران با ترس و اضطراب شدید دندانپزشکی، توضیح دهید که ما مجهز به سیستم "سدیشن" (سودیشن یا خواب مصنوعی بسیار ایمن و آرام‌بخش با نظارت متخصص بیهوشی) هستیم تا درمان کاملاً بدون درد و بدون کوچکترین استرسی سپری شود.

به یاد داشته باشید شما سفیر برند دنت فلو هستید و آرامش دادن به بیمار اولویت اول شماست.`;
  });

  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Monitor scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Shared state syncing
  useEffect(() => {
    const loadSharedState = async () => {
      try {
        const response = await fetch("/api/clinic-state");
        if (!response.ok) throw new Error("Could not load shared state");

        const sharedState = await response.json();

        if (Array.isArray(sharedState.patients)) {
          setPatients(sharedState.patients);
        }
        if (Array.isArray(sharedState.transactions)) {
          setTransactions(sharedState.transactions);
        }
        if (Array.isArray(sharedState.blogPosts)) {
          setArticles(sharedState.blogPosts);
        }
        if (Array.isArray(sharedState.bookings)) {
          setAdminBookings(sharedState.bookings);
        }
        if (sharedState.adminCredentials) {
          setStoredAdminUsername(sharedState.adminCredentials.username || "admin");
        }
        if (sharedState.clinicConfig) {
          setClinicConfig(sharedState.clinicConfig);
        }
        if (Array.isArray(sharedState.services)) {
          setServices(sharedState.services);
        }
        if (Array.isArray(sharedState.messages)) {
          setMessages(sharedState.messages);
        }
        if (Array.isArray(sharedState.testimonials)) {
          setTestimonials(sharedState.testimonials);
        }
        if (sharedState.aiConfig) {
          setAiName(sharedState.aiConfig.name || "دستیار هوشمند دنت فلو");
          setAiGreeting(sharedState.aiConfig.greeting || "سلام! من دستیار هوشمند و تخصصی کلینیک دندانپزشکی دنت فلو هستم. هر سوالی درباره طرح درمان، هزینه‌ها، اقساط، ترس از دندانپزشکی یا خدمات ما دارید بپرسید؛ من با عشق راهنمایی‌تان می‌کنم! ✨");
          setAiPrompt(sharedState.aiConfig.prompt || `شما دستیار تخصصی، دلسوز و فوق‌العاده باهوش کلینیک دندانپزشکی دیجیتال "دنت فلو" (DentFlow) هستید...`);
        }
      } catch (error) {
        console.warn("Unable to load shared clinic state from the server.", error);
        const saved = localStorage.getItem("df_local_articles");
        setArticles(saved ? JSON.parse(saved) : blogPosts);
      } finally {
        setSharedStateLoaded(true);
      }
    };

    void loadSharedState();
  }, []);

  useEffect(() => {
    if (!sharedStateLoaded) return;
    if (!adminToken) return;

    const handler = setTimeout(() => {
      const syncSharedState = async () => {
        try {
          await fetch("/api/clinic-state", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              patients,
              transactions,
              blogPosts: articles,
              adminCredentials: { username: storedAdminUsername },
              clinicConfig,
              services,
              aiConfig: { name: aiName, greeting: aiGreeting, prompt: aiPrompt },
              testimonials,
            }),
          });
        } catch (error) {
          console.warn("Unable to sync clinic state to the server.", error);
        }
      };
      void syncSharedState();
    }, 1000);

    return () => clearTimeout(handler);
  }, [sharedStateLoaded, patients, transactions, articles, storedAdminUsername, clinicConfig, services, aiName, aiGreeting, aiPrompt, testimonials, adminToken]);

  useEffect(() => {
    if (useLocalDb && articles.length > 0) {
      localStorage.setItem("df_local_articles", JSON.stringify(articles));
    }
  }, [articles, useLocalDb]);

  useEffect(() => {
    const root = document.getElementById("main-container");
    if (root) {
      if (isDarkTheme) {
        root.classList.add("dark");
        document.documentElement.classList.add("dark");
      } else {
        root.classList.remove("dark");
        document.documentElement.classList.remove("dark");
      }
    }
    localStorage.setItem("df_dark_theme", isDarkTheme ? "true" : "false");
  }, [isDarkTheme]);

  // Client-side local DB initial data
  const getLocalBookings = () => {
    const saved = localStorage.getItem("df_bookings");
    if (saved) return JSON.parse(saved);
    const initialBookings = [
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
        adminComment: "تایید شد. منتظر تشریف‌فرمایی شما در ساعت ۱۴:۳۰ هستیم."
      }
    ];
    localStorage.setItem("df_bookings", JSON.stringify(initialBookings));
    return initialBookings;
  };

  const saveLocalBookings = (bookingsList: any[]) => {
    localStorage.setItem("df_bookings", JSON.stringify(bookingsList));
    setAdminBookings(bookingsList);
  };

  const refreshClinicState = async () => {
    try {
      const response = await fetch("/api/clinic-state");
      if (response.ok) {
        const sharedState = await response.json();
        if (Array.isArray(sharedState.patients)) setPatients(sharedState.patients);
        if (Array.isArray(sharedState.testimonials)) setTestimonials(sharedState.testimonials);
        if (Array.isArray(sharedState.transactions)) setTransactions(sharedState.transactions);
        if (Array.isArray(sharedState.blogPosts)) setArticles(sharedState.blogPosts);
      }
    } catch (err) {
      console.warn("Refresh state error:", err);
    }
  };

  const fetchAdminBookings = async () => {
    if (useLocalDb) {
      setAdminBookings(getLocalBookings());
      return;
    }
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setAdminBookings(data);
      } else {
        setUseLocalDb(true);
        localStorage.setItem("df_use_local_db", "true");
        setAdminBookings(getLocalBookings());
      }
    } catch (err) {
      setUseLocalDb(true);
      localStorage.setItem("df_use_local_db", "true");
      setAdminBookings(getLocalBookings());
    }
  };

  const fetchMessages = async () => {
    try {
      const headers: HeadersInit = {};
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }
      const res = await fetch("/api/messages", { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.warn("Could not fetch messages from server:", err);
    }
  };

  useEffect(() => {
    fetchAdminBookings();

    // If logged in as admin, fetch latest bookings and messages from server every 15 seconds to ensure live updates
    if (!useLocalDb && adminToken) {
      fetchMessages();
      const intervalId = setInterval(() => {
        fetchAdminBookings();
        fetchMessages();
        
        // Also fetch latest patients and testimonials to ensure chat and reviews are updated
        fetch("/api/clinic-state")
          .then(res => res.json())
          .then(sharedState => {
            if (Array.isArray(sharedState.patients)) setPatients(sharedState.patients);
            if (Array.isArray(sharedState.testimonials)) setTestimonials(sharedState.testimonials);
            if (Array.isArray(sharedState.transactions)) setTransactions(sharedState.transactions);
          })
          .catch(err => console.warn("Polling state error:", err));
          
      }, 15000);
      return () => clearInterval(intervalId);
    }
  }, [useLocalDb, adminToken]);

  const updateBookingStatus = async (id: string, status: string) => {
    if (useLocalDb) {
      const updated = getLocalBookings().map((b: any) => b.id === id ? { ...b, status } : b);
      saveLocalBookings(updated);
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAdminBookings();
    } catch (err) {
      const updated = getLocalBookings().map((b: any) => b.id === id ? { ...b, status } : b);
      saveLocalBookings(updated);
    }
  };

  const deleteBooking = async (id: string) => {
    if (useLocalDb) {
      const updated = getLocalBookings().filter((b: any) => b.id !== id);
      saveLocalBookings(updated);
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) fetchAdminBookings();
    } catch (err) {
      const updated = getLocalBookings().filter((b: any) => b.id !== id);
      saveLocalBookings(updated);
    }
  };

  const updateBookingDetails = async (id: string, updates: any) => {
    if (useLocalDb) {
      const updated = getLocalBookings().map((b: any) => b.id === id ? { ...b, ...updates } : b);
      saveLocalBookings(updated);
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchAdminBookings();
    } catch (err) {
      const updated = getLocalBookings().map((b: any) => b.id === id ? { ...b, ...updates } : b);
      saveLocalBookings(updated);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoginError(data.error || "نام کاربری یا کلمه عبور نادرست است.");
        return;
      }
      setIsAdminAuthenticated(true);
      setAdminToken(data.token || null);
      setLoginError("");
      setStoredAdminUsername(data.username || adminUsername);
      localStorage.setItem("df_admin_username", data.username || adminUsername);
    } catch (error) {
      setLoginError("امکان ورود به پنل در این لحظه وجود ندارد.");
    }
  };

  const selectServiceAndBook = (service: Service) => {
    setSelectedServiceId(service.id);
    setActiveSection("booking");
    window.location.hash = "#booking";
  };

  // Pure Client Hash-Based Router for clean multi-page transition
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#home";
      
      if (!hash.startsWith("#article/")) {
        setSelectedArticle(null);
      }
      
      if (hash === "#home" || hash === "") {
        setActiveSection("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#services") {
        setActiveSection("services");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#assistant") {
        setActiveSection("assistant");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#about") {
        setActiveSection("about");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#gallery") {
        setActiveSection("gallery");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#articles") {
        setActiveSection("articles");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash.startsWith("#article/")) {
        const articleIdStr = hash.replace("#article/", "");
        const articleId = parseInt(articleIdStr, 10);
        const articleList = articles.length > 0 ? articles : blogPosts;
        const article = articleList.find(a => a.id === articleId);
        if (article) {
          setSelectedArticle(article);
          setActiveSection("articles");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.location.hash = "#articles";
        }
      } else if (hash === "#booking") {
        setActiveSection("booking");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "#contact") {
        setActiveSection("contact");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [articles]);

  return (
    <div className="font-sans min-h-screen flex flex-col selection:bg-teal-100 selection:text-teal-800 bg-[#F0F9F9] text-slate-800" id="main-container" dir="rtl">
      
      {/* 1. Header & Navigation (Floating Premium Bento Glass Pill) */}
      {!isAdminMode && !isPatientPortalMode && (
        <header id="app-header" className="fixed top-4 left-4 right-4 z-50 transition-all duration-300 max-w-7xl mx-auto">
          <div className={`px-6 rounded-[24px] transition-all duration-300 ${isScrolled ? "bg-white/75 backdrop-blur-md border border-white/50 shadow-xl shadow-teal-950/5 py-3" : "bg-white/45 backdrop-blur-md border border-white/20 py-4"}`} id="nav-container">
            <div className="flex items-center justify-between" id="nav-inner">
              
              {/* Logo */}
              <div className="flex items-center gap-2.5" id="logo-block">
                <a href="#home" className="flex items-center gap-2 group" id="logo-link">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform" id="logo-icon-wrapper">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-right" id="logo-text">
                    <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">DentFlow</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-widest -mt-1">دندانپزشکی دیجیتال</span>
                  </div>
                </a>
              </div>

              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600" id="desktop-nav">
                {[
                  { id: "home", label: "خانه" },
                  { id: "services", label: "خدمات ما" },
                  { id: "assistant", label: "دستیار هوشمند" },
                  { id: "about", label: "درباره کلینیک" },
                  { id: "gallery", label: "گالری لبخند" },
                  { id: "articles", label: "مقالات آموزشی" },
                  { id: "booking", label: "رزرو نوبت" },
                  { id: "contact", label: "تماس با ما" }
                ].map((link) => (
                  <a 
                    key={link.id}
                    href={`#${link.id}`} 
                    className={`transition-colors hover:text-teal-600 relative py-1 ${activeSection === link.id ? "text-teal-600" : ""}`}
                  >
                    {link.label}
                    {activeSection === link.id && (
                      <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                    )}
                  </a>
                ))}
              </nav>

              {/* CTA Actions */}
              <div className="hidden sm:flex items-center gap-4" id="header-cta-block">
                <button
                  onClick={() => setIsPatientPortalMode(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-100 hover:bg-teal-50 transition-all font-bold text-[11px] cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>پورتال بیماران</span>
                </button>
                <button
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isDarkTheme ? "حالت روشن" : "حالت تاریک"}
                >
                  {isDarkTheme ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <a href={`tel:${clinicConfig.phoneRaw}`} className="hidden md:flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 transition-colors font-bold font-sans">
                  <Phone className="w-4 h-4 text-teal-500" />
                  <span>{clinicConfig.phone.split(" | ")[0]}</span>
                </a>
                <a href="#booking" className="relative overflow-hidden group bg-gradient-to-l from-teal-600 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                  <span className="relative z-10">رزرو نوبت آنلاین</span>
                </a>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2 lg:hidden" id="mobile-header-actions">
                <button
                  onClick={() => setIsPatientPortalMode(true)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-teal-600 hover:bg-slate-50 transition-colors"
                  title="پورتال بیماران"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 transition-colors"
                  title={isDarkTheme ? "حالت روشن" : "حالت تاریک"}
                >
                  {isDarkTheme ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <button className="p-2 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

            </div>
          </div>

          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 mx-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-150 shadow-xl p-5 flex flex-col gap-3 lg:hidden text-right"
                id="mobile-dropdown"
              >
                {[
                  { id: "home", label: "خانه" },
                  { id: "services", label: "خدمات ما" },
                  { id: "assistant", label: "دستیار هوشمند" },
                  { id: "about", label: "درباره کلینیک" },
                  { id: "gallery", label: "گالری لبخند" },
                  { id: "articles", label: "مقالات آموزشی" },
                  { id: "booking", label: "رزرو نوبت" },
                  { id: "contact", label: "تماس با ما" }
                ].map((link) => (
                  <a 
                    key={link.id}
                    href={`#${link.id}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`py-2 px-3 rounded-xl transition-colors text-sm font-bold ${activeSection === link.id ? "bg-teal-50 text-teal-600" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {link.label}
                  </a>
                ))}
                
                <button
                  onClick={() => {
                    setIsPatientPortalMode(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 py-3 px-3 rounded-xl bg-teal-50 text-teal-600 transition-colors text-sm font-black flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>ورود به پورتال بیماران</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* 2. Patient Portal or Admin Panel or Main Site */}
      {isPatientPortalMode ? (
        <PatientPortal 
          onBack={() => setIsPatientPortalMode(false)} 
          clinicConfig={clinicConfig} 
        />
      ) : isAdminMode ? (
        <AdminPanel
          isAdminMode={isAdminMode}
          setIsAdminMode={setIsAdminMode}
          isAdminAuthenticated={isAdminAuthenticated}
          setIsAdminAuthenticated={setIsAdminAuthenticated}
          adminUsername={adminUsername}
          setAdminUsername={setAdminUsername}
          adminPassword={adminPassword}
          setAdminPassword={setAdminPassword}
          storedAdminUsername={storedAdminUsername}
          setStoredAdminUsername={setStoredAdminUsername}
          adminToken={adminToken}
          setAdminToken={setAdminToken}
          loginError={loginError}
          setLoginError={setLoginError}
          adminBookings={adminBookings}
          setAdminBookings={setAdminBookings}
          patients={patients}
          setPatients={setPatients}
          transactions={transactions}
          setTransactions={setTransactions}
          articles={articles}
          setArticles={setArticles}
          clinicConfig={clinicConfig}
          setClinicConfig={setClinicConfig}
          services={services}
          setServices={setServices}
          aiName={aiName}
          setAiName={setAiName}
          aiGreeting={aiGreeting}
          setAiGreeting={setAiGreeting}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          messages={messages}
          setMessages={setMessages}
          fetchMessages={fetchMessages}
          fetchAdminBookings={fetchAdminBookings}
          refreshClinicState={refreshClinicState}
          updateBookingStatus={updateBookingStatus}
          updateBookingDetails={updateBookingDetails}
          deleteBooking={deleteBooking}
          useLocalDb={useLocalDb}
          setUseLocalDb={setUseLocalDb}
          handleAdminLogin={handleAdminLogin}
          testimonials={testimonials}
          setTestimonials={setTestimonials}
        />
      ) : (
        <main className="flex-1 pt-24 min-h-[85vh]">
          <AnimatePresence mode="wait">
            {activeSection === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-16 animate-fade-in"
              >
                <HeroSection clinicConfig={clinicConfig} />
                
                {/* AI Assistant Section on Home page */}
                <div id="home-assistant-wrapper" className="pt-8">
                  <div className="text-center space-y-2 mb-10">
                    <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">مشاوره هوشمند ۲۴ ساعته</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">دستیار صوتی و متنی هوشمند دنت فلو</h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-2xl mx-auto">به راحتی با دستیار کلینیک صحبت کنید و در ثانیه پاسخ‌های خود درباره خدمات، قیمت‌ها و مراقبت‌ها را دریافت کنید</p>
                  </div>
                  <AiAssistantSection 
                    clinicConfig={clinicConfig} 
                    services={services} 
                    aiPrompt={aiPrompt} 
                    aiName={aiName} 
                    aiGreeting={aiGreeting} 
                  />
                </div>

                <TestimonialsFaqSection 
                  testimonials={testimonials} 
                  setTestimonials={setTestimonials} 
                />

                {/* Educational Articles Section on Home page */}
                <div id="home-articles-wrapper" className="pt-8">
                  <div className="text-center space-y-2 mb-10">
                    <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">مجله سلامت دهان و دندان</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">آخرین دانستنی‌ها و مقالات دندانپزشکی دیجیتال</h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-2xl mx-auto">با مطالعه مقالات تایید شده توسط متخصصین دنت فلو، لبخند سالم‌تر و زیباتری داشته باشید</p>
                  </div>
                  <ArticlesSection 
                    articles={articles}
                    selectedArticle={selectedArticle}
                    setSelectedArticle={setSelectedArticle}
                  />
                </div>
              </motion.div>
            )}

            {activeSection === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <ServicesSection 
                  services={services} 
                  onSelectServiceAndBook={selectServiceAndBook} 
                />
              </motion.div>
            )}

            {activeSection === "assistant" && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <AiAssistantSection 
                  clinicConfig={clinicConfig} 
                  services={services} 
                  aiPrompt={aiPrompt} 
                  aiName={aiName} 
                  aiGreeting={aiGreeting} 
                />
              </motion.div>
            )}

            {activeSection === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <AboutSection clinicConfig={clinicConfig} />
              </motion.div>
            )}

            {activeSection === "gallery" && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <GallerySection smileCases={clinicConfig?.smileCases} />
              </motion.div>
            )}

            {activeSection === "articles" && (
              <motion.div
                key="articles"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <ArticlesSection 
                  articles={articles}
                  selectedArticle={selectedArticle}
                  setSelectedArticle={setSelectedArticle}
                />
              </motion.div>
            )}

            {activeSection === "booking" && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <BookingSection 
                  selectedServiceId={selectedServiceId} 
                  services={services}
                  clinicConfig={clinicConfig}
                />
              </motion.div>
            )}

            {activeSection === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <ContactSection clinicConfig={clinicConfig} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* 9. Footer (RTL) */}
      {!isAdminMode && (
        <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900 text-right" id="app-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="footer-inner-container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12" id="footer-grid">
              
              <div className="lg:col-span-5 space-y-4" id="footer-logo-col">
                <div className="flex items-center gap-2.5" id="footer-logo">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white" id="footer-logo-icon">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-right" id="footer-logo-text">
                    <span className="font-bold text-xl tracking-tight text-white">DentFlow</span>
                    <span className="text-[10px] text-teal-400 font-bold tracking-widest -mt-1">دندانپزشکی دیجیتال سوئیس</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  کلینیک دندانپزشکی دیجیتال دنت فلو با هدف ارائه بالاترین سطح استانداردهای زیبایی و درمانی در محیطی لوکس و سرشار از آرامش در تهران (منطقه الهیه) دایر گردیده است. لبخند شما هویت و تخصص ماست.
                </p>

                <div className="flex gap-3 pt-2" id="footer-social-wrapper">
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-teal-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://wa.me/989123456789" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-[#25D366] text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                    <PhoneCall className="w-5 h-5" />
                  </a>
                  <a href="https://telegram.org" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-[#0088cc] text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                    <Send className="w-5 h-5 -rotate-45" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4" id="footer-quicklinks-col">
                <h4 className="font-extrabold text-white text-sm">لینک‌های دسترسی سریع</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
                  <li><a href="#home" className="hover:text-white hover:underline transition-colors">صفحه نخست</a></li>
                  <li><a href="#services" className="hover:text-white hover:underline transition-colors">خدمات و هزینه‌ها</a></li>
                  <li><a href="#about" className="hover:text-white hover:underline transition-colors">درباره کادر پزشکی</a></li>
                  <li><a href="#gallery" className="hover:text-white hover:underline transition-colors">نمونه‌کارها و قبل/بعد</a></li>
                  <li><a href="#articles" className="hover:text-white hover:underline transition-colors">مجله علمی آموزش</a></li>
                  <li><a href="#booking" className="hover:text-white hover:underline transition-colors">رزرو آنلاین مشاوره</a></li>
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-4 font-bold text-xs sm:text-sm">
                <h4 className="font-extrabold text-white text-sm">ساعات کاری و اطلاعات پذیرش</h4>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">شنبه تا چهارشنبه:</span>
                    <span className="text-slate-300 font-mono font-bold">۱۰:۰۰ الی ۲۰:۰۰</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">پنجشنبه‌ها:</span>
                    <span className="text-slate-300 font-mono font-bold">۱۰:۰۰ الی ۱۷:۰۰</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">جمعه‌ها و ایام تعطیل:</span>
                    <span className="text-rose-400 font-bold">فقط اورژانس هماهنگ شده</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">پاسخگویی تلفنی:</span>
                    <span className="text-teal-400 font-bold">۰۸:۰۰ صبح الی ۲۲:۰۰ شب</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-500 gap-4">
              <p>© کلیه حقوق مادی و معنوی این اثر متعلق به کلینیک دندانپزشکی DentFlow می‌باشد.</p>
              <div className="flex gap-4">
                <a href="#about" className="hover:text-slate-300 transition-colors">قوانین و حریم خصوصی بیمار</a>
                <span>|</span>
                <a href="#faq" className="hover:text-slate-300 transition-colors">سوالات متداول</a>
                <span>|</span>
                <button
                  onClick={() => {
                    setIsAdminMode(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-teal-400 text-slate-600 transition-colors cursor-pointer text-xs font-bold"
                >
                  ورود همکاران
                </button>
              </div>
            </div>

          </div>
        </footer>
      )}

      {/* Floating Theme Switcher Button */}
      <button
        onClick={() => setIsDarkTheme(prev => !prev)}
        className="fixed bottom-6 left-6 z-50 p-3.5 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border hover:scale-110 active:scale-95 bg-white dark:bg-slate-900 text-slate-800 dark:text-yellow-400 border-slate-200 dark:border-slate-800 shadow-teal-950/10 dark:shadow-black/50 group cursor-pointer"
        aria-label="تغییر پوسته کاربری"
        title={isDarkTheme ? "پوسته روشن" : "پوسته تیره کنتراست بالا"}
        id="theme-toggle-floating"
      >
        {isDarkTheme ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-bold text-xs whitespace-nowrap pr-0 group-hover:pr-2 text-slate-800 dark:text-yellow-400">
          {isDarkTheme ? "حالت روشن" : "حالت تاریک"}
        </span>
      </button>

      {/* Modern, elegant, non-blocking notification alerts */}
      <ToastContainer />

    </div>
  );
}
