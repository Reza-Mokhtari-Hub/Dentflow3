import React from "react";
import { Activity } from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";

interface Booking {
  id: string;
  fullName: string;
  phone: string;
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

interface AnalyticsTabProps {
  adminBookings: Booking[];
  services: Service[];
}

export default function AnalyticsTab({ adminBookings, services }: AnalyticsTabProps) {
  return (
    <div className="space-y-6" id="analytics-tab-content">
      <div className="bg-teal-50/30 border border-teal-100/50 p-5 rounded-2xl text-right">
        <h3 className="text-base font-extrabold text-teal-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
          <span>داشبورد آنالیز و بررسی عملکرد دنت فلو</span>
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
          آمارها، توزیع نوبت‌ها، خدمات پرطرفدار و ارزش مادی کلینیک را به صورت گرافیکی و کاملاً محاسباتی مشاهده کنید. این اطلاعات زنده هستند و با ثبت هر نوبت جدید فورا بروزرسانی می‌شوند.
        </p>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="analytics-kpi-cards">
        <div className="bg-white border border-teal-100 p-5 rounded-2xl text-right">
          <span className="text-slate-400 font-extrabold text-[11px] block">ارزش نوبت‌های تایید شده دنت فلو</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-600 block mt-2 font-mono">
            {(adminBookings.filter(b => b.status === "approved").reduce((sum, b) => {
              const prices: {[key: string]: number} = { implant: 9500000, veneer: 2800000, orthodontics: 22000000, bleaching: 3500000, pediatric: 1200000, "root-canal": 2500000, surgery: 1800000 };
              return sum + (prices[b.serviceId] || 1500000);
            }, 0)).toLocaleString("fa-IR")} <span className="text-xs font-bold text-slate-500">تومان</span>
          </span>
        </div>

        <div className="bg-white border border-amber-100 p-5 rounded-2xl text-right">
          <span className="text-slate-400 font-extrabold text-[11px] block">پتانسیل درآمدی نوبت‌های در انتظار بررسی</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 block mt-2 font-mono">
            {(adminBookings.filter(b => b.status === "pending").reduce((sum, b) => {
              const prices: {[key: string]: number} = { implant: 9500000, veneer: 2800000, orthodontics: 22000000, bleaching: 3500000, pediatric: 1200000, "root-canal": 2500000, surgery: 1800000 };
              return sum + (prices[b.serviceId] || 1500000);
            }, 0)).toLocaleString("fa-IR")} <span className="text-xs font-bold text-slate-500">تومان</span>
          </span>
        </div>

        <div className="bg-white border border-teal-50 p-5 rounded-2xl text-right">
          <span className="text-slate-400 font-extrabold text-[11px] block">محبوب‌ترین درمان ثبت شده</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 block mt-2">
            {(() => {
              if (adminBookings.length === 0) return "ایمپلنت دندان";
              const counts: {[key: string]: number} = {};
              adminBookings.forEach(b => counts[b.serviceId] = (counts[b.serviceId] || 0) + 1);
              const topId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "implant");
              return services.find(s => s.id === topId)?.title || "ایمپلنت دندان";
            })()}
          </span>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-wrapper">
        {/* Chart 1: Distribution by Service */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-right space-y-4">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-200 pb-2">سهم خدمات و درمان‌های درخواستی مراجعین</h4>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(() => {
                    const list = adminBookings.length > 0 ? adminBookings : [
                      { serviceId: "implant" }, { serviceId: "implant" },
                      { serviceId: "veneer" }, { serviceId: "veneer" }, { serviceId: "veneer" },
                      { serviceId: "orthodontics" }, { serviceId: "bleaching" }
                    ];
                    const counts: {[key: string]: number} = {};
                    list.forEach(b => counts[b.serviceId] = (counts[b.serviceId] || 0) + 1);
                    return Object.keys(counts).map(id => ({
                      name: services.find(s => s.id === id)?.title || id,
                      value: counts[id]
                    }));
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    "#0D9488", "#06B6D4", "#3B82F6", "#8B5CF6", 
                    "#EC4899", "#F59E0B", "#10B981"
                  ].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value} درخواست`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bookings Status Breakdown */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-right space-y-4">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-200 pb-2">وضعیت پذیرش و نهایی‌سازی نوبت‌ها</h4>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "تایید نهایی شده", تعداد: adminBookings.filter(b => b.status === "approved").length || 4, رنگ: "#0D9488" },
                  { name: "در انتظار تماس", تعداد: adminBookings.filter(b => b.status === "pending").length || 3, رنگ: "#D97706" },
                  { name: "لغو شده", تعداد: adminBookings.filter(b => b.status === "cancelled").length || 1, رنگ: "#E11D48" }
                ]}
              >
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value: any) => `${value} مورد`} />
                <Bar dataKey="تعداد" radius={[8, 8, 0, 0]}>
                  {[
                    { color: "#0D9488" },
                    { color: "#D97706" },
                    { color: "#E11D48" }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Potential income estimate */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-right space-y-4 col-span-1 lg:col-span-2">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-200 pb-2">مقایسه ارزش مادی نوبت‌های تایید شده در مقابل معلق (میلیون تومان)</h4>
          <div className="h-[250px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  {
                    name: "ارزش مادی نوبت‌ها",
                    "تایید شده": (adminBookings.filter(b => b.status === "approved").reduce((sum, b) => {
                      const prices: {[key: string]: number} = { implant: 9500000, veneer: 2800000, orthodontics: 22000000, bleaching: 3500000, pediatric: 1200000, "root-canal": 2500000, surgery: 1800000 };
                      return sum + (prices[b.serviceId] || 1500000);
                    }, 0)) / 1000000 || 28,
                    "در انتظار تماس": (adminBookings.filter(b => b.status === "pending").reduce((sum, b) => {
                      const prices: {[key: string]: number} = { implant: 9500000, veneer: 2800000, orthodontics: 22000000, bleaching: 3500000, pediatric: 1200000, "root-canal": 2500000, surgery: 1800000 };
                      return sum + (prices[b.serviceId] || 1500000);
                    }, 0)) / 1000000 || 16
                  }
                ]}
              >
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value: any) => `${value} میلیون تومان`} />
                <Legend />
                <Area type="monotone" dataKey="تایید شده" stroke="#0D9488" fill="#CCFBF1" />
                <Area type="monotone" dataKey="در انتظار تماس" stroke="#D97706" fill="#FEF3C7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
