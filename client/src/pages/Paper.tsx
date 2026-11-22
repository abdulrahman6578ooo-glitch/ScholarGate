import { useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ArrowUpRight, BookOpen, Bookmark, Check, Clipboard, Download, ExternalLink, FileText, Link2, LockKeyhole, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SAVED_PAPERS_KEY, RESEARCH_SOURCES, type ResearchPaper } from "@shared/research";
import { decodePaperRouteId } from "@/lib/research-utils";

function readPaper(id: string): ResearchPaper | null {
  try {
    const results = JSON.parse(sessionStorage.getItem("scholargate:last-results") || "[]") as ResearchPaper[];
    const saved = JSON.parse(localStorage.getItem(SAVED_PAPERS_KEY) || "[]") as ResearchPaper[];
    return [...results, ...saved].find(paper => paper.id === id) ?? null;
  } catch { return null; }
}

function citationFor(paper: ResearchPaper, style: "apa" | "mla" | "bibtex") {
  const authors = paper.authors.length ? paper.authors.join(", ") : "Unknown author";
  const year = paper.year ?? "n.d.";
  if (style === "bibtex") {
    const key = `${paper.authors[0]?.split(" ").at(-1) ?? "research"}${year}`.replace(/[^a-z0-9]/gi, "");
    return `@article{${key},\n  title={${paper.title}},\n  author={${authors}},\n  year={${year}}${paper.journal ? `,\n  journal={${paper.journal}}` : ""}${paper.doi ? `,\n  doi={${paper.doi}}` : ""}\n}`;
  }
  if (style === "mla") return `${authors}. “${paper.title}.” ${paper.journal ?? ""}${paper.journal ? ", " : ""}${year}${paper.doi ? `, https://doi.org/${paper.doi}` : ""}.`;
  return `${authors} (${year}). ${paper.title}.${paper.journal ? ` ${paper.journal}.` : ""}${paper.doi ? ` https://doi.org/${paper.doi}` : ""}`;
}

