import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactQuill from "react-quill-new";
import { 
  Sparkles, Loader2, Languages, Wand2, Type, 
  Plus, Trash2, ArrowUp, ArrowDown, Heading2, Heading3, 
  AlignLeft, FileText, Image as ImageIcon, Video as VideoIcon, Quote, Split, 
  Check, Edit3, Layers, Settings, Code, Eye, RefreshCw,
  PlusCircle, MinusCircle, List, ListOrdered, HelpCircle, ArrowRightLeft,
  ChevronDown, ChevronUp, Copy, BookOpen, Heart, CheckCircle2, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  topic?: string;
  category?: string;
}

interface Block {
  id: string;
  type: "heading" | "text" | "quote" | "list" | "image" | "video" | "divider";
  value: any;
}

const presetDentalImages = [
  {
    title: "ایمپلنت دندان (مدل آموزشی)",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/59/Dental_implants_on_model.jpg"
  },
  {
    title: "جراحی ایمپلنت دندان",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Dental_implants.jpg"
  },
  {
    title: "ارتودنسی دندان (بندهای فلزی)",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/82/Dental_braces.jpg"
  },
  {
    title: "نمای نزدیک بریس‌های ارتودنسی",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Braces_closeup.jpg"
  },
  {
    title: "طراحی لبخند و بهداشت دهان",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/33/A_clean_dental_smile.jpg"
  },
  {
    title: "بلیچینگ و لمینت (سفید کردن)",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Teeth_whitening_smile.jpg"
  },
  {
    title: "مسواک زدن و پیشگیری",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Brushing_teeth.jpg"
  },
  {
    title: "دندانپزشکی اطفال و کودکان",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/77/Child_at_dentist_smiling.jpg"
  },
  {
    title: "یونیت دندانپزشکی کلینیک",
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Dental_chair_and_instruments_in_contemporary_operatory_clinic.jpg"
  },
  {
    title: "معاینه روتین دندانپزشک",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/05/Routine_dental_checkup.jpg"
  }
];

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

const genId = () => Math.random().toString(36).substring(2, 9);

// Parse HTML string to blocks array
function parseHtmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) {
    return [{ id: genId(), type: "text", value: "" }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const blocks: Block[] = [];

  if (body.children.length === 0) {
    return [{ id: genId(), type: "text", value: body.textContent || "" }];
  }

  for (let i = 0; i < body.children.length; i++) {
    const el = body.children[i];
    const tagName = el.tagName.toUpperCase();

    if (tagName === "H2" || tagName === "H1") {
      blocks.push({
        id: genId(),
        type: "heading",
        value: { text: el.textContent || "", level: "h2" }
      });
    } else if (tagName === "H3" || tagName === "H4" || tagName === "H5" || tagName === "H6") {
      blocks.push({
        id: genId(),
        type: "heading",
        value: { text: el.textContent || "", level: "h3" }
      });
    } else if (tagName === "P") {
      // Clean up empty lines or keep text
      blocks.push({
        id: genId(),
        type: "text",
        value: el.innerHTML || el.textContent || ""
      });
    } else if (tagName === "BLOCKQUOTE") {
      const cite = el.querySelector("cite");
      const author = cite ? cite.textContent?.replace(/^—\s*/, "") || "" : (el.getAttribute("data-author") || "");
      // Extract quote text excluding cite text if present
      let text = el.textContent || "";
      if (cite && cite.textContent) {
        text = text.replace(cite.textContent, "").trim();
      }
      text = text.replace(/^—\s*/, "").trim();
      blocks.push({
        id: genId(),
        type: "quote",
        value: { text, author }
      });
    } else if (tagName === "UL") {
      const items = Array.from(el.querySelectorAll("li")).map(li => li.innerHTML || li.textContent || "");
      blocks.push({
        id: genId(),
        type: "list",
        value: { items: items.length ? items : [""], listType: "bullet" }
      });
    } else if (tagName === "OL") {
      const items = Array.from(el.querySelectorAll("li")).map(li => li.innerHTML || li.textContent || "");
      blocks.push({
        id: genId(),
        type: "list",
        value: { items: items.length ? items : [""], listType: "ordered" }
      });
    } else if (tagName === "IMG") {
      blocks.push({
        id: genId(),
        type: "image",
        value: { url: el.getAttribute("src") || "", caption: el.getAttribute("alt") || "" }
      });
    } else if (el.classList.contains("dental-video-container") || tagName === "IFRAME" || tagName === "VIDEO") {
      const iframe = el.querySelector("iframe") || (tagName === "IFRAME" ? el : null);
      const video = el.querySelector("video") || (tagName === "VIDEO" ? el : null);
      const url = iframe ? iframe.getAttribute("src") : (video ? video.getAttribute("src") : "");
      blocks.push({
        id: genId(),
        type: "video",
        value: { url: url || "", caption: el.nextElementSibling?.textContent || el.textContent?.trim() || "" }
      });
    } else if (tagName === "HR") {
      blocks.push({
        id: genId(),
        type: "divider",
        value: null
      });
    } else {
      blocks.push({
        id: genId(),
        type: "text",
        value: el.innerHTML || el.textContent || ""
      });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ id: genId(), type: "text", value: "" });
  }

  return blocks;
}

