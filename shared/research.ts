export type ResearchSourceId =
  | "openalex"
  | "crossref"
  | "arxiv"
  | "pubmed"
  | "semanticScholar"
  | "core"
  | "doaj"
  | "googleScholar";

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  doi: string | null;
  sources: ResearchSourceId[];
  openAccess: boolean;
  pdfUrl: string | null;
  landingUrl: string | null;
  type: string | null;
  citationCount: number | null;
  license?: string | null;
}

export interface SourceStatus {
  id: ResearchSourceId;
  status: "ok" | "error" | "skipped";
  count: number;
  message?: string;
}

export interface ResearchSearchResult {
  papers: ResearchPaper[];
  sourceStatuses: SourceStatus[];
  elapsedMs: number;
}

export interface SearchInput {
  query: string;
  openAccessOnly?: boolean;
  fromYear?: number;
  toYear?: number;
  sourceIds?: ResearchSourceId[];
  limit?: number;
}

export interface ResearchSource {
  id: ResearchSourceId;
  name: string;
  description: string;
  descriptionEn?: string;
  mode: "api" | "link";
  searchUrl?: string;
  enabledByDefault?: boolean;
}

export const RESEARCH_SOURCES: ResearchSource[] = [
  { id: "pubmed", name: "PubMed", description: "بحث رسمي في أدبيات الطب والعلوم الحيوية.", descriptionEn: "Official search for biomedical and life-science literature.", mode: "api", enabledByDefault: true, searchUrl: "https://pubmed.ncbi.nlm.nih.gov/?term={query}" },
  { id: "arxiv", name: "arXiv", description: "أبحاث ومسوّدات مفتوحة في العلوم والرياضيات والحوسبة.", descriptionEn: "Open research and preprints in science, math and computing.", mode: "api", enabledByDefault: true, searchUrl: "https://arxiv.org/search/?query={query}&searchtype=all" },
  { id: "openalex", name: "OpenAlex", description: "فهرس مفتوح للأعمال والاستشهادات الأكاديمية.", descriptionEn: "An open index of scholarly works and citations.", mode: "api", enabledByDefault: true, searchUrl: "https://openalex.org/works?search={query}" },
  { id: "semanticScholar", name: "Semantic Scholar", description: "بحث مباشر؛ واجهة API الرسمية أعادت HTTP 429 دون مفتاح في الاختبار الحالي.", descriptionEn: "Direct search link; the official API returned HTTP 429 without a key in the current test.", mode: "link", searchUrl: "https://www.semanticscholar.org/search?q={query}" },
  { id: "doaj", name: "DOAJ", description: "دليل المجلات العلمية مفتوحة الوصول.", descriptionEn: "Directory of open-access journals and articles.", mode: "api", enabledByDefault: true, searchUrl: "https://doaj.org/search/articles/{query}" },
  { id: "crossref", name: "Crossref", description: "بيانات ببليوغرافية ومعرّفات DOI للمنشورات العلمية.", descriptionEn: "Bibliographic metadata and DOI records for scholarly works.", mode: "api", enabledByDefault: true, searchUrl: "https://search.crossref.org/?q={query}" },
  { id: "core", name: "CORE", description: "بحث مباشر في مستودعات وأبحاث مفتوحة؛ يحتاج التكامل الآلي إلى مفتاح وشروط مناسبة.", descriptionEn: "Direct search across open repositories; automated integration needs an API key and suitable terms.", mode: "link", searchUrl: "https://core.ac.uk/search?q={query}" },
  { id: "googleScholar", name: "Google Scholar", description: "فتح صفحة البحث الرسمية؛ لا تتوفر واجهة بحث عامة موثقة للمطورين.", descriptionEn: "Opens the official search page; no public developer search API is documented.", mode: "link", searchUrl: "https://scholar.google.com/scholar?q={query}" },
];

export const SAVED_PAPERS_KEY = "scholargate:saved-papers:v1";
export const RECENT_SEARCHES_KEY = "scholargate:recent-searches:v1";
export const ENABLED_SOURCES_KEY = "scholargate:enabled-sources:v1";
