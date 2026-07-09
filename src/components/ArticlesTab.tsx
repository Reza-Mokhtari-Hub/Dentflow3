import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import DOMPurify from "dompurify";
import { RichTextEditor } from "./RichTextEditor";
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Check, 
  Calendar, 
  Clock, 
  Search, 
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Eye,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Minus,
  Info,
  RotateCcw,
  Upload,
  Globe,
  HelpCircle,
  CheckCircle,
  Bookmark,
  ChevronLeft
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl: string;
  content?: string;
}

interface ArticlesTabProps {
  articles: BlogPost[];
  setArticles: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  useLocalDb: boolean;
  adminToken?: string | null;
}

// Curated beautiful clinic-related Unsplash photos that the user can pick
const unsplashStockPhotos = [
  {
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop",
    title: "کلینیک مدرن دنت فلو",
    desc: "تصویر باکیفیت از کابین دندانپزشکی لوکس و تجهیزات دیجیتال"
  },
  {
    url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=800&auto=format&fit=crop",
    title: "کیت ایمپلنت و ابزار دیجیتال",
    desc: "تصویر زوم و دقیق از تجهیزات و ابزارآلات لوکس معاینه"
  },
  {
    url: "https://images.unsplash.com/photo-1579684389782-64d84b5e901d?q=80&w=800&auto=format&fit=crop",
    title: "طرح لبخند و بهداشت دندان",
    desc: "پرتره کلوزآپ از لبخند سفید سرامیکی و دندان‌های درخشان"
  },
  {
    url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=800&auto=format&fit=crop",
    title: "اسکن سه بعدی دیجیتال فک",
    desc: "شبیه‌سازی طرح درمان لبخند با نرم‌افزارهای سه بعدی"
  },
  {
    url: "https://images.unsplash.com/photo-1512223792601-592a9809eed4?q=80&w=800&auto=format&fit=crop",
    title: "دندانپزشکی اطفال و کودکان",
    desc: "محیطی شاداب و صمیمی برای درمان بدون ترس کودکان"
  },
  {
    url: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=800&auto=format&fit=crop",
    title: "پزشک دندانپزشک متخصص",
    desc: "تصویر صمیمی و مطمئن از پزشک آماده برای ارائه خدمات"
  }
];

