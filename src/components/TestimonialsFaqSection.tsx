import React, { useState, useEffect } from "react";
import { Smile, Star, ArrowRight, ArrowLeft, ShieldCheck, ChevronDown, Info, Plus, MessageSquare, X, Check } from "lucide-react";
import { faqData } from "../data";
import { AnimatePresence, motion } from "motion/react";

interface Testimonial {
  id: number;
  name: string;
  treatment: string;
  rating: number;
  comment: string;
  avatarUrl: string;
  status: "approved" | "pending";
}

interface TestimonialsFaqSectionProps {
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
}

export default function TestimonialsFaqSection({ testimonials, setTestimonials }: TestimonialsFaqSectionProps) {
  const [currentTestimonialIdx, setCurrentTestimonialIdx] = useState(0);
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [treatment, setTreatment] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const approvedTestimonials = testimonials.filter(t => t.status === "approved");
  const totalApproved = approvedTestimonials.length;

  const averageRating = totalApproved > 0
    ? (approvedTestimonials.reduce((sum, t) => sum + t.rating, 0) / totalApproved).toFixed(1)
    : "0.0";

  // Carousel auto-play
  useEffect(() => {
    if (approvedTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTestimonialIdx((prev) => (prev + 1) % approvedTestimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [approvedTestimonials.length]);

  // Safe navigation index
  const safeIdx = approvedTestimonials.length > 0 
    ? currentTestimonialIdx % approvedTestimonials.length 
    : 0;

  const handlePrev = () => {
    if (approvedTestimonials.length === 0) return;
    setCurrentTestimonialIdx((prev) => (prev - 1 + approvedTestimonials.length) % approvedTestimonials.length);
  };

  const handleNext = () => {
    if (approvedTestimonials.length === 0) return;
    setCurrentTestimonialIdx((prev) => (prev + 1) % approvedTestimonials.length);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || !treatment.trim()) {
      alert("لطفاً تمامی فیلدها را پر کنید.");
      return;
    }

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          treatment: treatment.trim(),
          rating,
          comment: comment.trim(),
          avatarUrl: "/images/avatar-default.svg"
        })
      });

      if (!response.ok) {
        throw new Error("خطا در ثبت دیدگاه");
      }

      const createdReview = await response.json();
      setTestimonials(prev => [createdReview, ...prev]);
      setIsSuccess(true);
      
      // Reset Form
      setName("");
      setTreatment("");
      setRating(5);
      setComment("");

      setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("متأسفانه خطایی در ثبت دیدگاه رخ داد. لطفاً مجدداً تلاش کنید.");
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full" id="testimonials-faq-section" dir="rtl">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="testimonials-faq-bento">
        
        {/* Card A: Testimonial slider bento (Spans 5 Columns) */}
        <div 
          className="lg:col-span-5 bg-white border border-teal-100/50 p-8 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between relative overflow-hidden"
          id="testimonials-carousel-box"
        >
          {/* Background watermarked quote icon */}
          <div className="absolute top-6 left-6 text-teal-50/70 pointer-events-none scale-[3]" id="quote-bg-icon">
            <Smile className="w-16 h-16 opacity-35 text-teal-100" />
          </div>

          <div className="space-y-4 text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold border border-teal-100">تجربه رضایت واقعی بیماران</span>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <h3 className="text-xl font-extrabold text-slate-900">سخنان و دیدگاه‌های بیماران</h3>
              
              {/* Average Rating Badge */}
              <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-xl self-start">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-slate-800 font-mono">{averageRating}</span>
                <span className="text-[10px] text-slate-400 font-bold">({totalApproved} دیدگاه)</span>
              </div>
            </div>
          </div>

          {approvedTestimonials.length === 0 ? (
            <div className="text-center py-12 space-y-3" id="no-approved-reviews">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">دیدگاهی هنوز منتشر نشده است.</p>
            </div>
          ) : (
            <div className="relative text-right space-y-6 my-6" id="testimonial-slide">
              {/* Star ratings */}
              <div className="flex items-center gap-1 text-amber-400" id="testimonial-stars">
                {[...Array(approvedTestimonials[safeIdx].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>

              {/* Review Comment text */}
              <blockquote className="text-slate-700 text-sm sm:text-base font-bold leading-relaxed italic min-h-[80px]" id="testimonial-comment">
                « {approvedTestimonials[safeIdx].comment} »
              </blockquote>

              {/* Patient Info Row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100" id="testimonial-patient-row">
                <div className="flex items-center gap-3" id="patient-identity">
                  <img 
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-200 shrink-0" 
                    src={approvedTestimonials[safeIdx].avatarUrl || "/images/avatar-default.svg"} 
                    alt={approvedTestimonials[safeIdx].name} 
                    id="patient-avatar"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right" id="patient-text">
                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm" id="patient-name">{approvedTestimonials[safeIdx].name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5" id="patient-treatment">درمان: {approvedTestimonials[safeIdx].treatment}</p>
                  </div>
                </div>

                {/* Navigation selectors */}
                <div className="flex items-center gap-1.5" id="carousel-controls">
                  <button 
                    id="btn-prev-testimonial"
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    aria-label="قبلی"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    id="btn-next-testimonial"
                    onClick={handleNext}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    aria-label="بعدی"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Buttons Panel */}
          <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-slate-100 pt-4" id="testimonials-footer-row">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
              id="btn-add-review"
            >
              <Plus className="w-4 h-4" />
              <span>اشتراک‌گذاری تجربه درمان (ثبت نظر)</span>
            </button>
            
            <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-400 font-bold sm:mr-auto" id="testimonials-seal">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>پخش طبق اجازه‌نامه کتبی مراجعین</span>
            </div>
          </div>
        </div>

        {/* Card B: FAQ Accordions bento (Spans 7 Columns) */}
        <div 
          className="lg:col-span-7 bg-white/80 backdrop-blur-md border border-white/60 p-8 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between"
          id="faq-bento"
        >
          <div className="text-right space-y-2 mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold border border-teal-100">پاسخ سوالات شما اینجاست</span>
            <h3 className="text-xl font-extrabold text-slate-900">سوالات متداول مراجعین محترم</h3>
          </div>

          {/* Accordion List inside the bento */}
          <div className="space-y-3" id="faq-accordions-wrapper">
            {faqData.slice(0, 4).map((faq) => (
              <div 
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className="bg-white/85 border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  id={`faq-trigger-${faq.id}`}
                  onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-right font-bold text-slate-800 hover:text-teal-600 gap-4 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">{faq.question}</span>
                  <div className={`w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 transition-transform ${openFaqId === faq.id ? "rotate-180 bg-teal-50 text-teal-600" : ""}`} id={`faq-arrow-wrapper-${faq.id}`}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                <AnimatePresence>
                  {openFaqId === faq.id && (
                    <motion.div
                      id={`faq-panel-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 text-slate-500 text-xs sm:text-sm leading-relaxed border-t border-slate-50 bg-slate-50/50 font-medium" id={`faq-answer-${faq.id}`}>
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Quick Online Consultation banner inside Bento */}
          <div className="mt-5 bg-teal-50/50 rounded-2xl p-4 border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-4" id="faq-footer-help">
            <div className="flex items-center gap-3 text-right" id="faq-help-text-wrapper">
              <Info className="w-5 h-5 text-teal-600 shrink-0" />
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                آیا هنوز سوالی دارید؟ مشاوران ما در واتس‌اپ آماده راهنمایی هستند.
              </p>
            </div>
            <a 
              id="btn-faq-whatsapp"
              href="https://wa.me/989123456789" 
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba56] text-white font-bold text-xs shadow-md transition-colors"
            >
              واتس‌اپ دنت فلو
            </a>
          </div>

        </div>

      </div>

      {/* Review Submission Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="review-modal-overlay">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-2xl w-full max-w-md relative z-10 text-right space-y-6 max-h-[90vh] overflow-y-auto"
              id="review-modal"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 left-5 p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                id="btn-close-review-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100">
                  <Smile className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">ثبت دیدگاه و امتیاز مراجعین</h4>
                <p className="text-xs text-slate-400 font-bold">دیدگاه شما پس از بررسی و تایید مدیریت در سایت منتشر خواهد شد.</p>
              </div>

              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center space-y-3"
                  id="review-success-panel"
                >
                  <div className="w-12 h-12 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <h5 className="font-extrabold text-teal-800 text-sm">دیدگاه شما با موفقیت ثبت شد!</h5>
                  <p className="text-xs text-teal-600 font-semibold leading-relaxed">با سپاس از اینکه تجربه خود را با ما به اشتراک گذاشتید. نظر شما پس از تأیید مدیریت نمایش داده خواهد شد.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4" id="review-submission-form">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">نام و نام خانوادگی:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مانند: علی حسینی" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  {/* Treatment Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">نوع درمان / سرویس دریافت شده:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مانند: ایمپلنت دندان، لمینت، عصب‌کشی" 
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">امتیاز شما به خدمات:</label>
                    <div className="flex items-center gap-1.5 py-1 text-slate-200" id="rating-star-selectors">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = hoveredRating !== null 
                          ? starVal <= hoveredRating 
                          : starVal <= rating;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoveredRating(starVal)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="p-1 transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Star className={`w-7 h-7 transition-colors ${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          </button>
                        );
                      })}
                      <span className="text-xs font-black text-slate-500 mr-2 font-mono">{rating} از ۵</span>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">متن دیدگاه شما:</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="جزئیات تجربه درمانی خود، میزان رضایت از دندانپزشک، بهداشت محیط و اخلاق کادر درمانی را بنویسید..." 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none focus:border-teal-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-teal-600/15 cursor-pointer mt-2"
                  >
                    ثبت و ارسال دیدگاه جهت تایید
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
