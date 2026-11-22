import { useState } from "react";
import { ArrowUpRight, Check, Globe2, Link2, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ENABLED_SOURCES_KEY, RESEARCH_SOURCES, type ResearchSourceId } from "@shared/research";
import { getEnabledSources } from "@/lib/research-utils";

export default function SourcesPage() {
  const { isArabic } = useLanguage();
  const [enabled, setEnabled] = useState<ResearchSourceId[]>(getEnabledSources);
  const [query, setQuery] = useState("");

  const toggleSource = (id: ResearchSourceId) => {
    const next = enabled.includes(id) ? enabled.filter(value => value !== id) : [...enabled, id];
    setEnabled(next);
    localStorage.setItem(ENABLED_SOURCES_KEY, JSON.stringify(next));
  };

  const externalSearch = (template?: string) => template?.replace("{query}", encodeURIComponent(query.trim() || "research"));

  const apiSources = RESEARCH_SOURCES.filter(source => source.mode === "api");
  const linkSources = RESEARCH_SOURCES.filter(source => source.mode === "link");

  return (
    <section className="sources-page content-page">
      <div className="page-heading-block"><div className="eyebrow"><span className="eyebrow-line" />{isArabic ? "من أين تأتي النتائج" : "WHERE RESULTS COME FROM"}</div><h1>{isArabic ? "مصادر البحث" : "Research sources"}</h1><p>{isArabic ? "اختر المصادر التي تبحث فيها، وافتح محركات البحث الأخرى مباشرة عند الحاجة." : "Choose which integrated sources to search, and open other academic search engines directly when needed."}</p></div>
      <div className="sources-toolbar"><div className="sources-count"><span className="sources-count-number">{enabled.filter(id => apiSources.some(source => source.id === id)).length}</span><span>{isArabic ? "مصادر مفعّلة في البحث الموحد" : "integrated sources enabled"}</span></div><div className="sources-privacy"><ShieldCheck size={15} />{isArabic ? "تُحفظ اختياراتك على جهازك" : "Preferences stay in this browser"}</div></div>
      <div className="sources-layout">
        <div className="sources-main-column">
          <div className="source-section-heading"><span className="source-section-icon"><Globe2 size={17} /></span><div><h2>{isArabic ? "مصادر متصلة" : "Integrated sources"}</h2><p>{isArabic ? "تُدمج نتائجها داخل صفحة البحث عند توفر الواجهة." : "Results are merged into your search when their public interface is available."}</p></div></div>
          <div className="source-setting-list">{apiSources.map(source => {
            const active = enabled.includes(source.id);
            return <article className={`source-setting-card ${active ? "enabled" : ""}`} key={source.id}><span className="source-logo">{source.name.slice(0, 1)}</span><div className="source-setting-info"><h3>{source.name}</h3><p>{isArabic ? source.description : source.descriptionEn ?? source.description}</p><span className="connection-state"><span className="state-dot" />{isArabic ? "واجهة بحث رسمية" : "Official search API"}</span></div><button className={`source-switch ${active ? "on" : ""}`} type="button" role="switch" aria-checked={active} aria-label={`${isArabic ? (active ? "تعطيل" : "تفعيل") : (active ? "Disable" : "Enable")} ${source.name}`} onClick={() => toggleSource(source.id)}><span /></button></article>;
          })}</div>
          <div className="source-section-heading link-heading"><span className="source-section-icon"><Link2 size={17} /></span><div><h2>{isArabic ? "محركات بروابط مباشرة" : "Direct search links"}</h2><p>{isArabic ? "تفتح صفحة البحث في الموقع الأصلي؛ لا تُسحب نتائجها تلقائيًا." : "Open the original search page; results aren’t imported automatically."}</p></div></div>
          <div className="external-search-box"><div className="external-search-title"><Search size={16} /><span>{isArabic ? "ابحث عن عبارة في هذه المحركات" : "Search the same query on these engines"}</span></div><div className="external-search-input"><input value={query} onChange={event => setQuery(event.target.value)} dir="auto" placeholder={isArabic ? "اكتب موضوع البحث..." : "Enter a research topic..."} /><span>{query.length}</span></div><div className="external-links">{linkSources.map(source => <a key={source.id} className="external-link-card" href={externalSearch(source.searchUrl)} target="_blank" rel="noreferrer"><span className="source-logo small-logo">{source.name.slice(0, 1)}</span><span>{source.name}</span><ArrowUpRight size={15} /></a>)}</div></div>
        </div>
        <aside className="sources-aside"><div className="source-notice-icon"><LockKeyhole size={19} /></div><h3>{isArabic ? "الوصول القانوني أولًا" : "Access, handled responsibly"}</h3><p>{isArabic ? "ScholarGate لا يتجاوز تسجيل الدخول أو الاشتراكات، ولا يخزن نسخًا من الأبحاث. رابط PDF يظهر فقط عندما يوفره المصدر مع إشارة موثوقة إلى الوصول المفتوح." : "ScholarGate doesn’t bypass logins or subscriptions and doesn’t host paper copies. A PDF link appears only when a source provides it with a trustworthy open-access signal."}</p><div className="notice-rule"><Check size={14} /><span>{isArabic ? "تُفتح الروابط في مواقعها الأصلية" : "Links open on their original websites"}</span></div><div className="notice-rule"><Check size={14} /><span>{isArabic ? "يمكنك تعطيل مصادر البحث الموحد" : "You control integrated sources"}</span></div></aside>
      </div>
    </section>
  );
}
