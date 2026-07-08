import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { toast, ToastMessage } from "../lib/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration || 4000);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div 
      id="toast-notifications-container"
      className="fixed bottom-5 left-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none text-right font-sans"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          let bgColor = "bg-white border-slate-200 text-slate-800 shadow-slate-200/50";
          let icon = <Info className="w-5 h-5 text-teal-500 shrink-0" />;

          if (t.type === "success") {
            bgColor = "bg-emerald-50 border-emerald-100 text-emerald-900 shadow-emerald-100/30";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
          } else if (t.type === "error") {
            bgColor = "bg-rose-50 border-rose-100 text-rose-900 shadow-rose-100/30";
            icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
          } else if (t.type === "warning") {
            bgColor = "bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/30";
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
          }

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              layout
              className={`pointer-events-auto border rounded-2xl p-4 shadow-xl flex items-start gap-3 justify-between ${bgColor}`}
            >
              <div className="flex gap-3 items-start flex-1" dir="rtl">
                {icon}
                <p className="text-xs sm:text-sm font-bold leading-relaxed pr-1">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100/55 transition-colors border-none bg-transparent cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