// Reusable Content rendering function supporting both Markdown and HTML
export function renderMarkdown(contentStr: string) {
  if (!contentStr) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs font-bold space-y-1">
        <FileText className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
        <p>محتوای مقاله خالی است. نوشتن متن را آغاز کنید.</p>
      </div>
    );
  }

  // Detect if content is HTML (likely from RichTextEditor) or Markdown
  const isHtml = contentStr.trim().startsWith("<") || contentStr.includes("</");

  if (isHtml) {
    return (
      <div 
        className="prose prose-slate max-w-none w-full overflow-hidden text-right font-medium text-slate-700 leading-relaxed text-xs sm:text-sm md:text-base rtl-html-content"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentStr) }}
        style={{ direction: "rtl", textAlign: "right" }}
      />
    );
  }

  // Fallback to legacy Markdown renderer for existing posts
  const lines = contentStr.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "bullet" | "number"; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (!currentList) return;
    if (currentList.type === "bullet") {
      elements.push(
        <ul key={`list-${key}`} className="list-disc list-inside mr-5 my-3.5 space-y-1.5 text-slate-700 leading-relaxed text-xs sm:text-sm text-right" style={{ direction: "rtl" }}>
          {currentList.items.map((it, idx) => (
            <li key={idx} className="relative pr-5 list-none">
              <span className="absolute right-0 top-2.5 w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              {parseInlineMarkdown(it)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${key}`} className="mr-5 my-3.5 space-y-1.5 text-slate-700 leading-relaxed text-xs sm:text-sm text-right list-decimal" style={{ direction: "rtl" }}>
          {currentList.items.map((it, idx) => (
            <li key={idx} className="pr-1 font-bold text-teal-700">
              <span className="font-normal text-slate-700">{parseInlineMarkdown(it)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  const parseInlineMarkdown = (text: string) => {
    let parts: React.ReactNode[] = [];
    let currentIdx = 0;
    
    // Bold, italic, inline code regexes
    const boldItalicRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
    let match;
    let keyIdx = 0;

    while ((match = boldItalicRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > currentIdx) {
        parts.push(text.substring(currentIdx, matchIndex));
      }

      if (match[1]) { // Bold
        parts.push(<strong key={keyIdx++} className="font-black text-slate-900 bg-teal-50/40 px-1 rounded">{match[2]}</strong>);
      } else if (match[3]) { // Italic
        parts.push(<em key={keyIdx++} className="italic text-slate-800 underline decoration-slate-200">{match[4]}</em>);
      } else if (match[5]) { // Code
        parts.push(<code key={keyIdx++} className="px-1.5 py-0.5 bg-slate-100 text-teal-800 rounded font-mono text-xs border border-slate-200/55">{match[6]}</code>);
      }

      currentIdx = boldItalicRegex.lastIndex;
    }

    if (currentIdx < text.length) {
      parts.push(text.substring(currentIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check custom callouts first
    if (line.startsWith("> [!INFO]")) {
      flushList(i);
      // read subsequent text
      let text = line.substring(9).trim();
      elements.push(
        <div key={`callout-info-${i}`} className="my-4 p-4 bg-teal-50/50 border-r-4 border-teal-500 rounded-l-2xl text-xs sm:text-sm text-teal-900 font-bold flex items-start gap-2.5">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInlineMarkdown(text)}</div>
        </div>
      );
      continue;
    }

    if (line.startsWith("> [!SUCCESS]")) {
      flushList(i);
      let text = line.substring(12).trim();
      elements.push(
        <div key={`callout-success-${i}`} className="my-4 p-4 bg-emerald-50/50 border-r-4 border-emerald-500 rounded-l-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInlineMarkdown(text)}</div>
        </div>
      );
      continue;
    }

    if (line.startsWith("> [!WARNING]")) {
      flushList(i);
      let text = line.substring(12).trim();
      elements.push(
        <div key={`callout-warn-${i}`} className="my-4 p-4 bg-rose-50/50 border-r-4 border-rose-500 rounded-l-2xl text-xs sm:text-sm text-rose-900 font-bold flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{parseInlineMarkdown(text)}</div>
        </div>
      );
      continue;
    }

    if (line.startsWith("* ") || line.startsWith("- ")) {
      if (!currentList || currentList.type !== "bullet") {
        flushList(i);
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push(line.substring(2));
      continue;
    }

    const numMatch = line.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      if (!currentList || currentList.type !== "number") {
        flushList(i);
        currentList = { type: "number", items: [] };
      }
      currentList.items.push(numMatch[1]);
      continue;
    }

    if (line !== "") {
      flushList(i);
    }

    if (line === "") {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 border-r-4 border-teal-600 pr-3 pb-1">
          {parseInlineMarkdown(line.substring(2))}
        </h2>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-lg sm:text-xl font-black text-slate-900 mt-5 mb-2.5 border-r-4 border-teal-500 pr-2.5 pb-1">
          {parseInlineMarkdown(line.substring(3))}
        </h3>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-base sm:text-lg font-black text-slate-800 mt-4 mb-2 border-r-2 border-slate-300 pr-2">
          {parseInlineMarkdown(line.substring(4))}
        </h4>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="bg-slate-50 border-r-4 border-slate-300 text-slate-600 italic px-4 py-3 rounded-l-2xl my-4 text-xs sm:text-sm font-bold leading-relaxed">
          {parseInlineMarkdown(line.substring(2))}
        </blockquote>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-t border-slate-100 my-5" />);
    } else {
      elements.push(
        <p key={i} className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-3.5 text-right font-medium">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  }

  flushList(lines.length);

  return <div className="space-y-1 text-right">{elements}</div>;
}

const articleTemplates = [
  {
    id: "treatment-guide",
    name: "راهنمای درمانی تخصصی (Treatment Guide)",
    description: "مناسب برای ایمپلنت، لمینت، ارتودنسی و درمان‌های نوین کلینیک",
    content: `## راهنمای کامل و تخصصی: [نام درمان را در اینجا بنویسید]

امروزه با پیشرفت‌های شگفت‌انگیز در حوزه دندانپزشکی دیجیتال، **[نام درمان]** به عنوان یکی از مطمئن‌ترین و مدرن‌ترین روش‌ها برای بازیابی سلامت دهان و زیبایی لبخند شناخته می‌شود.

در این مقاله تخصصی که توسط کادر علمی کلینیک **دنت فلو** تهیه شده، صفر تا صد این فرآیند را بررسی خواهیم کرد.

### چرا [نام درمان] بهترین گزینه است؟
مزایای چشمگیر این روش فراتر از جنبه‌های صرفاً زیبایی است:
* **ماندگاری فوق‌العاده بالا:** در صورت رعایت بهداشت، تا سال‌ها بدون تغییر باقی می‌ماند.
* **دقت و سرعت دیجیتال:** با استفاده از اسکنرهای سه بعدی، خطاهای انسانی کاملاً حذف می‌شود.
* **درمان بدون درد (سدیشن):** امکان انجام تحت خواب مصنوعی برای بیماران با اضطراب شدید.

> [!INFO] کلینیک دنت فلو مجهز به مجهزترین سیستم‌های اسکن دیجیتال در منطقه فرشته تهران است که درمان را تا ۹۸٪ سریع‌تر و دقیق‌تر می‌کند.

### مراحل درمان قدم‌به‌قدم:
۱. **اسکن سه بعدی دیجیتال و طراحی سه بعدی لبخند**
۲. **تهیه و ساخت شابلون‌های جراحی یا لمینت‌ها در لابراتوار تخصصی**
۳. **نصب و تحویل نهایی با بیشترین ظرافت ممکن**

> **توصیه علمی:** هرگونه تاخیر در درمان دندان‌های آسیب‌دیده، می‌تواند منجر به تحلیل استخوان فک و افزایش هزینه‌های بعدی شود.

### مراقبت‌های حیاتی پس از درمان:
جهت افزایش طول عمر [نام درمان]، نکات زیر را رعایت فرمایید:
* از مسواک‌های با فرچه نرم استفاده کنید.
* نخ دندان را به صورت روزانه و با حرکت ملایم بکار ببرید.
* هر ۶ ماه یکبار برای جرم‌گیری و چکاپ دوره‌ای به کلینیک مراجعه کنید.

> [!SUCCESS] رعایت این نکات طول عمر درمان‌های زیبایی نظیر لمینت سرامیکی را تا بیش از ۱۵ سال تضمین می‌کند.

### نتیجه‌گیری و مشاوره
اگر مایلید بدانید آیا شما کاندید مناسبی برای **[نام درمان]** هستید، می‌توانید همین امروز از بخش رزرواسیون آنلاین کلینیک دنت فلو نوبت بگیرید یا با شماره ۰۲۱-۲۲۰۰۰۰۰۰ تماس حاصل فرمایید.`
  },
  {
    id: "post-op-care",
    name: "مراقبت‌های حیاتی پس از جراحی (Post-Op Care Guide)",
    description: "توصیه‌های ضروری بعد از ایمپلنت، عصب‌کشی یا جراحی‌های پیچیده لثه",
    content: `## دستورالعمل‌های حیاتی: مراقبت‌های پس از [نام جراحی/ایمپلنت]

رعایت دقیق توصیه‌های بعد از **[نام جراحی]**، نقشی حیاتی (بیش از ۵۰ درصد) در موفقیت نهایی درمان، جلوگیری از عفونت و کاهش دوره نقاهت ایفا می‌کند.

لطفاً این راهنمای تنظیم شده توسط پزشکان متخصص کلینیک **دنت فلو** را به دقت مطالعه و اجرا کنید.

### اقدامات ضروری در ۲۴ ساعت اول:
* **حفظ گاز استریل:** گاز قرار داده شده روی ناحیه جراحی را حداقل تا ۲ ساعت با فشار ملایم نگه دارید.
* **تف کردن ممنوع:** از تف کردن و مکیدن با نی اکیداً خودداری کنید (فشار منفی ایجاد شده باعث کنده شدن لخته خون و خونریزی مجدد می‌شود).
* **کمپرس سرد:** در ۲۴ ساعت اول، جهت کاهش تورم هر ۲۰ دقیقه یکبار کمپرس یخ را روی گونه (محل جراحی) قرار دهید.
* **تغذیه نرم و خنک:** در روز اول فقط از مایعات خنک، بستنی، فرنی و سوپ ولرم استفاده کنید.

> [!WARNING] خوردن و نوشیدن غذاهای داغ در ۲۴ ساعت اول شدیداً ممنوع است و ریسک بروز خونریزی و تورم را بسیار بالا می‌برد.

### اقدامات روزهای دوم به بعد:
۱. **دهانشویه آب‌نمک ولرم:** از روز دوم، روزی ۳ الی ۴ بار دهان را با آب‌نمک بسیار رقیق و گرم به آرامی شستشو دهید.
۲. **داروهای تجویز شده:** مسکن‌ها و آنتی‌بیوتیک‌های خود را دقیقاً سر ساعت مصرف کنید.
۳. **مسواک زدن:** سایر نواحی دهان را مسواک بزنید اما از تماس فرچه مسواک با محل جراحی خودداری کنید.

> **هشدار جدی:** مصرف سیگار و قلیان تا یک هفته پس از جراحی، شانس موفقیت درمان (به‌ویژه ایمپلنت دندان) را تا ۸۰ درصد کاهش می‌دهد.

### چه زمانی باید با کلینیک تماس بگیریم؟
در صورت بروز هر یک از علائم زیر سریعاً با شماره پشتیبانی ۲۴ ساعته دنت فلو تماس بگیرید:
* خونریزی شدید و مداوم که با گاز استریل کنترل نمی‌شود.
* تب بالا و لرز شدید.
* درد بسیار شدیدی که با مسکن‌های تجویزی تسکین نمی‌یابد.`
  },
  {
    id: "faq-article",
    name: "پرسش و پاسخ متداول (FAQ Style)",
    description: "پاسخ به سوالات و نگرانی‌های پر تکرار بیماران درباره هزینه‌ها، ترس و طول درمان",
    content: `## پاسخ به متداول‌ترین سوالات شما درباره: [موضوع اصلی]

وقتی صحبت از **[موضوع اصلی]** می‌شود، مراجعین کلینیک **دنت فلو** سوالات و دغدغه‌های مشترک فراوانی دارند. در این مقاله به صورت کاملاً علمی و صادقانه به ۵ سوال اصلی شما پاسخ می‌دهیم.

---

### سوال اول: آیا درمان [موضوع اصلی] با درد همراه است؟
**پاسخ متخصص:** به هیچ وجه! امروزه با استفاده از بی‌حسی‌های موضعی پیشرفته و دیجیتال، بیمار حین درمان متوجه هیچ دردی نخواهد شد. همچنین برای بیماران با ترس شدید، کلینیک دنت فلو سیستم **سدیشن (Sedation)** یا خواب مصنوعی تحت نظارت متخصص بیهوشی ارائه می‌دهد.

### سوال دوم: شرایط پرداخت اقساطی در دنت فلو چگونه است؟
ما در کلینیک دنت فلو شرایط ویژه‌ای برای تسهیل پرداخت هزینه‌ها فراهم کرده‌ایم تا همه مراجعین بتوانند از بهترین کیفیت استفاده کنند:
* **پیش‌پرداخت:** تنها ۳۰ تا ۴۰ درصد کل مبلغ
* **اقساط:** مابقی در ۶ الی ۱۲ قسط ماهانه
* **تسهیلات:** دریافت چک صیادی بدون هیچ‌گونه بهره یا سود اضافه!

> [!INFO] برای دریافت پلن اقساطی دقیق، کارشناسان مالی ما حین جلسه مشاوره رایگان لبخند، جدول زمانبندی پرداخت را تقدیم شما خواهند کرد.

### سوال سوم: طول عمر و دوام این درمان چقدر است؟
**پاسخ متخصص:** در صورت اجرای صحیح توسط پزشک متخصص و مراقبت‌های منظم بیمار در منزل، این درمان می‌تواند ماندگاری بین **۱۰ الی ۱۵ سال** و در مورد ایمپلنت‌های مرغوب حتی تا **پایان عمر** داشته باشد.

---

### مشاوره رایگان لبخند دنت فلو
اگر هنوز سوالی دارید که در این راهنما به آن پاسخ داده نشده، خوشحال می‌شویم صدای گرم شما را بشنویم. با کارشناسان ما تماس بگیرید یا نوبت مشاوره حضوری خود را به صورت آنلاین ثبت کنید.`
  }
];

export default function ArticlesTab({ articles, setArticles, useLocalDb, adminToken }: ArticlesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("همه");
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<BlogPost> | null>(null);
  
  // AI Generator configuration
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ایمپلنت");
  const [aiTone, setAiTone] = useState("academic"); // academic, friendly, simple
  const [aiLength, setAiLength] = useState("medium"); // short, medium, long
  
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      showStatus("error", "لطفاً فقط فایل تصویر معتبر (PNG, JPG, WEBP) انتخاب کنید.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showStatus("error", "حجم فایل بسیار زیاد است. حداکثر حجم مجاز ۵ مگابایت است.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${adminToken || ""}`
            },
            body: JSON.stringify({
              file: base64data,
              fileName: file.name
            })
          });
          
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "خطا در آپلود");
          }
          
          const data = await res.json();
          if (data.url) {
            setFormImageUrl(data.url);
            showStatus("success", "تصویر با موفقیت بارگذاری و جایگزین شد.");
          } else {
            throw new Error("آدرس تصویر بازگردانده نشد.");
          }
        } catch (err: any) {
          console.error("Upload error:", err);
          showStatus("error", `بارگذاری با خطا مواجه شد: ${err.message || "لطفاً اتصال خود را بررسی کنید."}`);
        } finally {
          setIsUploading(false);
        }
      };
    } catch (err: any) {
      console.error("File reading error:", err);
      showStatus("error", "خطا در خواندن فایل.");
      setIsUploading(false);
    }
  };
  
  // Slash Commands & Inline Upload States
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuQuery, setSlashMenuQuery] = useState("");
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Rich Editor Tab Selection
  const [formActiveTab, setFormActiveTab] = useState<"general" | "content" | "visuals" | "preview">("general");

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategory, setFormCategory] = useState("ایمپلنت");
  const [formReadTime, setFormReadTime] = useState("مطالعه ۵ دقیقه");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formContent, setFormContent] = useState("");


  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const categories = ["ایمپلنت", "زیبایی", "سلامت دهان", "ارتودنسی", "اطفال", "عمومی"];

  const openCreateForm = () => {
    setEditingArticle(null);
    setFormTitle("");
    setFormExcerpt("");
    setFormCategory("ایمپلنت");
    setFormReadTime("مطالعه ۵ دقیقه");
    setFormImageUrl("https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop");
    setFormDate(new Date().toLocaleDateString("fa-IR"));
    setFormContent("");
    setFormActiveTab("general");
    setIsEditing(true);
  };

  const openEditForm = (article: BlogPost) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormExcerpt(article.excerpt);
    setFormCategory(article.category);
    setFormReadTime(article.readTime);
    setFormImageUrl(article.imageUrl);
    setFormDate(article.date);
    setFormContent(article.content || "");
    setFormActiveTab("general");
    setIsEditing(true);
    // Smooth scroll to top of form
    document.getElementById("articles-editor-container")?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to load preset templates
  const loadPresetTemplate = (contentTemplate: string) => {
    if (formContent.trim() && !confirm("آیا از بازنویسی متن فعلی مقاله با قالب پیش‌فرض اطمینان دارید؟")) {
      return;
    }
    setFormContent(contentTemplate);
    showStatus("success", "قالب پیش‌فرض با موفقیت بارگذاری شد. می‌توانید ویرایش آن را آغاز کنید.");
  };

  const handleGenerateWithAI = async () => {
    if (!topicPrompt.trim()) {
      showStatus("error", "لطفاً موضوع یا کلمه کلیدی مقاله را وارد کنید.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: topicPrompt, 
          category: selectedCategory,
          tone: aiTone,
          length: aiLength
        }),
      });

      if (!response.ok) {
        let errMessage = "خطا در پاسخ سرور";
        try {
          const errData = await response.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch(e) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      
      setFormTitle(data.title || "");
      setFormExcerpt(data.excerpt || "");
      setFormCategory(data.category || selectedCategory);
      setFormReadTime(data.readTime || "مطالعه ۶ دقیقه");
      setFormImageUrl(data.imageUrl || "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop");
      setFormDate(new Date().toLocaleDateString("fa-IR"));
      setFormContent(data.content || "");
      
      if (!isEditing) {
        setIsEditing(true);
      }
      
      setFormActiveTab("content"); // Auto switch to editor tab to let them see the content!
      setTopicPrompt("");
      showStatus("success", "مقاله کامل به همراه متن اختصاصی تولید و در ادیتور بارگذاری شد! لطفا آن را مرور و ذخیره کنید.");
    } catch (error: any) {
      console.error(error);
      showStatus("error", error?.message || "خطا در برقراری ارتباط با هوش مصنوعی جمینای. لطفاً اتصال شبکه را بررسی کنید.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formExcerpt.trim()) {
      showStatus("error", "لطفاً عنوان و خلاصه مقاله را وارد کنید.");
      setFormActiveTab("general");
      return;
    }

    if (!formContent.trim()) {
      showStatus("error", "لطفاً محتوای متنی مقاله را در زبانه ادیتور بنویسید.");
      setFormActiveTab("content");
      return;
    }

    setActionLoading(true);
    const payload = {
      title: formTitle,
      excerpt: formExcerpt,
      category: formCategory,
      readTime: formReadTime,
      imageUrl: formImageUrl || "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop",
      date: formDate || new Date().toLocaleDateString("fa-IR"),
      content: formContent
    };

    if (useLocalDb) {
      if (editingArticle && editingArticle.id) {
        const updated = articles.map(p => p.id === editingArticle.id ? { ...p, ...payload } : p);
        setArticles(updated);
        localStorage.setItem("df_local_articles", JSON.stringify(updated));
        showStatus("success", "مقاله با موفقیت ویرایش شد (محلی).");
      } else {
        const newId = articles.length > 0 ? Math.max(...articles.map(p => p.id)) + 1 : 1;
        const newPost = { id: newId, ...payload } as BlogPost;
        const updated = [newPost, ...articles];
        setArticles(updated);
        localStorage.setItem("df_local_articles", JSON.stringify(updated));
        showStatus("success", "مقاله جدید با موفقیت اضافه شد (محلی).");
      }
      setIsEditing(false);
      setActionLoading(false);
      return;
    }

    try {
      let response;
      if (editingArticle && editingArticle.id) {
        response = await fetch(`/api/articles/${editingArticle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const savedData = await response.json();
        if (editingArticle && editingArticle.id) {
          setArticles(prev => prev.map(p => p.id === editingArticle.id ? savedData : p));
          showStatus("success", "مقاله با موفقیت ذخیره و در سرور بروزرسانی شد.");
        } else {
          setArticles(prev => [savedData, ...prev]);
          showStatus("success", "مقاله جدید با موفقیت ایجاد و روی سرور ذخیره شد.");
        }
        setIsEditing(false);
      } else {
        throw new Error("خطا در ذخیره‌سازی مقاله");
      }
    } catch (err) {
      console.error(err);
      showStatus("error", "خطا در ارتباط با سرور دیتابیس کلینیک. ذخیره انجام نشد.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف دائم این مقاله علمی اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) return;

    if (useLocalDb) {
      const updated = articles.filter(p => p.id !== id);
      setArticles(updated);
      localStorage.setItem("df_local_articles", JSON.stringify(updated));
      showStatus("success", "مقاله با موفقیت حذف شد (محلی).");
      return;
    }

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setArticles(prev => prev.filter(p => p.id !== id));
        showStatus("success", "مقاله علمی با موفقیت حذف گردید.");
      } else {
        throw new Error("خطا در حذف مقاله");
      }
    } catch (err) {
      console.error(err);
      showStatus("error", "خطا در حذف مقاله از دیتابیس اصلی کلینیک.");
    }
  };

  // Filter and Search logic
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (selectedCategoryTab === "همه") return matchesSearch;
    return matchesSearch && article.category === selectedCategoryTab;
  });

  // Calculate statistics
  const totalArticles = articles.length;
  const implantCount = articles.filter(a => a.category === "ایمپلنت").length;
  const beautyCount = articles.filter(a => a.category === "زیبایی").length;
  const healthCount = articles.filter(a => a.category === "سلامت دهان").length;

  return (
    <div className="space-y-6 text-right font-sans" id="articles-editor-container">
      {/* Page Title & Clinical Stats Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-100 pb-5" id="articles-editor-header">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">
            <span>مدیریت و سردبیری مجله علمی دنت فلو</span>
            <BookOpen className="w-5.5 h-5.5 text-teal-600" />
          </h3>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">
            مقالات علمی کلینیک فرشته را تالیف و منتشر کنید. متن مقالات را با استفاده از ادیتور فرمت‌بندی کنید یا از پیش‌نویس‌های آماده و ژنراتور هوشمند جمینای بهره ببرید.
          </p>
        </div>

        {/* Mini stats badges */}
        <div className="flex flex-wrap items-center gap-2 justify-end" id="articles-quick-stats">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500">
            کل مقالات: <span className="font-extrabold text-slate-800 mr-1">{totalArticles}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-teal-50 border border-teal-100/50 rounded-2xl text-[11px] font-bold text-teal-600">
            ایمپلنت: <span className="font-extrabold mr-1">{implantCount}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-2xl text-[11px] font-bold text-indigo-600">
            زیبایی دندان: <span className="font-extrabold mr-1">{beautyCount}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-100/50 rounded-2xl text-[11px] font-bold text-amber-600">
            سلامت و بهداشت: <span className="font-extrabold mr-1">{healthCount}</span>
          </div>
          
          <button
            onClick={openCreateForm}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-2xl flex items-center gap-1.5 justify-center shadow-lg shadow-teal-600/15 transition-all cursor-pointer mr-2"
            id="btn-open-add-article"
          >
            <Plus className="w-4 h-4" />
            <span>نگارش مقاله جدید</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Messages */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 justify-end ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                : "bg-rose-50 border border-rose-100 text-rose-700"
            }`}
          >
            <span>{statusMessage.text}</span>
            <AlertCircle className="w-4 h-4 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced AI Generator Dashboard */}
      <div className="bg-gradient-to-r from-teal-500/5 to-indigo-500/5 border border-teal-100/60 rounded-[32px] p-6 space-y-5" id="ai-article-generator">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 justify-end self-end sm:self-auto">
            <span className="text-slate-800 font-black text-sm">مولد و نویسنده هوشمند مقاله با هوش مصنوعی جمینای (Gemini)</span>
            <div className="p-1.5 bg-teal-600/10 text-teal-700 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black">طراحی محتوای متنی غنی به زبان فارسی</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Topic Input */}
            <div className="md:col-span-8 space-y-1">
              <input
                type="text"
                placeholder="عنوان یا موضوع مقاله (مثال: ونیر کامپوزیت و تفاوت آن با لمینت، عوارض دیرکرد ایمپلنت، ارتودنسی اطفال...)"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs font-bold text-slate-800 outline-none text-right"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs font-extrabold text-slate-800 outline-none text-right cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expanded AI Parameters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              {/* Tone of voice */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-extrabold">لحن نگارش:</span>
                <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setAiTone("academic")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiTone === "academic" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    علمی و تخصصی
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone("friendly")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiTone === "friendly" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    صمیمی و جذاب
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone("simple")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiTone === "simple" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ساده و عامه‌فهم
                  </button>
                </div>
              </div>

              {/* Expected Length */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-extrabold">حجم مقاله:</span>
                <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setAiLength("short")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiLength === "short" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    کوتاه (خلاصه)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiLength("medium")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiLength === "medium" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    متوسط (استاندارد)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiLength("long")}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      aiLength === "long" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    جامع (تخصصی)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white text-xs font-black rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer shadow-md shadow-teal-600/10 shrink-0 self-end sm:self-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال تولید متن کامل مقاله...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید هوشمند محتوا</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Form Panel (Visual rich control system) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-white border-2 border-slate-100 p-6 rounded-3xl space-y-6 shadow-xl shadow-slate-900/5 relative">
              <div className="absolute top-6 left-6 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="بستن فرم"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Category Badge */}
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">
                  {editingArticle ? `در حال ویرایش مقاله علمی: ${editingArticle.title}` : "تالیف و ایجاد مقاله علمی جدید"}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  فرم را پر کرده و از ویرایشگر مجهز Markdown در تب دوم استفاده کنید.
                </p>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-100 gap-4 justify-start overflow-x-auto pb-1" id="form-tabs-navigation">
                <button
                  type="button"
                  onClick={() => setFormActiveTab("general")}
                  className={`pb-2.5 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    formActiveTab === "general" ? "text-teal-600 font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>۱. اطلاعات عمومی</span>
                  {formActiveTab === "general" && (
                    <motion.div layoutId="form-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormActiveTab("content")}
                  className={`pb-2.5 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    formActiveTab === "content" ? "text-teal-600 font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>۲. ویرایشگر متن (Markdown)</span>
                  {formActiveTab === "content" && (
                    <motion.div layoutId="form-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormActiveTab("visuals")}
                  className={`pb-2.5 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    formActiveTab === "visuals" ? "text-teal-600 font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>۳. تصویر شاخص و گالری</span>
                  {formActiveTab === "visuals" && (
                    <motion.div layoutId="form-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormActiveTab("preview")}
                  className={`pb-2.5 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    formActiveTab === "preview" ? "text-teal-600 font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>۴. پیش‌نمایش کارت وبلاگ</span>
                  {formActiveTab === "preview" && (
                    <motion.div layoutId="form-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {/* TAB 1: General Information */}
                {formActiveTab === "general" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 block">عنوان مقاله علمی <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="یک عنوان علمی و جذاب وارد کنید (مثال: ایمپلنت دیجیتال چیست؟)..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 block">دسته‌بندی موضوعی <span className="text-rose-500">*</span></label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-right cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 block">مدت زمان تقریبی مطالعه</label>
                      <input
                        type="text"
                        value={formReadTime}
                        onChange={(e) => setFormReadTime(e.target.value)}
                        placeholder="مثال: مطالعه ۵ دقیقه"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 block">تاریخ انتشار</label>
                      <input
                        type="text"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        placeholder="مثال: ۱۵ تیر ۱۴۰۵"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-right"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-bold">باقی‌مانده: {Math.max(0, 160 - formExcerpt.length)} کاراکتر</span>
                        <label className="text-[11px] font-extrabold text-slate-500 block">خلاصه کوتاه مقاله (جهت نمایش در شبکه‌های اجتماعی و کارت‌ها) <span className="text-rose-500">*</span></label>
                      </div>
                      <textarea
                        required
                        maxLength={200}
                        rows={3}
                        value={formExcerpt}
                        onChange={(e) => setFormExcerpt(e.target.value)}
                        placeholder="یک خلاصه جامع و ترغیب‌کننده در حد دو الی سه جمله کامل برای تشویق کاربر به خواندن بنویسید..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-right resize-none"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("content")}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <span>مرحله بعد: نوشتن متن مقاله</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: Advanced Content Editor (RTL Markdown + Toolbar) */}
                {formActiveTab === "content" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Prest Templates Toolbar and Quick formatting */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      
                      {/* Presets popover menu */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-extrabold">قالب‌های نگارشی آماده:</span>
                        <div className="flex gap-1">
                          {articleTemplates.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => loadPresetTemplate(t.content)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/20 text-slate-700 hover:text-teal-700 text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-xs"
                              title={t.description}
                            >
                              {t.name.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4" id="editor-main-canvas">
                      {/* Rich Editor + Preview */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[550px]">
                        {/* Editor side */}
                        <div className="flex flex-col h-full space-y-1 relative">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-slate-400 font-bold">از نوار ابزار بالا برای فرمت‌بندی استفاده کنید. جادوی هوش مصنوعی نیز در دسترس است.</span>
                            <span className="text-[10px] font-black text-teal-600">پنل ویرایشگر حرفه‌ای</span>
                          </div>
                          <RichTextEditor 
                            value={formContent} 
                            onChange={setFormContent}
                            topic={formTitle}
                            category={formCategory}
                            placeholder="نوشتن مقاله را در اینجا آغاز کنید..."
                          />
                        </div>

                        {/* Live Rendered Side */}
                        <div className="flex flex-col h-full space-y-1">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-indigo-600">پیش‌نمایش زنده و رندر شده</span>
                            <span className="text-[10px] text-slate-400 font-bold">نمایش استایل نهایی مقاله در وب‌سایت</span>
                          </div>
                          <div className="w-full flex-1 p-5 bg-slate-50/30 border border-slate-100 rounded-2xl overflow-y-auto text-right font-sans select-none prose prose-slate">
                            {renderMarkdown(formContent)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("general")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl cursor-pointer transition-all"
                      >
                        بازگشت به اطلاعات پایه
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("visuals")}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <span>مرحله بعد: تنظیمات تصویر</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: Visual & Banner (Media selector) */}
                {formActiveTab === "visuals" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    {/* Photo URL Input */}
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-bold">آدرس مستقیم تصویر وب از Unsplash یا منابع معتبر</span>
                          <label className="text-[11px] font-extrabold text-slate-500 block">لینک آدرس تصویر شاخص (URL)</label>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none text-left"
                          />
                          {formImageUrl && (
                            <button
                              type="button"
                              onClick={() => setFormImageUrl("")}
                              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              پاکسازی
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Drag and Drop Uploader Widget */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-bold">فایل تصویر را بکشید و رها کنید یا انتخاب کنید</span>
                          <label className="text-[11px] font-extrabold text-slate-500 block">یا بارگذاری فایل تصویر جدید از رایانه</label>
                        </div>
                        
                        <div
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDragActive(true);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragActive(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragActive(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            isDragActive
                              ? "border-teal-500 bg-teal-50/40"
                              : "border-slate-200 hover:border-teal-400 bg-white hover:bg-slate-50/50"
                          }`}
                          onClick={() => {
                            const fileInput = document.getElementById("article-image-file-input");
                            if (fileInput) fileInput.click();
                          }}
                        >
                          <input
                            type="file"
                            id="article-image-file-input"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                          
                          {isUploading ? (
                            <div className="space-y-2 py-1">
                              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                              <p className="text-[11px] font-bold text-teal-600">در حال بارگذاری فایل تصویر روی سرور کلینیک دنت فلو...</p>
                            </div>
                          ) : (
                            <div className="space-y-1 py-1">
                              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                              <p className="text-[11px] font-bold text-slate-700">کلیک کنید یا فایل تصویر را به داخل این کادر بکشید</p>
                              <p className="text-[9px] text-slate-400 font-medium">حجم مجاز تا ۵ مگابایت (PNG, JPG, WebP)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock photos gallery selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-400 font-bold">با کلیک روی هر عکس، آدرس آن مستقیماً به عنوان عکس مقاله ست می‌شود.</span>
                        <span className="text-[11px] font-black text-slate-700">عکس‌های کلینیکال دندانپزشکی دنت فلو (Unsplash)</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {unsplashStockPhotos.map((photo, index) => (
                          <div 
                            key={index}
                            onClick={() => {
                              setFormImageUrl(photo.url);
                              showStatus("success", `عکس شاخص با موفقیت به "${photo.title}" تغییر یافت.`);
                            }}
                            className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all hover:-translate-y-0.5 ${
                              formImageUrl === photo.url ? "border-teal-500 shadow-md shadow-teal-500/10 scale-95" : "border-transparent border-slate-100"
                            }`}
                          >
                            <img 
                              src={photo.url} 
                              alt={photo.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Overlay tag */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-right">
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-white">{photo.title}</p>
                                <p className="text-[7px] text-slate-300 font-bold leading-none line-clamp-1">{photo.desc}</p>
                              </div>
                            </div>

                            {formImageUrl === photo.url && (
                              <div className="absolute top-1.5 right-1.5 bg-teal-500 text-white p-1 rounded-lg">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Banner Image Preview Container */}
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                        {formImageUrl ? (
                          <img 
                            src={formImageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-400 text-[10px] space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                            <p>پیش‌نمایش تصویر</p>
                          </div>
                        )}
                        {formImageUrl && (
                          <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-[8px] text-white font-bold px-2 py-0.5 rounded-md">
                            سایز: متناسب
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 text-right">
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">پیش‌نمایش زنده بنر</span>
                        <h5 className="text-xs font-black text-slate-800">کاور مقاله وبلاگ</h5>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                          تصویر شاخص در بالای صفحه مقاله و روی کارت‌ها در بخش وبلاگ کلینیک دنت فلو نمایش داده خواهد شد. کیفیت پیشنهادی تصاویر لنداسکیپ با نسبت ۱۶:۹ می‌باشد.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("content")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl cursor-pointer transition-all"
                      >
                        بازگشت به ادیتور متن
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("preview")}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <span>مرحله بعد: پیش‌نمایش کارت وبلاگ</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: Card Preview */}
                {formActiveTab === "preview" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-2">
                      <p className="text-[11px] text-slate-400 font-bold">کارت وبلاگ نهایی مراجعین به شکل زیر در پورتال اصلی رندر و نمایش داده می‌شود:</p>
                    </div>

                    {/* Centered card mockup */}
                    <div className="flex justify-center py-4 bg-slate-100/50 rounded-3xl">
                      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-xl shadow-slate-950/5 flex flex-col justify-between w-80 text-right" style={{ wordBreak: "keep-all" }}>
                        <div>
                          {/* Banner image */}
                          <div className="aspect-video w-full overflow-hidden relative bg-slate-100">
                            {formImageUrl ? (
                              <img 
                                className="w-full h-full object-cover" 
                                src={formImageUrl} 
                                alt={formTitle || "بدون عنوان"} 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-10 h-10" />
                              </div>
                            )}
                            <span className="absolute top-3 right-3 bg-white/95 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                              {formCategory}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-5 text-right space-y-2.5">
                            <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formDate || new Date().toLocaleDateString("fa-IR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formReadTime || "مطالعه ۵ دقیقه"}
                              </span>
                            </div>

                            <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2">
                              {formTitle || "عنوان مقاله را در زبانه اول مشخص کنید"}
                            </h3>
                            <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-3 font-semibold">
                              {formExcerpt || "خلاصه مقاله در اینجا رندر می‌شود..."}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 text-right">
                          <span className="text-teal-600 font-black text-[10px] flex items-center gap-1">
                            ادامه مطلب و مطالعه راهنما
                            <ChevronLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setFormActiveTab("visuals")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl cursor-pointer transition-all"
                      >
                        بازگشت به تصاویر شاخص
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Form Footer Action buttons */}
              <div className="flex items-center gap-3 justify-start border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                >
                  انصراف و بستن
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/15"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>ثبت و انتشار نهایی مقاله</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search, Category Tab Filter, and Articles Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-5 shadow-xs" id="articles-list-container">
        
        {/* Header section with categories */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-4">
          
          {/* Categories Tab Bar */}
          <div className="flex gap-1.5 overflow-x-auto w-full lg:w-auto pb-1" id="category-tabs-bar">
            {["همه", ...categories].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryTab === tab 
                    ? "bg-teal-600 text-white shadow-sm" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-72 relative shrink-0">
            <input
              type="text"
              placeholder="جستجو در عنوان، خلاصه یا دسته..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-2xl text-xs font-bold text-slate-800 outline-none text-right focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Output Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p>هیچ مقاله علمی منطبق با جستجو در دسته‌بندی "{selectedCategoryTab}" یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="admin-articles-grid">
            {filteredArticles.map((article) => (
              <div 
                key={article.id}
                className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-teal-100 hover:shadow-md hover:shadow-teal-900/5 transition-all bg-white"
                style={{ wordBreak: "keep-all" }}
              >
                <div className="flex gap-4">
                  {/* Photo thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {/* Metadata & titles */}
                  <div className="space-y-1 text-right min-w-0 flex-1">
                    <span className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-black rounded-lg">
                      {article.category}
                    </span>
                    <h5 className="text-xs font-black text-slate-800 line-clamp-1 leading-normal">
                      {article.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-bold line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer and interactive buttons */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditForm(article)}
                      className="p-2 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black"
                      title="ویرایش کامل مقاله"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="p-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black"
                      title="حذف مقاله"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {article.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {article.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
