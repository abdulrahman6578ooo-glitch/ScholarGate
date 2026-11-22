import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  ArrowDownWideNarrow, ArrowUpRight, Bookmark, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Download, ExternalLink, FileText, Filter, LoaderCircle,
  Search, Sparkles, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { ENABLED_SOURCES_KEY, RECENT_SEARCHES_KEY, RESEARCH_SOURCES, SAVED_PAPERS_KEY, type ResearchPaper, type ResearchSourceId } from "@shared/research";
import { encodePaperRouteId, getEnabledSources, getRecentSearches, saveRecentSearch } from "@/lib/research-utils";

const SEARCH_EXAMPLES = [
  { ar: "الذكاء الاصطناعي في التعليم", en: "AI in education" },
  { ar: "تغير المناخ والصحة", en: "Climate change and health" },
  { ar: "CRISPR gene editing", en: "CRISPR gene editing" },
];

function loadSaved(): ResearchPaper[] {
  try { return JSON.parse(localStorage.getItem(SAVED_PAPERS_KEY) || "[]") as ResearchPaper[]; }
  catch { return []; }
}

export default function Home() {
  const { isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [openOnly, setOpenOnly] = useState(false);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sort, setSort] = useState("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<ResearchSourceId | "all">("all");
  const [savedIds, setSavedIds] = useState(() => new Set(loadSaved().map(paper => paper.id)));
  const enabledSources = useMemo(() => getEnabledSources(), []);
  const searchMutation = trpc.research.search.useMutation();

  const apiSourceIds = useMemo(
    () => RESEARCH_SOURCES.filter(source => source.mode === "api" && enabledSources.includes(source.id)).map(source => source.id),
    [enabledSources],
  );

  const submitSearch = (event?: FormEvent, value = input) => {
    event?.preventDefault();
    const cleaned = value.trim();
    if (!cleaned || apiSourceIds.length === 0) return;
    setInput(cleaned);
    setQuery(cleaned);
    saveRecentSearch(cleaned);
    setRecentSearches(getRecentSearches());
    searchMutation.mutate({
      query: cleaned,
      sourceIds: apiSourceIds,
      limit: 60,
      openAccessOnly: false,
    });
    try { sessionStorage.removeItem("scholargate:last-results"); } catch { /* optional storage */ }
  };

  const papers = searchMutation.data?.papers ?? [];
  const filteredPapers = useMemo(() => {
    const terms = query.toLocaleLowerCase().split(/\s+/).filter(term => term.length > 1);
    const filtered = papers.filter(paper => {
      if (openOnly && !paper.openAccess) return false;
      if (yearFrom && (paper.year === null || paper.year < Number(yearFrom))) return false;
      if (yearTo && (paper.year === null || paper.year > Number(yearTo))) return false;
      if (sourceFilter !== "all" && !paper.sources.includes(sourceFilter)) return false;
      return true;
    });
    const relevance = (paper: ResearchPaper) => terms.reduce((score, term) => {
      const title = paper.title.toLocaleLowerCase();
      const authors = paper.authors.join(" ").toLocaleLowerCase();
      const abstract = (paper.abstract ?? "").toLocaleLowerCase();
      const journal = (paper.journal ?? "").toLocaleLowerCase();
      return score + (title.includes(term) ? 5 : 0) + (authors.includes(term) ? 3 : 0) + (abstract.includes(term) ? 2 : 0) + (journal.includes(term) ? 1 : 0);
    }, 0);
    return filtered.sort((a, b) => {
      if (sort === "newest") return (b.year ?? 0) - (a.year ?? 0);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "citations") return (b.citationCount ?? 0) - (a.citationCount ?? 0);
      return relevance(b) - relevance(a) || (b.citationCount ?? 0) - (a.citationCount ?? 0) || (b.year ?? 0) - (a.year ?? 0);
    });
  }, [papers, query, openOnly, yearFrom, yearTo, sourceFilter, sort]);

  const rememberResults = (paper: ResearchPaper) => {
    try {
      const current = JSON.parse(sessionStorage.getItem("scholargate:last-results") || "[]") as ResearchPaper[];
      if (!current.some(item => item.id === paper.id)) current.push(paper);
      sessionStorage.setItem("scholargate:last-results", JSON.stringify(current));
    } catch { /* Details remain available while storage is enabled. */ }
  };

  const toggleSaved = (paper: ResearchPaper) => {
    const next = new Set(savedIds);
    const saved = loadSaved();
    if (next.has(paper.id)) {
      next.delete(paper.id);
      localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(saved.filter(item => item.id !== paper.id)));
    } else {
      next.add(paper.id);
      localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify([paper, ...saved.filter(item => item.id !== paper.id)]));
    }
    setSavedIds(next);
  };

  const openPaper = (paper: ResearchPaper) => {
    rememberResults(paper);
    setLocation(`/paper/${encodePaperRouteId(paper.id)}`);
  };

  const sourceNames = (ids: ResearchSourceId[]) => ids.map(id => RESEARCH_SOURCES.find(source => source.id === id)?.name ?? id).join(" · ");

  return (
    <div className="home-page">
      <section className={`search-hero ${query ? "compact" : ""}`}>
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" />{isArabic ? "بوابة البحث العلمي" : "A clearer way to find research"}</div>
          <h1>{isArabic ? <>كل الأبحاث العلمية،<br /><span>في مكان واحد.</span></> : <>Find the research<br /><span>that moves you forward.</span></>}</h1>
          <p>{isArabic ? "ابحث مرة واحدة في مصادر أكاديمية متعددة، وقارن النتائج واعرف أين تجد النص الكامل." : "Search across trusted academic sources in one place, compare results, and find the full text when it’s available."}</p>
        </div>
        <form className="search-panel" onSubmit={event => submitSearch(event)}>
          <div className="search-input-wrap">
            <Search size={21} className="search-input-icon" />
            <input
              aria-label={isArabic ? "عنوان البحث أو الموضوع أو DOI أو المؤلف" : "Paper title, topic, DOI or author"}
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={isArabic ? "عنوان البحث، الموضوع، DOI أو اسم المؤلف" : "Paper title, topic, DOI or author"}
              dir="auto"
            />
            {input && <button className="clear-input" type="button" onClick={() => setInput("")} aria-label={isArabic ? "مسح" : "Clear"}><X size={17} /></button>}
            <button className="search-submit" type="submit" disabled={searchMutation.isPending || !input.trim() || apiSourceIds.length === 0}>
              {searchMutation.isPending ? <LoaderCircle size={18} className="spin" /> : <Search size={18} />}
              <span>{isArabic ? "ابحث" : "Search"}</span>
            </button>
          </div>
          <div className="search-panel-bottom">
            <div className="source-strip">
              <span>{isArabic ? "يبحث في" : "SEARCHING"}</span>
              {RESEARCH_SOURCES.filter(source => source.mode === "api" && enabledSources.includes(source.id)).map(source => <span className="source-pill" key={source.id}>{source.name}</span>)}
            </div>
            <button className={`filter-toggle ${filtersOpen ? "selected" : ""}`} type="button" onClick={() => setFiltersOpen(value => !value)}>
              <Filter size={15} />{isArabic ? "الفلاتر" : "Filters"}<ChevronDown size={14} className={filtersOpen ? "rotate" : ""} />
            </button>
          </div>
          {filtersOpen && (
            <div className="filter-drawer">
              <label className="filter-field"><span>{isArabic ? "من سنة" : "From year"}</span><input inputMode="numeric" placeholder="2018" value={yearFrom} onChange={event => setYearFrom(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
              <label className="filter-field"><span>{isArabic ? "إلى سنة" : "To year"}</span><input inputMode="numeric" placeholder={String(new Date().getFullYear())} value={yearTo} onChange={event => setYearTo(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
              <label className="filter-field"><span>{isArabic ? "المصدر" : "Source"}</span><select value={sourceFilter} onChange={event => setSourceFilter(event.target.value as ResearchSourceId | "all")}><option value="all">{isArabic ? "كل المصادر" : "All sources"}</option>{RESEARCH_SOURCES.filter(source => source.mode === "api" && enabledSources.includes(source.id)).map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>
              <label className="open-filter"><input type="checkbox" checked={openOnly} onChange={event => setOpenOnly(event.target.checked)} /><span className="fake-checkbox"><Check size={12} /></span><span>{isArabic ? "المتاح مفتوحًا فقط" : "Open access only"}</span></label>
              <label className="filter-field sort-field"><span>{isArabic ? "الترتيب" : "Sort by"}</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="relevance">{isArabic ? "الأكثر صلة" : "Relevance"}</option><option value="newest">{isArabic ? "الأحدث" : "Newest"}</option><option value="citations">{isArabic ? "الأكثر استشهادًا" : "Most cited"}</option><option value="title">{isArabic ? "العنوان" : "Title"}</option></select></label>
            </div>
          )}
          {apiSourceIds.length === 0 && <div className="partial-results-note"><Sparkles size={15} /><span>{isArabic ? "كل المصادر معطّلة. فعّل مصدرًا واحدًا على الأقل من صفحة المصادر." : "All sources are disabled. Enable at least one on the Sources page."}</span></div>}
          <div className="legal-note"><span className="legal-check"><Check size={13} /></span><span>{isArabic ? "نربطك بالمصدر الأصلي، ولا نستضيف الأبحاث أو نمنح حقوق إعادة استخدامها." : "Links go to the original source; ScholarGate doesn’t host papers or grant reuse rights."}</span><CircleHelp size={14} className="legal-help" /></div>
        </form>
        {!query && <>
          <div className="suggestions">
            <span>{isArabic ? "جرّب البحث عن" : "Try searching"}</span>
            {SEARCH_EXAMPLES.map(item => <button type="button" key={item.en} onClick={() => { setInput(item.en); submitSearch(undefined, item.en); }}>{isArabic ? item.ar : item.en}<ArrowUpRight size={13} /></button>)}
          </div>
          {recentSearches.length > 0 && <div className="recent-searches"><div className="recent-heading"><Clock3 size={15} /><span>{isArabic ? "عمليات بحث سابقة" : "Recent searches"}</span></div><div className="recent-list">{recentSearches.slice(0, 4).map(search => <button type="button" key={search} onClick={() => { setInput(search); submitSearch(undefined, search); }}><Search size={14} /><span>{search}</span><ArrowUpRight size={13} /></button>)}</div></div>}
        </>}
      </section>

      {query && (
        <section className="results-section" aria-live="polite">
          <div className="results-heading">
            <div>
              <div className="results-kicker">{isArabic ? "نتائج البحث" : "SEARCH RESULTS"}</div>
              <h2>{isArabic ? `نتائج عن «${query}»` : `Results for “${query}”`}</h2>
              {!searchMutation.isPending && searchMutation.data && <p>{isArabic ? `${filteredPapers.length} نتيجة · تم دمج النتائج وإزالة التكرار` : `${filteredPapers.length} results · merged and deduplicated`} <span className="elapsed-dot">·</span> {searchMutation.data.elapsedMs} ms</p>}
            </div>
            <div className="results-sort"><ArrowDownWideNarrow size={16} /><select value={sort} onChange={event => setSort(event.target.value)} aria-label={isArabic ? "ترتيب النتائج" : "Sort results"}><option value="relevance">{isArabic ? "الأكثر صلة" : "Relevance"}</option><option value="newest">{isArabic ? "الأحدث" : "Newest"}</option><option value="citations">{isArabic ? "الأكثر استشهادًا" : "Most cited"}</option><option value="title">{isArabic ? "العنوان" : "Title"}</option></select></div>
          </div>
          <div className="active-filters">
            <button className={`filter-chip ${openOnly ? "active" : ""}`} type="button" onClick={() => setOpenOnly(value => !value)}><span className="chip-dot" />{isArabic ? "إتاحة مفتوحة" : "Open access"}{openOnly && <X size={13} />}</button>
            {sourceFilter !== "all" && <button className="filter-chip active" type="button" onClick={() => setSourceFilter("all")}>{RESEARCH_SOURCES.find(s => s.id === sourceFilter)?.name}<X size={13} /></button>}
            {(yearFrom || yearTo) && <button className="filter-chip active" type="button" onClick={() => { setYearFrom(""); setYearTo(""); }}>{yearFrom || "…"}–{yearTo || "…"}<X size={13} /></button>}
            {searchMutation.data && <span className="source-health">{searchMutation.data.sourceStatuses.filter(status => status.status === "ok").length}/{searchMutation.data.sourceStatuses.length} {isArabic ? "مصادر متاحة" : "sources responding"}</span>}
          </div>

          {searchMutation.isPending && <div className="results-state loading-state"><LoaderCircle size={23} className="spin" /><span>{isArabic ? "نبحث في المصادر الأكاديمية…" : "Searching academic sources…"}</span></div>}
          {searchMutation.error && <div className="results-state error-state"><CircleHelp size={22} /><div><strong>{isArabic ? "تعذر إكمال البحث" : "Search couldn’t be completed"}</strong><p>{isArabic ? "حاول مرة أخرى بعد قليل. قد يتعذر الوصول إلى بعض المصادر مؤقتًا." : "Try again in a moment. Some sources may be temporarily unavailable."}</p><button className="secondary-button" onClick={() => submitSearch(undefined, query)}>{isArabic ? "إعادة المحاولة" : "Retry"}</button></div></div>}
          {searchMutation.data && filteredPapers.length === 0 && !searchMutation.isPending && <div className="results-state empty-state"><Search size={25} /><div><strong>{isArabic ? "لم نعثر على نتائج مطابقة" : "No matching results"}</strong><p>{isArabic ? "جرّب عبارة أقصر أو عطّل بعض الفلاتر." : "Try a shorter query or remove some filters."}</p></div></div>}

          <div className="results-grid">
            {filteredPapers.map((paper, index) => (
              <article className="paper-card" key={paper.id}>
                <div className="paper-card-topline"><span className="paper-number">{String(index + 1).padStart(2, "0")}</span><div className="paper-badges"><span className="source-badges">{sourceNames(paper.sources)}</span>{paper.openAccess && <span className="oa-badge"><span />{isArabic ? "وصول مفتوح بحسب المصدر" : "Open access reported"}</span>}</div><button className={`icon-button save-button ${savedIds.has(paper.id) ? "saved" : ""}`} type="button" onClick={() => toggleSaved(paper)} aria-label={savedIds.has(paper.id) ? (isArabic ? "إزالة من المحفوظات" : "Remove saved paper") : (isArabic ? "حفظ البحث" : "Save paper")}><Bookmark size={17} fill={savedIds.has(paper.id) ? "currentColor" : "none"} /></button></div>
                <button className="paper-title-button" type="button" onClick={() => openPaper(paper)}><h3>{paper.title}</h3></button>
                <div className="paper-meta">{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}{paper.journal ? ` · ${paper.journal}` : ""}{paper.year ? ` · ${paper.year}` : ""}</div>
                {paper.abstract && <p className="paper-abstract">{paper.abstract}</p>}
                <div className="paper-card-footer"><div className="paper-id">{paper.doi && <span>DOI: {paper.doi}</span>}{paper.citationCount !== null && <span><BookOpen size={13} />{paper.citationCount.toLocaleString()} {isArabic ? "استشهادًا" : "citations"}</span>}</div><div className="paper-actions">
                  {paper.pdfUrl && paper.openAccess ? <a className="primary-button small" href={paper.pdfUrl} target="_blank" rel="noreferrer"><Download size={15} />{isArabic ? "PDF من المصدر" : "Source PDF"}</a> : paper.landingUrl ? <a className="secondary-button small" href={paper.landingUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{isArabic ? "صفحة المصدر" : "View source"}</a> : null}
                  <button className="details-link" type="button" onClick={() => openPaper(paper)}><FileText size={15} />{isArabic ? "التفاصيل" : "Details"}</button>
                </div></div>
              </article>
            ))}
          </div>

          {searchMutation.data && searchMutation.data.sourceStatuses.some(status => status.status === "error") && (
            <div className="partial-results-note"><Sparkles size={15} /><span>{isArabic ? "بعض المصادر لم تستجب هذه المرة؛ النتائج المتاحة ما زالت معروضة." : "Some sources didn’t respond this time; available results are still shown."}</span></div>
          )}
        </section>
      )}
      {!query && <div className="trust-strip"><div className="trust-icon"><BookOpen size={18} /></div><span>{isArabic ? "أبحاث من مصادر أكاديمية موثوقة، وروابط وصول واضحة." : "Research from trusted scholarly sources, with transparent access links."}</span><span className="trust-dot" /><span>{isArabic ? "المصادر المفتوحة أولاً" : "Open access when available"}</span></div>}
    </div>
  );
}
