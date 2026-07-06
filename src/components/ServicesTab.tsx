import React, { useState } from "react";
import { 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  PlusCircle, 
  X, 
  ShieldCheck, 
  Activity, 
  Smile, 
  Baby, 
  Zap, 
  Scissors, 
  Award, 
  HeartHandshake, 
  Stethoscope,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
  details: string[];
  priceEst: string;
}

interface ServicesTabProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const AVAILABLE_ICONS = [
  { name: "ShieldCheck", label: "سپر ایمنی (ایمپلنت)", icon: ShieldCheck },
  { name: "Sparkles", label: "درخشش (زیبایی)", icon: Sparkles },
  { name: "Activity", label: "فعالیت/براکت (ارتودنسی)", icon: Activity },
  { name: "Smile", label: "لبخند (ترمیم/لمینت)", icon: Smile },
  { name: "Baby", label: "کودک (اطفال)", icon: Baby },
  { name: "Zap", label: "جرقه/لیزر (فوری)", icon: Zap },
  { name: "Scissors", label: "قیچی/جراحی (جراحی)", icon: Scissors },
  { name: "Award", label: "نشان کیفیت (VIP)", icon: Award },
  { name: "HeartHandshake", label: "همکاری صمیمانه (مشاوره)", icon: HeartHandshake },
  { name: "Stethoscope", label: "گوشی پزشکی (عمومی)", icon: Stethoscope },
];