// Convert blocks array back to clean semantic HTML
function serializeBlocksToHtml(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case "heading": {
        const level = block.value?.level || "h2";
        const text = block.value?.text || "";
        return `<${level}>${text}</${level}>`;
      }
      case "text":
        return `<p>${block.value || ""}</p>`;
      case "quote": {
        const text = block.value?.text || "";
        const author = block.value?.author || "";
        const authorAttr = author ? ` data-author="${author}"` : "";
        return `<blockquote${authorAttr}><p>${text}</p>${author ? `<cite>— ${author}</cite>` : ""}</blockquote>`;
      }
      case "list": {
        const tag = block.value?.listType === "ordered" ? "ol" : "ul";
        const items = (block.value?.items || [""]).map((it: string) => `<li>${it}</li>`).join("");
        return `<${tag}>${items}</${tag}>`;
      }
      case "image": {
        const url = block.value?.url || "";
        const caption = block.value?.caption || "";
        return `<img src="${url}" alt="${caption}" style="max-width:100%; border-radius:12px; margin: 16px 0; display: block;" />`;
      }
      case "video": {
        const url = block.value?.url || "";
        const caption = block.value?.caption || "";
        return `<div class="dental-video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; margin: 16px 0;"><iframe src="${url}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div><p style="text-align:center; font-size:12px; color:#64748b; margin-top:-8px;">${caption}</p>`;
      }
      case "divider":
        return `<hr style="border:0; border-top: 1px dashed #cbd5e1; margin: 24px 0;" />`;
      default:
        return "";
    }
  }).join("\n");
}

const QuillComponent = ReactQuill as any;

