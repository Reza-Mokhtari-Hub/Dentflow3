import React, { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { Service } from "../data";
import { renderServiceIcon } from "./ServiceIcon";
import { AnimatePresence, motion } from "motion/react";

interface ServicesSectionProps {
  services: Service[];
  onSelectServiceAndBook: (service: Service) => void;
}

export default function ServicesSection({ services, onSelectServiceAndBook }: ServicesSectionProps) {
  const [activeServiceModal, setActiveServiceModal] = useState<Service | null>(null);

  return (
    <section id="services" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Block as elegant center header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16" id="services-header">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100" id="services-badge">
          <span>چه خدماتی ارائه می‌دهیم؟</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" id="services-title">خدمات تخصصی و فوق‌مدرن کلینیک دنت فلو</h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold" id="services-desc">
          ما دایره کاملی از نیازهای بهداشتی، درمانی و زیبایی دهان و دندان شما را به کمک فناوری روز دنیا و متریال تضمین‌شده بین‌المللی پوشش می‌دهیم. برای مشاهده جزئیات روی هر خدمت کلیک کنید.
        </p>
      </div>

      {/* Bento Grid Services arrangement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-grid">
        {services.map((service) => {
          // Apply unique bento layouts - e.g. first and primary aesthetic services get glowing subtle card gradients
          const isHighlight = service.id === "implant" || service.id === "laminate";
          return (
            <div 
              key={service.id}
              id={`service-card-${service.id}`}
              className={`group relative rounded-[28px] p-8 border hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isHighlight 
                  ? "bg-gradient-to-br from-white to-teal-50/30 border-teal-200/50 shadow-xl shadow-teal-900/5 hover:shadow-2xl hover:shadow-teal-900/10" 
                  : "bg-white/80 backdrop-blur-md border-white/60 shadow-lg shadow-teal-950/5 hover:shadow-xl hover:shadow-teal-900/5"
              }`}
              onClick={() => setActiveServiceModal(service)}
            >
              <div id={`service-body-${service.id}`}>
                {/* Decorative Icon Wrapper */}
                <div className="w-12 h-12 rounded-2xl bg-teal-50 group-hover:bg-teal-500 group-hover:text-white flex items-center justify-center text-teal-600 mb-6 shadow-sm border border-teal-100/30 transition-colors duration-300" id={`service-card-icon-${service.id}`}>
                  {renderServiceIcon(service.iconName, "w-6 h-6 group-hover:text-white transition-colors")}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors" id={`service-card-title-${service.id}`}>
                    {service.title}
                  </h3>
                  {isHighlight && (
                    <span className="text-[9px] bg-rose-50 text-rose-500 font-bold px-1.5 py-0.5 rounded-md border border-rose-100">ویژه</span>
                  )}
                </div>

                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 font-medium" id={`service-card-desc-${service.id}`}>
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold" id={`service-card-footer-${service.id}`}>
                <span className="text-teal-600 group-hover:underline flex items-center gap-1.5" id={`service-card-more-${service.id}`}>
                  مشاهده جزئیات و تعرفه هزینه
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </span>
                <span className="text-teal-800 bg-teal-50 px-2 py-1 rounded-lg" id={`service-card-price-${service.id}`}>
                  {service.priceEst}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Services Detail Modal (AnimatePresence - Bento Style overlays) */}
      <AnimatePresence>
        {activeServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="service-modal-overlay">
            {/* Modal backdrop */}
            <motion.div 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveServiceModal(null)}
              id="modal-backdrop"
            />
            
            {/* Modal content body */}
            <motion.div 
              id="service-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col text-right"
            >
              {/* Modal header visual decoration */}
              <div className="p-6 bg-gradient-to-l from-teal-600 to-teal-500 text-white flex items-center justify-between" id="modal-header">
                <div className="flex items-center gap-3" id="modal-header-title">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white" id="modal-icon">
                    {renderServiceIcon(activeServiceModal.iconName, "w-6 h-6 text-white")}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold" id="modal-service-title">{activeServiceModal.title}</h4>
                    <span className="text-xs text-teal-100" id="modal-service-category">دنت فلو | DentFlow</span>
                  </div>
                </div>
                <button 
                  id="btn-close-modal"
                  onClick={() => setActiveServiceModal(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal content body scrollable */}
              <div className="p-6 overflow-y-auto space-y-6" id="modal-scroll-area">
                <div className="space-y-2.5" id="modal-desc-block">
                  <span className="text-xs font-bold text-slate-400 block">توضیحات خدمات</span>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-semibold" id="modal-desc">{activeServiceModal.description}</p>
                </div>

                <div className="space-y-4" id="modal-details-block">
                  <span className="text-xs font-bold text-slate-400 block">بخش‌های جزئی و مزایای درمان</span>
                  <div className="grid sm:grid-cols-2 gap-3" id="modal-details-grid">
                    {activeServiceModal.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100" id={`modal-detail-item-${idx}`}>
                        <Check className="w-4 h-4 text-teal-600 shrink-0 mt-1" />
                        <span className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-4" id="modal-pricing">
                  <div className="text-center sm:text-right" id="modal-price-lbl">
                    <p className="text-xs text-slate-500 font-bold">تعرفه تقریبی هزینه درمان</p>
                    <p className="text-base sm:text-lg font-black text-teal-700 mt-1">{activeServiceModal.priceEst}</p>
                  </div>
                  <div className="text-xs text-slate-400 font-bold" id="modal-installments-badge">
                    امکان پرداخت اقساطی بلندمدت با چک صیادی
                  </div>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3" id="modal-actions">
                <button 
                  id="btn-modal-cancel"
                  onClick={() => setActiveServiceModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors"
                >
                  انصراف
                </button>
                <button 
                  id="btn-modal-book"
                  onClick={() => {
                    onSelectServiceAndBook(activeServiceModal);
                    setActiveServiceModal(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  رزرو نوبت برای این خدمت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
