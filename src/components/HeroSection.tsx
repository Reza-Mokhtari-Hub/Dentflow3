import React from "react";
import { Sparkle, HeartHandshake, Zap, Star } from "lucide-react";
import { stats } from "../data";
import { renderServiceIcon } from "./ServiceIcon";

interface HeroSectionProps {
  clinicConfig?: {
    doctorName?: string;
    doctorTitle?: string;
    aboutDesc?: string;
    installmentInfo?: string;
    phone?: string;
    phoneRaw?: string;
    address?: string;
  };
}

export default function HeroSection({ clinicConfig }: HeroSectionProps) {
  const displayDesc = clinicConfig?.aboutDesc || "ما در دنت فلو با تلفیق دندانپزشکی دیجیتال، مواد درجه یک سوئیسی و کادر متخصص باسابقه، تجربه‌ای بدون درد، بدون استرس و بسیار ماندگار را برای شما طراحی کرده‌ایم. لذت داشتن دندان‌های سالم و بی‌عیب در محیطی آرام‌بخش.";
  const displayDoctorName = clinicConfig?.doctorName || "دکتر مختاری";

  return (
    <section 
      id="home" 
      className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
    >
      {/* Subtle decorative background lights matching Bento theme */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-teal-200/20 blur-[80px] pointer-events-none" id="bg-glow-teal"></div>
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] rounded-full bg-rose-200/10 blur-[80px] pointer-events-none" id="bg-glow-coral"></div>
      
      {/* The Master Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6" id="hero-bento-grid">
        
        {/* Bento Card 1: Main Copy and Primary Calls to Action (Spans 7 columns) */}
        <div 
          className="lg:col-span-7 bg-white/80 backdrop-blur-md border border-white/50 p-8 sm:p-12 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between text-right space-y-6"
          id="bento-hero-main-card"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100" id="hero-badge">
              <Sparkle className="w-3.5 h-3.5 text-teal-500 animate-spin-slow animate-pulse" />
              <span>مدرن‌ترین کلینیک دندانپزشکی دیجیتال تحت مدیریت {displayDoctorName}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight sm:leading-snug" id="hero-title">
              لبخندی که شایسته شماست، <br className="hidden sm:inline" />
              در کلینیک تخصصی <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-teal-500">دنت فلو (DentFlow)</span>
            </h1>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-medium" id="hero-desc">
              {displayDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4" id="hero-cta-group">
            <a 
              id="hero-primary-cta"
              href="#booking" 
              className="w-full sm:w-auto text-center px-8 py-4 rounded-xl bg-gradient-to-l from-teal-600 to-teal-500 text-white font-bold text-base shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 transition-all"
            >
              همین حالا نوبت بگیرید
            </a>
            <a 
              id="hero-secondary-cta"
              href="#services" 
              className="w-full sm:w-auto text-center px-8 py-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 text-slate-700 hover:text-teal-600 font-bold text-base transition-all shadow-sm"
            >
              مشاهده خدمات ما
            </a>
          </div>
        </div>

        {/* Bento Card 2: Visual High-Fidelity Doctor Frame & Live Available Status Badge (Spans 5 columns) */}
        <div 
          className="lg:col-span-5 bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between relative overflow-hidden group min-h-[350px]"
          id="bento-hero-doctor-card"
        >
          {/* Visual badge top */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-white/60 flex items-center gap-2.5 z-10 animate-bounce-slow" id="badge-quality">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold text-slate-900 leading-none">محیط بدون استرس</p>
              <p className="text-[10px] text-slate-500 mt-1">تضمین عدم بروز درد و حساسیت</p>
            </div>
          </div>

          {/* Swiss laser tech badge bottom */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-white/60 flex items-center gap-2.5 z-10" id="badge-tech">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold text-slate-900 leading-none">فناوری لیزر پیشرفته</p>
              <p className="text-[10px] text-slate-500 mt-1">سوئیسی درجه یک</p>
            </div>
          </div>

          {/* Hero Dental Doctor/Clinic Image */}
          <div className="absolute inset-0 w-full h-full" id="bento-hero-img-container">
            <img 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              src="/images/hero-clinic.svg" 
              alt="کلینیک دندانپزشکی DentFlow"
              id="hero-main-img"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Overlap footer text inside the visual bento card */}
          <div className="relative z-10 mt-auto text-right text-white space-y-1 p-2 bg-slate-950/40 backdrop-blur-sm rounded-2xl" id="doctor-visual-label">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">کلینیک فعال و پذیرش باز است</span>
            </div>
            <h4 className="font-bold text-sm">مجهز به تکنولوژی مدل‌سازی ۳بعدی فک</h4>
          </div>
        </div>

        {/* Bento Grid Sub-row: Stats blocks styled as clean, mini nested bento items (Spans 12 columns) */}
        <div className="lg:col-span-12" id="bento-hero-stats-row">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-lg shadow-teal-950/5 text-center flex flex-col items-center justify-center hover:bg-white transition-all duration-300" 
                id={`stat-item-${idx}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3 text-teal-600 shadow-inner" id={`stat-icon-${idx}`}>
                  {renderServiceIcon(stat.icon, "w-6 h-6 text-teal-600")}
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900" id={`stat-val-${idx}`}>{stat.value}</span>
                <span className="text-xs sm:text-sm text-slate-500 font-bold mt-1" id={`stat-lbl-${idx}`}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Trust Box: Compact Bento Card (Spans 12 columns) */}
        <div 
          className="lg:col-span-12 bg-white/70 backdrop-blur-md border border-white/40 px-6 py-4 rounded-2xl shadow-lg shadow-teal-950/5 flex flex-wrap items-center justify-between gap-4"
          id="bento-hero-trust-bar"
        >
          <div className="flex items-center gap-3" id="trust-avatars-row">
            <div className="flex -space-x-2.5 space-x-reverse" id="avatar-stack">
              <img className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="/images/avatar-sara.svg" alt="سارا" referrerPolicy="no-referrer" />
              <img className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="/images/avatar-amin.svg" alt="امین" referrerPolicy="no-referrer" />
              <img className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="/images/avatar-niloofar.svg" alt="نیلوفر" referrerPolicy="no-referrer" />
              <div className="w-9 h-9 rounded-full border-2 border-white bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold" id="avatar-more">+۵k</div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-bold" id="trust-label">رضایت‌مندی بیش از ۵۰۰۰ بیمار زیبایی و درمانی در سال گذشته</p>
          </div>
          
          <div className="flex items-center gap-1 text-amber-500" id="trust-stars-wrapper">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            <span className="text-xs font-black text-slate-800 mr-2">۵.۰ / ۵.۰</span>
          </div>
        </div>

      </div>
    </section>
  );
}
