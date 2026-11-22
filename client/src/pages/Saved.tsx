import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, Bookmark, Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SAVED_PAPERS_KEY, RESEARCH_SOURCES, type ResearchPaper } from "@shared/research";
import { encodePaperRouteId, getSavedPapers } from "@/lib/research-utils";

export default function SavedPage() {
  const { isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const [papers, setPapers] = useState<ResearchPaper[]>(getSavedPapers);

  const removePaper = (id: string) => {
    const next = papers.filter(paper => paper.id !== id);
    localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(next));
    setPapers(next);
  };
  const sourceLabel = (paper: ResearchPaper) => paper.sources.map(id => RESEARCH_SOURCES.find(source => source.id === id)?.name ?? id).join(" · ");

  return (
    <section className="saved-page content-page">
      <div className="page-heading-block"><div className="eyebrow"><span className="eyebrow-line" />{isArabic ? "مكتبتك الشخصية" : "YOUR LIBRARY"}</div><h1>{isArabic ? "الأبحاث المحفوظة" : "Saved research"}</h1><p>{isArabic ? "احتفظ بالأبحاث المهمة وارجع إليها من هذا الجهاز." : "Keep important papers close. Saved papers stay in this browser."}</p></div>
      {papers.length === 0 ? <div className="page-empty-state"><span className="empty-icon"><Bookmark size={24} /></span><h2>{isArabic ? "قائمة المحفوظات فارغة" : "No saved papers yet"}</h2><p>{isArabic ? "استخدم علامة الحفظ في نتيجة البحث لإضافتها هنا." : "Use the bookmark on a search result to add it here."}</p><button className="primary-button" onClick={() => setLocation("/")} type="button">{isArabic ? "ابدأ البحث" : "Start searching"}<ArrowUpRight size={16} /></button></div> : <div className="saved-list"><div className="saved-list-heading"><span>{isArabic ? `${papers.length} بحث محفوظ` : `${papers.length} saved ${papers.length === 1 ? "paper" : "papers"}`}</span><button className="text-button danger-text" type="button" onClick={() => { localStorage.removeItem(SAVED_PAPERS_KEY); setPapers([]); }}>{isArabic ? "مسح الكل" : "Clear all"}</button></div>{papers.map(paper => <article className="paper-card saved-card" key={paper.id}><div className="paper-card-topline"><div className="paper-badges"><span className="source-badges">{sourceLabel(paper)}</span>{paper.openAccess && <span className="oa-badge"><span />{isArabic ? "وصول مفتوح بحسب المصدر" : "Open access reported"}</span>}</div><button className="icon-button remove-saved" type="button" onClick={() => removePaper(paper.id)} aria-label={isArabic ? "إزالة من المحفوظات" : "Remove from saved"}><Trash2 size={16} /></button></div><button className="paper-title-button" type="button" onClick={() => setLocation(`/paper/${encodePaperRouteId(paper.id)}`)}><h3>{paper.title}</h3></button><div className="paper-meta">{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}{paper.journal ? ` · ${paper.journal}` : ""}{paper.year ? ` · ${paper.year}` : ""}</div><div className="paper-card-footer"><div className="paper-id">{paper.doi && <span>DOI: {paper.doi}</span>}</div><div className="paper-actions">{paper.pdfUrl && paper.openAccess ? <a className="primary-button small" href={paper.pdfUrl} target="_blank" rel="noreferrer"><Download size={15} />{isArabic ? "PDF من المصدر" : "Source PDF"}</a> : paper.landingUrl ? <a className="secondary-button small" href={paper.landingUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{isArabic ? "المصدر" : "Source"}</a> : null}<button className="details-link" type="button" onClick={() => setLocation(`/paper/${encodePaperRouteId(paper.id)}`)}><FileText size={15} />{isArabic ? "التفاصيل" : "Details"}</button></div></div></article>)}</div>}
    </section>
  );
}
