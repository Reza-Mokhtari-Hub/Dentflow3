import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Search, 
  Share2, 
  Copy, 
  Check, 
  Bookmark, 
  Heart, 
  MessageSquare, 
  Send, 
  User, 
  Sparkles, 
  ThumbsUp,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { BlogPost, blogPosts } from "../data";
import { renderMarkdown } from "./ArticlesTab";
import { motion, AnimatePresence } from "motion/react";

interface ArticlesSectionProps {
  articles: BlogPost[];
  selectedArticle: BlogPost | null;
  setSelectedArticle: (post: BlogPost | null) => void;
  clinicConfig?: any;
  setArticles?: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}

export default function ArticlesSection({ 
  articles, 
  selectedArticle, 
  setSelectedArticle,
  clinicConfig,
  setArticles
}: ArticlesSectionProps) {
  const articleList = articles.length > 0 ? articles : blogPosts;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");

  // Interactive metrics (Local Storage state)
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [shareSuccess, setShareSuccess] = useState(false);
  const [comments, setComments] = useState<Record<number, Array<{name: string, text: string, date: string}>>>({});
  
  // Sidebar Quick Query / Comment Form state
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  
  // Scroll & Reading Progress state
  const [readingProgress, setReadingProgress] = useState(0);

  // Extract dynamic categories
  const categories = useMemo(() => {
    const list = articleList.map(a => a.category);
    return ["همه", ...Array.from(new Set(list))];
  }, [articleList]);

  // Load interactive state from Local Storage
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem("dentflow_blog_likes_count");
      const storedHasLiked = localStorage.getItem("dentflow_blog_has_liked");
      const storedBookmarks = localStorage.getItem("dentflow_blog_bookmarks");
      const storedComments = localStorage.getItem("dentflow_blog_comments");

      if (storedLikes) setLikes(JSON.parse(storedLikes));
      if (storedHasLiked) setHasLiked(JSON.parse(storedHasLiked));
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
      if (storedComments) setComments(JSON.parse(storedComments));
    } catch (e) {
      console.error("Could not load blog interactive states", e);
    }
  }, []);

  // Update Reading Progress on Scroll
  useEffect(() => {
    if (!selectedArticle) {
      setReadingProgress(0);
      return;
    }

    const handleScroll = () => {
      const element = document.documentElement;
      const totalHeight = element.scrollHeight - element.clientHeight;
      if (totalHeight > 0) {
        const progress = (element.scrollTop / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedArticle]);

  // Handle Like Increment
  const handleLike = (id: number) => {
    const likedMap = { ...hasLiked };
    const likesMap = { ...likes };
    const isLiking = !likedMap[id];
    
    likedMap[id] = isLiking;
    
    const currentArticle = articles.find(a => a.id === id);
    const currentLikes = currentArticle?.likes ?? likesMap[id] ?? (id * 7 + 18);
    
    const newLikesVal = isLiking ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    likesMap[id] = newLikesVal;

    setHasLiked(likedMap);
    setLikes(likesMap);
    localStorage.setItem("dentflow_blog_has_liked", JSON.stringify(likedMap));
    localStorage.setItem("dentflow_blog_likes_count", JSON.stringify(likesMap));

    if (setArticles) {
      setArticles(prev => prev.map(art => {
        if (art.id === id) {
          return {
            ...art,
            likes: newLikesVal
          };
        }
        return art;
      }));
    }
  };

  // Handle Bookmark Toggle
  const handleBookmark = (id: number) => {
    const bookmarkMap = { ...bookmarks };
    bookmarkMap[id] = !bookmarkMap[id];
    setBookmarks(bookmarkMap);
    localStorage.setItem("dentflow_blog_bookmarks", JSON.stringify(bookmarkMap));
  };

  // Handle Copy Link (Share)
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    });
  };

  // Handle Comment Submission
  const handleCommentSubmit = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    const newComment = {
      name: commentName.trim(),
      text: commentText.trim(),
      date: new Date().toLocaleDateString("fa-IR")
    };

    const updatedComments = { ...comments };
    if (!updatedComments[id]) {
      updatedComments[id] = [];
    }
    updatedComments[id] = [newComment, ...updatedComments[id]];

    setComments(updatedComments);
    localStorage.setItem("dentflow_blog_comments", JSON.stringify(updatedComments));
    setCommentName("");
    setCommentText("");
  };

  // Filtered Articles based on selection & search
  const filteredArticles = useMemo(() => {
    return articleList.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.content || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "همه" || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articleList, searchQuery, selectedCategory]);

  // Related Articles (same category, max 3)
  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    return articleList
      .filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id)
      .slice(0, 3);
  }, [selectedArticle, articleList]);

  // Author details fallback config
  const articleAuthor = {
    name: clinicConfig?.articleDoctorName || "دکتر مریم رضایی",
    title: clinicConfig?.articleDoctorTitle || "متخصص جراحی لثه و ایمپلنت",
    bio: clinicConfig?.articleDoctorBio || "عضو هیئت علمی دانشگاه، با بیش از ۱۰ سال سابقه تخصصی در کاشت دندان دیجیتال و اصلاح لبخند هوشمند.",
    avatar: clinicConfig?.articleDoctorAvatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=250&auto=format&fit=crop"
  };

  if (selectedArticle) {
    const currentArticle = articles.find(a => a.id === selectedArticle.id) || selectedArticle;
    const isBookmarked = !!bookmarks[selectedArticle.id];
    const isLiked = !!hasLiked[selectedArticle.id];
    const likeCount = currentArticle.likes !== undefined ? currentArticle.likes : (likes[selectedArticle.id] || (selectedArticle.id * 7 + 18));
    const postComments = comments[selectedArticle.id] || [];

    return (
      <div className="dentflow-dot-grid min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right" id="article-detail-page">
        
        {/* Reading Progress Line (Sticky Top) */}
        <div className="fixed top-0 left-0 w-full h-2 bg-[#1A3C3A]/10 z-50">
          <div 
            className="h-full bg-[#2DD4BF] transition-all duration-75"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Back and Breadcrumbs Navigation bar */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl neo-border neo-shadow-dark mb-10" id="article-detail-header-actions">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#1A3C3A] font-extrabold font-sans">
            <span 
              className="hover:text-[#0D9488] transition-colors cursor-pointer flex items-center gap-1" 
              onClick={() => {
                if (window.history.pushState) window.history.pushState(null, "", "/#articles");
                window.location.hash = "#articles";
                setSelectedArticle(null);
              }}
            >
              <span>کلینیک دنت فلو</span>
              <span>/</span>
              <span>مقالات علمی</span>
            </span>
            <span>/</span>
            <span className="bg-[#2DD4BF] text-[#1A3C3A] px-2.5 py-1 rounded-md border border-[#1A3C3A] text-[10px] uppercase font-black">{selectedArticle.category}</span>
            <span>/</span>
            <span className="text-[#0D9488] font-black line-clamp-1 max-w-[200px] sm:max-w-[400px]">
              {selectedArticle.title}
            </span>
          </div>
          <button
            onClick={() => {
              if (window.history.pushState) window.history.pushState(null, "", "/#articles");
              window.location.hash = "#articles";
              setSelectedArticle(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#2DD4BF] hover:bg-[#0D9488] hover:text-white text-[#1A3C3A] text-xs font-black rounded-xl transition-all cursor-pointer neo-border shadow-[3px_3px_0_0_#1A3C3A] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#1A3C3A]"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>بازگشت به لیست مقالات</span>
          </button>
        </div>

        {/* Editorial Layout Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Article Content Panel (8 Columns) */}
          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[24px] neo-border neo-shadow-dark overflow-hidden flex flex-col">
              
              {/* Premium Content Area */}
              <div className="p-6 sm:p-10 space-y-8 text-right bg-white">
                
                {/* Meta details & Custom colored category label */}
                <div className="flex flex-wrap items-center gap-4 pb-4 border-b-2 border-slate-100/80 font-sans text-xs font-bold text-[#1A3C3A]/70 justify-start">
                  <span className="px-3 py-1 bg-[#2DD4BF] text-[#1A3C3A] border-2 border-[#1A3C3A] rounded-md text-[10px] font-black uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                    ⏱ زمان مطالعه: {selectedArticle.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                    📅 {selectedArticle.date}
                  </span>
                </div>

                {/* Main Heading title of article */}
                <h1 className="text-2xl sm:text-4xl font-black text-[#1A3C3A] leading-tight">
                  {selectedArticle.title}
                </h1>

                {/* Excerpt Summary Callout */}
                <div className="summary-card relative p-6 sm:p-8 bg-white neo-border rounded-[20px] neo-shadow border-[#1A3C3A]">
                  <Sparkles className="absolute left-4 top-4 w-5 h-5 text-[#0D9488] opacity-40 animate-pulse" />
                  <h3 className="text-sm font-black text-[#0D9488] mb-2 uppercase font-sans">خلاصه و ضرورت راهنما</h3>
                  <p className="text-xs sm:text-sm text-[#1A3C3A] font-bold leading-loose">
                    {selectedArticle.excerpt}
                  </p>
                </div>

                {/* Premium Hero Cover Image with badge rotation decoration */}
                <div className="hero-container relative">
                  <img 
                    src={selectedArticle.imageUrl} 
                    alt={selectedArticle.title}
                    className="hero-img w-full h-[240px] sm:h-[420px] object-cover rounded-[24px] neo-border"
                    referrerPolicy="no-referrer"
                  />
                  {/* Rotating decorative Badge "Smile" / "DentFlow" */}
                  <div className="hero-decoration absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-[#2DD4BF] text-[#1A3C3A] rounded-full flex flex-col items-center justify-center transform rotate-12 neo-border font-gaegu text-sm sm:text-base font-bold shadow-md cursor-default select-none hover:rotate-0 transition-transform duration-300">
                    <span>Smile</span>
                    <span className="text-[8px] tracking-widest uppercase opacity-75">Flow</span>
                  </div>
                </div>

                {/* Body Prose contents */}
                <div className="article-body font-sans text-right">
                  <article className="prose prose-slate max-w-none w-full overflow-hidden text-[#1A3C3A] leading-[2] text-sm sm:text-base rtl-html-content">
                    {renderMarkdown(selectedArticle.content || "")}
                  </article>
                </div>

                {/* Double check badge */}
                <div className="flex items-center gap-2 p-3 bg-[#F0F9F9] rounded-xl border-2 border-dashed border-[#2DD4BF]/60 text-xs text-[#0D9488] font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
                  <span>تمامی مقالات و محتوای علمی دنت فلو توسط دندانپزشکان متخصص جراحی و ترمیم بازبینی و تایید شده است.</span>
                </div>

              </div>

              {/* Interactivity Bar (Likes, Bookmarks, Copy Link) */}
              <div className="px-6 sm:px-10 py-5 bg-[#F0F9F9] border-t-2 border-[#1A3C3A] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Like button */}
                  <button 
                    onClick={() => handleLike(selectedArticle.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 border-[#1A3C3A] ${
                      isLiked 
                        ? "bg-rose-100 text-rose-600 shadow-[2px_2px_0_0_#1A3C3A]" 
                        : "bg-white text-[#1A3C3A] hover:bg-rose-50 shadow-[4px_4px_0_0_#1A3C3A]"
                    } active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#1A3C3A]`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>{likeCount} پسند</span>
                  </button>

                  {/* Bookmark button */}
                  <button 
                    onClick={() => handleBookmark(selectedArticle.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 border-[#1A3C3A] ${
                      isBookmarked 
                        ? "bg-[#2DD4BF] text-[#1A3C3A] shadow-[2px_2px_0_0_#1A3C3A]" 
                        : "bg-white text-[#1A3C3A] hover:bg-slate-50 shadow-[4px_4px_0_0_#1A3C3A]"
                    } active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#1A3C3A]`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#1A3C3A] text-[#1A3C3A]" : ""}`} />
                    <span>{isBookmarked ? "ذخیره شده" : "ذخیره راهنما"}</span>
                  </button>
                </div>

                {/* Share URL Button */}
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#1A3C3A] font-black text-xs rounded-xl border-2 border-[#1A3C3A] shadow-[4px_4px_0_0_#1A3C3A] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#1A3C3A]"
                >
                  {shareSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">لینک کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#0D9488]" />
                      <span>اشتراک‌گذاری مقاله</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* In-Text CTA Appointment Booking block */}
            <div className="cta-banner p-8 sm:p-10 bg-[#1A3C3A] text-white rounded-[24px] neo-border neo-shadow text-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#2DD4BF]/10 rounded-full blur-2xl" />
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-[#2DD4BF]/10 rounded-full blur-2xl" />
              
              <div className="space-y-4 relative z-10 max-w-2xl mx-auto">
                <span className="inline-block px-3 py-1 bg-[#2DD4BF] text-[#1A3C3A] border border-[#1A3C3A] rounded-md text-[10px] font-black uppercase font-space-mono tracking-widest">
                  DENTFLOW MEDICAL SYSTEM
                </span>
                <h3 className="text-xl sm:text-2xl font-black">نیاز به مشورت مستقیم دندانپزشک دارید؟</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-bold">
                  شما می‌توانید به صورت آنلاین، نوبت ویزیت و معاینه تخصصی دیجیتال خود را ثبت کنید. کارشناسان پزشکی دنت فلو در سریع‌ترین زمان برای هماهنگی با شما تماس می‌گیرند.
                </p>
                <div className="pt-4">
                  <a 
                    href="#booking"
                    onClick={() => {
                      setSelectedArticle(null);
                      window.location.hash = "#booking";
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#2DD4BF] hover:bg-[#0D9488] hover:text-white text-[#1A3C3A] font-black text-xs sm:text-sm rounded-full transition-all duration-300 neo-border shadow-[4px_4px_0_0_white] cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>رزرو نوبت معاینه تخصصی</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Q&A / Real interactive Comments Block */}
            <div className="bg-white rounded-[24px] neo-border neo-shadow-dark p-6 sm:p-8 text-right space-y-6">
              <div className="flex items-center gap-2.5 justify-end border-b-2 border-slate-100 pb-4">
                <span className="text-[#0D9488] text-xs font-extrabold font-sans">({postComments.length} پرسش علمی)</span>
                <h3 className="text-base sm:text-lg font-black text-[#1A3C3A]">پرسش و پاسخ تخصصی این مقاله</h3>
                <MessageSquare className="w-5 h-5 text-[#0D9488]" />
              </div>

              {/* Form to submit comments/questions */}
              <form onSubmit={(e) => handleCommentSubmit(e, selectedArticle.id)} className="space-y-4">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  سوالی در مورد این مقاله یا درمان مربوط به آن دارید؟ پرسش خود را ارسال کنید تا دندانپزشک ما پاسخ دهد.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-black text-[#1A3C3A]">نام شما</label>
                    <input 
                      type="text" 
                      placeholder="مثال: رضا حسینی"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#1A3C3A] text-xs font-bold text-[#1A3C3A] text-right outline-none bg-white focus:bg-[#F0F9F9] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 text-right sm:col-span-2">
                    <label className="text-[11px] font-black text-[#1A3C3A]">متن پرسش شما</label>
                    <textarea 
                      placeholder="پرسش خود را دقیق بنویسید..."
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#1A3C3A] text-xs font-bold text-[#1A3C3A] text-right outline-none bg-white focus:bg-[#F0F9F9] transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1A3C3A] hover:bg-[#0D9488] text-white font-black text-xs rounded-xl shadow-md border-2 border-[#1A3C3A] hover:border-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 transform rotate-180" />
                    <span>ثبت و ارسال پرسش به پزشک</span>
                  </button>
                </div>
              </form>

              {/* Dynamic rendering comments list */}
              <div className="space-y-4 pt-2">
                {postComments.length === 0 ? (
                  <div className="text-center py-8 bg-[#F0F9F9]/50 rounded-2xl text-slate-400 text-xs font-bold space-y-1.5 border-2 border-dashed border-[#1A3C3A]/20">
                    <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-[#1A3C3A]" />
                    <p>هنوز سوالی ثبت نشده است. اولین پرسش علمی را شما مطرح کنید!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {postComments.map((comment, index) => (
                      <div key={index} className="p-4 bg-slate-50/70 rounded-2xl border-2 border-slate-100 flex gap-3.5 text-right transition-all hover:bg-white hover:border-[#2DD4BF]">
                        <div className="w-10 h-10 rounded-full bg-[#F0F9F9] border-2 border-[#1A3C3A] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#1A3C3A]">
                          <User className="w-4 h-4 text-[#1A3C3A]" />
                        </div>
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-center w-full pb-1 border-b border-slate-100">
                            <span className="text-[10px] text-slate-400 font-extrabold font-sans">{comment.date}</span>
                            <h4 className="text-xs font-black text-[#1A3C3A]">{comment.name}</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-bold pt-1.5">
                            {comment.text}
                          </p>
                          {comment.reply ? (
                            <div className="mt-3 p-3.5 bg-teal-50/50 border border-teal-100 rounded-2xl text-xs text-slate-700 font-semibold space-y-1.5 text-right relative">
                              <div className="flex justify-between items-center border-b border-teal-100/40 pb-1.5 mb-1.5">
                                <span className="text-[10px] text-slate-400 font-extrabold">{comment.replyDate || comment.date}</span>
                                <span className="font-black text-teal-600 flex items-center gap-1">
                                  <span>پاسخ پزشک متخصص ({articleAuthor.name})</span>
                                  <Sparkles className="w-3.5 h-3.5" />
                                </span>
                              </div>
                              <p className="leading-relaxed text-slate-600">{comment.reply}</p>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-md text-[9px] font-black mt-2 border border-yellow-200">
                              <span>منتظر پاسخ مستقیم جراح متخصص</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </main>

          {/* Sticky Editorial Sidebar (4 Columns) */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            
            {/* Expertise: Doctor Information box */}
            <div>
              <span className="sidebar-title block text-xs font-extrabold text-[#0D9488] font-space-mono tracking-widest uppercase mb-2">
                EXPERT PANEL
              </span>
              <div className="doctor-box bg-white rounded-[24px] neo-border p-6 text-right space-y-4">
                <img 
                  src={articleAuthor.avatar} 
                  alt={articleAuthor.name} 
                  className="doctor-avatar w-16 h-16 rounded-full object-cover border-4 border-[#2DD4BF]"
                />
                <div>
                  <h4 className="font-black text-lg text-[#1A3C3A]">{articleAuthor.name}</h4>
                  <p className="text-xs text-[#0D9488] font-extrabold">{articleAuthor.title}</p>
                </div>
                <p className="text-xs text-[#1A3C3A]/80 leading-relaxed font-bold">
                  {articleAuthor.bio}
                </p>
                <div className="bg-[#F0F9F9] p-4 rounded-xl border border-[#2DD4BF]/40 space-y-1">
                  <span className="font-black text-[#1A3C3A] text-xs block">مشاوره آنلاین مستقیم:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    جهت بررسی وضعیت عکس رادیوگرافی لثه، به بخش چت زنده هوشمند دنت فلو مراجعه نمایید.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Query Sidebar Form - Connected to local state comments list! */}
            <div>
              <span className="sidebar-title block text-xs font-extrabold text-[#0D9488] font-space-mono tracking-widest uppercase mb-2">
                QUICK QUERY
              </span>
              <div className="bg-white rounded-[24px] neo-border p-6 text-right">
                <form onSubmit={(e) => handleCommentSubmit(e, selectedArticle.id)} className="space-y-3.5">
                  <input 
                    type="text" 
                    placeholder="نام و نام خانوادگی"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    required
                    className="form-control w-full px-4 py-3 border-2 border-[#1A3C3A] rounded-xl text-xs font-bold text-[#1A3C3A] bg-white outline-none focus:bg-[#F0F9F9] transition-colors"
                  />
                  <textarea 
                    placeholder="پرسش شما..."
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    className="form-control w-full px-4 py-3 border-2 border-[#1A3C3A] rounded-xl text-xs font-bold text-[#1A3C3A] bg-white outline-none focus:bg-[#F0F9F9] transition-colors resize-none"
                  />
                  <button 
                    type="submit" 
                    className="btn-submit w-full py-3 bg-[#1A3C3A] hover:bg-[#0D9488] text-white rounded-xl font-black text-xs border-2 border-[#1A3C3A] cursor-pointer shadow-[4px_4px_0_0_#2DD4BF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#2DD4BF] transition-all"
                  >
                    ارسال پرسش به پزشک
                  </button>
                </form>
              </div>
            </div>

            {/* Suggested / Related Articles sidebar */}
            {relatedArticles.length > 0 && (
              <div>
                <span className="sidebar-title block text-xs font-extrabold text-[#0D9488] font-space-mono tracking-widest uppercase mb-2">
                  SUGGESTED
                </span>
                <div className="bg-white rounded-[24px] neo-border p-6 text-right space-y-4">
                  {relatedArticles.map((post) => (
                    <div 
                      key={post.id}
                      onClick={() => {
                        setSelectedArticle(post);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group flex gap-3 cursor-pointer items-center p-2 rounded-xl hover:bg-[#F0F9F9] transition-colors border-2 border-transparent hover:border-[#1A3C3A]/20"
                    >
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-14 h-14 rounded-lg object-cover neo-border shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 flex-1 text-right">
                        <h4 className="text-xs font-black text-[#1A3C3A] line-clamp-1 group-hover:text-[#0D9488] transition-colors">
                          {post.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-extrabold font-sans block">
                          ⏱ {post.readTime}
                        </span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-[#1A3C3A] transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Sidebar Brand badge */}
            <div className="bg-[#1A3C3A] rounded-[24px] p-6 text-white text-right relative overflow-hidden shadow-xl shadow-teal-950/20">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#2DD4BF]/10 rounded-full blur-2xl" />
              <div className="space-y-3 relative z-10">
                <span className="text-[10px] font-black text-[#2DD4BF] bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-900 inline-block font-space-mono tracking-wider">
                  DENTFLOW SERVICES
                </span>
                <h4 className="text-xs sm:text-sm font-black">طراحی دیجیتال لبخند هالیوودی</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                  کلینیک دیجیتال دنت فلو مجهز به اسکنر سه‌بعدی پیشرفته و نرم‌افزار هوش مصنوعی شبیه‌سازی لبخند قبل از انجام کامپوزیت و لمینت است.
                </p>
                <div className="pt-2">
                  <a 
                    href="#booking"
                    onClick={() => {
                      setSelectedArticle(null);
                      window.location.hash = "#booking";
                    }}
                    className="w-full py-2.5 bg-[#2DD4BF] hover:bg-[#0D9488] text-[#1A3C3A] hover:text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all neo-border shadow-[3px_3px_0_0_white]"
                  >
                    <span>رزرو نوبت مشاوره رایگان</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    );
  }

  return (
    <section id="articles" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      
      {/* List Header text block */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-[#1A3C3A]" id="articles-header">
        <div className="space-y-2 text-center md:text-right flex-1" id="articles-header-text">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2DD4BF]/20 text-[#0D9488] text-xs font-black border-2 border-[#2DD4BF]/40">
            <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>پایگاه علمی و دانستنی‌های سلامت دهان و دندان</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#1A3C3A]">مقالات تخصصی و آموزشی دندانپزشکی</h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-bold max-w-2xl">
            با مطالعه آخرین نوشته‌ها و راهنماهای علمی تدوین‌شده توسط متخصصان دنت فلو، آگاهی بهداشتی خود را بالا ببرید.
          </p>
        </div>
      </div>

      {/* Advanced Interactive Filters and Real-time Search Panel */}
      <div className="bg-[#F0F9F9] p-5 rounded-3xl neo-border flex flex-col md:flex-row items-center gap-4 justify-between" id="articles-filter-panel">
        
        {/* Real-time Search input */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-[#1A3C3A]/60" />
          <input 
            type="text" 
            placeholder="جستجوی عنوان یا موضوع مقاله..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border-2 border-[#1A3C3A] focus:bg-[#F0F9F9]/20 text-xs text-[#1A3C3A] text-right outline-none font-bold transition-all shadow-[4px_4px_0_0_#1A3C3A]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg px-2 py-1 text-[10px] font-black cursor-pointer transition-colors"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Category filters chips scroll */}
        <div className="w-full overflow-x-auto py-1 scrollbar-thin">
          <div className="flex flex-row-reverse items-center gap-2 justify-start md:justify-end min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer border-2 border-[#1A3C3A] ${
                  selectedCategory === cat
                    ? "bg-[#2DD4BF] text-[#1A3C3A] shadow-[3px_3px_0_0_#1A3C3A]"
                    : "bg-white text-[#1A3C3A] hover:bg-slate-50 shadow-[4px_4px_0_0_#1A3C3A]"
                } active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#1A3C3A]`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter summary status lines */}
      {(searchQuery || selectedCategory !== "همه") && (
        <div className="text-right text-xs font-bold text-[#1A3C3A] flex items-center gap-2 justify-end bg-[#2DD4BF]/10 p-3.5 rounded-xl border-2 border-dashed border-[#1A3C3A]/20">
          <span>{filteredArticles.length} مقاله یافت شد</span>
          <span className="w-1.5 h-1.5 bg-[#0D9488] rounded-full" />
          <span>
            فیلتر: {selectedCategory === "همه" ? "تمام دسته‌بندی‌ها" : `دسته‌بندی "${selectedCategory}"`} {searchQuery ? `، شامل عبارت "${searchQuery}"` : ""}
          </span>
        </div>
      )}

      {/* Premium Article Cards Grid styled with bold neo-brutalist border-box shadow effects */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[24px] neo-border neo-shadow-dark max-w-lg mx-auto space-y-4">
          <Search className="w-12 h-12 text-[#1A3C3A] opacity-30 mx-auto" />
          <h4 className="font-black text-[#1A3C3A] text-base">هیچ مقاله‌ای با مشخصات جستجو پیدا نشد</h4>
          <p className="text-xs text-slate-500 font-bold px-6">کلمات کلیدی دیگری را بررسی نمایید یا فیلتر دسته‌بندی‌ها را تغییر دهید.</p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedCategory("همه"); }}
            className="px-5 py-2.5 bg-[#2DD4BF] text-[#1A3C3A] font-black text-xs rounded-xl border-2 border-[#1A3C3A] shadow-[4px_4px_0_0_#1A3C3A] cursor-pointer transition-all active:scale-95"
          >
            نمایش تمام مقالات دنت فلو
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="articles-grid">
          {filteredArticles.map((post) => {
            const isSaved = !!bookmarks[post.id];
            
            // Premium background colors for categories
            let categoryBadgeStyle = "bg-[#2DD4BF] text-[#1A3C3A]";
            if (post.category.includes("ارتودنسی")) {
              categoryBadgeStyle = "bg-indigo-100 text-indigo-900";
            } else if (post.category.includes("ایمپلنت")) {
              categoryBadgeStyle = "bg-blue-100 text-blue-900";
            } else if (post.category.includes("زیبایی") || post.category.includes("اصلاح لبخند")) {
              categoryBadgeStyle = "bg-rose-100 text-rose-950";
            }

            return (
              <article 
                key={post.id}
                id={`article-card-${post.id}`}
                onClick={() => { 
                  setSelectedArticle(post); 
                  window.location.hash = `#article/${post.id}`;
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group bg-white rounded-[24px] neo-border neo-shadow-dark hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
              >
                <div>
                  
                  {/* Article cover banner image with rotation elements */}
                  <div className="aspect-[16/10] w-full overflow-hidden relative border-b-2 border-[#1A3C3A]" id={`article-image-frame-${post.id}`}>
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={post.imageUrl} 
                      alt={post.title} 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Category Label */}
                    <span className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1.5 rounded-md border-2 border-[#1A3C3A] uppercase ${categoryBadgeStyle}`}>
                      {post.category}
                    </span>

                    {/* Bookmark sticker */}
                    {isSaved && (
                      <span className="absolute top-4 left-4 bg-yellow-400 text-[#1A3C3A] p-2 rounded-md border-2 border-[#1A3C3A] shadow-sm">
                        <Bookmark className="w-3.5 h-3.5 fill-[#1A3C3A]" />
                      </span>
                    )}
                  </div>

                  {/* Content details block */}
                  <div className="p-6 text-right space-y-3" id={`article-info-${post.id}`}>
                    
                    {/* Meta calendar line */}
                    <div className="flex items-center gap-4 text-[10px] font-extrabold text-[#1A3C3A]/60 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-[#1A3C3A] group-hover:text-[#0D9488] transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    
                    {/* Excerpt */}
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-3 font-bold">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer actions */}
                <div className="px-6 pb-6 text-right pt-4 border-t border-slate-100/60 flex items-center justify-between" id={`article-footer-${post.id}`}>
                  <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black font-sans">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{post.likes !== undefined ? post.likes : (post.id * 7 + 18)} پسند</span>
                  </div>
                  
                  <span className="text-[#0D9488] font-black text-xs flex items-center gap-1 group-hover:text-[#1A3C3A] transition-colors">
                    مطالعه کامل راهنما
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
