import React, { useState } from "react";
import { toast } from "../lib/toast";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Edit3, Check, X, Trash2, Save, RefreshCw, Mail } from "lucide-react";

interface Booking {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceId: string;
  date: string;
  timeSlot: "morning" | "afternoon";
  notes?: string;
  status: "pending" | "approved" | "cancelled";
  createdAt: string;
  adminComment?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
  details: string[];
  priceEst: string;
}

interface BookingsTabProps {
  useLocalDb: boolean;
  setUseLocalDb: (val: boolean) => void;
  adminStats: {
    total: number;
    pending: number;
    approved: number;
    cancelled: number;
  };
  adminFilter: string;
  setAdminFilter: (val: string) => void;
  filteredBookings: Booking[];
  services: Service[];
  updateBookingStatus: (id: string, status: "pending" | "approved" | "cancelled") => void;
  updateBookingDetails: (id: string, details: { date: string; timeSlot: "morning" | "afternoon"; adminComment: string }) => void;
  deleteBooking: (id: string) => void;
  refreshBookings: () => void;
  adminToken: string | null;
  clinicConfig: any;
}

export default function BookingsTab({
  useLocalDb,
  setUseLocalDb,
  adminStats,
  adminFilter,
  setAdminFilter,
  filteredBookings,
  services,
  updateBookingStatus,
  updateBookingDetails,
  deleteBooking,
  refreshBookings,
  adminToken,
  clinicConfig
}: BookingsTabProps) {
  // Editing state local to BookingsTab
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState<"morning" | "afternoon">("morning");
  const [editAdminComment, setEditAdminComment] = useState("");

  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const getServiceTitle = (srvId: string) => {
    return services.find((s) => s.id === srvId)?.title || srvId;
  };

  const sendCustomEmail = async (booking: Booking) => {
    if (!booking.email) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          to: booking.email,
          subject: emailSubject,
          body: `<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; line-height: 1.6; padding: 20px;">
                  <h2>سلام ${booking.fullName} عزیز،</h2>
                  <p>${emailBody.replace(/\n/g, '<br/>')}</p>
                  <hr style="border: 1px solid #eee; margin: 20px 0;"/>
                  <p style="font-size: 12px; color: #777;">با تشکر،<br/>کلینیک دنت فلو</p>
                </div>`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("ایمیل با موفقیت ارسال شد.");
        setActiveEmailId(null);
        setEmailSubject("");
        setEmailBody("");
      } else {
        toast.error(data.error || "خطا در ارسال ایمیل.");
      }
    } catch (err) {
      toast.error("خطا در برقراری ارتباط با سرور.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="space-y-8" id="tab-bookings-content">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-stats-grid">
        <div className="bg-[#F8FCFC] border border-slate-100 p-5 rounded-2xl flex flex-col justify-between" id="stat-total">
          <span className="text-xs font-bold text-slate-500">کل نوبت‌های ثبت شده</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 font-mono">{adminStats.total}</span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-between" id="stat-pending">
          <span className="text-xs font-bold text-amber-700">در انتظار بررسی پذیرش</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">{adminStats.pending}</span>
        </div>

        <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex flex-col justify-between" id="stat-approved">
          <span className="text-xs font-bold text-teal-700">تایید نهایی شده</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-600 mt-2 font-mono">{adminStats.approved}</span>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl flex flex-col justify-between" id="stat-cancelled">
          <span className="text-xs font-bold text-rose-700">لغو شده یا عدم پاسخ</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 mt-2 font-mono">{adminStats.cancelled}</span>
        </div>
      </div>

      {/* Filter controls and count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2" id="admin-filters">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" id="admin-filter-buttons">
          {[
            { value: "all", label: "همه نوبت‌ها" },
            { value: "pending", label: "در انتظار بررسی" },
            { value: "approved", label: "تایید شده" },
            { value: "cancelled", label: "لغو شده" }
          ].map((f) => (
            <button
              key={f.value}
              id={`filter-btn-${f.value}`}
              onClick={() => setAdminFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                adminFilter === f.value 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/15" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
          
          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={refreshBookings}
            className="px-4 py-2 rounded-xl text-xs font-black bg-teal-50/50 hover:bg-teal-100 text-teal-700 border border-teal-200/50 transition-all cursor-pointer flex items-center gap-1.5"
            title="به‌روزرسانی زنده نوبت‌ها از سرور"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>به‌روزرسانی</span>
          </button>
        </div>
        <span className="text-xs font-bold text-slate-400 shrink-0 self-end sm:self-auto" id="filtered-count">
          تعداد موارد یافته شده: {filteredBookings.length} مورد
        </span>
      </div>

      {/* Live Bookings Table / Cards */}
      <div className="space-y-4" id="admin-bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="empty-bookings">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-500">هیچ درخواستی در این دسته‌بندی یافت نشد.</p>
            <p className="text-xs text-slate-400 mt-1">مراجعین جدید به صورت زنده در این جدول ظاهر خواهند شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4" id="bookings-grid-list">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map((b) => (
                <motion.div
                  key={b.id}
                  id={`admin-booking-row-${b.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-2xl border transition-all ${
                    b.status === "approved" 
                      ? "bg-teal-50/20 border-teal-100" 
                      : b.status === "cancelled"
                      ? "bg-rose-50/10 border-rose-100/50"
                      : "bg-white border-slate-100 shadow-md shadow-teal-950/5 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4" id={`row-layout-${b.id}`}>
                    
                    {/* Main info */}
                    <div className="space-y-3 flex-1" id={`row-info-${b.id}`}>
                      <div className="flex flex-wrap items-center gap-2" id={`row-badge-row-${b.id}`}>
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">{b.id}</span>
                        
                        {b.status === "pending" && (
                          <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">در انتظار تماس پذیرش</span>
                        )}
                        {b.status === "approved" && (
                          <span className="text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg">تایید و رزرو قطعی</span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">لغو شده</span>
                        )}

                        <span className="text-[10px] text-slate-400 font-bold" dir="ltr">
                          {new Date(b.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm" id={`row-details-${b.id}`}>
                        <div>
                          <span className="text-slate-400 font-bold block text-[11px]">بیمار:</span>
                          <span className="font-extrabold text-slate-900 block mt-0.5">{b.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[11px]">شماره تماس:</span>
                          <a href={`tel:${b.phone}`} className="font-bold text-teal-600 hover:underline block mt-0.5 font-mono text-right" dir="ltr">{b.phone}</a>
                        </div>
                        {b.email && (
                          <div className="lg:col-span-1">
                            <span className="text-slate-400 font-bold block text-[11px]">ایمیل:</span>
                            <span className="font-bold text-slate-700 block mt-0.5 font-mono text-[11px] truncate" dir="ltr" title={b.email}>{b.email}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 font-bold block text-[11px]">خدمت مورد نظر:</span>
                          <span className="font-semibold text-slate-700 block mt-0.5">{getServiceTitle(b.serviceId)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[11px]">تاریخ و شیفت:</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{b.date} ({b.timeSlot === "morning" ? (clinicConfig?.shiftMorningName || "شیفت صبح") : (clinicConfig?.shiftAfternoonName || "شیفت عصر")})</span>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100 font-semibold mt-2" id={`row-notes-${b.id}`}>
                          <span className="font-extrabold text-slate-900 ml-1">توضیحات بیمار:</span>
                          {b.notes}
                        </div>
                      )}

                      {b.adminComment && (
                        <div className="bg-teal-50/40 p-3 rounded-xl text-xs text-slate-700 border border-teal-100 font-semibold mt-2" id={`row-admin-comment-${b.id}`}>
                          <span className="font-extrabold text-teal-800 ml-1">توضیحات و پاسخ مطب:</span>
                          {b.adminComment}
                        </div>
                      )}
                    </div>

                    {/* Quick Admin Actions */}
                    <div className="flex flex-row lg:flex-col items-center justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100" id={`row-actions-${b.id}`}>
                      
                      <div className="flex flex-wrap gap-2 w-full justify-end" id={`action-btn-group-${b.id}`}>
                        <button
                          id={`btn-edit-trigger-${b.id}`}
                          onClick={() => {
                            setActiveEditingId(b.id);
                            setEditDate(b.date);
                            setEditTimeSlot(b.timeSlot);
                            setEditAdminComment(b.adminComment || "");
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>ویرایش نوبت</span>
                        </button>

                        {b.email && (
                          <button
                            id={`btn-email-trigger-${b.id}`}
                            onClick={() => setActiveEmailId(b.id)}
                            className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs transition-colors flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>ارسال ایمیل</span>
                          </button>
                        )}

                        {b.status !== "approved" && (
                          <button
                            id={`btn-approve-${b.id}`}
                            onClick={() => updateBookingStatus(b.id, "approved")}
                            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تایید نوبت</span>
                          </button>
                        )}

                        {b.status !== "cancelled" && (
                          <button
                            id={`btn-cancel-${b.id}`}
                            onClick={() => updateBookingStatus(b.id, "cancelled")}
                            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-xs transition-colors flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>لغو نوبت</span>
                          </button>
                        )}

                        <button
                          id={`btn-delete-${b.id}`}
                          onClick={() => deleteBooking(b.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          aria-label="حذف نوبت"
                          title="حذف نوبت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>

                  {activeEditingId === b.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 pt-4 mt-4 text-right space-y-4"
                      id={`edit-panel-${b.id}`}
                    >
                      <div className="flex items-center gap-2 text-teal-600 font-extrabold text-xs">
                        <Edit3 className="w-4 h-4" />
                        <span>ویرایش اطلاعات، تاریخ، زمان و پیام تایید مطب دنت فلو</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">تاریخ تایید شده نهایی:</label>
                          <input 
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white text-slate-800 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">زمان/شیفت حضور مراجع:</label>
                          <select
                            value={editTimeSlot}
                            onChange={(e) => setEditTimeSlot(e.target.value as "morning" | "afternoon")}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-extrabold text-slate-800"
                          >
                            <option value="morning">{clinicConfig?.shiftMorningName || "شیفت صبح"}</option>
                            <option value="afternoon">{clinicConfig?.shiftAfternoonName || "شیفت عصر"}</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-slate-500 font-bold block">توضیحات مطب، ساعت حضور بیمار و توصیه‌های پزشک (پاسخ اختصاصی به بیمار):</label>
                        <textarea
                          value={editAdminComment}
                          onChange={(e) => setEditAdminComment(e.target.value)}
                          placeholder="مثال: نوبت شما برای ساعت ۱۱:۳۰ تایید شد. لطفاً یک ربع قبل از زمان مقرر با مدارک پزشکی خود تشریف بیاورید."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white resize-none text-slate-700 font-semibold"
                          rows={2.5}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveEditingId(null)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateBookingDetails(b.id, {
                              date: editDate,
                              timeSlot: editTimeSlot,
                              adminComment: editAdminComment
                            });
                            setActiveEditingId(null);
                          }}
                          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold cursor-pointer transition-colors shadow-md shadow-slate-800/10"
                        >
                          فقط ذخیره تغییرات
                        </button>
                        {b.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => {
                              updateBookingDetails(b.id, {
                                date: editDate,
                                timeSlot: editTimeSlot,
                                adminComment: editAdminComment
                              });
                              updateBookingStatus(b.id, "approved");
                              setActiveEditingId(null);
                            }}
                            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer transition-colors flex items-center gap-1 shadow-md shadow-teal-600/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ثبت تغییرات و تایید نهایی نوبت (ارسال ایمیل)</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeEmailId === b.id && b.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 pt-4 mt-4 text-right space-y-4"
                      id={`email-panel-${b.id}`}
                    >
                      <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs">
                        <Mail className="w-4 h-4" />
                        <span>ارسال ایمیل مستقیم به بیمار (فاکتور، نسخه، اطلاع‌رسانی)</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-slate-500 font-bold block">موضوع ایمیل:</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="مثال: فاکتور هزینه درمان - دنت فلو"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800 font-bold"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-slate-500 font-bold block">متن ایمیل:</label>
                        <textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="متن پیام خود را بنویسید..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white resize-none text-slate-700 font-semibold"
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2 justify-end text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveEmailId(null);
                            setEmailSubject("");
                            setEmailBody("");
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          disabled={emailSending || !emailSubject || !emailBody}
                          onClick={() => sendCustomEmail(b)}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer transition-colors flex items-center gap-1 shadow-md shadow-blue-600/10 disabled:opacity-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{emailSending ? "در حال ارسال..." : "ارسال پیام"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
