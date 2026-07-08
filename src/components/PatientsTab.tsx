import React, { useState } from "react";
import { 
  FolderHeart, 
  Search, 
  Plus, 
  Stethoscope, 
  Sliders, 
  FileText, 
  CheckSquare, 
  PlusCircle, 
  Save,
  Camera,
  UploadCloud,
  Trash2,
  Image,
  Mail,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientsTabProps {
  patients: any[];
  setPatients: React.Dispatch<React.SetStateAction<any[]>>;
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  isAddingPatient: boolean;
  setIsAddingPatient: (val: boolean) => void;
  newPatientForm: any;
  setNewPatientForm: React.Dispatch<React.SetStateAction<any>>;
  activeToothNum: number | null;
  setActiveToothNum: (num: number | null) => void;
  isAddingPrescription: boolean;
  setIsAddingPrescription: (val: boolean) => void;
  rxDiagnosis: string;
  setRxDiagnosis: (val: string) => void;
  rxDrugs: any[];
  setRxDrugs: React.Dispatch<React.SetStateAction<any[]>>;
  newDrug: any;
  setNewDrug: React.Dispatch<React.SetStateAction<any>>;
  newPlanTitle: string;
  setNewPlanTitle: (val: string) => void;
  newPlanCost: string;
  setNewPlanCost: (val: string) => void;
  patientsSearch: string;
  setPatientsSearch: (val: string) => void;
  clinicConfig: any;
  adminToken: string | null;
}

export default function PatientsTab({
  patients,
  setPatients,
  selectedPatientId,
  setSelectedPatientId,
  isAddingPatient,
  setIsAddingPatient,
  newPatientForm,
  setNewPatientForm,
  activeToothNum,
  setActiveToothNum,
  isAddingPrescription,
  setIsAddingPrescription,
  rxDiagnosis,
  setRxDiagnosis,
  rxDrugs,
  setRxDrugs,
  newDrug,
  setNewDrug,
  newPlanTitle,
  setNewPlanTitle,
  newPlanCost,
  setNewPlanCost,
  patientsSearch,
  setPatientsSearch,
  clinicConfig,
  adminToken,
}: PatientsTabProps) {
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const urlInput = document.getElementById("new-photo-url") as HTMLInputElement;
      if (urlInput && reader.result) {
        urlInput.value = reader.result as string;
        
        // Pre-fill name if empty
        const titleInput = document.getElementById("new-photo-title") as HTMLInputElement;
        if (titleInput && !titleInput.value) {
          titleInput.value = file.name.split(".")[0];
        }
        alert("تصویر با موفقیت خوانده و برای ذخیره آماده شد.");
      }
    };
    reader.readAsDataURL(file);
  };

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<any>(null);

  const emailTemplates = [
    { id: "custom", label: "پیام دلخواه", subject: "", body: "" },
    { 
      id: "reminder", 
      label: "یادآوری نوبت", 
      subject: "یادآوری نوبت معاینه - کلینیک دنت فلو", 
      body: "مراجع گرامی،\nیادآوری می‌شود که نوبت دندانپزشکی شما برای فردا رزرو شده است. لطفاً ۱۰ دقیقه قبل از ساعت مقرر در کلینیک حضور داشته باشید." 
    },
    { 
      id: "prescription", 
      label: "ارسال نسخه دیجیتال", 
      subject: "نسخه دیجیتال و دستورات دارویی - دنت فلو", 
      body: "بیمار گرامی،\nنسخه دارویی شما به پیوست صادر گردید. لطفاً طبق دستورات پزشک مصرف نمایید." 
    },
    { 
      id: "followup", 
      label: "پیگیری پس از درمان", 
      subject: "بررسی وضعیت پس از درمان - کلینیک دنت فلو", 
      body: "سلام، امیدواریم حالتان خوب باشد.\nجهت بررسی وضعیت بهبودی پس از درمان اخیر، این پیام ارسال می‌گردد. در صورت بروز هرگونه درد غیرطبیعی با ما تماس بگیرید." 
    }
  ];

  const handleTemplateChange = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const startEditing = () => {
    if (!activePatient) return;
    setEditPatientForm({ ...activePatient });
    setIsEditingPatient(true);
  };

  const savePatientEdits = () => {
    if (!editPatientForm.fullName || !editPatientForm.phone) {
      alert("لطفاً نام بیمار و شماره تلفن را وارد نمایید.");
      return;
    }
    const updatedList = patients.map(p => p.id === activePatient.id ? { ...editPatientForm } : p);
    setPatients(updatedList);
    setIsEditingPatient(false);
    alert("اطلاعات پرونده بیمار با موفقیت بروزرسانی شد.");
  };

  const sendCustomEmail = async () => {
    if (!activePatient || !activePatient.email) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          to: activePatient.email,
          subject: emailSubject,
          body: `<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; line-height: 1.6; padding: 20px;">
                  <h2>سلام ${activePatient.fullName} عزیز،</h2>
                  <p>${emailBody.replace(/\n/g, '<br/>')}</p>
                  <hr style="border: 1px solid #eee; margin: 20px 0;"/>
                  <p style="font-size: 12px; color: #777;">با تشکر،<br/>کلینیک دنت فلو</p>
                </div>`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("ایمیل با موفقیت ارسال شد.");
        
        // Update local patients list with the new message in chat history
        const newMsg = {
          id: Date.now(),
          date: new Date().toLocaleDateString("fa-IR"),
          time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }),
          sender: "clinic",
          subject: emailSubject,
          text: emailBody,
          status: "read"
        };
        
        const updatedPatients = patients.map(p => {
          if (p.id === activePatient.id) {
            return {
              ...p,
              chat: [newMsg, ...(p.chat || [])]
            };
          }
          return p;
        });
        
        setPatients(updatedPatients);
        
        setIsEmailModalOpen(false);
        setEmailSubject("");
        setEmailBody("");
      } else {
        alert(data.error || "خطا در ارسال ایمیل.");
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="space-y-6 text-right" id="patients-ehr-tab" dir="rtl">
      <div className="bg-teal-50/30 border border-teal-100/50 p-5 rounded-2xl">
        <h3 className="text-base font-extrabold text-teal-800 flex items-center gap-2">
          <FolderHeart className="w-5 h-5 text-teal-600" />
          <span>سامانه پرونده الکترونیک سلامت (EHR) و چارت دندان دیجیتال</span>
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
          در این بخش می‌توانید پرونده‌های درمانی بیماران را جستجو، ایجاد و مدیریت کنید. وضعیت تک‌تک دندان‌های مراجع بر روی چارت گرافیکی ۳۲ عددی قابل ترسیم و نسخه‌های دارویی و طرح درمان نیز قابل برنامه‌ریزی هستند.
        </p>
      </div>

      {/* EHR Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT SIDEBAR: Patients List (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-black text-slate-800">لیست بیماران ثبت شده</span>
            <button
              onClick={() => setIsAddingPatient(!isAddingPatient)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] transition-colors flex items-center gap-1 cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingPatient ? "انصراف" : "بیمار جدید"}</span>
            </button>
          </div>

          {/* Search patient input */}
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو بر اساس نام یا شماره تماس..."
              value={patientsSearch}
              onChange={(e) => setPatientsSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50 text-slate-800 text-right placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Add Patient Collapsible Form */}
          {isAddingPatient && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl border border-teal-100 bg-teal-50/20 space-y-3 text-xs text-right"
            >
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">نام و نام خانوادگی بیمار:</label>
                <input
                  type="text"
                  value={newPatientForm.fullName}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, fullName: e.target.value })}
                  placeholder="مثال: زهرا مرادی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">شماره تماس:</label>
                  <input
                    type="text"
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">ایمیل (جهت ارسال نسخه/فاکتور):</label>
                  <input
                    type="email"
                    value={newPatientForm.email || ""}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">کد ملی:</label>
                  <input
                    type="text"
                    value={newPatientForm.nationalId}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, nationalId: e.target.value })}
                    placeholder="001..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">سن بیمار (سال):</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    placeholder="32"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">گروه خونی:</label>
                  <select
                    value={newPatientForm.bloodType}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-right"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">جنسیت:</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-right"
                  >
                    <option value="female">زن</option>
                    <option value="male">مرد</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">تاریخچه پزشکی / حساسیت:</label>
                  <input
                    type="text"
                    value={newPatientForm.history}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, history: e.target.value })}
                    placeholder="مثال: دیابت - حساسیت به آسپرین"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  />
              </div>

              <button
                onClick={() => {
                  if (!newPatientForm.fullName || !newPatientForm.phone) {
                    alert("لطفاً نام بیمار و شماره تلفن را وارد نمایید.");
                    return;
                  }
                  const pId = `P-${Math.floor(100 + Math.random() * 900)}`;
                  const defaultChart: { [key: number]: string } = {};
                  for (let i = 1; i <= 32; i++) {
                    defaultChart[i] = "healthy";
                  }
                  const created = {
                    id: pId,
                    fullName: newPatientForm.fullName,
                    phone: newPatientForm.phone,
                    email: newPatientForm.email || "",
                    nationalId: newPatientForm.nationalId || "---",
                    age: parseInt(newPatientForm.age) || 30,
                    gender: newPatientForm.gender,
                    history: newPatientForm.history || "بدون بیماری زمینه ای",
                    bloodType: newPatientForm.bloodType,
                    dentalChart: defaultChart,
                    treatmentPlan: [],
                    prescriptions: []
                  };
                  setPatients([created, ...patients]);
                  setSelectedPatientId(pId);
                  setNewPatientForm({
                    fullName: "",
                    phone: "",
                    nationalId: "",
                    age: "",
                    gender: "female",
                    history: "بدون بیماری زمینه ای",
                    bloodType: "O+"
                  });
                  setIsAddingPatient(false);
                  alert("پرونده دیجیتال جدید مراجع با موفقیت در سامانه دنت فلو ذخیره شد.");
                }}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all cursor-pointer border-none"
              >
                ثبت و ایجاد پرونده دیجیتال
              </button>
            </motion.div>
          )}

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {patients
              .filter(p => 
                p.fullName.includes(patientsSearch) || 
                p.phone.includes(patientsSearch) ||
                p.id.includes(patientsSearch)
              )
              .map((p) => {
                const isSel = p.id === selectedPatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setActiveToothNum(null);
                    }}
                    className={`p-3.5 rounded-2xl text-right cursor-pointer border transition-all ${
                      isSel
                        ? "bg-teal-50/80 border-teal-200 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          isSel ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          {p.fullName[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">{p.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">{p.phone}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-mono">{p.id}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* LEFT WORKSPACE: Active Patient EHR Workspace (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <div className="space-y-6">
              {/* General EHR Info Card */}
              <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl text-right space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-800">{activePatient.fullName}</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full font-mono">{activePatient.id}</span>
                    <button
                      onClick={startEditing}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>ویرایش اطلاعات</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 font-bold">
                    کد ملی بیمار: <span className="font-mono text-slate-700">{activePatient.nationalId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">سن بیمار:</span>
                    <span className="text-slate-800 text-sm font-extrabold mt-1 block">{activePatient.age} سال</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">جنسیت:</span>
                    <span className="text-slate-800 text-sm font-extrabold mt-1 block">{activePatient.gender === "female" ? "زن" : "مرد"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">گروه خونی:</span>
                    <span className="text-rose-600 text-sm font-extrabold mt-1 block font-mono">{activePatient.bloodType}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">شماره همراه:</span>
                    <span className="text-slate-800 text-sm font-mono font-bold mt-1 block" dir="ltr">{activePatient.phone}</span>
                  </div>
                  {activePatient.email && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[10px]">ایمیل:</span>
                      <span className="text-slate-800 text-[11px] font-mono font-bold mt-1 block truncate" dir="ltr" title={activePatient.email}>{activePatient.email}</span>
                    </div>
                  )}
                </div>

                <div className="bg-rose-50/30 p-3.5 rounded-xl border border-rose-100/50 text-xs">
                  <span className="text-rose-700 font-extrabold block">پیشینه پزشکی و حساسیت‌های دارویی (EHR Sensitivities):</span>
                  <p className="text-slate-600 font-bold mt-1 leading-relaxed">{activePatient.history}</p>
                </div>

                {/* Unified Chat History Section */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="bg-teal-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-teal-600" />
                      <span>تاریخچه گفتگو با بیمار (چت و ایمیل)</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col">
                    {activePatient.chat && activePatient.chat.length > 0 ? (
                      [...activePatient.chat].reverse().map((msg: any) => (
                        <div 
                          key={msg.id} 
                          className={`max-w-[85%] p-3 rounded-2xl text-xs relative group ${
                            msg.sender === "patient" 
                              ? "bg-slate-100 text-slate-700 self-start rounded-tr-none" 
                              : "bg-teal-600 text-white self-end rounded-tl-none shadow-md shadow-teal-600/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 opacity-60 font-black text-[9px]">
                            <span>{msg.sender === "patient" ? "بیمار" : "کلینیک"}</span>
                            <span>{msg.date} - {msg.time}</span>
                          </div>
                          {msg.subject && (
                            <div className="font-black mb-1 border-b border-white/20 pb-1">{msg.subject}</div>
                          )}
                          <p className="font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          {msg.sender === "patient" && msg.status === "unread" && (
                            <span className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs italic">هنوز گفتگویی ثبت نشده است.</div>
                    )}
                  </div>
                </div>

                {/* Edit Patient Modal/Overlay */}
                <AnimatePresence>
                  {isEditingPatient && editPatientForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
                      >
                        <div className="bg-teal-600 p-5 text-white flex items-center justify-between">
                          <h3 className="text-lg font-black flex items-center gap-2">
                            <Sliders className="w-5 h-5" />
                            <span>ویرایش اطلاعات پرونده: {activePatient.fullName}</span>
                          </h3>
                          <button onClick={() => setIsEditingPatient(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors border-none text-white cursor-pointer">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-bold block text-xs">نام و نام خانوادگی بیمار:</label>
                            <input
                              type="text"
                              value={editPatientForm.fullName}
                              onChange={(e) => setEditPatientForm({ ...editPatientForm, fullName: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">شماره تماس:</label>
                              <input
                                type="text"
                                value={editPatientForm.phone}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, phone: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-left"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">ایمیل:</label>
                              <input
                                type="email"
                                value={editPatientForm.email || ""}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-left"
                                dir="ltr"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">کد ملی:</label>
                              <input
                                type="text"
                                value={editPatientForm.nationalId}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, nationalId: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-left"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">سن:</label>
                              <input
                                type="number"
                                value={editPatientForm.age}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, age: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">گروه خونی:</label>
                              <select
                                value={editPatientForm.bloodType}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, bloodType: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-right"
                              >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold block text-xs">جنسیت:</label>
                              <select
                                value={editPatientForm.gender}
                                onChange={(e) => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-right"
                              >
                                <option value="female">زن</option>
                                <option value="male">مرد</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500 font-bold block text-xs">تاریخچه پزشکی و حساسیت‌ها:</label>
                            <textarea
                              value={editPatientForm.history}
                              onChange={(e) => setEditPatientForm({ ...editPatientForm, history: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="p-5 bg-slate-50 flex items-center justify-end gap-3">
                          <button
                            onClick={() => setIsEditingPatient(false)}
                            className="px-6 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-sm hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            onClick={savePatientEdits}
                            className="px-8 py-2.5 rounded-2xl bg-teal-600 text-white font-black text-sm hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20 border-none cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>ذخیره تغییرات پرونده</span>
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!activePatient.email) {
                        alert("ایمیلی برای این بیمار ثبت نشده است. لطفاً ابتدا در قسمت اطلاعات بیمار، ایمیل را وارد کنید.");
                        return;
                      }
                      setIsEmailModalOpen(!isEmailModalOpen);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Mail className="w-4 h-4" />
                    <span>ارسال ایمیل به بیمار (نسخه/فاکتور/پیام دلخواه)</span>
                  </button>
                </div>

                {/* Inline Email Form */}
                {isEmailModalOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 pt-4 mt-2 text-right space-y-4"
                  >
                    <div className="space-y-1 text-xs">
                      <label className="text-slate-500 font-bold block">انتخاب قالب آماده:</label>
                      <div className="flex flex-wrap gap-2">
                        {emailTemplates.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleTemplateChange(t.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold transition-all text-[10px] cursor-pointer"
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-slate-500 font-bold block">موضوع پیام:</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="مثال: فاکتور هزینه درمان - کلینیک دنت فلو"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800 font-bold"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-slate-500 font-bold block">متن کامل پیام (نسخه، هزینه یا یادآوری):</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="جناب آقای / سرکار خانم ...&#10;بدینوسیله فاکتور/نسخه شما ارسال می‌گردد."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white resize-none text-slate-700 font-semibold leading-relaxed"
                        rows={5}
                      />
                    </div>

                    <div className="flex gap-2 justify-end text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEmailModalOpen(false);
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
                        onClick={sendCustomEmail}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/10 disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{emailSending ? "در حال ارسال..." : "ارسال پیام و اطلاع‌رسانی"}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Dental Chart Component */}
              <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl text-right space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>چارت تصویری و دندانپزشکی ۳۲ عددی بیمار</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">جهت ویرایش وضعیت هر دندان، روی شماره آن کلیک نمایید.</span>
                </div>

                {/* Interactive teeth rendering */}
                <div className="space-y-6" dir="ltr">
                  {/* UPPER ARCH */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-center text-slate-400 font-bold">MAXILLA (آرک فک بالا)</div>
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((toothNum) => {
                        const status = activePatient.dentalChart?.[toothNum] || "healthy";
                        const isAct = activeToothNum === toothNum;
                        let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
                        if (status === "decayed") colorClass = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
                        if (status === "filled") colorClass = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
                        if (status === "missing") colorClass = "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200";
                        if (status === "crowned") colorClass = "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";

                        return (
                          <button
                            key={toothNum}
                            onClick={() => setActiveToothNum(toothNum)}
                            className={`w-7 h-9 sm:w-10 sm:h-12 rounded-xl border text-xs font-black flex flex-col items-center justify-between py-1 transition-all cursor-pointer ${colorClass} ${
                              isAct ? "ring-2 ring-teal-500 scale-105 border-transparent shadow-md" : ""
                            }`}
                          >
                            <span className="text-[8px] text-slate-400 font-bold uppercase">{status === "healthy" ? "H" : status[0].toUpperCase()}</span>
                            <span className="text-[10px] sm:text-xs font-mono">{toothNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LOWER ARCH */}
                  <div className="space-y-2 pt-2 border-t border-dashed border-slate-100">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                      {Array.from({ length: 16 }, (_, i) => i + 17).map((toothNum) => {
                        const status = activePatient.dentalChart?.[toothNum] || "healthy";
                        const isAct = activeToothNum === toothNum;
                        let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
                        if (status === "decayed") colorClass = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
                        if (status === "filled") colorClass = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
                        if (status === "missing") colorClass = "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200";
                        if (status === "crowned") colorClass = "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";

                        return (
                          <button
                            key={toothNum}
                            onClick={() => setActiveToothNum(toothNum)}
                            className={`w-7 h-9 sm:w-10 sm:h-12 rounded-xl border text-xs font-black flex flex-col items-center justify-between py-1 transition-all cursor-pointer ${colorClass} ${
                              isAct ? "ring-2 ring-teal-500 scale-105 border-transparent shadow-md" : ""
                            }`}
                          >
                            <span className="text-[10px] sm:text-xs font-mono">{toothNum}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">{status === "healthy" ? "H" : status[0].toUpperCase()}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-center text-slate-400 font-bold">MANDIBLE (آرک فک پایین)</div>
                  </div>
                </div>

                {/* Interactive Tooth Editor Drawer / Controls */}
                {activeToothNum !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-right"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">تغییر وضعیت درمان دندان شماره <span className="font-mono text-teal-600 text-sm">{activeToothNum}</span>:</span>
                      <button
                        onClick={() => setActiveToothNum(null)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer border-none bg-transparent"
                      >
                        بستن پنل ویرایش
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {[
                        { id: "healthy", label: "سالم (Healthy)", color: "bg-emerald-600 text-white" },
                        { id: "decayed", label: "پوسیده (Decayed)", color: "bg-rose-600 text-white" },
                        { id: "filled", label: "پرشده (Filled)", color: "bg-blue-600 text-white" },
                        { id: "missing", label: "کشیده شده (Missing)", color: "bg-slate-500 text-white" },
                        { id: "crowned", label: "روکش (Crowned)", color: "bg-purple-600 text-white" }
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => {
                            const updatedChart = { ...activePatient.dentalChart, [activeToothNum]: st.id };
                            const updatedList = patients.map(p => p.id === activePatient.id ? { ...p, dentalChart: updatedChart } : p);
                            setPatients(updatedList);
                            alert(`وضعیت دندان شماره ${activeToothNum} به «${st.label.split(" ")[0]}» بروزرسانی شد.`);
                          }}
                          className={`py-2 rounded-lg font-bold transition-all text-[11px] cursor-pointer border-none ${st.color} hover:opacity-90`}
                        >
                          {st.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Chart Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />سالم (Healthy)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />پوسیده (Decayed)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />پرشده (Filled)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 block" />کشیده شده (Missing)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 block" />روکش شده (Crowned)</span>
                </div>
              </div>

              {/* Grid for treatment plan, prescription writer, and medical photos */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Area: Treatment Plan */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-right space-y-4">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    <span>برنامه و طرح درمان‌های فعال</span>
                  </h4>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(!activePatient.treatmentPlan || activePatient.treatmentPlan.length === 0) ? (
                      <p className="text-xs text-slate-400 font-bold py-4 text-center">طرح درمانی برای این بیمار ثبت نشده است.</p>
                    ) : (
                      activePatient.treatmentPlan.map((plan: any) => {
                        let badgeColor = "bg-slate-100 text-slate-600";
                        let statusLabel = "برنامه‌ریزی";
                        if (plan.status === "in_progress") {
                          badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                          statusLabel = "در حال کار";
                        } else if (plan.status === "completed") {
                          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                          statusLabel = "تکمیل شده";
                        }

                        return (
                          <div
                            key={plan.id}
                            className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 text-xs font-bold"
                          >
                            <div className="space-y-0.5 text-right">
                              <span className="font-extrabold text-slate-800 block">{plan.title}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">هزینه: {plan.cost.toLocaleString("fa-IR")} تومان</span>
                            </div>
                            <button
                              onClick={() => {
                                const updatedPlan = activePatient.treatmentPlan.map((p: any) => {
                                  if (p.id === plan.id) {
                                    const nextStatus = p.status === "planned" ? "in_progress" : p.status === "in_progress" ? "completed" : "planned";
                                    return { ...p, status: nextStatus };
                                  }
                                  return p;
                                });
                                setPatients(patients.map(p => p.id === activePatient.id ? { ...p, treatmentPlan: updatedPlan } : p));
                              }}
                              className={`px-2.5 py-1 rounded-lg border font-black text-[10px] cursor-pointer transition-all ${badgeColor}`}
                            >
                              {statusLabel}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-right">
                    <span className="text-slate-500 font-bold block">افزودن طرح درمان جدید:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="عنوان درمان..."
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="مبلغ حدودی (تومان)..."
                        value={newPlanCost}
                        onChange={(e) => setNewPlanCost(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newPlanTitle || !newPlanCost) {
                          alert("لطفاً عنوان درمان و هزینه را مشخص کنید.");
                          return;
                        }
                        const updatedPlan = [
                          ...(activePatient.treatmentPlan || []),
                          { id: Date.now(), title: newPlanTitle, cost: parseInt(newPlanCost) || 1000000, status: "planned" }
                        ];
                        setPatients(patients.map(p => p.id === activePatient.id ? { ...p, treatmentPlan: updatedPlan } : p));
                        setNewPlanTitle("");
                        setNewPlanCost("");
                        alert("آیتم طرح درمان جدید به پرونده بیمار پیوست شد.");
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all cursor-pointer border-none"
                    >
                      پیوست طرح درمان به پرونده
                    </button>
                  </div>
                </div>

                {/* Right Area: Electronic Prescriptions */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-right space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>نسخه‌نویسی الکترونیکی (Rx Pad)</span>
                    </h4>
                    <button
                      onClick={() => setIsAddingPrescription(!isAddingPrescription)}
                      className="text-[10px] font-black text-teal-600 hover:underline cursor-pointer bg-transparent border-none"
                    >
                      {isAddingPrescription ? "انصراف" : "صدور نسخه جدید"}
                    </button>
                  </div>

                  {isAddingPrescription ? (
                    <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold block">تشخیص پزشک:</label>
                        <input
                          type="text"
                          value={rxDiagnosis}
                          onChange={(e) => setRxDiagnosis(e.target.value)}
                          placeholder="مثال: التهاب شدید دندان پوسیده شماره ۱۳"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none bg-white"
                        />
                      </div>

                      {/* Drugs draft */}
                      {rxDrugs.length > 0 && (
                        <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">اقلام نسخه در حال آماده‌سازی:</span>
                          {rxDrugs.map((dr, index) => (
                            <div key={index} className="flex items-center justify-between gap-1 text-[11px] py-1 border-b border-slate-50 font-bold text-right">
                              <span>{dr.name} ({dr.dose})</span>
                              <button
                                onClick={() => setRxDrugs(rxDrugs.filter((_, idx) => idx !== index))}
                                className="text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Drug form */}
                      <div className="bg-teal-50/30 p-2.5 rounded-lg border border-teal-100 space-y-2">
                        <span className="text-[10px] text-teal-700 font-black block">افزودن قلم دارو:</span>
                        <input
                          type="text"
                          placeholder="نام دارو (مثال: Amoxicillin 500mg)..."
                          value={newDrug.name}
                          onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                          className="w-full px-2.5 py-1 rounded-md border border-slate-200 font-bold focus:outline-none bg-white text-right"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            placeholder="دستور مصرف..."
                            value={newDrug.dose}
                            onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
                            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="مدت..."
                            value={newDrug.duration}
                            onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
                            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!newDrug.name) {
                              alert("لطفاً نام دارو را وارد کنید.");
                              return;
                            }
                            setRxDrugs([...rxDrugs, newDrug]);
                            setNewDrug({ name: "", dose: "هر ۸ ساعت یک عدد", duration: "۵ روز" });
                          }}
                          className="w-full py-1 bg-teal-600 text-white rounded font-bold cursor-pointer border-none"
                        >
                          افزودن به اقلام نسخه
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          let finalDrugs = [...rxDrugs];
                          // Automatically append current typed drug if name is not empty
                          if (newDrug.name) {
                            finalDrugs.push(newDrug);
                          }
                          if (finalDrugs.length === 0) {
                            alert("لطفاً حداقل یک قلم دارو با مشخصات کامل اضافه کنید.");
                            return;
                          }
                          const newRx = {
                            id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
                            date: new Date().toLocaleDateString("fa-IR"),
                            diagnosis: rxDiagnosis || "معاینه عمومی دهان و دندان",
                            drugs: finalDrugs
                          };
                          const updatedPrescriptions = [newRx, ...(activePatient.prescriptions || [])];
                          setPatients(patients.map(p => p.id === activePatient.id ? { ...p, prescriptions: updatedPrescriptions } : p));
                          setRxDiagnosis("");
                          setRxDrugs([]);
                          setNewDrug({ name: "", dose: "هر ۸ ساعت یک عدد", duration: "۵ روز" });
                          setIsAddingPrescription(false);
                          alert("نسخه الکترونیکی با موفقیت صادر و در پرونده بیمار ذخیره شد.");
                        }}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-xl transition-all border-none cursor-pointer"
                      >
                        ثبت و صدور نهایی نسخه الکترونیک
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {(!activePatient.prescriptions || activePatient.prescriptions.length === 0) ? (
                        <p className="text-xs text-slate-400 font-bold py-6 text-center">تاریخچه نسخه‌ای برای این بیمار یافت نشد.</p>
                      ) : (
                        activePatient.prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-3 rounded-xl border border-dashed border-teal-100 bg-teal-50/10 space-y-2 text-xs text-right">
                            <div className="flex items-center justify-between gap-1 border-b border-teal-100/30 pb-1.5">
                              <span className="font-mono text-[10px] text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full font-black">{rx.id}</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">{rx.date}</span>
                            </div>
                            <div className="text-[11px] text-right">
                              <span className="text-slate-400 block font-bold">تشخیص بیماری:</span>
                              <span className="text-slate-700 font-extrabold mt-0.5 block">{rx.diagnosis}</span>
                            </div>
                            <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-100/80">
                              <span className="text-[10px] text-slate-400 font-bold block text-right">اقلام تجویز شده:</span>
                              {rx.drugs.map((dr: any, idx: number) => (
                                <div key={idx} className="text-[11px] text-slate-600 font-bold border-b border-slate-50 last:border-none py-1 flex items-center justify-between">
                                  <span>• {dr.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">({dr.dose} / {dr.duration})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Column 3: Medical Photos & Radiography */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-right space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-teal-600" />
                      <span>تصاویر پزشکی و رادیوگرافی (Option 3)</span>
                    </h4>
                  </div>

                  {/* List of Photos */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {(!activePatient.medicalPhotos || activePatient.medicalPhotos.length === 0) ? (
                      <p className="text-xs text-slate-400 font-bold py-6 text-center">تصویر پزشکی یا رادیوگرافی برای این بیمار ثبت نشده است.</p>
                    ) : (
                      activePatient.medicalPhotos.map((photo: any) => (
                        <div key={photo.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-slate-800 text-xs">{photo.title}</span>
                            <span className="text-[9px] text-slate-400 font-bold font-mono">{photo.date}</span>
                          </div>
                          
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-28 flex items-center justify-center">
                            <img 
                              src={photo.imageUrl} 
                              alt={photo.title} 
                              className="object-cover w-full h-full"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as any).src = "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=300";
                              }}
                            />
                            <button
                              onClick={() => {
                                const updatedPhotos = activePatient.medicalPhotos.filter((p: any) => p.id !== photo.id);
                                setPatients(patients.map(p => p.id === activePatient.id ? { ...p, medicalPhotos: updatedPhotos } : p));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-lg transition-all cursor-pointer border border-none"
                              title="حذف تصویر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {photo.notes && (
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{photo.notes}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Photo form */}
                  <div className="pt-2 border-t border-slate-100 space-y-3 text-xs text-right">
                    <span className="text-slate-500 font-bold block">افزودن تصویر پزشکی جدید:</span>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="عنوان تصویر (مثال: رادیوگرافی OPG)..."
                        id="new-photo-title"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none"
                      />
                      
                      {/* Drag and Drop / Select File Box */}
                      <div 
                        onClick={() => document.getElementById("photo-file-input")?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            handlePhotoUpload(files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-teal-50/10 transition-all flex flex-col items-center justify-center gap-1"
                      >
                        <UploadCloud className="w-6 h-6 text-slate-400" />
                        <span className="font-extrabold text-[11px] text-slate-600">بکشید و رها کنید یا کلیک کنید تا آپلود شود</span>
                        <span className="text-[9px] text-slate-400 font-bold">فایل‌های تصویر (PNG, JPEG, SVG)</span>
                        <input 
                          type="file" 
                          id="photo-file-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              handlePhotoUpload(files[0]);
                            }
                          }}
                        />
                      </div>

                      {/* Or enter arbitrary url or select standard presets */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">یا انتخاب از تصاویر نمونه دندانپزشکی:</label>
                        <select
                          id="new-photo-preset"
                          onChange={(e) => {
                            const val = e.target.value;
                            const titleInput = document.getElementById("new-photo-title") as HTMLInputElement;
                            const urlInput = document.getElementById("new-photo-url") as HTMLInputElement;
                            if (val && titleInput && urlInput) {
                              urlInput.value = val;
                              if (val.includes("598256")) titleInput.value = "رادیوگرافی پانورامیک OPG";
                              else if (val.includes("62990")) titleInput.value = "عکس کلینیکی فوتودنتال";
                              else if (val.includes("57968")) titleInput.value = "رادیوگرافی بایت‌وینگ";
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 text-xs focus:outline-none"
                        >
                          <option value="">-- انتخاب تصویر نمونه دندانپزشکی --</option>
                          <option value="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600">رادیوگرافی پانورامیک OPG</option>
                          <option value="https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=600">رادیوگرافی بایت‌وینگ (Bitewing)</option>
                          <option value="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600">عکس کلینیکی فوتودنتال بعد از درمان</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">یا وارد کردن آدرس مستقیم تصویر (URL):</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          id="new-photo-url"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none text-left font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">توضیحات پزشک (اختیاری):</label>
                        <input
                          type="text"
                          placeholder="مثال: ریشه دندان عقل سمت راست نیازمند بررسی مجدد..."
                          id="new-photo-notes"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const titleInput = document.getElementById("new-photo-title") as HTMLInputElement;
                        const urlInput = document.getElementById("new-photo-url") as HTMLInputElement;
                        const notesInput = document.getElementById("new-photo-notes") as HTMLInputElement;
                        
                        if (!titleInput?.value || !urlInput?.value) {
                          alert("لطفاً عنوان تصویر و آدرس تصویر (یا تصویر آپلود شده) را مشخص کنید.");
                          return;
                        }

                        const newPhoto = {
                          id: Date.now(),
                          title: titleInput.value,
                          date: new Date().toLocaleDateString("fa-IR"),
                          imageUrl: urlInput.value,
                          notes: notesInput?.value || ""
                        };

                        const updatedPhotos = [...(activePatient.medicalPhotos || []), newPhoto];
                        setPatients(patients.map(p => p.id === activePatient.id ? { ...p, medicalPhotos: updatedPhotos } : p));
                        
                        titleInput.value = "";
                        urlInput.value = "";
                        if (notesInput) notesInput.value = "";
                        alert("تصویر پزشکی با موفقیت به پرونده بیمار ضمیمه شد.");
                      }}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl transition-all cursor-pointer border border-none"
                    >
                      ضمیمه تصویر به پرونده بیمار
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 font-bold">
              هیچ پرونده‌ای انتخاب نشده است یا لیست بیماران خالی است.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
