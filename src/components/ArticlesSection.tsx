import React from "react";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { BlogPost, blogPosts } from "../data";
import { renderMarkdown } from "./ArticlesTab";

interface ArticlesSectionProps {
  articles: BlogPost[];
  selectedArticle: BlogPost | null;
  setSelectedArticle: (post: BlogPost | null) => void;
}

export default function ArticlesSection({ 
  articles, 
  selectedArticle, 
  setSelectedArticle 
}: ArticlesSectionProps) {
  
  const articleList = articles.length > 0 ? articles : blogPosts;

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right space-y-8 animate-fade-in" id="article-detail-page">
        <div className="flex justify-between items-center" id="article-detail-header-actions">
          <span className="text-[10px] sm:text-xs text-slate-400 font-bold">خانه / مقالات آموزشی / {selectedArticle.title}</span>
          <button
            onClick={() => {
              window.location.hash = "#articles";
              setSelectedArticle(null);
            }}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 hover:border-teal-200 hover:bg-teal-50/20 text-slate-700 hover:text-teal-600 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>بازگشت به لیست مقالات</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-teal-950/5 flex flex-col" style={{ wordBreak: "keep-all" }}>
          {/* Header Cover Banner */}
          <div className="relative h-64 sm:h-96 bg-slate-100 shrink-0">
            <img 
              src={selectedArticle.imageUrl} 
              alt={selectedArticle.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <span className="absolute top-4 right-4 bg-teal-500 text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
              {selectedArticle.category}
            </span>

            {/* Title overlay at the bottom of cover */}
            <div className="absolute bottom-5 right-6 left-6 space-y-1.5">
              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-teal-300 font-bold justify-end">
                <span className="flex items-center gap-1">
                  {selectedArticle.date}
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <span className="flex items-center gap-1">
                  {selectedArticle.readTime}
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-white leading-normal">
                {selectedArticle.title}
              </h1>
            </div>
          </div>

          {/* Article body */}
          <div 
            className="p-6 sm:p-10 overflow-x-hidden overflow-y-auto space-y-6 flex-1 bg-slate-50/30" 
            style={{ 
              direction: "rtl"
            }}
          >
            
            {/* Brief introduction card */}
            <div className="p-4 bg-teal-50/30 border-r-4 border-teal-500 rounded-l-2xl text-xs sm:text-sm text-teal-900 font-bold leading-relaxed shadow-sm">
              {selectedArticle.excerpt}
            </div>

            {/* Full article rich text */}
            <div 
              className="prose prose-slate max-w-none w-full overflow-hidden text-right font-medium text-slate-700 leading-relaxed text-xs sm:text-sm md:text-base"
            >
              {renderMarkdown(selectedArticle.content || "")}
            </div>

            {/* Quick Consultation Call to action */}
            <div className="border-t border-slate-100 pt-6 mt-8">
              <div className="p-6 bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-right">
                  <h4 className="text-sm font-black text-slate-800">نیاز به مشاوره تخصصی دندانپزشکی دارید؟</h4>
                  <p className="text-[11px] text-slate-500 font-bold">می‌توانید به صورت کاملاً آنلاین و رایگان نوبت خود را ثبت کنید تا کارشناسان ما با شما تماس بگیرند.</p>
                </div>
                
                <a 
                  href="#booking"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-teal-600/15"
                >
                  ثبت فوری نوبت مشاوره
                </a>
              </div>
            </div>
          </div>

          {/* Footer info block inside reader */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold">کاری از کادر پژوهشی و درمانی دنت فلو</span>
            <button
              onClick={() => {
                window.location.hash = "#articles";
                setSelectedArticle(null);
              }}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              بازگشت به مقالات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="articles" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start justify-between mb-16 gap-4 text-right" id="articles-header">
        <div className="space-y-4 max-w-3xl" id="articles-header-text">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100">
            <span>بخش آموزش و سلامت دندان</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">جدیدترین مقالات و راهنماهای بهداشت دهان</h2>
          <p className="text-slate-500 text-sm leading-relaxed font-semibold">
            دانش بیشتر، کلید پیشگیری از بیماری‌ها است. مقالات نگارش شده توسط دندانپزشکان متخصص ما را مطالعه کنید.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="articles-grid">
        {articleList.map((post) => (
          <article 
            key={post.id}
            id={`article-card-${post.id}`}
            onClick={() => { window.location.hash = `#article/${post.id}`; }}
            className="group bg-white border border-white/60 rounded-[28px] overflow-hidden hover:scale-[1.01] hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div id={`article-body-wrapper-${post.id}`}>
              {/* Article Banner image */}
              <div className="aspect-video w-full overflow-hidden relative" id={`article-image-frame-${post.id}`}>
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={post.imageUrl} 
                  alt={post.title} 
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm border border-slate-100" id={`article-badge-${post.id}`}>
                  {post.category}
                </span>
              </div>

              {/* Content details */}
              <div className="p-6 text-right space-y-3" id={`article-info-${post.id}`}>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold" id={`article-meta-${post.id}`}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2" id={`article-title-${post.id}`}>
                  {post.title}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-3 font-semibold" id={`article-excerpt-${post.id}`}>
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 text-right" id={`article-footer-${post.id}`}>
              <span className="text-teal-600 font-extrabold text-xs flex items-center gap-1" id={`article-more-btn-${post.id}`}>
                ادامه مطلب و مطالعه راهنما
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
