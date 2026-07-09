import React, { useState, useCallback } from "react";
import ReactQuill from "react-quill-new";
import { Sparkles, Loader2, Languages, Wand2, Type } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  topic?: string;
  category?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ direction: "rtl" }],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "direction",
  "align",
  "link",
  "image",
  "video",
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  topic,
  category,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const handleAiAction = useCallback(async (mode: "refine" | "continue", tone: string = "specialized") => {
    setIsGenerating(true);
    setShowAiMenu(false);
    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          tone,
          existingContent: value,
          topic,
          category
        }),
      });

      const data = await response.json();
      if (data.content) {
        // If continue, append. If refine, replace.
        if (mode === "continue") {
          onChange(value + data.content);
        } else {
          onChange(data.content);
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [value, onChange, topic, category]);

  return (
    <div className="relative group">
      {/* AI Floating Button */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          onClick={() => setShowAiMenu(!showAiMenu)}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-mint-600 hover:bg-brand-mint-700 text-white rounded-full shadow-lg transition-all text-sm font-medium disabled:opacity-50"
          id="ai-magic-button"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>دستیار هوشمند (AI)</span>
        </button>

        <AnimatePresence>
          {showAiMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => handleAiAction("refine", "specialized")}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-sm transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-brand-mint-600" />
                  <span>بهبود و بازنویسی تخصصی</span>
                </button>
                <button
                  onClick={() => handleAiAction("refine", "friendly")}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-sm transition-colors"
                >
                  <Languages className="w-4 h-4 text-brand-mint-600" />
                  <span>تغییر لحن به دوستانه</span>
                </button>
                <button
                  onClick={() => handleAiAction("continue")}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-sm transition-colors"
                >
                  <Type className="w-4 h-4 text-brand-mint-600" />
                  <span>ادامه دادن متن خودکار</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "نوشتن محتوا را شروع کنید..."}
        className="bg-white dark:bg-slate-900 rounded-xl"
      />
      
      {isGenerating && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
          <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-brand-mint-600 animate-spin" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">هوش مصنوعی در حال نوشتن...</span>
          </div>
        </div>
      )}
    </div>
  );
};
