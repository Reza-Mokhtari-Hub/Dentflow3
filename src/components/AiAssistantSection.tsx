import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Info, Send } from "lucide-react";
import { Service } from "../data";

interface ClinicConfig {
  doctorName: string;
  doctorTitle: string;
  phone: string;
  phoneRaw: string;
  address: string;
  workingHours: string;
  installmentInfo: string;
  aboutDesc: string;
}

interface AiAssistantSectionProps {
  clinicConfig: ClinicConfig;
  services: Service[];
  aiPrompt: string;
  aiName: string;
  aiGreeting: string;
}

export default function AiAssistantSection({ 
  clinicConfig, 
  services, 
  aiPrompt, 
  aiName, 
  aiGreeting 
}: AiAssistantSectionProps) {
  
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting message on load or when aiGreeting changes
  useEffect(() => {
    setChatMessages([
      {
        role: "model",
        text: aiGreeting || "سلام! من دستیار هوشمند و تخصصی کلینیک دندانپزشکی دنت فلو هستم. هر سوالی درباره طرح درمان، هزینه‌ها، اقساط، ترس از دندانپزشکی یا خدمات ما دارید بپرسید؛ من با عشق راهنمایی‌تان می‌کنم! ✨"
      }
    ]);
  }, [aiGreeting]);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  const getLocalBotResponse = (userMsg: string): string => {
    const msg = userMsg.toLowerCase();
    
    if (msg.includes("ایمپلنت")) {
      const s = services.find(x => x.id === "implant");
      return `بله در کلینیک دنت فلو کاشت تخصصی ایمپلنت دندان با پیشرفته‌ترین تکنولوژی دیجیتال توسط ${clinicConfig.doctorName} انجام می‌شود. 
\n💎 جزئیات درمان:\n${s?.details.map(d => `• ${d}`).join("\n") || ""}\n\n💰 هزینه حدودی:\n${s?.priceEst || "تماس بگیرید"} (با امکان پرداخت اقساطی!)\nآیا مایلید یک نوبت مشاوره رایگان با پزشک برای شما رزرو کنم؟`;
    }
    
    if (msg.includes("لمینت") || msg.includes("ونیر") || msg.includes("کامپوزیت") || msg.includes("طرح لبخند")) {
      const s = services.find(x => x.id === "veneer") || services.find(x => x.id === "laminate");
      return `جهت اصلاح طرح لبخند، ما خدمات ونیر کامپوزیت‌های فوق‌طبیعی و لمینت‌های سرامیکی فوق‌نازک ضدخش را با برترین مواد در بخش مجهز کلینیک ارائه می‌دهیم.
\n💎 جزئیات خدمت:\n${s?.details.map(d => `• ${d}`).join("\n") || ""}\n\n💰 هزینه تخمینی:\n${s?.priceEst || "تماس بگیرید"}\nدوست دارید طرح لبخند دیجیتال خود را قبل از شروع کار ببینید؟`;
    }

    if (msg.includes("ارتودنسی")) {
      const s = services.find(x => x.id === "orthodontics");
      return `ارتودنسی تخصصی ثابت و نامرئی (با الاینرهای شفاف و شیشه‌ای بدون سیم‌کشی) برای کودکان و بزرگسالان در کلینیک ما ارائه می‌شود.
\n💎 ویژگی‌ها:\n${s?.details.map(d => `• ${d}`).join("\n") || ""}\n\n💰 هزینه ارتودنسی:\n${s?.priceEst || "تماس بگیرید"}`;
    }

    if (msg.includes("بلیچ") || msg.includes("سفید") || msg.includes("جرم")) {
      const s = services.find(x => x.id === "bleaching");
      return `برای سفید کردن دندان‌ها از مجهزترین سیستم بلیچینگ مطب با لیزر بدون حساسیت دندان استفاده می‌کنیم.
\n💎 جزئیات:\n${s?.details.map(d => `• ${d}`).join("\n") || ""}\n\n💰 هزینه:\n${s?.priceEst || "تماس بگیرید"}`;
    }

    if (msg.includes("اقساط") || msg.includes("قسط") || msg.includes("هزینه") || msg.includes("قیمت") || msg.includes("چک")) {
      return `در کلینیک دنت فلو شرایط پرداخت اقساطی بسیار منعطف و آسانی برای مراجعین گرانقدر در نظر گرفته شده است:
\n💳 ${clinicConfig.installmentInfo}
\nهمچنین مشاوره حضوری و عکس‌برداری اولیه در صورت شروع درمان کاملاً رایگان می‌باشد. برای هرکدام از خدمات مورد نظرتان مایل به رزرو نوبت هستید؟`;
    }

    if (msg.includes("آدرس") || msg.includes("کجاست") || msg.includes("موقعیت") || msg.includes("لوکیشن") || msg.includes("تهران") || msg.includes("نشانی")) {
      return `📍 آدرس کلینیک دنت فلو:
${clinicConfig.address}
\n🕒 ساعات کاری:
${clinicConfig.workingHours}
\nتلفن تماس مستقیم جهت هماهنگی:
📞 ${clinicConfig.phone}`;
    }

    if (msg.includes("تلفن") || msg.includes("شماره") || msg.includes("تماس") || msg.includes("زنگ") || msg.includes("تلفن")) {
      return `📞 شماره‌های تماس مستقیم با پذیرش کلینیک دنت فلو:
${clinicConfig.phone}
\nهمچنین می‌توانید از بخش انتهای صفحه نوبت خود را به صورت آنلاین و ۲۴ ساعته ثبت کنید تا همکاران ما در اسرع وقت با شما تماس بگیرند.`;
    }

    if (msg.includes("ترس") || msg.includes("استرس") || msg.includes("فوبیا") || msg.includes("درد") || msg.includes("بیهوشی") || msg.includes("سدیشن") || msg.includes("خواب")) {
      return `هیچ نگرانی نداشته باشید! هدف اصلی کلینیک دنت فلو درمان کاملاً بدون درد است.
ما مجهز به سیستم پیشرفته "سدیشن" (خواب مصنوعی بسیار آرامش‌بخش تحت نظر متخصص بیهوشی) هستیم. شما به خوابی عمیق و شیرین می‌روید و بدون اینکه متوجه شوید تمام کارهای دندانپزشکی‌تان انجام می‌شود. 
\nآیا مایلید مشاوره سدیشن با دکتر هماهنگ کنیم؟`;
    }

    if (msg.includes("پزشک") || msg.includes("دکتر") || msg.includes("متخصص") || msg.includes("کیست") || msg.includes("مختاری")) {
      return `پزشک ارشد و جراح زیبایی کلینیک ما ${clinicConfig.doctorName} هستند.
🎓 سوابق و مدارک پزشک:
- ${clinicConfig.doctorTitle}
- ثبت بیش از ۵,۰۰۰ لبخند موفق و رضایت‌بخش
- استفاده از برترین برندهای سوئیسی و آلمانی دندانپزشکی`;
    }

    if (msg.includes("سلام") || msg.includes("درود") || msg.includes("وقت بخیر") || msg.includes("روز بخیر")) {
      return `سلام! وقت زیبای شما بخیر. خیلی خوش آمدید به دنت فلو. ✨
چطور می‌توانم در زمینه سلامت و زیبایی دندان‌ها به شما کمک کنم؟`;
    }

    return `ممنون از سؤال شما. من پاسخ دقیق کلمه به کلمه برای این موضوع ندارم؛ اما به عنوان دستیار هوشمند ${clinicConfig.doctorName} در کلینیک دنت فلو، پیشنهاد می‌کنم برای راهنمایی کامل یا هماهنگی نوبت با شماره تلفن ${clinicConfig.phone} تماس بگیرید یا از فرم نوبت‌دهی پایین صفحه استفاده کنید.
\nاگر سوالی درباره خدمات ایمپلنت، لمینت، ارتودنسی، عصب‌کشی، دندانپزشکی کودکان یا شرایط اقساطی دارید بپرسید؛ من با کمال میل راهنمایی‌تان می‌کنم! ✨`;
  };

  const sendChatMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isChatLoading) return;
    
    const userMessage = textToSend.trim();
    // Add user message to state
    const newMessages = [...chatMessages, { role: "user" as const, text: userMessage }];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      // Map chat messages to history format for backend
      const history = chatMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history,
          message: userMessage,
          customSystemInstruction: aiPrompt
        })
      });

      if (!res.ok) {
        throw new Error("ترافیک بالا یا عدم اتصال به سرور بک‌اند؛ استفاده از پردازشگر محلی دنت فلو.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages(prev => [...prev, { role: "model" as const, text: data.text }]);
    } catch (err: any) {
      console.warn("Backend Chat failed, falling back to local rule-based AI:", err);
      // Simulate typing speed for better UI feel
      setTimeout(() => {
        const fallbackText = getLocalBotResponse(userMessage);
        setChatMessages(prev => [...prev, { role: "model" as const, text: fallbackText }]);
        setIsChatLoading(false);
      }, 700);
      return; // prevent setting loading to false immediately
    } finally {
      // only runs if not caught by timeout local simulation
      setIsChatLoading(false);
    }
  };

  return (
    <section id="assistant" className="py-12 bg-gradient-to-b from-[#F0F9F9] to-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch" id="assistant-grid">
        
        {/* Card A: Assistant Description & Quick Questions (Spans 5 Columns) */}
        <div 
          className="lg:col-span-5 bg-white/80 backdrop-blur-md border border-teal-100 p-8 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between text-right"
          id="assistant-info-card"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100" id="assistant-badge">
              <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span>پاسخگویی آنی شبانه‌روزی</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight" id="assistant-card-title">
              دستیار تخصصی و هوشمند <span className="text-teal-600">{aiName || "دنت فلو"}</span>
            </h2>
            
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold" id="assistant-card-desc">
              قبل از مراجعه حضوری، تمامی سوالات خود در مورد درمان‌های دندانپزشکی، طول درمان، قیمت تقریبی، نحوه پرداخت اقساطی یا رفع استرس دندانپزشکی را بپرسید. دستیار هوشمند ما با تکیه بر اطلاعات علمی و خدمات کلینیک فوراً به شما پاسخ می‌دهد.
            </p>

            <div className="space-y-3" id="quick-questions-wrapper">
              <p className="text-xs font-black text-slate-400">سوالات متداول کلیک‌شدنی:</p>
              <div className="flex flex-wrap gap-2" id="quick-question-pills">
                {[
                  "هزینه ایمپلنت دندان چقدر است؟",
                  "آیا شرایط پرداخت اقساطی دارید؟",
                  "برای ترس شدید از دندانپزشکی چه راهکاری دارید؟",
                  "تفاوت کامپوزیت و لمینت چیست؟",
                  "عصب‌کشی چقدر طول می‌کشد و آیا درد دارد؟"
                ].map((qText, qIdx) => (
                  <button
                    key={qIdx}
                    id={`qq-pill-${qIdx}`}
                    onClick={() => sendChatMessage(qText)}
                    disabled={isChatLoading}
                    className="text-right px-3.5 py-2 rounded-xl bg-teal-50/50 hover:bg-teal-50 border border-teal-100/60 hover:border-teal-300 text-teal-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {qText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-right" id="assistant-form-hint">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-950 leading-tight">رزرو مستقیم پس از گفتگو</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-bold">پس از رفع ابهامات خود، می‌توانید از فرم انتهای صفحه برای رزرو نوبت رایگان استفاده کنید.</p>
            </div>
          </div>
        </div>

        {/* Card B: Live Interactive Chat Terminal (Spans 7 Columns) */}
        <div 
          className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-[32px] border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden relative min-h-[480px]"
          id="assistant-chat-card"
        >
          {/* Terminal Header */}
          <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800/60 flex items-center justify-between" id="chat-header">
            <div className="flex items-center gap-3" id="chat-identity">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-black text-slate-100 leading-tight">{aiName || "دستیار هوشمند دنت فلو"}</h4>
                <p className="text-[10px] text-teal-400 font-bold mt-0.5">سیستم هوش مصنوعی بر بستر Gemini 3.5</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5" id="chat-window-decor">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          {/* Chat Messages Log */}
          <div 
            className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[350px] min-h-[280px] bg-slate-900/40"
            id="chat-messages-log"
          >
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                id={`chat-msg-${index}`}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm font-semibold leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-teal-600 text-white rounded-tr-none" 
                      : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50"
                  }`}
                >
                  <p className="whitespace-pre-line text-right">{msg.text}</p>
                  <span className="block text-[10px] text-slate-400 mt-2 text-left" dir="ltr">
                    {msg.role === "user" ? "شما" : aiName || "دستیار دنت‌فلو"}
                  </span>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-end" id="chat-loading-item">
                <div className="bg-slate-800 text-slate-100 border border-slate-700/50 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <p className="text-xs text-slate-400 font-bold pr-1">در حال بررسی سوال شما...</p>
                </div>
              </div>
            )}
            {chatError && (
              <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3 text-rose-300 text-xs text-right" id="chat-error-item">
                {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Field Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage(chatInput);
            }}
            className="bg-slate-950/90 px-5 py-4 border-t border-slate-800/80 flex items-center gap-3"
            id="chat-input-form"
          >
            <button
              type="submit"
              id="btn-send-chat"
              disabled={isChatLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white flex items-center justify-center transition-colors shrink-0 disabled:text-slate-500 cursor-pointer"
              aria-label="ارسال پیام"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
            
            <input 
              type="text"
              id="chat-input-field"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="سوال خود را بنویسید (مثلاً: آیا ایمپلنت درد دارد؟)..."
              disabled={isChatLoading}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/80 text-right font-semibold disabled:opacity-50"
            />
          </form>
        </div>

      </div>
    </section>
  );
}
