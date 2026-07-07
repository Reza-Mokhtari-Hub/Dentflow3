import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Calendar, FolderHeart, BookOpen, DollarSign, Sliders, MapPin, 
  Sparkles, Activity, Lock, ArrowRight, MessageSquare, Image
} from "lucide-react";

import BookingsTab from "./BookingsTab";
import PatientsTab from "./PatientsTab";
import BillingTab from "./BillingTab";
import SecurityTab from "./SecurityTab";
import ArticlesTab from "./ArticlesTab";
import ServicesTab from "./ServicesTab";
import ContactTab from "./ContactTab";
import AiTab from "./AiTab";
import AnalyticsTab from "./AnalyticsTab";
import ReviewsTab from "./ReviewsTab";
import GalleryTab from "./GalleryTab";
import { Service } from "../data";

interface AdminPanelProps {
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  storedAdminUsername: string;
  setStoredAdminUsername: (val: string) => void;
  adminToken: string | null;
  setAdminToken: (val: string | null) => void;
  loginError: string;
  setLoginError: (val: string) => void;
  adminBookings: any[];
  setAdminBookings: React.Dispatch<React.SetStateAction<any[]>>;
  patients: any[];
  setPatients: React.Dispatch<React.SetStateAction<any[]>>;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  articles: any[];
  setArticles: React.Dispatch<React.SetStateAction<any[]>>;
  clinicConfig: any;
  setClinicConfig: (val: any) => void;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  aiName: string;
  setAiName: (val: string) => void;
  aiGreeting: string;
  setAiGreeting: (val: string) => void;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => Promise<void>;
  fetchAdminBookings: () => Promise<void>;
  updateBookingStatus: (id: string, status: string) => Promise<void>;
  updateBookingDetails: (id: string, updates: any) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  useLocalDb: boolean;
  setUseLocalDb: (val: boolean) => void;
  handleAdminLogin: (e: React.FormEvent) => Promise<void>;
  testimonials: any[];
  setTestimonials: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AdminPanel({
  isAdminMode,
  setIsAdminMode,
  isAdminAuthenticated,
  setIsAdminAuthenticated,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  storedAdminUsername,
  setStoredAdminUsername,
  adminToken,
  setAdminToken,
  loginError,
  setLoginError,
  adminBookings,
  setAdminBookings,
  patients,
  setPatients,
  transactions,
  setTransactions,
  articles,
  setArticles,
  clinicConfig,
  setClinicConfig,
  services,
  setServices,
  aiName,
  setAiName,
  aiGreeting,
  setAiGreeting,
  aiPrompt,
  setAiPrompt,
  messages,
  setMessages,
  fetchMessages,
  fetchAdminBookings,
  updateBookingStatus,
  updateBookingDetails,
  deleteBooking,
  useLocalDb,
  setUseLocalDb,
  handleAdminLogin,
  testimonials,
  setTestimonials
}: AdminPanelProps) {
  const [adminActiveTab, setAdminActiveTab] = useState<"bookings" | "services" | "contact" | "ai" | "analytics" | "patients" | "billing" | "security" | "articles" | "reviews" | "gallery">("bookings");
  const [adminFilter, setAdminFilter] = useState<string>("all");

  // Local Admin Tab specific states relocated to keep App.tsx clean
  const [selectedPatientId, setSelectedPatientId] = useState<string>("P-101");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    age: "",
    gender: "female",
    history: "بدون بیماری زمینه ای",
    bloodType: "O+"
  });

  const [activeToothNum, setActiveToothNum] = useState<number | null>(null);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxDrugs, setRxDrugs] = useState<any[]>([]);
  const [newDrug, setNewDrug] = useState({
    name: "",
    dose: "هر ۸ ساعت یک عدد",
    duration: "۵ روز"
  });

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanCost, setNewPlanCost] = useState("");

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTxForm, setNewTxForm] = useState({
    type: "income",
    amount: "",
    category: "treatment",
    date: "1405/04/05",
    description: "",
    patientId: ""
  });

  const [invoicePatientId, setInvoicePatientId] = useState("P-101");
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { title: "ایمپلنت دیجیتال (فیکسچر سوئیسی)", qty: 1, unitPrice: 9500000 }
  ]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(10);
  const [invoiceCreated, setInvoiceCreated] = useState<any | null>(null);
  const [isViewingInvoicePreview, setIsViewingInvoicePreview] = useState(false);

  const [patientsSearch, setPatientsSearch] = useState("");
  const [billingTypeFilter, setBillingTypeFilter] = useState("all");

  // Computed properties
  const filteredBookings = adminBookings.filter(b => {
    if (adminFilter === "all") return true;
    return b.status === adminFilter;
  });

  const adminStats = {
    total: adminBookings.length,
    pending: adminBookings.filter(b => b.status === "pending").length,
    approved: adminBookings.filter(b => b.status === "approved").length,
    cancelled: adminBookings.filter(b => b.status === "cancelled").length,
  };

  if (!isAdminAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center pt-28 pb-16 px-4" id="admin-login-container">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/80 backdrop-blur-md border border-teal-100 rounded-[32px] p-8 sm:p-10 shadow-2xl w-full max-w-md text-right space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">ورود به سیستم مدیریت</h3>
            <p className="text-xs text-slate-400 font-bold">بخش دسترسی کادر درمانی و اداری کلینیک دنت فلو</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">نام کاربری مدیریت:</label>
              <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="نام کاربری..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">کلمه عبور:</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="رمز عبور..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
            </div>
            {loginError && <p className="text-xs text-rose-500 font-bold">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-colors">ورود</button>
          </form>
          <button onClick={() => setIsAdminMode(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">بازگشت</button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-right" id="admin-dashboard-container">
      <div className="bg-white border border-teal-100 rounded-[32px] p-6 sm:p-10 shadow-2xl space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">کنترل سنتر کلینیک دنت فلو</h2>
            <p className="text-slate-500 text-xs font-semibold">پیکربندی هوش مصنوعی، پرونده الکترونیک و نوبت‌ها</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAdminAuthenticated(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">خروج</button>
            <button onClick={() => setIsAdminMode(false)} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /><span>سایت</span></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          {[
            { id: "bookings", label: "نوبت‌ها", icon: Calendar },
            { id: "patients", label: "پرونده‌ها", icon: FolderHeart },
            { id: "reviews", label: "نظرات مراجعین", icon: MessageSquare },
            { id: "gallery", label: "گالری لبخند", icon: Image },
            { id: "articles", label: "مقالات", icon: BookOpen },
            { id: "billing", label: "مالی", icon: DollarSign },
            { id: "services", label: "تعرفه‌ها", icon: Sliders },
            { id: "contact", label: "اطلاعات تماس", icon: MapPin },
            { id: "ai", label: "هوش مصنوعی", icon: Sparkles },
            { id: "analytics", label: "آمار", icon: Activity },
            { id: "security", label: "امنیت", icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${adminActiveTab === tab.id ? "bg-teal-600 text-white border-teal-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {adminActiveTab === "bookings" && (
          <BookingsTab
            useLocalDb={useLocalDb}
            setUseLocalDb={setUseLocalDb}
            adminStats={adminStats}
            adminFilter={adminFilter}
            setAdminFilter={setAdminFilter}
            filteredBookings={filteredBookings}
            services={services}
            updateBookingStatus={updateBookingStatus}
            updateBookingDetails={updateBookingDetails}
            deleteBooking={deleteBooking}
            refreshBookings={fetchAdminBookings}
            adminToken={adminToken}
            clinicConfig={clinicConfig}
          />
        )}

        {adminActiveTab === "patients" && (
          <PatientsTab
            patients={patients}
            setPatients={setPatients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            isAddingPatient={isAddingPatient}
            setIsAddingPatient={setIsAddingPatient}
            newPatientForm={newPatientForm}
            setNewPatientForm={setNewPatientForm}
            activeToothNum={activeToothNum}
            setActiveToothNum={setActiveToothNum}
            isAddingPrescription={isAddingPrescription}
            setIsAddingPrescription={setIsAddingPrescription}
            rxDiagnosis={rxDiagnosis}
            setRxDiagnosis={setRxDiagnosis}
            rxDrugs={rxDrugs}
            setRxDrugs={setRxDrugs}
            newDrug={newDrug}
            setNewDrug={setNewDrug}
            newPlanTitle={newPlanTitle}
            setNewPlanTitle={setNewPlanTitle}
            newPlanCost={newPlanCost}
            setNewPlanCost={setNewPlanCost}
            patientsSearch={patientsSearch}
            setPatientsSearch={setPatientsSearch}
            clinicConfig={clinicConfig}
            adminToken={adminToken}
          />
        )}

        {adminActiveTab === "billing" && (
          <BillingTab
            transactions={transactions}
            setTransactions={setTransactions}
            isAddingTransaction={isAddingTransaction}
            setIsAddingTransaction={setIsAddingTransaction}
            newTxForm={newTxForm}
            setNewTxForm={setNewTxForm}
            patients={patients}
            invoicePatientId={invoicePatientId}
            setInvoicePatientId={setInvoicePatientId}
            invoiceItems={invoiceItems}
            setInvoiceItems={setInvoiceItems}
            invoiceDiscount={invoiceDiscount}
            setInvoiceDiscount={setInvoiceDiscount}
            invoiceCreated={invoiceCreated}
            setInvoiceCreated={setInvoiceCreated}
            isViewingInvoicePreview={isViewingInvoicePreview}
            setIsViewingInvoicePreview={setIsViewingInvoicePreview}
            billingTypeFilter={billingTypeFilter}
            setBillingTypeFilter={setBillingTypeFilter}
            clinicConfig={clinicConfig}
          />
        )}

        {adminActiveTab === "security" && (
          <SecurityTab
            storedAdminUsername={storedAdminUsername}
            setStoredAdminUsername={setStoredAdminUsername}
            adminToken={adminToken}
          />
        )}

        {adminActiveTab === "articles" && (
          <ArticlesTab
            articles={articles}
            setArticles={setArticles}
            useLocalDb={useLocalDb}
            adminToken={adminToken}
          />
        )}

        {adminActiveTab === "services" && (
          <ServicesTab
            services={services}
            setServices={setServices}
          />
        )}

        {adminActiveTab === "contact" && (
          <ContactTab
            clinicConfig={clinicConfig}
            setClinicConfig={setClinicConfig}
            messages={messages}
            setMessages={setMessages}
            adminToken={adminToken}
            fetchMessages={fetchMessages}
          />
        )}

        {adminActiveTab === "ai" && (
          <AiTab
            aiName={aiName}
            setAiName={setAiName}
            aiGreeting={aiGreeting}
            setAiGreeting={setAiGreeting}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
          />
        )}

        {adminActiveTab === "analytics" && (
          <AnalyticsTab
            adminBookings={adminBookings}
            services={services}
          />
        )}

        {adminActiveTab === "reviews" && (
          <ReviewsTab
            testimonials={testimonials}
            setTestimonials={setTestimonials}
          />
        )}

        {adminActiveTab === "gallery" && (
          <GalleryTab
            clinicConfig={clinicConfig}
            setClinicConfig={setClinicConfig}
            adminToken={adminToken}
          />
        )}

      </div>
    </main>
  );
}