export default function PaperPage() {
  const [, params] = useRoute("/paper/:id");
  const id = decodePaperRouteId(params?.id ?? "");
  const paper = useMemo(() => readPaper(id), [id]);
  const { isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const [style, setStyle] = useState<"apa" | "mla" | "bibtex">("apa");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(SAVED_PAPERS_KEY) || "[]") as ResearchPaper[]).some(item => item.id === id); }
    catch { return false; }
  });

  const toggleSaved = () => {
    if (!paper) return;
    const collection = JSON.parse(localStorage.getItem(SAVED_PAPERS_KEY) || "[]") as ResearchPaper[];
    const next = saved ? collection.filter(item => item.id !== id) : [paper, ...collection.filter(item => item.id !== id)];
    localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(next));
    setSaved(!saved);
  };

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationFor(paper!, style));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  };

  if (!paper) return <section className="detail-missing"><div className="detail-missing-icon"><FileText size={24} /></div><h1>{isArabic ? "لا تتوفر تفاصيل هذا البحث هنا" : "Paper details aren’t available here"}</h1><p>{isArabic ? "قد تكون الجلسة انتهت أو لم تُفتح تفاصيله من صفحة النتائج. ارجع وابحث عنه من جديد." : "Your search session may have ended. Return to search and open the paper from its result."}</p><button className="primary-button" type="button" onClick={() => setLocation("/")}><ArrowLeft size={16} />{isArabic ? "العودة إلى البحث" : "Back to search"}</button></section>;

  const sourceNames = paper.sources.map(id => RESEARCH_SOURCES.find(source => source.id === id)?.name ?? id);
  const accessUrl = paper.pdfUrl && paper.openAccess ? paper.pdfUrl : null;

  return (
    <article className="paper-detail-page">
      <button className="back-link" onClick={() => setLocation("/")} type="button"><ArrowLeft size={16} />{isArabic ? "العودة للنتائج" : "Back to results"}</button>
      <div className="detail-header">
        <div className="detail-crumb">{isArabic ? "تفاصيل البحث" : "PAPER DETAILS"}<span>·</span>{sourceNames.join(" · ")}</div>
        <div className="detail-title-row"><h1>{paper.title}</h1><button className={`icon-button detail-save ${saved ? "saved" : ""}`} onClick={toggleSaved} type="button" aria-label={isArabic ? "حفظ البحث" : "Save paper"}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button></div>
        <p className="detail-authors">{paper.authors.join(", ") || (isArabic ? "بيانات المؤلفين غير متاحة" : "Authors not listed")}</p>
        <div className="detail-meta-row">{paper.journal && <span><BookOpen size={15} />{paper.journal}</span>}{paper.year && <span>{paper.year}</span>}{paper.doi && <a href={`https://doi.org/${paper.doi.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer"><Link2 size={14} /> DOI: {paper.doi}<ArrowUpRight size={13} /></a>}</div>
        <div className="detail-status-row">{paper.openAccess ? <span className="oa-badge large"><span />{isArabic ? "إتاحة مفتوحة بحسب بيانات المصدر" : "Open access reported by source"}</span> : <span className="access-locked"><LockKeyhole size={14} />{isArabic ? "لم يُعثر على وصول مفتوح" : "No open access reported"}</span>}{paper.type && <span className="detail-type">{paper.type}</span>}</div>
      </div>

      <div className="detail-layout">
        <div className="detail-main-column">
          <section className="detail-card abstract-card"><div className="section-label"><span className="section-icon"><FileText size={17} /></span><h2>{isArabic ? "الملخص" : "Abstract"}</h2></div>{paper.abstract ? <p>{paper.abstract}</p> : <p className="muted-copy">{isArabic ? "لم يوفّر المصدر ملخصًا لهذا البحث." : "The source did not provide an abstract for this paper."}</p>}</section>
          <section className="detail-card citation-card"><div className="section-label"><span className="section-icon"><Quote size={17} /></span><h2>{isArabic ? "اقتباس" : "Cite this paper"}</h2></div><div className="citation-tabs"><button className={style === "apa" ? "active" : ""} type="button" onClick={() => setStyle("apa")}>APA</button><button className={style === "mla" ? "active" : ""} type="button" onClick={() => setStyle("mla")}>MLA</button><button className={style === "bibtex" ? "active" : ""} type="button" onClick={() => setStyle("bibtex")}>BibTeX</button></div><pre className="citation-text">{citationFor(paper, style)}</pre><button className="secondary-button copy-citation" type="button" onClick={copyCitation}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? (isArabic ? "تم النسخ" : "Copied") : (isArabic ? "نسخ الاقتباس" : "Copy citation")}</button></section>
        </div>
        <aside className="detail-side-column">
          <section className="detail-card access-card"><div className="section-label"><span className="section-icon"><Download size={17} /></span><h2>{isArabic ? "النص الكامل" : "Full text"}</h2></div>
            {accessUrl ? <><p>{isArabic ? "المصدر يبلّغ عن إتاحة مفتوحة ويوفر رابط PDF مباشرًا." : "The source reports open access and provides a direct PDF link."}</p><a className="primary-button access-button" href={accessUrl} target="_blank" rel="noreferrer"><Download size={17} />{isArabic ? "فتح PDF من المصدر" : "Open source PDF"}<ArrowUpRight size={15} /></a></> : <><p className="muted-copy">{isArabic ? "لا يتوفر رابط PDF مباشر موثوق هنا. قد تكون خيارات النص الكامل متاحة في صفحة المصدر وفق شروطه." : "No verified direct PDF link is available here. Full-text options may be available on the source page under its terms."}</p>{paper.landingUrl && <a className="secondary-button access-button" href={paper.landingUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} />{isArabic ? "زيارة صفحة المصدر" : "Visit source page"}</a>}</>}
            <div className="access-disclaimer"><Check size={14} />{isArabic ? "لا نحفظ الملفات ولا نتجاوز شروط أي منصة." : "We don’t host files or bypass platform access rules."}</div>
            {paper.license && <p className="license-note">{isArabic ? "الرخصة بحسب بيانات المصدر: " : "License reported by source: "}{/^https:\/\//i.test(paper.license) ? <a href={paper.license} target="_blank" rel="noreferrer">{paper.license}</a> : paper.license}</p>}
          </section>
          <section className="detail-card source-card"><div className="section-label"><span className="section-icon"><BookOpen size={17} /></span><h2>{isArabic ? "عُثر عليه في" : "Found in"}</h2></div><div className="source-list">{sourceNames.map(name => <div className="source-list-item" key={name}><span className="source-marker">{name.charAt(0)}</span><span>{name}</span><Check size={15} className="source-check" /></div>)}</div>{paper.citationCount !== null && <div className="citation-count"><BookOpen size={15} />{paper.citationCount.toLocaleString()} {isArabic ? "استشهادًا" : "citations"}</div>}</section>
        </aside>
      </div>
    </article>
  );
}
