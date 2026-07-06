import React from "react";
import { ShieldCheck, Sparkles, Zap, Award } from "lucide-react";

interface AboutSectionProps {
  clinicConfig: {
    address: string;
    phone: string;
    telegram: string;
    workingHours: string;
    doctorName: string;
    doctorTitle: string;
    aboutDesc: string;
    installmentInfo: string;
  };
}

export default function AboutSection({ clinicConfig }: AboutSectionProps) {
  return (
    <section id="about" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center" id="about-grid">
        
        {/* Story and Feature Grids as Nested Bento Blocks */}
        <div className="lg:col-span-12 space-y-6 text-right" id="about-text-col">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100" id="about-badge">
            <span>تعهد، دقت و فناوری</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" id="about-title">درباره کلینیک دندانپزشکی دنت فلو</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-semibold" id="about-desc">
            {clinicConfig.aboutDesc}
          </p>

          {/* Doctor Info card */}
          <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white p-6 rounded-[24px] shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-xs text-teal-400 font-extrabold">پزشک و جراح ارشد کلینیک</span>
              <h3 className="text-lg font-black">{clinicConfig.doctorName}</h3>
              <p className="text-xs text-slate-300 font-semibold">{clinicConfig.doctorTitle}</p>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-teal-300 font-bold block">مدرک فلوشیپ تخصصی</span>
              <span className="text-xs font-extrabold text-white">عضو مجمع بین‌المللی ایمپلنتولوژی</span>
            </div>
          </div>

          {/* Feature Bento grid - 4 mini columns on large screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2" id="about-features">
            
            <div className="flex gap-3 bg-white border border-white p-5 rounded-[22px] shadow-md shadow-teal-950/5 hover:scale-[1.01] transition-transform" id="about-feat-1">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0" id="about-feat-icon-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">۱۰۰٪ استریل و ایمن</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">بکارگیری اتاق اتوکلاو کلاس B و پایش مستمر میکروبیولوژیک محیط.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white border border-white p-5 rounded-[22px] shadow-md shadow-teal-950/5 hover:scale-[1.01] transition-transform" id="about-feat-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0" id="about-feat-icon-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">متریال سوئیسی و آلمانی</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">استفاده اختصاصی از بهترین مارک‌های کامپوزیت و ایمپلنت ثبت شده جهانی.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white border border-white p-5 rounded-[22px] shadow-md shadow-teal-950/5 hover:scale-[1.01] transition-transform" id="about-feat-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0" id="about-feat-icon-3">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">تجهیزات دیجیتال بدون درد</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">اسکنرهای درون‌دهانی سه‌بعدی و بی‌حسی الکترونیکی دیجیتال پیشرفته.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white border border-white p-5 rounded-[22px] shadow-md shadow-teal-950/5 hover:scale-[1.01] transition-transform" id="about-feat-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0" id="about-feat-icon-4">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">تسهیلات اقساط بدون سود</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{clinicConfig.installmentInfo}</p>
              </div>
            </div>

          </div>

          {/* Certification logos inside about block */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 justify-between" id="about-certifications">
            <div className="text-right" id="cert-text">
              <p className="text-xs font-bold text-slate-500">مورد تایید مراجع علمی تخصصی کشور</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold">پروانه بهره‌برداری وزارت بهداشت درمان و آموزش پزشکی کشور</p>
            </div>
            <div className="flex gap-3 items-center opacity-75" id="cert-icons">
              <span className="text-[10px] font-black tracking-widest text-slate-600 bg-white/80 border border-slate-200/50 px-2.5 py-1 rounded-md">ISO 9001</span>
              <span className="text-[10px] font-black tracking-widest text-slate-600 bg-white/80 border border-slate-200/50 px-2.5 py-1 rounded-md">SWISS DOCS</span>
              <span className="text-[10px] font-black tracking-widest text-slate-600 bg-white/80 border border-slate-200/50 px-2.5 py-1 rounded-md">FDA APPR</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