export default function ServicesTab({ services, setServices }: ServicesTabProps) {
  // Feedback Status state
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Service addition form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newService, setNewService] = useState({
    id: "",
    title: "",
    priceEst: "",
    description: "",
    iconName: "ShieldCheck",
    details: [""]
  });

  // Action feedback trigger helper
  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Add detail to new service form
  const addDetailToNewService = () => {
    setNewService(prev => ({
      ...prev,
      details: [...prev.details, ""]
    }));
  };

  // Remove detail from new service form
  const removeDetailFromNewService = (idx: number) => {
    setNewService(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx)
    }));
  };

  // Handle saving all current services state to local storage
  const handleSaveAll = () => {
    try {
      localStorage.setItem("df_services", JSON.stringify(services));
      showFeedback("تمامی تغییرات و تعرفه‌های خدمات با موفقیت ذخیره شدند و در سراسر سایت اعمال گردیدند.", "success");
    } catch (err) {
      showFeedback("خطا در ذخیره تغییرات دیتابیس خدمات.", "error");
    }
  };

  // Create & Insert new service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.id.trim()) {
      showFeedback("لطفاً یک شناسه انگلیسی یکتا وارد کنید. (مثال: scaling)", "error");
      return;
    }
    if (!newService.title.trim()) {
      showFeedback("لطفاً عنوان خدمت را وارد کنید.", "error");
      return;
    }

    // Check duplicate ID
    const cleanId = newService.id.trim().toLowerCase();
    if (services.some(s => s.id === cleanId)) {
      showFeedback("این شناسه قبلاً ثبت شده است. شناسه دیگری انتخاب کنید.", "error");
      return;
    }

    // Clean details
    const finalDetails = newService.details.map(d => d.trim()).filter(d => d.length > 0);
    if (finalDetails.length === 0) {
      finalDetails.push("مشاوره و معاینه تخصصی");
    }

    const created: Service = {
      id: cleanId,
      title: newService.title.trim(),
      priceEst: newService.priceEst.trim() || "تماس بگیرید",
      description: newService.description.trim() || "توضیحاتی برای این خدمت ثبت نشده است.",
      iconName: newService.iconName,
      details: finalDetails
    };

    const updated = [...services, created];
    setServices(updated);
    localStorage.setItem("df_services", JSON.stringify(updated));

    // Reset Form
    setNewService({
      id: "",
      title: "",
      priceEst: "",
      description: "",
      iconName: "ShieldCheck",
      details: [""]
    });
    setIsAddingNew(false);
    showFeedback(`خدمت جدید «${created.title}» با موفقیت به لیست خدمات اضافه شد.`, "success");
  };

  // Delete service confirmation
  const handleDeleteService = (id: string, title: string) => {
    const isConfirmed = window.confirm(`آیا از حذف خدمت «${title}» مطمئن هستید؟ این تغییر بلافاصله در سایت و پنل مراجعین اعمال خواهد شد.`);
    if (!isConfirmed) return;

    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    localStorage.setItem("df_services", JSON.stringify(updated));
    showFeedback(`خدمت «${title}» با موفقیت حذف گردید.`, "success");
  };

  // Add detail item to an existing service
  const addDetailToExistingService = (sIdx: number) => {
    const updated = [...services];
    updated[sIdx].details.push("");
    setServices(updated);
  };

  // Remove detail item from an existing service
  const removeDetailFromExistingService = (sIdx: number, dIdx: number) => {
    const updated = [...services];
    updated[sIdx].details = updated[sIdx].details.filter((_, idx) => idx !== dIdx);
    setServices(updated);
  };

  return (
    <div className="space-y-8 text-right" id="services-editor-tab" dir="rtl">
      {/* 1. Header with Description */}
      <div className="bg-gradient-to-l from-teal-50 to-emerald-50/50 border border-teal-100 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-teal-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
            <span>مدیریت هوشمند خدمات و تعرفه‌ها</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-3xl">
            در این بخش می‌توانید کاتالوگ خدمات کلینیک دنت فلو را ویرایش، حذف یا غنی‌تر کنید. هرگونه تغییر در عنوان، قیمت، ویژگی‌ها یا آیکون خدمات بلافاصله در وب‌سایت اصلی مراجعین، فرم‌های رزرو نوبت و چت‌بات مجهز به هوش مصنوعی اعمال می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer ${
              isAddingNew 
                ? "bg-slate-800 hover:bg-slate-900 text-white" 
                : "bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/10"
            }`}
          >
            {isAddingNew ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAddingNew ? "انصراف و بازگشت" : "افزودن خدمت جدید"}</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-md shadow-emerald-600/15 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره نهایی کل تغییرات</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div 
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-extrabold shadow-md border animate-fade-in ${
            feedback.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. Embedded Form to Add a New Service */}
      {isAddingNew && (
        <form onSubmit={handleCreateService} className="bg-white border-2 border-dashed border-teal-200 p-6 sm:p-8 rounded-[28px] space-y-6 shadow-xl shadow-teal-900/5 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              <span>ایجاد دسته خدمت درمانی یا زیبایی جدید</span>
            </h4>
            <p className="text-slate-400 text-xs font-bold mt-1">اطلاعات پایه خدمت جدید را جهت نمایش در کاتالوگ و وب‌سایت وارد کنید.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">شناسه یکتا دیتابیس (انگلیسی و بدون فاصله):</label>
              <input
                type="text"
                placeholder="مثال: root-canal"
                value={newService.id}
                onChange={(e) => setNewService(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono font-bold text-slate-800 placeholder:font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">عنوان خدمت (فارسی):</label>
              <input
                type="text"
                placeholder="مثال: درمان ریشه (عصب‌کشی)"
                value={newService.title}
                onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-extrabold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">تعرفه پایه / شروع از:</label>
              <input
                type="text"
                placeholder="مثال: شروع از ۳,۲۰۰,۰۰۰ تومان"
                value={newService.priceEst}
                onChange={(e) => setNewService(prev => ({ ...prev, priceEst: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-extrabold text-teal-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 block">توضیح کوتاه و ترغیب‌کننده برای مراجعین:</label>
            <textarea
              placeholder="توضیح مختصری بنویسید که بیمار متوجه کیفیت، تجهیزات یا مواد مصرفی این درمان در کلینیک شما شود..."
              value={newService.description}
              onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium text-slate-600"
            />
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">انتخاب نماد تصویری (آیکون خدمت):</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {AVAILABLE_ICONS.map(ic => {
                const IconComponent = ic.icon;
                const isSelected = newService.iconName === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setNewService(prev => ({ ...prev, iconName: ic.name }))}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-right transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-teal-50 border-teal-500 text-teal-700 font-extrabold shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                    <span className="text-[10px] sm:text-xs leading-none">{ic.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Details block for New Service */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 block">لیست جزئیات، ویژگی‌ها و مزایای درمان:</label>
              <button
                type="button"
                onClick={addDetailToNewService}
                className="text-xs text-teal-600 hover:text-teal-700 font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>افزودن سطر ویژگی</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {newService.details.map((det, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder="مثال: استفاده از دستگاه دیجیتال روتاری رتک بدون صدا"
                    value={det}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewService(prev => {
                        const copy = [...prev.details];
                        copy[idx] = val;
                        return { ...prev, details: copy };
                      });
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                  />
                  {newService.details.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDetailFromNewService(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-teal-600/10 cursor-pointer"
            >
              ثبت نهایی و انتشار خدمت جدید
            </button>
          </div>
        </form>
      )}

      {/* 3. Main Services Cards Grid (Editable with highly functional fields) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="services-cards-grid">
        {services.map((srv, sIdx) => {
          // Find icon helper
          const matchedIcon = AVAILABLE_ICONS.find(ic => ic.name === srv.iconName);
          const IconComponent = matchedIcon ? matchedIcon.icon : Stethoscope;

          return (
            <div 
              key={srv.id} 
              className="bg-white border border-slate-150/80 p-6 rounded-[28px] shadow-xl shadow-teal-950/5 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-300 relative flex flex-col justify-between gap-6"
            >
              {/* Card top banner */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-100/40 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{srv.title || "خدمت بدون عنوان"}</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID: {srv.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteService(srv.id, srv.title)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-100 flex items-center justify-center"
                  title="حذف خدمت"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Edit Fields */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-extrabold block">عنوان خدمت:</label>
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...services];
                        updated[sIdx].title = val;
                        setServices(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-extrabold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-extrabold block">تعرفه / قیمت حدودی:</label>
                    <input
                      type="text"
                      value={srv.priceEst}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...services];
                        updated[sIdx].priceEst = val;
                        setServices(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-extrabold text-teal-600"
                    />
                  </div>
                </div>

                {/* Change Icon Row */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-extrabold block">تغییر آیکون خدمت:</label>
                  <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {AVAILABLE_ICONS.map(ic => {
                      const isSelected = srv.iconName === ic.name;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => {
                            const updated = [...services];
                            updated[sIdx].iconName = ic.name;
                            setServices(updated);
                          }}
                          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                            isSelected 
                              ? "bg-teal-600 text-white border-teal-600" 
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                          title={ic.label}
                        >
                          {React.createElement(ic.icon, { className: "w-4 h-4" })}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-extrabold block">توضیح کوتاه و جذاب:</label>
                  <textarea
                    value={srv.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = [...services];
                      updated[sIdx].description = val;
                      setServices(updated);
                    }}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-medium text-slate-600 resize-none leading-relaxed"
                  />
                </div>

                {/* Dynamic details for existing services */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-extrabold block">جزئیات و ویژگی‌های خدمت:</label>
                    <button
                      type="button"
                      onClick={() => addDetailToExistingService(sIdx)}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>افزودن جزئیات</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                    {srv.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"></span>
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...services];
                            updated[sIdx].details[dIdx] = val;
                            setServices(updated);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50/50 font-semibold text-slate-700 focus:bg-white"
                        />
                        {srv.details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDetailFromExistingService(sIdx, dIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="حذف ویژگی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save changes specific card button */}
              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("df_services", JSON.stringify(services));
                    showFeedback(`تغییرات خدمت درمانی «${srv.title}» با موفقیت ثبت و ذخیره شد.`, "success");
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-teal-100"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات خدمت درمانی فوق</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
