import React, { useState } from "react";
import { Star, Check, X, Trash2, MessageSquare, AlertCircle } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  treatment: string;
  rating: number;
  comment: string;
  avatarUrl: string;
  status: "approved" | "pending";
}

interface ReviewsTabProps {
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
}

export default function ReviewsTab({ testimonials, setTestimonials }: ReviewsTabProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const handleApprove = (id: number) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: "approved" } : t));
  };

  const handleReject = (id: number) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: "pending" } : t));
  };

  const handleDelete = (id: number) => {
    if (window.confirm("آیا از حذف این دیدگاه مطمئن هستید؟")) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
    }
  };

  const approvedReviews = testimonials.filter(t => t.status === "approved");
  const pendingReviews = testimonials.filter(t => t.status === "pending");

  const averageRating = approvedReviews.length > 0 
    ? (approvedReviews.reduce((sum, t) => sum + t.rating, 0) / approvedReviews.length).toFixed(1)
    : "0.0";

  const filteredTestimonials = testimonials.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-6 text-right" id="reviews-tab-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">مدیریت دیدگاه‌ها و نظرات بیماران</h3>
          <p className="text-slate-500 text-xs font-semibold">دیدگاه‌های ارسالی بیماران را بررسی، تایید یا حذف کنید</p>
        </div>
        
        {/* Quick Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl" id="review-filters">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === "all" ? "bg-white text-teal-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            همه ({testimonials.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === "pending" ? "bg-white text-amber-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            در انتظار تایید ({pendingReviews.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === "approved" ? "bg-white text-teal-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            تایید شده ({approvedReviews.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="reviews-stats-grid">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-slate-500 font-bold">کل نظرات ارسالی</span>
          <span className="text-2xl font-black text-slate-800 mt-1 font-mono">{testimonials.length}</span>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-amber-700 font-bold">در انتظار بررسی</span>
          <span className="text-2xl font-black text-amber-600 mt-1 font-mono">{pendingReviews.length}</span>
        </div>
        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-teal-700 font-bold">نظرات تایید شده</span>
          <span className="text-2xl font-black text-teal-600 mt-1 font-mono">{approvedReviews.length}</span>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-amber-800 font-bold">میانگین امتیاز تایید شده</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-2xl font-black text-slate-800 font-mono">{averageRating}</span>
            <span className="text-xs text-slate-400 font-bold">/ ۵</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredTestimonials.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50" id="no-reviews-placeholder">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">هیچ دیدگاهی در این بخش یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-4" id="reviews-list-wrapper">
          {filteredTestimonials.map((t) => (
            <div 
              key={t.id} 
              className={`p-5 rounded-2xl border transition-all ${t.status === "pending" ? "bg-amber-50/30 border-amber-100" : "bg-white border-slate-100 shadow-sm"}`}
              id={`review-item-${t.id}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                    src={t.avatarUrl || "/images/avatar-default.svg"} 
                    alt={t.name} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{t.name}</span>
                      {t.status === "pending" && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          در انتظار تایید
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">درمان: {t.treatment || "نامشخص"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Rating display */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        className={`w-4 h-4 ${idx < t.rating ? "fill-current" : "text-slate-200"}`} 
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {t.status === "pending" ? (
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                        title="تایید و نمایش در سایت"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تایید</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReject(t.id)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 transition-all text-xs font-bold flex items-center gap-1"
                        title="تغییر وضعیت به در انتظار تایید"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">لغو تایید</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                      title="حذف دیدگاه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-slate-700 text-xs sm:text-sm leading-relaxed font-semibold bg-slate-50/50 p-3 rounded-xl border border-slate-50/80">
                « {t.comment} »
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
