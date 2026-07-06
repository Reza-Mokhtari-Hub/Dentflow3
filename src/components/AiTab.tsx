import React from "react";
import { Sparkles, Save } from "lucide-react";

interface AiTabProps {
  aiName: string;
  setAiName: (val: string) => void;
  aiGreeting: string;
  setAiGreeting: (val: string) => void;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
}

export default function AiTab({
  aiName,
  setAiName,
  aiGreeting,
  setAiGreeting,
  aiPrompt,
  setAiPrompt
}: AiTabProps) {
  return (
    <div className="space-y-6" id="ai-editor-tab">
      <div className="bg-teal-50/30 border border-teal-100/50 p-5 rounded-2xl text-right">
        <h3 className="text-base font-extrabold text-teal-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
          <span>پیکربندی چت‌بات هوش مصنوعی کلینیک دنت فلو</span>
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
          در این بخش می‌توانید هویت، رفتار، پیام خوش‌آمدگویی و دستورالعمل‌های سیستمی ربات پاسخگوی هوشمند (Gemini 3.5 Flash) را سفارشی‌سازی کنید تا مطابق استراتژی بازاریابی شما به بیماران پاسخ دهد.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl space-y-6 text-right">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-slate-500 font-bold block">نام نمایشی دستیار هوشمند:</label>
            <input
              type="text"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-extrabold text-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-slate-500 font-bold block">نوع مدل پردازنده هوشمند:</label>
            <input
              type="text"
              value="Google Gemini 3.5 Flash (با پشتیبانی محلی دنت فلو)"
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 font-bold text-sm"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="text-slate-500 font-bold block">پیام خوش‌آمدگویی اولیه ربات (کارت اول چت):</label>
          <textarea
            value={aiGreeting}
            onChange={(e) => setAiGreeting(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-semibold text-slate-700 text-sm resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-1 text-xs">
          <label className="text-slate-500 font-bold block">دستورالعمل سیستمی و پرومپت ربات (System Instructions):</label>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-mono text-slate-600 text-xs leading-relaxed resize-none"
            rows={12}
            dir="rtl"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={() => {
              setAiName("دستیار هوشمند دنت فلو");
              setAiGreeting("سلام! من دستیار هوشمند و تخصصی کلینیک دندانپزشکی دنت فلو هستم. هر سوالی درباره طرح درمان، هزینه‌ها، اقساط، ترس از دندانپزشکی یا خدمات ما دارید بپرسید؛ من با عشق راهنمایی‌تان می‌کنم! ✨");
              setAiPrompt(`شما دستیار تخصصی، دلسوز و فوق‌العاده باهوش کلینیک دندانپزشکی دیجیتال "دنت فلو" (DentFlow) هستید. نام شما "دستیار هوشمند دنت فلو" است.
دستورالعمل‌ها:
۱. پاسخ به مراجعین درباره خدمات ایمپلنت، لمینت، ارتودنسی، عصب‌کشی، دندانپزشکی کودکان.
۲. جراح زیبایی کلینیک "دکتر مختاری" است. شماره تماس: ۰۲۱-۲۲۰۰۰۰۰۰ است.
۳. پرداخت اقساطی: ۳۰ الی ۴۰ درصد پیش‌پرداخت، مابقی در اقساط ۶ الی ۱۲ ماهه با چک صیادی بدون بهره.`);
              alert("تنظیمات ریست شد. برای ذخیره نهایی، دکمه ذخیره سمت چپ را بزنید.");
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-extrabold text-xs transition-colors cursor-pointer"
          >
            بازنشانی به تنظیمات پیش‌فرض کارخانه
          </button>

          <button
            onClick={() => {
              localStorage.setItem("df_ai_name", aiName);
              localStorage.setItem("df_ai_greeting", aiGreeting);
              localStorage.setItem("df_ai_prompt", aiPrompt);
              alert("پیکربندی هوش مصنوعی با موفقیت بروزرسانی شد. ربات از این لحظه با پرومپت جدید بیمارها را راهنمایی خواهد کرد.");
            }}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-teal-600/15 cursor-pointer border-none"
          >
            <Save className="w-4 h-4" />
            <span>بروزرسانی پرومپت و کالیبراسیون هوش مصنوعی</span>
          </button>
        </div>
      </div>
    </div>
  );
}
