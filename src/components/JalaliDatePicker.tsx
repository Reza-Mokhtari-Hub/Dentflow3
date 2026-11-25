import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { 
  gregorianToJalali, 
  jalaliToGregorian,
  getDaysInJalaliMonth, 
  getJalaliFirstDayOfWeekday, 
  JALALI_MONTH_NAMES, 
  toPersianDigits, 
  JalaliDate,
  formatJalaliToString,
  parseJalaliString
} from "../lib/jalali";

interface JalaliDatePickerProps {
  value: string; // "YYYY/MM/DD" format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disablePastDates?: boolean;
}

export default function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className = "",
  disablePastDates = false
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view state with the selected date, or today
  const [currentView, setCurrentView] = useState<JalaliDate>(() => {
    const parsed = parseJalaliString(value);
    if (parsed) return parsed;
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  });

  const [selectedDate, setSelectedDate] = useState<JalaliDate | null>(() => {
    return parseJalaliString(value);
  });

  // Sync state if prop changes externally
  useEffect(() => {
    const parsed = parseJalaliString(value);
    setSelectedDate(parsed);
    if (parsed) {
      setCurrentView(parsed);
    }
  }, [value]);

  // Click outside listener to close calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const todayJalali = (() => {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  })();

  const daysInMonth = getDaysInJalaliMonth(currentView.jy, currentView.jm);
  const firstDayIndex = getJalaliFirstDayOfWeekday(currentView.jy, currentView.jm);

  // Quick navigation handlers
  const handlePrevMonth = () => {
    setCurrentView((prev) => {
      if (prev.jm === 1) {
        return { jy: prev.jy - 1, jm: 12, jd: 1 };
      }
      return { ...prev, jm: prev.jm - 1, jd: 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentView((prev) => {
      if (prev.jm === 12) {
        return { jy: prev.jy + 1, jm: 1, jd: 1 };
      }
      return { ...prev, jm: prev.jm + 1, jd: 1 };
    });
  };

  const handleYearChange = (jy: number) => {
    setCurrentView((prev) => ({ ...prev, jy, jd: 1 }));
  };

  const handleMonthChange = (jm: number) => {
    setCurrentView((prev) => ({ ...prev, jm, jd: 1 }));
  };

  const handleDaySelect = (day: number) => {
    const selected: JalaliDate = { jy: currentView.jy, jm: currentView.jm, jd: day };
    
    // Check if selecting a past date is disabled
    if (disablePastDates) {
      const gSel = jalaliToGregorian(selected.jy, selected.jm, selected.jd);
      const selDateObj = new Date(gSel.gy, gSel.gm - 1, gSel.gd);
      const todayDateObj = new Date();
      todayDateObj.setHours(0, 0, 0, 0);
      if (selDateObj < todayDateObj) {
        return; // Do nothing for past dates
      }
    }

    setSelectedDate(selected);
    onChange(formatJalaliToString(selected));
    setIsOpen(false);
  };

  const selectToday = () => {
    setSelectedDate(todayJalali);
    setCurrentView(todayJalali);
    onChange(formatJalaliToString(todayJalali));
    setIsOpen(false);
  };

  // Generate Year options (current Jalali year +/- 5 years)
  const currentJalaliYear = todayJalali.jy;
  const yearsRange = Array.from({ length: 11 }, (_, i) => currentJalaliYear - 2 + i);

  // Generate blank spacer spaces before the 1st of the month
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Generate days range
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to determine if a specific day is a past date
  const isPastDate = (day: number) => {
    const gDay = jalaliToGregorian(currentView.jy, currentView.jm, day);
    const dayObj = new Date(gDay.gy, gDay.gm - 1, gDay.gd);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    return dayObj < todayObj;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate !== null &&
      selectedDate.jy === currentView.jy &&
      selectedDate.jm === currentView.jm &&
      selectedDate.jd === day
    );
  };

  const isToday = (day: number) => {
    return (
      todayJalali.jy === currentView.jy &&
      todayJalali.jm === currentView.jm &&
      todayJalali.jd === day
    );
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`} dir="rtl">
      {/* Date Field Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer flex items-center justify-between"
      >
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          value={selectedDate ? toPersianDigits(formatJalaliToString(selectedDate)) : ""}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-[#F8FCFC] border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-teal-500 focus:ring-2 cursor-pointer font-bold text-right"
        />
        <Calendar className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 left-0 sm:left-auto sm:w-[320px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-teal-950/10 p-4 animate-fade-in">
          {/* Calendar Header with month and year selectors */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-slate-500 hover:text-teal-600 cursor-pointer"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Selector Dropdowns */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <select
                  value={currentView.jm}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                  className="appearance-none bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-black px-2.5 py-1.5 pr-6 rounded-lg border border-teal-100/50 focus:outline-none cursor-pointer"
                >
                  {JALALI_MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute left-1.5 top-2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={currentView.jy}
                  onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                  className="appearance-none bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-black px-2.5 py-1.5 pr-6 rounded-lg border border-teal-100/50 focus:outline-none cursor-pointer"
                >
                  {yearsRange.map((yr) => (
                    <option key={yr} value={yr}>
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 absolute left-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-slate-500 hover:text-teal-600 cursor-pointer"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-black text-slate-400">
            <span>ش</span>
            <span>ی</span>
            <span>د</span>
            <span>س</span>
            <span>چ</span>
            <span>پ</span>
            <span>ج</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blanks */}
            {blanks.map((b) => (
              <div key={`blank-${b}`} className="w-full aspect-square" />
            ))}

            {/* Days list */}
            {days.map((day) => {
              const disabled = disablePastDates && isPastDate(day);
              const active = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  disabled={disabled}
                  onClick={() => handleDaySelect(day)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    disabled
                      ? "text-slate-300 bg-slate-50/40 line-through cursor-not-allowed"
                      : active
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 font-black"
                      : today
                      ? "bg-teal-50 text-teal-700 border-2 border-teal-500/50 font-black"
                      : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Today Button shortcut */}
          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center gap-2">
            <button
              type="button"
              onClick={selectToday}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-black transition-colors cursor-pointer"
            >
              امروز
            </button>
            <span className="text-[10px] text-slate-400 font-bold">
              امروز: {toPersianDigits(`${todayJalali.jy}/${todayJalali.jm}/${todayJalali.jd}`)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