interface AutoResizingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = ({ value, onChange, className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      adjustHeight();
    }, 10);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      className={`${className} overflow-hidden resize-none whitespace-pre-wrap break-words`}
      {...props}
    />
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  topic,
  category,
}) => {
  const [editorMode, setEditorMode] = useState<"block" | "simple">("block");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [blockAiLoading, setBlockAiLoading] = useState<string>("");

  // Custom states for fast image insertion and auto-save
  const quillRef = useRef<any>(null);
  const [showGalleryPopover, setShowGalleryPopover] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [hasBackup, setHasBackup] = useState(false);
  const [backupContent, setBackupContent] = useState<string>("");
  const [backupTopic, setBackupTopic] = useState<string>("");
  const [backupTime, setBackupTime] = useState<string>("");

  const [isEditorDark, setIsEditorDark] = useState(() => {
    return document.documentElement.classList.contains("dark") || localStorage.getItem("df_dark_theme") === "true";
  });

  // Keep editor theme state in perfect sync with the document root's theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsEditorDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const themeBtn = document.getElementById("theme-toggle-floating");
    if (themeBtn) {
      themeBtn.click();
    } else {
      const root = document.getElementById("main-container");
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        document.documentElement.classList.remove("dark");
        root?.classList.remove("dark");
        localStorage.setItem("df_dark_theme", "false");
        setIsEditorDark(false);
      } else {
        document.documentElement.classList.add("dark");
        root?.classList.add("dark");
        localStorage.setItem("df_dark_theme", "true");
        setIsEditorDark(true);
      }
    }
  };

  // Sync value with blocks on mount / load (only if we don't have a backup restored)
  useEffect(() => {
    const parsed = parseHtmlToBlocks(value);
    setBlocks(parsed);
  }, [value]);

  // Check for auto-saved draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dental_editor_autosave");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.content && parsed.content.trim() !== value.trim()) {
          setBackupContent(parsed.content);
          setBackupTopic(parsed.topic || "");
          setBackupTime(parsed.time || "");
          setHasBackup(true);
        }
      }
    } catch (err) {
      console.error("Failed to load autosave from localStorage:", err);
    }
  }, []);

  // Perform Auto-save into localStorage when value changes
  useEffect(() => {
    if (!value || value.trim() === "<p><br></p>" || value.trim() === "") return;
    
    const timeoutId = setTimeout(() => {
      try {
        const data = {
          content: value,
          topic: topic || "",
          time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        };
        localStorage.setItem("dental_editor_autosave", JSON.stringify(data));
        setLastSavedTime(data.time);
      } catch (err) {
        console.error("Failed to autosave:", err);
      }
    }, 1200); // 1.2s debounce to avoid excessive storage writes
    
    return () => clearTimeout(timeoutId);
  }, [value, topic]);

  // Insert image function that supports both traditional Quill and blocks
  const handleInsertGalleryImage = (url: string, title: string) => {
    if (editorMode === "simple") {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        const index = range ? range.index : editor.getLength();
        
        // Insert image embed
        editor.insertEmbed(index, "image", url, "user");
        
        // Insert clean helper text below image
        editor.insertText(index + 1, `\n[تصویر: ${title}]\n`, "user");
        editor.setSelection(index + 2);
      } else {
        // Fallback: append
        const imgHtml = `<img src="${url}" alt="${title}" style="max-width:100%; border-radius:12px; margin: 16px 0; display: block;" /><p style="text-align:center; font-size:12px; color:#64748b; margin-top:-8px;">${title}</p>`;
        onChange(value + imgHtml);
      }
    } else {
      // Block mode: append a new image block with preset
      const newBlock: Block = {
        id: genId(),
        type: "image",
        value: { url, caption: title }
      };
      updateBlocksState([...blocks, newBlock]);
    }
    setShowGalleryPopover(false);
  };

  // Handle saving and triggering onChange
  const updateBlocksState = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    const html = serializeBlocksToHtml(newBlocks);
    onChange(html);
  };

  const handleBlockChange = (id: string, updatedValue: any) => {
    const updated = blocks.map(b => b.id === id ? { ...b, value: updatedValue } : b);
    updateBlocksState(updated);
  };

  const addBlock = (type: Block["type"], index?: number) => {
    let defaultValue: any = "";
    if (type === "heading") {
      defaultValue = { text: "", level: "h2" };
    } else if (type === "quote") {
      defaultValue = { text: "", author: "" };
    } else if (type === "list") {
      defaultValue = { items: [""], listType: "bullet" };
    } else if (type === "image") {
      defaultValue = { url: "", caption: "" };
    } else if (type === "video") {
      defaultValue = { url: "", caption: "" };
    }

    const newBlock: Block = {
      id: genId(),
      type,
      value: defaultValue
    };

    let updated: Block[];
    if (typeof index === "number") {
      updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
    } else {
      updated = [...blocks, newBlock];
    }
    updateBlocksState(updated);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      updateBlocksState([{ id: genId(), type: "text", value: "" }]);
      return;
    }
    const updated = blocks.filter(b => b.id !== id);
    updateBlocksState(updated);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const updated = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updateBlocksState(updated);
  };

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

  // Block level AI Assist
  const handleBlockAiAction = async (blockId: string, blockType: string, action: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    let textToRefine = "";
    if (blockType === "text") textToRefine = block.value;
    else if (blockType === "heading") textToRefine = block.value?.text || "";
    else if (blockType === "quote") textToRefine = block.value?.text || "";
    else return;

    setBlockAiLoading(blockId);
    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "refine",
          tone: action === "professional" ? "specialized" : "friendly",
          existingContent: textToRefine,
          topic: topic || "مباحث تخصصی دندانپزشکی",
          category: category || "علمی"
        }),
      });

      const data = await response.json();
      if (data.content) {
        // Remove HTML tags for simple text values
        let cleanedContent = data.content.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (blockType === "heading") {
          handleBlockChange(blockId, { ...block.value, text: cleanedContent });
        } else if (blockType === "quote") {
          handleBlockChange(blockId, { ...block.value, text: cleanedContent });
        } else {
          handleBlockChange(blockId, cleanedContent);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlockAiLoading("");
    }
  };

  const addListItem = (blockId: string, listIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== "list") return;

    const items = [...block.value.items];
    items.splice(listIndex + 1, 0, "");
    handleBlockChange(blockId, { ...block.value, items });
  };

  const removeListItem = (blockId: string, listIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== "list") return;

    const items = block.value.items.filter((_: any, idx: number) => idx !== listIndex);
    handleBlockChange(blockId, { ...block.value, items: items.length ? items : [""] });
  };

  const updateListItem = (blockId: string, listIndex: number, text: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== "list") return;

    const items = [...block.value.items];
    items[listIndex] = text;
    handleBlockChange(blockId, { ...block.value, items });
  };

  return (
    <div className="relative group w-full flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden" dir="rtl">
      {/* Auto-save Draft Restore Alert */}
      {hasBackup && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-55 dark:from-slate-900 dark:to-slate-900 border-b border-amber-200 dark:border-amber-900/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 z-20">
          <div className="flex items-start sm:items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-505 animate-pulse shrink-0 mt-1 sm:mt-0" />
            <span>
              یک نسخه پیش‌نویس ذخیره‌شده خودکار از ساعت <strong>{backupTime}</strong> {backupTopic && <>برای موضوع «<strong>{backupTopic}</strong>»</>} پیدا شد که با متن کنونی شما تفاوت دارد.
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                onChange(backupContent);
                const parsed = parseHtmlToBlocks(backupContent);
                setBlocks(parsed);
                setHasBackup(false);
                localStorage.removeItem("dental_editor_autosave");
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm text-[11px]"
            >
              بازیابی پیش‌نویس
            </button>
            <button
              type="button"
              onClick={() => {
                setHasBackup(false);
                localStorage.removeItem("dental_editor_autosave");
              }}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer text-[11px]"
            >
              نادیده گرفتن
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Sub-header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setEditorMode("block");
                const parsed = parseHtmlToBlocks(value);
                setBlocks(parsed);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editorMode === "block"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ویرایشگر بلوکی (پیشرفته)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditorMode("simple");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editorMode === "simple"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>ویرایشگر سنتی (HTML)</span>
            </button>
          </div>

          {/* Autosave Status indicator */}
          <div className="flex items-center gap-2 text-[10px] font-bold">
            {lastSavedTime ? (
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ذخیره خودکار در {lastSavedTime}
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg">
                آماده ذخیره خودکار
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Action Buttons: Quick Image + AI */}
        <div className="relative flex items-center gap-2">
          {/* Quick Insert Image Gallery */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGalleryPopover(!showGalleryPopover)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 text-slate-700 dark:text-slate-250 rounded-xl shadow-xs hover:shadow-sm transition-all text-xs font-bold cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span>درج سریع تصویر</span>
            </button>

            <AnimatePresence>
              {showGalleryPopover && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-30"
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">گالری تصاویر دندانپزشکی</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">روی تصویر کلیک کنید تا در جا به سند افزوده شود.</p>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto grid grid-cols-2 gap-1.5">
                    {presetDentalImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInsertGalleryImage(img.url, img.title)}
                        className="group/item flex flex-col gap-1 p-1 bg-slate-50 hover:bg-teal-50/50 dark:bg-slate-900/50 dark:hover:bg-teal-950/10 border border-slate-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-900 rounded-xl transition-all cursor-pointer text-right"
                      >
                        <div className="h-16 w-full rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                          <img
                            src={img.url}
                            alt={img.title}
                            className="h-full w-full object-cover group-hover/item:scale-105 transition-all"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 truncate w-full block px-1">
                          {img.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick theme toggle inside Admin / Editor */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title={isEditorDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک"}
          >
            {isEditorDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* AI Assistance Button */}
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl shadow-sm transition-all text-xs font-extrabold disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>کمک هوش مصنوعی (AI)</span>
          </button>

          <AnimatePresence>
            {showAiMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-30"
              >
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleAiAction("refine", "specialized")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-xs transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                    <span>بهبود و بازنویسی علمی کل متن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiAction("refine", "friendly")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-xs transition-colors cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5 text-teal-500" />
                    <span>تغییر لحن مقاله به زبان ساده</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiAction("continue")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-right text-xs transition-colors cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-teal-500" />
                    <span>ادامه دادن نگارش متن خودکار</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/40">
        {editorMode === "simple" ? (
          /* TRADITIONAL QUILL EDITOR WITH PREMIUM OVERRIDES */
          <div className="premium-quill-wrapper flex-1 flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
            <QuillComponent
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={onChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder || "نوشتن محتوا را در اینجا آغاز کنید..."}
              className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900"
            />
          </div>
        ) : (
          /* ADVANCED BLOCK-BASED EDITOR */
          <div className="flex-1 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full pr-1 pb-10">
            {blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 p-4 transition-all group/block"
              >
                {/* Block Controls Panel */}
                <div className="absolute left-3 top-3 opacity-0 group-hover/block:opacity-100 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, "up")}
                    disabled={index === 0}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, "down")}
                    disabled={index === blocks.length - 1}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="حذف این بلوک"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Block Header */}
                <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 dark:text-slate-500">
                  {block.type === "heading" && <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded flex items-center gap-1"><Heading2 className="w-3 h-3" />سرعنوان</span>}
                  {block.type === "text" && <span className="bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-400 px-2 py-0.5 rounded flex items-center gap-1"><AlignLeft className="w-3 h-3" />پاراگراف متنی</span>}
                  {block.type === "quote" && <span className="bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded flex items-center gap-1"><Quote className="w-3 h-3" />نقل قول / کادر طلایی</span>}
                  {block.type === "list" && <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400 px-2 py-0.5 rounded flex items-center gap-1"><List className="w-3 h-3" />لیست مطالب</span>}
                  {block.type === "image" && <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3" />تصویر ضمیمه دندانپزشکی</span>}
                  {block.type === "video" && <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded flex items-center gap-1"><VideoIcon className="w-3 h-3" />ویدیو آموزشی</span>}
                  {block.type === "divider" && <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded flex items-center gap-1"><Split className="w-3 h-3" />خط جداکننده</span>}
                  <span className="font-mono">#{index + 1}</span>
                </div>

                {/* Render specific inputs based on block.type */}
                <div className="space-y-3">
                  {block.type === "heading" && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={block.value?.level || "h2"}
                        onChange={(e) => handleBlockChange(block.id, { ...block.value, level: e.target.value })}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="h2">سرعنوان بزرگ (H2)</option>
                        <option value="h3">سرعنوان متوسط (H3)</option>
                      </select>
                      <input
                        type="text"
                        value={block.value?.text || ""}
                        onChange={(e) => handleBlockChange(block.id, { ...block.value, text: e.target.value })}
                        placeholder="عنوان بخش یا سوال فرعی را بنویسید..."
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold focus:outline-none focus:border-teal-500 bg-transparent"
                      />
                    </div>
                  )}

                  {block.type === "text" && (
                    <div className="relative">
                      <AutoResizingTextarea
                        value={block.value || ""}
                        onChange={(val) => handleBlockChange(block.id, val)}
                        placeholder="توضیحات و محتوای علمی خود را در این پاراگراف بنویسید..."
                        className="w-full px-3 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-teal-500 bg-transparent min-h-[80px] leading-relaxed resize-none"
                      />
                      {/* Block-level AI assistant icon */}
                      <button
                        type="button"
                        onClick={() => handleBlockAiAction(block.id, "text", "professional")}
                        disabled={blockAiLoading === block.id || !block.value}
                        className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-950 dark:text-teal-400 rounded-md text-[10px] font-black transition-all disabled:opacity-50 cursor-pointer"
                        title="پردازش و زیباتر کردن متن با هوش مصنوعی"
                      >
                        {blockAiLoading === block.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>بازنویسی حرفه‌ای (AI)</span>
                      </button>
                    </div>
                  )}

                  {block.type === "quote" && (
                    <div className="space-y-2 p-3 bg-teal-50/50 dark:bg-teal-950/10 rounded-xl border-r-4 border-teal-500">
                      <AutoResizingTextarea
                        value={block.value?.text || ""}
                        onChange={(val) => handleBlockChange(block.id, { ...block.value, text: val })}
                        placeholder="نقل قول برجسته یا پیام کلیدی علمی را وارد کنید..."
                        className="w-full bg-transparent border-none text-sm text-teal-900 dark:text-teal-200 focus:outline-none font-medium leading-relaxed resize-none min-h-[60px]"
                      />
                      <div className="flex justify-between items-center">
                        <input
                          type="text"
                          value={block.value?.author || ""}
                          onChange={(e) => handleBlockChange(block.id, { ...block.value, author: e.target.value })}
                          placeholder="نام نویسنده/منبع (مثال: دکتر احمدی)"
                          className="px-2 py-1 bg-white/75 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none font-bold text-slate-700 dark:text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleBlockAiAction(block.id, "quote", "friendly")}
                          disabled={blockAiLoading === block.id || !block.value?.text}
                          className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-teal-700 border border-teal-200 rounded-md text-[9px] font-black transition-all cursor-pointer"
                        >
                          {blockAiLoading === block.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          <span>اصلاح متن (AI)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === "list" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleBlockChange(block.id, { ...block.value, listType: "bullet" })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            block.value?.listType === "bullet"
                              ? "bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>لیست نشانه‌دار (بالت)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockChange(block.id, { ...block.value, listType: "ordered" })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            block.value?.listType === "ordered"
                              ? "bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>لیست شماره‌دار</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(block.value?.items || [""]).map((item: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 w-4 text-center">
                              {block.value?.listType === "ordered" ? `${idx + 1}.` : "•"}
                            </span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateListItem(block.id, idx, e.target.value)}
                              placeholder={`مورد شماره ${idx + 1} لیست...`}
                              className="flex-1 px-3 py-1 border border-slate-100 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => addListItem(block.id, idx)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal-600 rounded transition-colors cursor-pointer"
                              title="افزودن سطر جدید بعد از این"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeListItem(block.id, idx)}
                              disabled={block.value?.items?.length <= 1}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition-colors disabled:opacity-30 cursor-pointer"
                              title="حذف این سطر"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === "image" && (
                    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400">آدرس مستقیم تصویر (بدون تحریم و فیلتر):</label>
                          <input
                            type="text"
                            value={block.value?.url || ""}
                            onChange={(e) => handleBlockChange(block.id, { ...block.value, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-800 text-left"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400">توضیح یا زیرنویس تصویر (کپشن):</label>
                          <input
                            type="text"
                            value={block.value?.caption || ""}
                            onChange={(e) => handleBlockChange(block.id, { ...block.value, caption: e.target.value })}
                            placeholder="زیرنویس کوتاه مرتبط با تصویر..."
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      {/* Clinic Stock Preset Selector */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-teal-600 block">انتخاب سریع از تصاویر باکیفیت و بدون فیلتر ویکی‌مدیا:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {presetDentalImages.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleBlockChange(block.id, { ...block.value, url: preset.url, caption: preset.title })}
                              className={`p-1.5 bg-white dark:bg-slate-800 border text-[9px] font-black rounded-lg transition-all text-center hover:border-teal-500 hover:text-teal-600 truncate cursor-pointer ${
                                block.value?.url === preset.url ? "border-teal-600 text-teal-600 bg-teal-50/55 dark:bg-teal-950/20" : "border-slate-150 text-slate-500"
                              }`}
                              title={preset.title}
                            >
                              {preset.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image Preview Box */}
                      {block.value?.url && (
                        <div className="relative mt-2 h-28 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-white shadow-inner">
                          <img
                            src={block.value.url}
                            alt={block.value.caption || "پیش‌نمایش"}
                            className="h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // If image fails to load, show beautiful fallback icon
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                          <div className="img-fallback hidden flex-col items-center gap-1 text-rose-500 text-[10px] font-bold">
                            <HelpCircle className="w-6 h-6" />
                            <span>آدرس تصویر نامعتبر است یا لود نشد</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === "video" && (
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400">لینک امبد ویدیو (آپارات یا یوتیوب):</label>
                          <input
                            type="text"
                            value={block.value?.url || ""}
                            onChange={(e) => handleBlockChange(block.id, { ...block.value, url: e.target.value })}
                            placeholder="https://aparat.com/video/embed/..."
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-800 text-left"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400">توضیح زیر ویدیو:</label>
                          <input
                            type="text"
                            value={block.value?.caption || ""}
                            onChange={(e) => handleBlockChange(block.id, { ...block.value, caption: e.target.value })}
                            placeholder="توضیح کوتاه درباره موضوع ویدیو..."
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === "divider" && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                      <span className="px-3 text-[9px] font-bold text-slate-400 uppercase shrink-0">جداکننده موضوعی</span>
                      <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                    </div>
                  )}
                </div>

                {/* Inline plus button to insert block exactly here */}
                <div className="absolute -bottom-4 right-1/2 translate-x-1/2 opacity-0 group-hover/block:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity z-20 flex gap-1 items-center bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[8px] font-bold text-slate-400 ml-1.5">درج بلوک جدید:</span>
                  <button
                    type="button"
                    onClick={() => addBlock("text", index)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-sky-600 hover:text-sky-700 rounded-md text-[9px] font-bold cursor-pointer"
                  >
                    + متن
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("heading", index)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-600 hover:text-amber-700 rounded-md text-[9px] font-bold cursor-pointer"
                  >
                    + سرعنوان
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("quote", index)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-600 hover:text-teal-700 rounded-md text-[9px] font-bold cursor-pointer"
                  >
                    + نقل‌قول
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("list", index)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 hover:text-indigo-700 rounded-md text-[9px] font-bold cursor-pointer"
                  >
                    + لیست
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("image", index)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 hover:text-emerald-700 rounded-md text-[9px] font-bold cursor-pointer"
                  >
                    + تصویر
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Quick Append Buttons at the end */}
            <div className="pt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => addBlock("text")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-sky-50 dark:bg-slate-900 hover:text-sky-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>+ بند متنی جدید</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("heading")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-amber-50 dark:bg-slate-900 hover:text-amber-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <Heading3 className="w-3.5 h-3.5" />
                <span>+ سرعنوان جدید</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("quote")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-teal-50 dark:bg-slate-900 hover:text-teal-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
                <span>+ نقل‌قول طلایی</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("list")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-900 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <List className="w-3.5 h-3.5" />
                <span>+ لیست جدید</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("image")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-900 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>+ تصویر دندانپزشکی</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("video")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-900 hover:text-rose-600 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>+ ویدیو آموزشی</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("divider")}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-850 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>+ جداکننده</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generating Indicator Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-40">
          <div className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="text-sm font-black text-slate-700 dark:text-slate-250 animate-pulse">هوش مصنوعی در حال بازنویسی و نگارش متن...</span>
          </div>
        </div>
      )}
    </div>
  );
};
