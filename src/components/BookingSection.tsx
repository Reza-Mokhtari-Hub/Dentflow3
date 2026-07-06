import React, { useState, useEffect } from "react";
import { CheckCircle, Search, User, Phone, Lock, Check, AlertCircle, MapPin, Clock, Map, Info, FolderHeart, Camera } from "lucide-react";
import { Service } from "../data";
import { AnimatePresence, motion } from "motion/react";

interface BookingSectionProps {
  selectedServiceId: string;
  services: Service[];
  clinicConfig: {
    address: string;
    phone: string;
    phoneRaw: string;
    telegram: string;
    workingHours: string;
    doctorName: string;
    doctorTitle: string;
    aboutDesc: string;
    installmentInfo: string;
  };
}

export default function BookingSection({ selectedServiceId, services, clinicConfig }: BookingSectionProps) {
  const [bookingTab, setBookingTab] = useState<"new" | "track">("new");
  
  // New Appointment States
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    serviceId: "implant",
    date: "",
    timeSlot: "morning",
    notes: ""
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Tracking States
  const [trackCode, setTrackCode] = useState("");
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [trackedBooking, setTrackedBooking] = useState<any>(null);

  // Sync selected service ID from prop (e.g. when coming from the services modal click)
  useEffect(() => {
    if (selectedServiceId) {
      setFormData((prev) => ({ ...prev, serviceId: selectedServiceId }));
    }
  }, [selectedServiceId]);

  // Form Change Handler
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errors.fullName = "وارد کردن نام و نام خانوادگی بیمار الزامی است.";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "نام باید حداقل شامل ۳ حرف باشد.";
    }

    const phoneRegex = /^09[0-9]{9}$/;
    if (!formData.phone) {
      errors.phone = "وارد کردن شماره تماس جهت هماهنگی الزامی است.";
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = "شماره موبایل وارد شده معتبر نیست. نمونه معتبر: 09123456789";
    }

    if (!formData.date) {
      errors.date = "لطفاً تاریخ حدودی مورد نظر خود را انتخاب نمایید.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setBookingRef(data.id || data.refCode || `DF-${Math.floor(100000 + Math.random() * 900000)}`);
        setIsSubmitted(true);
      } else {
        alert(data.error || "ثبت نوبت با خطا مواجه شد.");
      }
    } catch (err) {
      console.error("Booking Error:", err);
      // Fallback
      setBookingRef(`DF-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track Booking
  const handleBookingTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) return;

    setIsTrackingLoading(true);
    setTrackError("");
    setTrackedBooking(null);

    try {
      const res = await fetch(`/api/bookings/track/${encodeURIComponent(trackCode.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setTrackedBooking(data);
      } else {
        setTrackError(data.error || "نوبتی با این کد رهگیری یافت نشد. لطفاً دقت فرمایید.");
      }
    } catch (err) {
      console.error("Error tracking booking:", err);
      setTrackError("اتصال به سرور برقرار نشد. لطفاً مجدداً تلاش فرمایید.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const getServiceTitle = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.title || "ایمپلنت دندان";
  };

  return (
    <section id="booking" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="booking-grid">
        
        {/* Card A: Grand Appointment Form Block (Spans 7 Columns) */}
        <div 
          className="lg:col-span-7 bg-white rounded-[32px] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-teal-950/5 text-right flex flex-col justify-between"
          id="booking-form-col"
        >
          <div>
            {/* Elegant Tab Headers */}
            <div className="flex border-b border-slate-100 mb-8 gap-6 justify-start" id="booking-tabs">
              <button
                type="button"
                id="tab-btn-new"
                onClick={() => setBookingTab("new")}
                className={`pb-3 text-xs sm:text-sm font-black transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  bookingTab === "new" ? "text-teal-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>ثبت نوبت جدید</span>
                {bookingTab === "new" && (
                  <motion.div layoutId="booking-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                )}
              </button>
              <button
                type="button"
                id="tab-btn-track"
                onClick={() => setBookingTab("track")}
                className={`pb-3 text-xs sm:text-sm font-black transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  bookingTab === "track" ? "text-teal-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>رهگیری نوبت قبلی</span>
                {bookingTab === "track" && (
                  <motion.div layoutId="booking-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                )}
              </button>
            </div>

            {bookingTab === "new" && (
              <>
                <div className="space-y-2 mb-8" id="form-header">
                  <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold border border-teal-100">نوبت دهی سریع</span>
                  <h3 className="text-2xl font-extrabold text-slate-900" id="form-title">سامانه هوشمند رزرو نوبت آنلاین</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold" id="form-desc">
                    مشاوره اولیه و معاینه کلی تماماً رایگان می‌باشد. اطلاعات خود را ثبت کنید؛ کادر پذیرش تا حداکثر ۲ ساعت کاری جهت قطعی کردن نوبت با شما تماس خواهند گرفت.
                  </p>
                </div>

                {!isSubmitted ? (
                  <form onSubmit={handleFormSubmit} className="space-y-5" id="appointment-form">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="form-row-1">
                      {/* Patient Name Input */}
                      <div className="space-y-1.5" id="form-group-name">
                        <label htmlFor="fullName" className="block text-xs sm:text-sm font-bold text-slate-700">نام و نام خانوادگی بیمار</label>
                        <div className="relative" id="name-input-wrapper">
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="مثال: مریم محمدی"
                            value={formData.fullName}
                            onChange={handleFormChange}
                            className={`w-full px-4 py-3 rounded-xl bg-[#F8FCFC] border ${formErrors.fullName ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500"} text-slate-800 text-sm focus:outline-none focus:ring-2`}
                          />
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        </div>
                        {formErrors.fullName && <p className="text-[11px] text-rose-500 font-semibold" id="err-name">{formErrors.fullName}</p>}
                      </div>

                      {/* Contact Phone */}
                      <div className="space-y-1.5" id="form-group-phone">
                        <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-slate-700">شماره موبایل جهت هماهنگی</label>
                        <div className="relative" id="phone-input-wrapper">
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            placeholder="مثال: 09123456789"
                            value={formData.phone}
                            onChange={handleFormChange}
                            className={`w-full px-4 py-3 rounded-xl bg-[#F8FCFC] border ${formErrors.phone ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500"} text-slate-800 text-sm focus:outline-none focus:ring-2`}
                          />
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        </div>
                        {formErrors.phone && <p className="text-[11px] text-rose-500 font-semibold" id="err-phone">{formErrors.phone}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="form-row-2">
                      {/* Select treatment dropdown */}
                      <div className="space-y-1.5" id="form-group-service">
                        <label htmlFor="serviceId" className="block text-xs sm:text-sm font-bold text-slate-700">نوع خدمت درخواستی</label>
                        <div className="relative" id="service-select-wrapper">
                          <select
                            id="serviceId"
                            name="serviceId"
                            value={formData.serviceId}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 rounded-xl bg-[#F8FCFC] border border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-slate-800 text-sm focus:outline-none focus:ring-2"
                          >
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Preferred Date Selector */}
                      <div className="space-y-1.5" id="form-group-date">
                        <label htmlFor="date" className="block text-xs sm:text-sm font-bold text-slate-700">تاریخ حدودی مد نظر</label>
                        <div className="relative" id="date-input-wrapper">
                          <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleFormChange}
                            className={`w-full px-4 py-3 rounded-xl bg-[#F8FCFC] border ${formErrors.date ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500"} text-slate-800 text-sm focus:outline-none focus:ring-2`}
                          />
                        </div>
                        {formErrors.date && <p className="text-[11px] text-rose-500 font-semibold" id="err-date">{formErrors.date}</p>}
                      </div>
                    </div>

                    {/* Time slot toggle */}
                    <div className="space-y-2" id="form-group-timeSlot">
                      <span className="block text-xs sm:text-sm font-bold text-slate-700">بازه زمانی مناسب شما</span>
                      <div className="grid grid-cols-2 gap-3" id="time-slot-radios">
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs sm:text-sm font-bold transition-all ${formData.timeSlot === "morning" ? "bg-teal-50 border-teal-300 text-teal-700 shadow-inner" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`} id="label-time-morning">
                          <input 
                            type="radio" 
                            name="timeSlot" 
                            value="morning" 
                            checked={formData.timeSlot === "morning"}
                            onChange={() => setFormData(prev => ({ ...prev, timeSlot: "morning" }))}
                            className="hidden"
                          />
                          <span>شیفت صبح (۱۰ الی ۱۴)</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs sm:text-sm font-bold transition-all ${formData.timeSlot === "afternoon" ? "bg-teal-50 border-teal-300 text-teal-700 shadow-inner" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`} id="label-time-afternoon">
                          <input 
                            type="radio" 
                            name="timeSlot" 
                            value="afternoon" 
                            checked={formData.timeSlot === "afternoon"}
                            onChange={() => setFormData(prev => ({ ...prev, timeSlot: "afternoon" }))}
                            className="hidden"
                          />
                          <span>شیفت عصر (۱۴ الی ۲۰)</span>
                        </label>
                      </div>
                    </div>

                    {/* Booking notes */}
                    <div className="space-y-1.5" id="form-group-notes">
                      <label htmlFor="notes" className="block text-xs sm:text-sm font-bold text-slate-700">توضیحات یا سوابق خاص پزشکی (اختیاری)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={2}
                        placeholder="اگر باردار هستید، حساسیت دارویی دارید یا سابقه بیماری خاص دارید لطفاً قید فرمایید."
                        value={formData.notes}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8FCFC] border border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-slate-800 text-sm focus:outline-none focus:ring-2 resize-none"
                      />
                    </div>

                    {/* Submission button with loading effect */}
                    <button
                      type="submit"
                      id="btn-submit-booking"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold text-base shadow-md shadow-teal-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" id="submit-loader"></div>
                          <span>در حال ارسال اطلاعات...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-white" />
                          <span>ثبت و ارسال درخواست رزرو نوبت</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px]" id="secure-badge">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>حریم خصوصی شما ایمن است. اطلاعات صرفاً برای هماهنگی پذیرش پزشک استفاده می‌شود.</span>
                    </div>
                  </form>
                ) : (
                  /* Beautiful Booking Success Receipt state */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#F8FCFC] border border-teal-200 rounded-3xl p-6 sm:p-8 text-center space-y-6"
                    id="booking-success-receipt"
                  >
                    <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner" id="receipt-success-icon">
                      <Check className="w-8 h-8 stroke-[3px]" />
                    </div>

                    <div className="space-y-2" id="receipt-header">
                      <h4 className="text-xl font-extrabold text-teal-600">درخواست رزرو نوبت با موفقیت ثبت شد!</h4>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold">
                        همکاران ما در بخش پذیرش کلینیک دنت فلو در سریع‌ترین زمان ممکن جهت تایید نهایی نوبت با شما تماس خواهند گرفت.
                      </p>
                    </div>

                    {/* Summary ticket */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 text-right space-y-3.5" id="receipt-ticket">
                      <div className="flex justify-between items-center text-xs" id="ticket-ref">
                        <span className="text-slate-400 font-bold">کد رهگیری نوبت:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-200/50 px-2.5 py-1 rounded-md">{bookingRef}</span>
                      </div>

                      <div className="border-t border-dashed border-slate-200 my-2" />

                      <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm font-semibold" id="ticket-details">
                        <div id="ticket-detail-name">
                          <span className="text-slate-400 block font-bold">بیمار:</span>
                          <span className="text-slate-800 font-extrabold mt-1 block">{formData.fullName}</span>
                        </div>
                        <div id="ticket-detail-phone">
                          <span className="text-slate-400 block font-bold">شماره تماس:</span>
                          <span className="text-slate-800 font-bold mt-1 block">{formData.phone}</span>
                        </div>
                        <div id="ticket-detail-service">
                          <span className="text-slate-400 block font-bold">خدمت انتخابی:</span>
                          <span className="text-slate-800 font-bold mt-1 block">{getServiceTitle(formData.serviceId)}</span>
                        </div>
                        <div id="ticket-detail-date">
                          <span className="text-slate-400 block font-bold">تاریخ حدودی:</span>
                          <span className="text-slate-800 font-bold mt-1 block">{formData.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2" id="receipt-actions">
                      <button 
                        id="btn-receipt-track"
                        onClick={async () => {
                          setTrackCode(bookingRef);
                          setBookingTab("track");
                          setIsSubmitted(false);
                          // Auto-trigger search for this code
                          setIsTrackingLoading(true);
                          setTrackError("");
                          setTrackedBooking(null);
                          try {
                            const res = await fetch(`/api/bookings/track/${encodeURIComponent(bookingRef)}`);
                            const data = await res.json();
                            if (res.ok) {
                              setTrackedBooking(data);
                            } else {
                              setTrackError(data.error || "نوبتی با این کد رهگیری یافت نشد.");
                            }
                          } catch (err) {
                            console.error("Error tracking booking:", err);
                            setTrackError("خطایی رخ داد.");
                          } finally {
                            setIsTrackingLoading(false);
                          }
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-extrabold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/10"
                      >
                        <Search className="w-4 h-4" />
                        <span>رهگیری و مشاهده وضعیت نوبت</span>
                      </button>
                      <button 
                        id="btn-receipt-reset"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            fullName: "",
                            phone: "",
                            serviceId: "implant",
                            date: "",
                            timeSlot: "morning",
                            notes: ""
                          });
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        درخواست نوبت جدید
                      </button>
                      <a 
                        id="btn-receipt-call"
                        href={`tel:${clinicConfig.phoneRaw}`} 
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-white" />
                        تماس با پذیرش
                      </a>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {bookingTab === "track" && (
              <div className="space-y-6 text-right" id="tracking-section">
                <div className="space-y-2 mb-6" id="tracking-header">
                  <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold border border-teal-100">استعلام نوبت</span>
                  <h3 className="text-2xl font-extrabold text-slate-900" id="tracking-title">رهگیری هوشمند وضعیت نوبت</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold" id="tracking-desc">
                    جهت مشاهده وضعیت نوبت خود، تاریخ نهایی تایید شده، و پیام اختصاصی کلینیک دنت فلو، کد رهگیری دریافتی هنگام ثبت‌نام (مثال: <code className="font-mono bg-slate-100 px-1 rounded text-slate-600">DF-183029</code>) را در کادر زیر وارد نمایید.
                  </p>
                </div>

                <form onSubmit={handleBookingTrack} className="flex gap-3" id="tracking-input-form">
                  <div className="relative flex-1" id="track-input-wrapper">
                    <input
                      type="text"
                      value={trackCode}
                      onChange={(e) => {
                        setTrackCode(e.target.value);
                        setTrackError("");
                      }}
                      placeholder="کد رهگیری خود را وارد کنید (مانند DF-183029)"
                      className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-[#F8FCFC] border border-slate-200 text-sm font-extrabold text-left focus:outline-none focus:border-teal-500 uppercase font-mono"
                      dir="ltr"
                      required
                    />
                    <Search className="absolute right-3.5 top-4 w-5 h-5 text-slate-400" />
                  </div>
                  <button
                    type="submit"
                    disabled={isTrackingLoading}
                    className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isTrackingLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <span>بررسی وضعیت</span>
                    )}
                  </button>
                </form>

                {trackError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p>{trackError}</p>
                  </motion.div>
                )}

                {trackedBooking ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#F8FCFC] border border-teal-100 rounded-3xl p-5 sm:p-6 space-y-5"
                    id="tracked-result-card"
                  >
                    <div className="flex justify-between items-center border-b border-teal-50/50 pb-4" id="tracked-card-header">
                      <span className="font-black text-teal-800 text-sm">اطلاعات نوبت مراجع</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs">{trackedBooking.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm font-bold" id="tracked-card-grid">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] sm:text-xs block">نام بیمار:</span>
                        <span className="text-slate-900 block">{trackedBooking.fullName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] sm:text-xs block">خدمت درخواستی:</span>
                        <span className="text-slate-900 block">{getServiceTitle(trackedBooking.serviceId)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] sm:text-xs block">تاریخ نوبت:</span>
                        <span className="text-slate-900 block font-mono">{trackedBooking.date}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] sm:text-xs block">زمان/شیفت نوبت:</span>
                        <span className="text-slate-900 block">
                          {trackedBooking.timeSlot === "morning" ? "شیفت صبح (۱۰ الی ۱۴)" : "شیفت عصر (۱۴ الی ۲۰)"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-teal-50/50 pt-4 space-y-3.5" id="tracked-card-status-wrapper">
                      <div>
                        <span className="text-slate-400 text-xs block font-bold mb-1.5">وضعیت پذیرش نوبت:</span>
                        {trackedBooking.status === "pending" && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>در انتظار بررسی کادر درمان کلینیک</span>
                          </div>
                        )}
                        {trackedBooking.status === "approved" && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span>تایید نهایی شده و رزرو قطعی است</span>
                          </div>
                        )}
                        {trackedBooking.status === "cancelled" && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>لغو شده یا عدم مراجعه</span>
                          </div>
                        )}
                      </div>

                      {/* Clinic Admin custom response message */}
                      <div className="bg-white border border-teal-100/50 rounded-2xl p-4 space-y-2" id="tracked-card-comment">
                        <span className="text-teal-700 text-xs font-black block flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>توضیحات و پیام تایید مطب دنت فلو:</span>
                        </span>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">
                          {trackedBooking.adminComment 
                            ? trackedBooking.adminComment 
                            : "درخواست نوبت شما با موفقیت به سیستم ارسال شده است. پس از تایید کادر درمان، پیام تایید، ساعت دقیق حضور و توصیه‌های لازم پزشک در این قسمت نمایش داده خواهد شد."}
                        </p>
                      </div>

                      {/* Matched Patient Record (EHR) from doctor */}
                      {trackedBooking.patientRecord && (
                        <div className="border-t border-teal-100/50 pt-4 space-y-4 animate-fade-in" id="tracked-card-ehr">
                          <div className="bg-gradient-to-br from-teal-50/40 to-teal-100/10 border border-teal-200/60 rounded-2xl p-4 space-y-3.5">
                            <div className="flex items-center gap-1.5 border-b border-teal-200/30 pb-2">
                              <FolderHeart className="w-4 h-4 text-teal-600 animate-pulse" />
                              <span className="text-teal-900 text-xs font-extrabold block">
                                پرونده الکترونیک سلامت شما ({trackedBooking.patientRecord.id})
                              </span>
                            </div>
                            
                            {/* General History / Medical Warning */}
                            {trackedBooking.patientRecord.history && (
                              <div className="bg-white/80 backdrop-blur-sm border border-teal-100/50 p-3 rounded-xl text-xs space-y-1">
                                <span className="text-teal-700/80 block font-black text-[10px]">خلاصه پرونده و سوابق پزشکی:</span>
                                <p className="text-slate-700 font-extrabold leading-relaxed">{trackedBooking.patientRecord.history}</p>
                              </div>
                            )}

                            {/* Treatment Plan Section */}
                            {trackedBooking.patientRecord.treatmentPlan && trackedBooking.patientRecord.treatmentPlan.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-slate-500 text-[10px] sm:text-[11px] font-black block">برنامه درمانی طراحی شده توسط دکتر مختاری:</span>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {trackedBooking.patientRecord.treatmentPlan.map((plan: any, idx: number) => (
                                    <div key={plan.id || idx} className="bg-white/85 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold">
                                      <span className="text-slate-700">{plan.title}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-teal-600 font-black">
                                          {plan.cost ? `${plan.cost.toLocaleString("fa-IR")} تومان` : ""}
                                        </span>
                                        {plan.status === "completed" && (
                                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-extrabold">انجام شده</span>
                                        )}
                                        {plan.status === "in_progress" && (
                                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold">در حال انجام</span>
                                        )}
                                        {plan.status === "planned" && (
                                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-extrabold">برنامه‌ریزی شده</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prescriptions Section */}
                            {trackedBooking.patientRecord.prescriptions && trackedBooking.patientRecord.prescriptions.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-slate-500 text-[10px] sm:text-[11px] font-black block">آخرین نسخه‌های دارویی ثبت شده:</span>
                                <div className="space-y-2">
                                  {trackedBooking.patientRecord.prescriptions.map((rx: any, idx: number) => (
                                    <div key={rx.id || idx} className="bg-white/85 border border-slate-100 p-3 rounded-xl space-y-2 text-xs">
                                      <div className="flex justify-between items-center text-slate-400 text-[9px] sm:text-[10px] font-black">
                                        <span>تشخیص پزشک: <strong className="text-teal-700 font-extrabold">{rx.diagnosis}</strong></span>
                                        <span>تاریخ نسخه: <strong className="text-slate-700 font-extrabold">{rx.date}</strong></span>
                                      </div>
                                      <div className="border-t border-dashed border-slate-100 my-1" />
                                      <ul className="space-y-1.5 list-disc pr-4 text-slate-600 font-bold">
                                        {rx.drugs && rx.drugs.map((drug: any, dIdx: number) => (
                                          <li key={dIdx} className="leading-relaxed text-[11px] sm:text-xs">
                                            <span className="text-slate-800 font-extrabold">{drug.name}</span>
                                            <span className="mx-1 text-slate-400 font-normal">|</span>
                                            <span className="text-teal-700 font-black">{drug.dose}</span>
                                            {drug.duration && (
                                              <>
                                                <span className="mx-1 text-slate-400 font-normal">|</span>
                                                <span className="text-slate-500 font-bold">دوره: {drug.duration}</span>
                                              </>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Medical Photos & Radiography Section (Option 3) */}
                            {trackedBooking.patientRecord.medicalPhotos && trackedBooking.patientRecord.medicalPhotos.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="text-slate-500 text-[10px] sm:text-[11px] font-black block flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                                  <span>عکس‌های پزشکی و تصاویر رادیوگرافی (Option 3):</span>
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {trackedBooking.patientRecord.medicalPhotos.map((photo: any, idx: number) => (
                                    <div key={photo.id || idx} className="bg-white/85 border border-slate-100 p-3 rounded-xl space-y-2 text-xs">
                                      <div className="flex justify-between items-center text-slate-400 text-[9px] sm:text-[10px] font-black">
                                        <span className="text-teal-700 font-extrabold">{photo.title}</span>
                                        <span className="text-slate-500 font-bold font-mono">{photo.date}</span>
                                      </div>
                                      <div className="relative rounded-xl overflow-hidden border border-slate-150 h-28 bg-slate-50 flex items-center justify-center">
                                        <img 
                                          src={photo.imageUrl} 
                                          alt={photo.title} 
                                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.target as any).src = "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=300";
                                          }}
                                          onClick={() => {
                                            const w = window.open();
                                            if (w) {
                                              w.document.write(`<img src="${photo.imageUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto; padding:20px; font-family:sans-serif;" />`);
                                              w.document.title = photo.title;
                                            }
                                          }}
                                        />
                                      </div>
                                      {photo.notes && (
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{photo.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="empty-tracking">
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">کد رهگیری خود را در کادر بالا وارد کرده و دکمه بررسی را بزنید.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card B: Contact Details & Interactive simulated Map (Spans 5 Columns) */}
        <div 
          className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-teal-950/5 flex flex-col justify-between"
          id="booking-contact-col"
        >
          <div className="space-y-6">
            <div className="space-y-3" id="contact-info-block">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">راه‌های ارتباطی با ما</span>
              <h3 className="text-2xl font-extrabold text-slate-900">اطلاعات تماس و آدرس</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold">
                ما همواره پذیرای حضور گرم شما مراجعین عزیز در محیط شیک و استریل دنت فلو هستیم.
              </p>
            </div>

            {/* Contact details */}
            <div className="space-y-4" id="contact-items">
              
              <div className="flex gap-4 items-start" id="contact-item-address">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 shadow-sm border border-teal-100/30" id="address-icon">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">آدرس فیزیکی کلینیک</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">{clinicConfig.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start" id="contact-item-phones">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 shadow-sm border border-teal-100/30" id="phones-icon">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">تلفن‌های تماس مستقیم</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-black">{clinicConfig.phone}</p>
                  <p className="text-[10px] text-slate-400 font-bold">امکان ارسال پیام در تلگرام یا واتس‌اپ: {clinicConfig.telegram}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start" id="contact-item-hours">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 shadow-sm border border-teal-100/30" id="hours-icon">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">ساعات کاری و پذیرش</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">{clinicConfig.workingHours}</p>
                  <p className="text-[10px] text-rose-500 font-bold">بخش اورژانس شبانه‌روزی (هماهنگی قبلی تلفنی)</p>
                </div>
              </div>

            </div>
          </div>

          {/* Virtual Simulated Map Widget */}
          <div className="bg-[#F8FCFC] rounded-2xl p-5 border border-slate-100 relative overflow-hidden shadow-inner flex flex-col justify-between aspect-video mt-6" id="virtual-map-widget">
            <div className="absolute inset-0 bg-teal-500/5 pointer-events-none" />
            
            {/* Visual map graphics (stylized vector road grid) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20" id="map-roads-lines">
              <div className="w-full h-1 bg-teal-600 absolute rotate-12" />
              <div className="w-full h-1 bg-teal-600 absolute -rotate-45" />
              <div className="h-full w-1 bg-teal-600 absolute left-1/3" />
              <div className="h-full w-1 bg-teal-600 absolute right-1/4" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full" id="map-details">
              <div className="flex items-center gap-2" id="map-header">
                <Map className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-600">موقعیت دنت فلو روی نقشه</span>
              </div>

              <div className="my-auto text-center animate-bounce-slow" id="map-pin">
                <div className="relative inline-block" id="pin-bounce">
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-rose-500/30 animate-ping" />
                  <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-md relative z-10 mx-auto" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 mt-2">الهیه، خیابان فرشته</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">ساختمان پزشکان مریم</p>
              </div>

              <div className="flex justify-between items-center bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-slate-100" id="map-actions">
                <div className="text-right" id="map-transit-hint">
                  <p className="text-[10px] font-black text-slate-800">نزدیک‌ترین مترو</p>
                  <p className="text-[9px] text-slate-500 font-bold">ایستگاه تجریش (۱۰ دقیقه تاکسی)</p>
                </div>
                <a 
                  id="btn-open-google-maps"
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold shadow-sm transition-colors"
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
