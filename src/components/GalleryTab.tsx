import React, { useState, useEffect } from "react";
import { Image, Upload, CheckCircle2, AlertCircle, Loader2, Sparkles, Smile } from "lucide-react";
import { motion } from "motion/react";
import { smileCases as defaultSmileCases, SmileCase } from "../data";

interface GalleryTabProps {
  clinicConfig: any;
  setClinicConfig: (val: any) => void;
  adminToken: string | null;
}

export default function GalleryTab({
  clinicConfig,
  setClinicConfig,
  adminToken
}: GalleryTabProps) {
  // Load initial cases from clinicConfig or fallback to defaults
  const [cases, setCases] = useState<SmileCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  useEffect(() => {
    if (clinicConfig && Array.isArray(clinicConfig.smileCases)) {
      setCases(clinicConfig.smileCases);
    } else {
      setCases(defaultSmileCases);
    }
  }, [clinicConfig]);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  const handleFieldChange = (field: keyof SmileCase, value: any) => {
    if (!activeCase) return;
    const updated = cases.map(c => {
      if (c.id === selectedCaseId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setCases(updated);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageType: "before" | "after") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus({
        type: "error",
        text: "حجم فایل تصویر نباید بیشتر از ۵ مگابایت باشد."
      });
      return;
    }

    if (imageType === "before") {
      setUploadingBefore(true);
    } else {
      setUploadingAfter(true);
    }
    setSaveStatus(null);

    try {
      // Read file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              file: base64String,
              fileName: file.name
            })
          });

          const data = await response.json();
          if (!response.ok || !data.url) {
            throw new Error(data.error || "خطا در آپلود عکس");
          }

          // Update active case image URL
          const urlField = imageType === "before" ? "beforeUrl" : "afterUrl";
          handleFieldChange(urlField, data.url);
          
          setSaveStatus({
            type: "success",
            text: `تصویر "${imageType === "before" ? "قبل از درمان" : "بعد از درمان"}" با موفقیت آپلود شد.`
          });
        } catch (err: any) {
          setSaveStatus({
            type: "error",
            text: err.message || "آپلود تصویر با خطا مواجه شد. لطفاً دوباره تلاش کنید."
          });
        } finally {
          if (imageType === "before") {
            setUploadingBefore(false);
          } else {
            setUploadingAfter(false);
          }
        }
      };

      reader.onerror = () => {
        setSaveStatus({
          type: "error",
          text: "خطا در خواندن فایل تصویر."
        });
        if (imageType === "before") {
          setUploadingBefore(false);
        } else {
          setUploadingAfter(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setSaveStatus({
        type: "error",
        text: "پردازش فایل تصویر با خطا مواجه شد."
      });
      if (imageType === "before") {
        setUploadingBefore(false);
      } else {
        setUploadingAfter(false);
      }
    }
  };

  const handleSaveGallery = async () => {
    setSaveStatus(null);
    try {
      const updatedConfig = {
        ...clinicConfig,
        smileCases: cases
      };
      
      // Update local and trigger syncing to the server automatically via App.tsx sync hook
      setClinicConfig(updatedConfig);
      
      setSaveStatus({
        type: "success",
        text: "تمامی تغییرات گالری لبخند (قبل و بعد) با موفقیت ذخیره شد و در وب‌سایت اعمال گردید!"
      });
    } catch (err) {
      setSaveStatus({
        type: "error",
        text: "ذخیره‌سازی تغییرات با خطا مواجه شد."
      });
    }
  };

  if (!activeCase) return null;

  return (
    <div className="space-y-6 text-right" id="gallery-settings-tab">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 justify-end">
            <span>مدیریت گالری تصاویر نمونه‌کارها (قبل و بعد)</span>
            <Image className="w-5 h-5 text-teal-600" />
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            تصاویر قبل و بعد، عنوان و توضیحات هر یک از طرح‌های درمان لبخند را در این بخش آپلود و مدیریت کنید.
          </p>
        </div>
      </div>

      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 justify-end ${
            saveStatus.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span className="text-sm font-bold">{saveStatus.text}</span>
          {saveStatus.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
        </motion.div>
      )}

      {/* Case Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCaseId(c.id);
              setSaveStatus(null);
            }}
            className={`px-4 py-3.5 rounded-2xl text-xs font-extrabold border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
              selectedCaseId === c.id
                ? "bg-teal-50 border-teal-500 text-teal-800 shadow-sm"
                : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Smile className={`w-4 h-4 ${selectedCaseId === c.id ? "text-teal-600" : "text-slate-400"}`} />
            <span className="line-clamp-1">{c.title.split(" با ")[1] || c.title}</span>
          </button>
        ))}
      </div>

      {/* Case Edit Fields */}
      <div className="bg-slate-50/60 rounded-3xl p-6 border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700">عنوان نمونه‌کار:</label>
            <input
              type="text"
              value={activeCase.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700">دسته‌بندی درمان:</label>
            <input
              type="text"
              value={activeCase.category}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-100/80 text-sm text-right text-slate-400 font-bold select-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700">توضیحات و شرح بیمار:</label>
          <textarea
            value={activeCase.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
          />
        </div>

        {/* Upload Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Before Image */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-600">تصویر قبل از درمان:</h4>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] bg-white transition-all overflow-hidden group">
              {activeCase.beforeUrl ? (
                <>
                  <img
                    src={activeCase.beforeUrl}
                    alt="Before"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <label className="cursor-pointer px-4 py-2 bg-white/95 text-slate-800 text-xs font-extrabold rounded-xl shadow-md hover:bg-white flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>تغییر تصویر قبل</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleFileUpload(e, "before")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full h-full">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-slate-700">کلیک کنید یا فایل را بکشید</p>
                    <p className="text-[10px] text-slate-400 mt-1">فرمت‌های JPG، PNG، WEBP (حداکثر ۵ مگابایت)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleFileUpload(e, "before")}
                    className="hidden"
                  />
                </label>
              )}

              {uploadingBefore && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  <span className="text-xs font-extrabold text-slate-600 mt-2">درحال آپلود تصویر قبل...</span>
                </div>
              )}
            </div>
          </div>

          {/* After Image */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-600">تصویر بعد از درمان:</h4>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] bg-white transition-all overflow-hidden group">
              {activeCase.afterUrl ? (
                <>
                  <img
                    src={activeCase.afterUrl}
                    alt="After"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <label className="cursor-pointer px-4 py-2 bg-white/95 text-slate-800 text-xs font-extrabold rounded-xl shadow-md hover:bg-white flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>تغییر تصویر بعد</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleFileUpload(e, "after")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full h-full">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-slate-700">کلیک کنید یا فایل را بکشید</p>
                    <p className="text-[10px] text-slate-400 mt-1">فرمت‌های JPG، PNG، WEBP (حداکثر ۵ مگابایت)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleFileUpload(e, "after")}
                    className="hidden"
                  />
                </label>
              )}

              {uploadingAfter && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  <span className="text-xs font-extrabold text-slate-600 mt-2">درحال آپلود تصویر بعد...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => void handleSaveGallery()}
          className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ذخیره تغییرات گالری لبخند</span>
        </button>
      </div>
    </div>
  );
}
