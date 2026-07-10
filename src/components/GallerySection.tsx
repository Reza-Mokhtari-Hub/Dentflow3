import React, { useState, useEffect, useRef } from "react";
import { Sliders, Check, ArrowLeft } from "lucide-react";
import { smileCases as defaultSmileCases } from "../data";

interface GallerySectionProps {
  smileCases?: any[];
}

export default function GallerySection({ smileCases: propSmileCases }: GallerySectionProps) {
  const activeSmileCases = propSmileCases && propSmileCases.length > 0 ? propSmileCases : defaultSmileCases;
  const [selectedCase, setSelectedCase] = useState(activeSmileCases[0]);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage of before/after split
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Synchronize selectedCase when dynamic activeSmileCases array changes (e.g. loaded from server)
  useEffect(() => {
    if (activeSmileCases && activeSmileCases.length > 0) {
      const found = activeSmileCases.find(c => c.id === selectedCase?.id) || activeSmileCases[0];
      setSelectedCase(found);
    }
  }, [activeSmileCases]);

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  if (!selectedCase) return null;

  return (
    <section id="gallery" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16" id="gallery-header">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100" id="gallery-badge">
          <span>دیدن قبل و بعد تفاوت را آشکار می‌کند</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900" id="gallery-title">معجزه طراحی لبخند در کلینیک دنت فلو</h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold" id="gallery-desc">
          با موس یا لمس دست، اسلایدر وسط تصویر زیر را به چپ و راست حرکت دهید تا تفاوت فوق‌العاده کیفیت کار قبل و بعد از درمان بیماران ما را به وضوح مقایسه کنید.
        </p>
      </div>

      {/* Clinical category selector */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10" id="gallery-filters">
        {activeSmileCases.map((smileCase) => (
          <button
            key={smileCase.id}
            id={`btn-case-${smileCase.id}`}
            onClick={() => {
              setSelectedCase(smileCase);
              setSliderPosition(50);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              selectedCase?.id === smileCase.id 
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/15" 
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 border border-slate-200"
            }`}
          >
            {smileCase.title.split(" با ")[1] || smileCase.title}
          </button>
        ))}
      </div>

      {/* Master Double Bento Grid for Gallery Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="gallery-showcase">
        
        {/* Card A: Interactive comparison image frame (Spans 8 Columns) */}
        <div 
          className="lg:col-span-8 bg-white border border-white p-4 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-center min-h-[350px]"
          id="slider-col"
        >
          <div 
            ref={sliderRef}
            className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg select-none cursor-ew-resize border border-slate-100"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            id="interactive-slider-frame"
          >
            {/* AFTER image (Full background) */}
            <img 
              src={selectedCase.afterUrl} 
              alt="بعد از درمان دندانپزشکی" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={selectedCase.afterFilter ? { filter: selectedCase.afterFilter } : undefined}
              id="img-after"
              referrerPolicy="no-referrer"
            />
            
            {/* Visual Label After */}
            <div className="absolute bottom-4 left-4 z-20 bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm" id="badge-after">بعد از درمان</div>

            {/* BEFORE image (Left clipping side) */}
            <div 
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              id="img-before-wrapper"
            >
              <img 
                src={selectedCase.beforeUrl} 
                alt="قبل از درمان دندانپزشکی" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={selectedCase.beforeFilter ? { filter: selectedCase.beforeFilter } : undefined}
                id="img-before"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Visual Label Before */}
            <div className="absolute bottom-4 right-4 z-20 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm" id="badge-before">قبل از درمان</div>

            {/* Drag Handle Bar */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-30"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              id="drag-bar"
            >
              {/* Circular Button center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-teal-600 hover:text-teal-700 transition-colors" id="drag-handle-circle">
                <Sliders className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Case details and reservation bridge (Spans 4 Columns) */}
        <div 
          className="lg:col-span-4 bg-white/80 backdrop-blur-md border border-white/60 p-8 rounded-[32px] shadow-xl shadow-teal-950/5 flex flex-col justify-between text-right"
          id="case-details-col"
        >
          <div className="space-y-4">
            <span className="inline-block text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100" id="case-category">
              دسته: {selectedCase.category === "laminate" ? "لمینت سرامیکی" : selectedCase.category === "composite" ? "ونیر کامپوزیت" : selectedCase.category === "ortho" ? "ارتودنسی دیجیتال" : "بلیچینگ مطبی"}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900" id="case-title">{selectedCase.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-semibold" id="case-desc">{selectedCase.description}</p>
            
            <div className="pt-4 border-t border-slate-100 space-y-3" id="case-features">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="case-feat-1">
                <Check className="w-4 h-4 text-teal-500 shrink-0" />
                <span>تضمین ثبات رنگ کامل بدون تغییر</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="case-feat-2">
                <Check className="w-4 h-4 text-teal-500 shrink-0" />
                <span>طراحی بر اساس زوایای طلایی فک و چهره</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="case-feat-3">
                <Check className="w-4 h-4 text-teal-500 shrink-0" />
                <span>قابلیت لمس طبیعی و تمیزپذیری آسان</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100" id="case-action">
            <a 
              id="btn-case-booking"
              href="#booking" 
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-teal-600 hover:text-teal-700"
            >
              مشاوره تخصصی و رزرو نوبت مشابه
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
