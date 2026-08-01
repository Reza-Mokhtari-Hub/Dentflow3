import React, { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  ChevronLeft, 
  Calendar, 
  CreditCard, 
  FileText, 
  LogOut, 
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  Stethoscope,
  Info,
  Send,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientPortalProps {
  onBack: () => void;
  clinicConfig: any;
}

export default function PatientPortal({ onBack, clinicConfig }: PatientPortalProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp" | "dashboard">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [patientMsg, setPatientMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Polling for new messages
  useEffect(() => {
    let interval: any;
    if (patientData && email) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/patient/chat/${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            // Only update if chat length or content changed to avoid excessive re-renders
            if (JSON.stringify(data.chat) !== JSON.stringify(patientData.chat)) {
              setPatientData((prev: any) => ({ ...prev, chat: data.chat }));
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 10000); // 10 seconds
    }
    return () => clearInterval(interval);
  }, [patientData, email]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/patient/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: patientData.fullName, 
          rating: reviewRating, 
          comment: reviewComment,
          treatment: patientData.treatmentPlan && patientData.treatmentPlan.length > 0 ? patientData.treatmentPlan[0].title : ""
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود.");
        setReviewComment("");
        setReviewRating(5);
      } else {
        toast.error("خطا در ثبت نظر.");
      }
    } catch (err) {
      toast.error("خطا در برقراری ارتباط.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientMsg.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch("/api/patient/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: patientMsg })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("پیام شما با موفقیت به کلینیک ارسال شد.");
        setPatientMsg("");
        // Update local chat history
        if (data.newMessage) {
          setPatientData((prev: any) => ({
            ...prev,
            chat: [data.newMessage, ...(prev.chat || [])]
          }));
        }
      } else {
        toast.error("خطا در ارسال پیام.");
      }
    } catch (err) {
      toast.error("خطا در برقراری ارتباط.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/patient/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message) toast.info(data.message, 6000);
        setStep("otp");
        setLoading(false);
        return;
      } else {
        setError(data.error || "خطا در ارسال کد تایید.");
      }
    } catch (err) {
      console.warn("Server request OTP failed, checking local patients...", err);
    }

    // Local Storage Fallback
    try {
      const savedPatientsStr = localStorage.getItem("df_patients");
      if (savedPatientsStr) {
        const localPatients = JSON.parse(savedPatientsStr);
        const found = localPatients.find((p: any) => 
          (p.email && p.email.toLowerCase() === cleanEmail) || 
          (p.phone && p.phone === cleanEmail)
        );
        if (found) {
          toast.info("کد تایید آزمایشی شما: 123456", 8000);
          setStep("otp");
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Local patient search error:", e);
    }

    if (!error) setError("بیماری با این نشانی ایمیل یا شماره تماس یافت نشد. لطفاً دقت فرمایید.");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/patient/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: otp })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatientData(data.patient);
        setStep("dashboard");
        setLoading(false);
        return;
      } else {
        setError(data.error || "کد تایید اشتباه است.");
      }
    } catch (err) {
      console.warn("Server verify OTP failed, checking local fallback...", err);
    }

    // Local Fallback Verification
    if (otp === "123456" || otp.length === 6) {
      try {
        const savedPatientsStr = localStorage.getItem("df_patients");
        if (savedPatientsStr) {
          const localPatients = JSON.parse(savedPatientsStr);
          const found = localPatients.find((p: any) => 
            (p.email && p.email.toLowerCase() === cleanEmail) || 
            (p.phone && p.phone === cleanEmail)
          );
          if (found) {
            // Populate full patient data structure
            setPatientData({
              ...found,
              treatmentPlan: found.treatmentPlan || [],
              prescriptions: found.prescriptions || [],
              medicalPhotos: found.medicalPhotos || [],
              chat: found.chat || [],
              bookings: JSON.parse(localStorage.getItem("df_bookings") || "[]").filter((b: any) => 
                (b.email && b.email.toLowerCase() === cleanEmail) || (b.phone && b.phone === found.phone)
              )
            });
            setStep("dashboard");
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Local verify fallback error:", e);
      }
    }

    if (!error) setError("کد تایید وارد شده معتبر نیست.");
    setLoading(false);
  };

  const handleLogout = () => {
    setStep("login");
    setPatientData(null);
    setEmail("");
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-bold text-sm cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به سایت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">DF</div>
            <span className="font-black text-slate-800 tracking-tighter">DENT<span className="text-teal-600">FLOW</span></span>
          </div>

          {step === "dashboard" && (
            <button 
              onClick={handleLogout}
              className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer"
              title="خروج از حساب"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-8 border border-slate-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-2">ورود به پورتال بیماران</h1>
                  <p className="text-slate-500 text-sm font-medium">جهت مشاهده پرونده، برای خود ایمیل وارد کنید</p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold text-xs pr-1">نشانی ایمیل:</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-mono text-left transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button 
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "در حال بررسی..." : "ارسال کد تایید"}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3 bg-slate-50/50 p-4 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    امنیت اطلاعات شما اولویت ماست. دسترسی به پرونده فقط از طریق ایمیل ثبت شده در سیستم کلینیک دنت فلو امکان‌پذیر است.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div 
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <button 
                  onClick={() => setStep("login")}
                  className="mb-6 text-slate-400 hover:text-teal-600 flex items-center gap-1 text-xs font-bold border-none bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span>تغییر ایمیل</span>
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-2">تایید هویت</h1>
                  <p className="text-slate-500 text-sm font-medium">کد ۶ رقمی ارسال شده به ایمیل <span className="text-teal-600 font-mono" dir="ltr">{email}</span> را وارد کنید</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold text-xs pr-1">کد تایید:</label>
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="------"
                      className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-mono text-center text-2xl tracking-[15px] transition-all"
                      dir="ltr"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 text-center">
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "در حال بررسی..." : "ورود به داشبورد"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === "dashboard" && patientData && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center text-white">
                  <User className="w-10 h-10" />
                </div>
                <div className="text-center sm:text-right flex-1">
                  <h2 className="text-2xl font-black text-slate-800 mb-1">{patientData.fullName} عزیز، خوش آمدید!</h2>
                  <p className="text-slate-500 text-sm font-medium">پورتال شخصی و پرونده دیجیتال شما در کلینیک دنت فلو</p>
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                      <Clock className="w-4 h-4 text-teal-500" />
                      <span>آخرین بروزرسانی: امروز</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                      <ShieldCheck className="w-4 h-4 text-teal-500" />
                      <span>کد پرونده: {patientData.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts & Plans */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Treatment Plan */}
                  <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span>طرح درمان و وضعیت سلامت</span>
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {patientData.treatmentPlan && patientData.treatmentPlan.length > 0 ? (
                          patientData.treatmentPlan.map((plan: any) => (
                            <div key={plan.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.status === "completed" ? "bg-teal-100 text-teal-600" : "bg-blue-100 text-blue-600"}`}>
                                  <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{plan.title}</h4>
                                  <span className="text-[10px] text-slate-400 font-bold">مبلغ برآورد شده: {plan.cost.toLocaleString("fa-IR")} تومان</span>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                plan.status === "completed" ? "bg-teal-50 text-teal-700" : 
                                plan.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {plan.status === "completed" ? "تکمیل شده" : plan.status === "in_progress" ? "در حال انجام" : "در نوبت اجرا"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-400 font-bold text-sm">طرح درمانی ثبت نشده است.</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Dental Chart Summary */}
                  <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6">
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                      <span>نمای کلی وضعیت دندان‌ها</span>
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                      <p className="text-xs text-slate-500 font-bold leading-relaxed mb-4">
                        این بخش خلاصه وضعیت دندان‌های شما در پرونده دیجیتال است. جهت مشاهده جزئیات کامل و چارت گرافیکی ۳ بعدی، در زمان مراجعه حضوری با پزشک خود مشورت کنید.
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-slate-600">
                          دندان‌های پر شده: {Object.values(patientData.dentalChart || {}).filter(v => v === "filled").length} مورد
                        </div>
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-rose-600">
                          نیاز به ترمیم: {Object.values(patientData.dentalChart || {}).filter(v => v === "decayed").length} مورد
                        </div>
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-teal-600">
                          دندان‌های سالم: {Object.values(patientData.dentalChart || {}).filter(v => v === "healthy").length} مورد
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Appointments */}
                  <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <span>تاریخچه نوبت‌ها و مراجعات</span>
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {patientData.bookings && patientData.bookings.length > 0 ? (
                          patientData.bookings.map((b: any) => (
                            <div key={b.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                              <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex flex-col items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <span className="text-[10px] font-black opacity-60">نوبت</span>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-black text-slate-800">{b.date}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                    b.status === "approved" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {b.status === "approved" ? "تایید شده" : "در انتظار"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold">{b.timeSlot === "morning" ? "شیفت صبح" : "شیفت عصر"}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-400 font-bold text-sm">سابقه‌ای یافت نشد.</div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Financials & Prescriptions */}
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <section className="bg-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-600/20 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <CreditCard className="w-8 h-8 opacity-50" />
                        <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">گردش مالی</span>
                      </div>
                      <div className="space-y-1 mb-6">
                        <span className="text-teal-100 text-[10px] font-bold block">مجموع پرداختی‌های شما:</span>
                        <div className="text-3xl font-black">
                          {patientData.transactions?.reduce((sum: number, t: any) => sum + (t.type === "income" ? t.amount : 0), 0).toLocaleString("fa-IR")}
                          <span className="text-xs font-bold mr-1">تومان</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                        <span className="text-teal-100">تعداد فاکتورها:</span>
                        <span>{patientData.transactions?.length || 0} مورد</span>
                      </div>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  </section>

                  {/* Prescriptions */}
                  <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        <span>نسخه‌های صادر شده</span>
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {patientData.prescriptions && patientData.prescriptions.length > 0 ? (
                          patientData.prescriptions.map((rx: any) => (
                            <div key={rx.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                <span className="text-[10px] font-black text-teal-600">{rx.date}</span>
                                <span className="text-[9px] font-mono font-bold text-slate-400">ID: {rx.id}</span>
                              </div>
                              <div className="space-y-2">
                                {rx.drugs.map((drug: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-teal-400 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                      <p className="text-[11px] font-black text-slate-700">{drug.name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold">{drug.dose} - {drug.duration}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-400 font-bold text-sm italic">نسخه‌ای یافت نشد.</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Medical History */}
                  <section className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                    <h3 className="font-black text-rose-700 flex items-center gap-2 mb-4 text-sm">
                      <Info className="w-5 h-5" />
                      <span>یادداشت‌های پزشکی و حساسیت‌ها</span>
                    </h3>
                    <p className="text-xs text-rose-600/80 leading-relaxed font-bold">
                      {patientData.history || "موردی ثبت نشده است."}
                    </p>
                  </section>

                  {/* Unified Chat & Messaging */}
                  <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-teal-600" />
                        <span>گفتگو با کلینیک</span>
                      </h3>
                      <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">آنلاین</span>
                    </div>
                    
                    {/* Chat Messages Area */}
                    <div className="p-6 h-[400px] overflow-y-auto bg-slate-50/30 flex flex-col gap-4 custom-scrollbar">
                      {patientData.chat && patientData.chat.length > 0 ? (
                        [...patientData.chat].reverse().map((msg: any) => (
                          <div 
                            key={msg.id} 
                            className={`max-w-[85%] p-4 rounded-2xl text-xs relative ${
                              msg.sender === "clinic" 
                                ? "bg-white text-slate-700 self-start rounded-tr-none shadow-sm border border-slate-100" 
                                : "bg-teal-600 text-white self-end rounded-tl-none shadow-md shadow-teal-600/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2 opacity-60 font-black text-[9px]">
                              <span>{msg.sender === "clinic" ? "کلینیک دنت فلو" : "شما"}</span>
                              <span>{msg.date} - {msg.time}</span>
                            </div>
                            {msg.subject && (
                              <div className="font-black mb-1 border-b border-slate-100 pb-1 text-teal-600">{msg.subject}</div>
                            )}
                            <p className="font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                          <Mail className="w-12 h-12 stroke-1" />
                          <span className="text-xs font-black italic">هنوز پیامی ارسال نشده است.</span>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                      <form onSubmit={handleSendMessage} className="relative">
                        <textarea
                          value={patientMsg}
                          onChange={(e) => setPatientMsg(e.target.value)}
                          placeholder="سوال یا پیام خود را اینجا بنویسید..."
                          className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-xs resize-none focus:outline-none focus:border-teal-500 transition-all pr-5 pl-14"
                          rows={2}
                        />
                        <button
                          disabled={sendingMsg || !patientMsg.trim()}
                          className="absolute left-3 bottom-3 p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-600/20 border-none"
                        >
                          {sendingMsg ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </form>
                      <p className="text-[9px] text-slate-400 font-bold mt-2 mr-2">
                        پاسخ شما در اسرع وقت توسط تیم پشتیبانی یا پزشک داده خواهد شد.
                      </p>
                    </div>
                  </section>

                  {/* Submit Review */}
                  <section className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8">
                    <h3 className="font-black text-amber-800 flex items-center gap-2 mb-4 text-sm">
                      <Sparkles className="w-5 h-5" />
                      <span>ثبت نظر و تجربه درمان</span>
                    </h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex items-center gap-2 justify-center py-2 bg-white rounded-2xl border border-amber-200">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setReviewRating(num)}
                            className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer border-none bg-transparent"
                          >
                            <Star 
                              className={`w-8 h-8 ${num <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="تجربه خود را از حضور در کلینیک بنویسید..."
                        className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white font-bold text-slate-700 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        rows={3}
                      />
                      <button
                        disabled={submittingReview || !reviewComment.trim()}
                        className="w-full py-3 rounded-2xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <span>{submittingReview ? "در حال ثبت..." : "ثبت و ارسال نظر"}</span>
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-bold mb-2">کلینیک تخصصی دندانپزشکی دنت فلو - الهیه، فرشته</p>
          <p className="text-slate-300 text-[10px] font-medium">© تمامی حقوق مادی و معنوی محفوظ است</p>
        </div>
      </footer>
    </div>
  );
}
