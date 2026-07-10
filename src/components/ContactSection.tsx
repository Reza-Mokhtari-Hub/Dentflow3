import React, { useState } from "react";
import { Mail, Check, Phone, MapPin, Clock, Map, PhoneCall } from "lucide-react";
import { motion } from "motion/react";

interface ContactSectionProps {
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

export default function ContactSection({ clinicConfig }: ContactSectionProps) {
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isContactSending, setIsContactSending] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSending(true);
    setContactError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          message: contactMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setContactSuccess(true);
      setContactName("");
      setContactPhone("");
      setContactMessage("");
    } catch (err: any) {
      console.error(err);
      setContactError("متأسفانه مشکلی در ارسال پیام به وجود آمد. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsContactSending(false);
    }
  };

  return (
    <section id="contact-page-block" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-right space-y-12 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100">ارتباط با کلینیک دنت فلو</span>
        <h2 className="text-3xl font-extrabold text-slate-900">اطلاعات تماس و موقعیت جغرافیایی</h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
          برای مشاوره، هماهنگی و یا ارسال نظرات خود می‌توانید از فرم زیر استفاده کنید یا با شماره‌های مستقیم کلینیک در تماس باشید.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Card A: Beautiful Direct Inquiry Form (Spans 6 columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-teal-950/5 flex flex-col justify-between text-right space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 justify-end mb-2">
              <h3 className="text-lg font-black text-slate-900">ارسال پیام مستقیم به مدیریت</h3>
              <Mail className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              اگر سوالی دارید یا تمایل دارید کارشناسان ما با شما تماس بگیرند، فرم زیر را پر کنید. پیام شما مستقیماً به دست مدیریت ارتباط با مراجعین خواهد رسید.
            </p>
            
            {contactSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-teal-900">پیام شما با موفقیت ارسال شد</h4>
                <p className="text-xs text-teal-700 font-bold">همکاران ما در اولین فرصت (حداکثر ۱ ساعت آینده) جهت هماهنگی و مشاوره با شما تماس خواهند گرفت.</p>
                <button
                  onClick={() => setContactSuccess(false)}
                  className="px-4 py-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-black rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  ارسال پیام جدید
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">نام و نام خانوادگی:</label>
                  <input 
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 text-right font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
                    placeholder="مثلاً: علیرضا محمدی"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">شماره تماس مستقیم (همراه):</label>
                  <input 
                    type="tel"
                    required
                    pattern="09[0-9]{9}"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 text-left font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
                    placeholder="09123456789"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">متن پیام یا سوال شما:</label>
                  <textarea 
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 text-right font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
                    placeholder="پیام خود، خدمات مورد نظر یا سوال تخصصی خود را بنویسید..."
                  />
                </div>

                {contactError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center">
                    {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isContactSending}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-teal-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isContactSending ? "در حال ارسال پیام..." : "ثبت و ارسال پیام ارتباطی"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Card B: Location and Details (Spans 6 columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-teal-950/5 flex flex-col justify-between text-right space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 justify-end">
              <h3 className="text-lg font-black text-slate-900">راه‌های ارتباطی مستقیم</h3>
              <PhoneCall className="w-5 h-5 text-teal-600" />
            </div>

            {/* Contact items */}
            <div className="space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/30 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">آدرس فیزیکی کلینیک</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">{clinicConfig.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/30 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">تلفن‌های تماس مستقیم</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-black">{clinicConfig.phone}</p>
                  <p className="text-[10px] text-slate-400 font-bold">پاسخگویی سریع در تلگرام و واتس‌اپ: {clinicConfig.telegram}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/30 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">ساعات کاری کلینیک</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">{clinicConfig.workingHours}</p>
                  <p className="text-[10px] text-rose-500 font-bold">پذیرش بخش اورژانس و تسکین درد به صورت شبانه‌روزی</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map widget inside the right block */}
          <div className="bg-[#F8FCFC] rounded-2xl p-4 border border-slate-100 relative overflow-hidden flex flex-col justify-between aspect-video" id="contact-page-map">
            <div className="absolute inset-0 bg-teal-500/5 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
              <div className="w-full h-1 bg-teal-600 absolute rotate-12" />
              <div className="w-full h-1 bg-teal-600 absolute -rotate-45" />
              <div className="h-full w-1 bg-teal-600 absolute left-1/3" />
              <div className="h-full w-1 bg-teal-600 absolute right-1/4" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] font-bold text-slate-600">موقعیت دنت فلو روی نقشه دیجیتال</span>
              </div>

              <div className="my-auto text-center animate-bounce-slow">
                <div className="relative inline-block">
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rose-500/30 animate-ping" />
                  <div className="w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white shadow-md relative z-10 mx-auto" />
                </div>
                <p className="text-[11px] font-black text-slate-900 mt-1.5">الهیه، خیابان فرشته، ساختمان پزشکان مریم</p>
              </div>

              <div className="flex justify-between items-center bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-slate-100">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-800">نزدیک‌ترین مترو</p>
                  <p className="text-[8px] text-slate-500 font-bold">ایستگاه تجریش</p>
                </div>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold shadow-sm transition-colors"
                >
                  مسیریابی در گوگل مپ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
