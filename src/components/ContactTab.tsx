import React, { useState } from "react";
import { MapPin, Save, Mail, Trash2, Check, CheckSquare, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";

interface ClinicConfig {
  doctorName: string;
  doctorTitle: string;
  phone: string;
  phoneRaw: string;
  telegram: string;
  workingHours: string;
  address: string;
  aboutDesc: string;
  installmentInfo: string;
  shiftMorningName?: string;
  shiftMorningCapacity?: number;
  shiftAfternoonName?: string;
  shiftAfternoonCapacity?: number;
}

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  status: "unread" | "read" | "replied";
}

interface ContactTabProps {
  clinicConfig: ClinicConfig;
  setClinicConfig: React.Dispatch<React.SetStateAction<ClinicConfig>>;
  messages: ContactMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  adminToken: string;
  fetchMessages?: () => Promise<void>;
}

export default function ContactTab({ 
  clinicConfig, 
  setClinicConfig,
  messages = [],
  setMessages,
  adminToken,
  fetchMessages
}: ContactTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"settings" | "messages">("messages");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const unreadCount = messages.filter(m => m.status === "unread").length;

  const handleUpdateStatus = async (id: string, newStatus: "unread" | "read" | "replied") => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updated = await response.json();
      setMessages(prev => prev.map(m => m.id === id ? updated : m));
    } catch (error) {
      console.error("Error updating message status:", error);
      alert("خطا در به‌روزرسانی وضعیت پیام.");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("آیا از حذف این پیام اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("خطا در حذف پیام.");
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (statusFilter === "all") return true;
    return msg.status === statusFilter;
  });

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6" id="contact-editor-tab">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("messages")}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "messages"
              ? "border-teal-600 text-teal-600 bg-teal-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>پیام‌های تماس مراجعین</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {unreadCount} جدید
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "settings"
              ? "border-teal-600 text-teal-600 bg-teal-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>ویرایش اطلاعات عمومی کلینیک</span>
        </button>
      </div>

      {activeSubTab === "messages" ? (
        <div className="space-y-4">
          <div className="bg-teal-50/30 border border-teal-100/50 p-5 rounded-2xl text-right">
            <h3 className="text-base font-extrabold text-teal-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              <span>صندوق پیام‌های دریافتی</span>
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
              در این بخش لیست کامل سوالات و پیام‌هایی که کاربران در صفحه اصلی کلینیک پر کرده‌اند را مشاهده و مدیریت می‌کنید.
            </p>
          </div>

          {/* Filters & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold">
            {fetchMessages && (
              <button
                onClick={async () => {
                  await fetchMessages();
                  alert("لیست پیام‌ها با موفقیت بروزرسانی شد.");
                }}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start font-black"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بروزرسانی زنده پیام‌ها</span>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              <span className="text-slate-500">فیلتر وضعیت:</span>
              {["all", "unread", "read", "replied"].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === filter
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {filter === "all" && `همه (${messages.length})`}
                  {filter === "unread" && `خوانده نشده (${messages.filter(m => m.status === "unread").length})`}
                  {filter === "read" && `خوانده شده (${messages.filter(m => m.status === "read").length})`}
                  {filter === "replied" && `پاسخ داده شده (${messages.filter(m => m.status === "replied").length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Messages list */}
          {filteredMessages.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-bold text-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              پیامی جهت نمایش پیدا نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`bg-white border rounded-2xl p-6 transition-all text-right shadow-sm hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    msg.status === "unread" 
                      ? "border-l-4 border-l-rose-500 border-slate-200" 
                      : msg.status === "read" 
                        ? "border-l-4 border-l-amber-500 border-slate-200"
                        : "border-l-4 border-l-teal-500 border-slate-200"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-slate-800 text-sm">{msg.name}</span>
                      <span className="font-mono font-bold text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {msg.phone}
                      </span>
                      <span className="text-slate-400 font-medium text-[10px]">{formatDate(msg.createdAt)}</span>
                      
                      {/* Status Badges */}
                      {msg.status === "unread" && (
                        <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                          خوانده نشده
                        </span>
                      )}
                      {msg.status === "read" && (
                        <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                          خوانده شده
                        </span>
                      )}
                      {msg.status === "replied" && (
                        <span className="bg-teal-50 text-teal-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                          پاسخ داده شده
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 mt-1">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {msg.status !== "read" && msg.status !== "replied" && (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, "read")}
                        title="علامت‌گذاری به عنوان خوانده شده"
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {msg.status !== "replied" && (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, "replied")}
                        title="پاسخ داده شد"
                        className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold px-3"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>ثبت پاسخ</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="حذف پیام"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl space-y-6 text-right">
          <div className="bg-teal-50/30 border border-teal-100/50 p-5 rounded-2xl text-right">
            <h3 className="text-base font-extrabold text-teal-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span>مدیریت اطلاعات تماس، آدرس و کادر کلینیک</span>
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
              در این بخش می‌توانید نشانی مطب، شماره‌های تلفن، پزشک ارشد، و توضیحات گالری و شرایط قسطی را به طور یکجا ادیت کنید. تغییرات بلافاصله در کل سایت، فرم‌ها، هدر، فوتر و چت‌بات اعمال می‌شوند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">نام پزشک ارشد کلینیک:</label>
              <input
                type="text"
                value={clinicConfig.doctorName}
                onChange={(e) => setClinicConfig({ ...clinicConfig, doctorName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-extrabold text-slate-800 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">تخصص و سوابق پزشک:</label>
              <input
                type="text"
                value={clinicConfig.doctorTitle}
                onChange={(e) => setClinicConfig({ ...clinicConfig, doctorTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-700 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">شماره تلفن‌های تماس (نمایشی):</label>
              <input
                type="text"
                value={clinicConfig.phone}
                onChange={(e) => setClinicConfig({ ...clinicConfig, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-black text-slate-800 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">لینک خام تماس (مثال: 02122000000 بدون فاصله یا خط تیره):</label>
              <input
                type="text"
                value={clinicConfig.phoneRaw}
                onChange={(e) => setClinicConfig({ ...clinicConfig, phoneRaw: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-mono font-bold text-slate-800 text-sm text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">شماره تلگرام / پیام‌رسان‌ها:</label>
              <input
                type="text"
                value={clinicConfig.telegram}
                onChange={(e) => setClinicConfig({ ...clinicConfig, telegram: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-black text-slate-800 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">ساعات کاری کلینیک:</label>
              <input
                type="text"
                value={clinicConfig.workingHours}
                onChange={(e) => setClinicConfig({ ...clinicConfig, workingHours: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-700 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-500 font-bold block">آدرس دقیق فیزیکی مطب:</label>
            <input
              type="text"
              value={clinicConfig.address}
              onChange={(e) => setClinicConfig({ ...clinicConfig, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-extrabold text-slate-800 text-sm"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-500 font-bold block">توضیحات بخش «درباره دنت فلو»:</label>
            <textarea
              value={clinicConfig.aboutDesc}
              onChange={(e) => setClinicConfig({ ...clinicConfig, aboutDesc: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-semibold text-slate-600 text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-500 font-bold block">شرایط پرداخت اقساطی مراجعین:</label>
            <textarea
              value={clinicConfig.installmentInfo}
              onChange={(e) => setClinicConfig({ ...clinicConfig, installmentInfo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-700 text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="pt-4 pb-2 border-b border-slate-100 flex items-center gap-2 text-indigo-700">
            <CheckSquare className="w-5 h-5" />
            <h4 className="font-extrabold text-sm">تنظیمات نوبت‌دهی و شیفت‌ها</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">نام شیفت اول (مثلاً: شیفت صبح):</label>
              <input
                type="text"
                value={clinicConfig.shiftMorningName || "شیفت صبح"}
                onChange={(e) => setClinicConfig({ ...clinicConfig, shiftMorningName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-700 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">ظرفیت پذیرش شیفت اول (نفر در روز):</label>
              <input
                type="number"
                value={clinicConfig.shiftMorningCapacity || 10}
                onChange={(e) => setClinicConfig({ ...clinicConfig, shiftMorningCapacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-800 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">نام شیفت دوم (مثلاً: شیفت عصر):</label>
              <input
                type="text"
                value={clinicConfig.shiftAfternoonName || "شیفت عصر"}
                onChange={(e) => setClinicConfig({ ...clinicConfig, shiftAfternoonName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-700 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">ظرفیت پذیرش شیفت دوم (نفر در روز):</label>
              <input
                type="number"
                value={clinicConfig.shiftAfternoonCapacity || 10}
                onChange={(e) => setClinicConfig({ ...clinicConfig, shiftAfternoonCapacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                localStorage.setItem("df_clinic_config", JSON.stringify(clinicConfig));
                alert("اطلاعات عمومی کلینیک و پزشک با موفقیت ذخیره شد و در تمامی بخش‌ها و چت‌بات اعمال گردید.");
              }}
              className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-teal-600/15 cursor-pointer border-none"
            >
              <Save className="w-4 h-4" />
              <span>ثبت و ذخیره سراسری تنظیمات کلینیک</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
