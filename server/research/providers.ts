import { XMLParser } from "fast-xml-parser";
import type { ResearchPaper, ResearchSourceId } from "../../shared/research";
import type { ResearchAdapter } from "./types";
import { cached, cleanText, doiUrl, fetchJson, fetchText, isReusableOpenLicense, licenseText, normalizeDoi, rateLimited, safeExternalUrl, yearFrom } from "./http";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", removeNSPrefix: true, parseTagValue: false, trimValues: true });
const cacheForTenMinutes = 10 * 60 * 1000;
const clampLimit = (limit: number) => Math.max(1, Math.min(20, Math.floor(limit)));
const textField = (value: unknown): string | null => typeof value === "string" ? cleanText(value) : value && typeof value === "object" && "#text" in value ? cleanText(String((value as { "#text": unknown })["#text"])) : null;

function abstractFromInvertedIndex(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const words: string[] = [];
  let highest = -1;
  for (const [word, positions] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (typeof position === "number" && position >= 0 && position < 6000) {
        words[position] = word;
        highest = Math.max(highest, position);
      }
    }
  }
  if (highest < 0) return null;
  return words.slice(0, highest + 1).filter(Boolean).join(" ") || null;
}

function safePaperUrl(value: unknown) { return safeExternalUrl(value); }

async function searchOpenAlex(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `openalex:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", query);
    url.searchParams.set("per-page", String(clampLimit(limit)));
    url.searchParams.set("select", "id,doi,display_name,title,publication_year,authorships,abstract_inverted_index,primary_location,best_oa_location,open_access,type,cited_by_count");
    const data = await fetchJson<{ results?: Array<Record<string, any>> }>(url.toString());
    return (data.results ?? []).map((item): ResearchPaper | null => {
      const title = cleanText(item.display_name ?? item.title);
      if (!title) return null;
      const doi = normalizeDoi(item.doi);
      const oa = item.open_access?.is_oa === true;
      const bestLocation = item.best_oa_location ?? null;
      const primaryLocation = item.primary_location ?? null;
      const license = typeof bestLocation?.license === "string" ? bestLocation.license : null;
      const rawPdfUrl = safePaperUrl(bestLocation?.pdf_url);
      const pdfUrl = oa && rawPdfUrl && isReusableOpenLicense(license) ? rawPdfUrl : null;
      const landingUrl = safePaperUrl(bestLocation?.landing_page_url)
        ?? safePaperUrl(primaryLocation?.landing_page_url)
        ?? (doi ? doiUrl(doi) : safePaperUrl(item.id));
      const authors = (item.authorships ?? []).map((entry: any) => cleanText(entry.author?.display_name)).filter((name: string | null): name is string => Boolean(name));
      const journal = cleanText(primaryLocation?.source?.display_name ?? bestLocation?.source?.display_name);
      return {
        id: doi ?? String(item.id), title, authors, year: yearFrom(item.publication_year), journal,
        abstract: abstractFromInvertedIndex(item.abstract_inverted_index), doi,
        sources: ["openalex"], openAccess: oa, pdfUrl, landingUrl,
        type: cleanText(item.type), citationCount: Number.isFinite(item.cited_by_count) ? item.cited_by_count : null,
        license,
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  });
}

async function searchCrossref(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `crossref:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => rateLimited("crossref", 220, async () => {
    const url = new URL("https://api.crossref.org/works");
    url.searchParams.set("query.bibliographic", query);
    url.searchParams.set("rows", String(clampLimit(limit)));
    url.searchParams.set("select", "DOI,title,author,published,container-title,URL,link,license,type,is-referenced-by-count,abstract");
    const data = await fetchJson<{ message?: { items?: Array<Record<string, any>> } }>(url.toString(), { "User-Agent": "ScholarGate/1.0 (academic metadata search; mailto not configured)" });
    return (data.message?.items ?? []).map((item): ResearchPaper | null => {
      const title = cleanText(item.title?.[0]);
      if (!title) return null;
      const doi = normalizeDoi(item.DOI);
      const licenses = (item.license ?? []).map((value: any) => licenseText(value?.URL)).filter(Boolean) as string[];
      const reusableLicense = licenses.find(isReusableOpenLicense) ?? null;
      const openAccess = Boolean(reusableLicense);
      const pdfLink = (item.link ?? []).find((entry: any) => /pdf/i.test(String(entry["content-type"] ?? "")));
      const pdfUrl = openAccess ? safePaperUrl(pdfLink?.URL) : null;
      const landingUrl = doi ? doiUrl(doi) : safePaperUrl(item.URL);
      const authorNames = (item.author ?? []).map((author: any) => cleanText([author.given, author.family].filter(Boolean).join(" "))).filter((name: string | null): name is string => Boolean(name));
      const dateParts = item.published?.["date-parts"]?.[0];
      const year = yearFrom(Array.isArray(dateParts) ? String(dateParts[0] ?? "") : null);
      return {
        id: doi ?? String(item.URL ?? title), title, authors: authorNames, year,
        journal: cleanText(item["container-title"]?.[0]), abstract: cleanText(item.abstract), doi,
        sources: ["crossref"], openAccess, pdfUrl, landingUrl,
        type: cleanText(item.type), citationCount: Number.isFinite(item["is-referenced-by-count"]) ? item["is-referenced-by-count"] : null,
        license: reusableLicense,
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  }));
}

function listify<T>(value: T | T[] | null | undefined): T[] { return value == null ? [] : Array.isArray(value) ? value : [value]; }

async function searchArxiv(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `arxiv:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => rateLimited("arxiv", 3000, async () => {
    const url = new URL("https://export.arxiv.org/api/query");
    const terms = query.split(/\s+/).filter(Boolean).map(term => `all:${term.replace(/["()]/g, "")}`);
    url.searchParams.set("search_query", terms.join(" AND "));
    url.searchParams.set("start", "0");
    url.searchParams.set("max_results", String(clampLimit(limit)));
    const xml = await fetchText(url.toString(), { Accept: "application/atom+xml, application/xml" });
    const feed = parser.parse(xml)?.feed;
    return listify<Record<string, any>>(feed?.entry).map((entry): ResearchPaper | null => {
      const title = textField(entry.title);
      if (!title) return null;
      const authorNames = listify<Record<string, any>>(entry.author).map(author => textField(author.name)).filter((name): name is string => Boolean(name));
      const idUrl = textField(entry.id) ?? "";
      const absUrl = safePaperUrl(idUrl.replace(/^http:\/\//i, "https://"));
      const absPath = absUrl ? new URL(absUrl).pathname.replace(/^\/abs\//, "") : "";
      const pdfUrl = absPath ? safePaperUrl(`https://arxiv.org/pdf/${absPath}`) : null;
      const categories = listify<Record<string, any>>(entry.category).map(category => cleanText(category["@_term"])).filter(Boolean);
      return {
        id: absPath || idUrl, title, authors: authorNames, year: yearFrom(textField(entry.published)),
        journal: textField(entry["arxiv:journal_ref"] ?? entry.journal_ref), abstract: textField(entry.summary), doi: normalizeDoi(textField(entry["arxiv:doi"] ?? entry.doi)),
        sources: ["arxiv"], openAccess: true, pdfUrl, landingUrl: absUrl,
        type: categories.length ? `Preprint · ${categories.slice(0, 2).join(", ")}` : "Preprint",
        citationCount: null, license: textField(entry["arxiv:license"] ?? entry.license),
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  }));
}

async function searchPubmed(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `pubmed:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => {
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", query);
    searchUrl.searchParams.set("retmode", "json");
    searchUrl.searchParams.set("retmax", String(clampLimit(limit)));
    searchUrl.searchParams.set("tool", "ScholarGate");
    const search = await rateLimited("pubmed", 400, () => fetchJson<{ esearchresult?: { idlist?: string[] } }>(searchUrl.toString()));
    const ids = search.esearchresult?.idlist ?? [];
    if (!ids.length) return [];

    const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    summaryUrl.searchParams.set("db", "pubmed");
    summaryUrl.searchParams.set("id", ids.join(","));
    summaryUrl.searchParams.set("retmode", "json");
    summaryUrl.searchParams.set("tool", "ScholarGate");
    const summary = await rateLimited("pubmed", 400, () => fetchJson<{ result?: Record<string, any> }>(summaryUrl.toString()));

    const abstractUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
    abstractUrl.searchParams.set("db", "pubmed");
    abstractUrl.searchParams.set("id", ids.join(","));
    abstractUrl.searchParams.set("retmode", "xml");
    abstractUrl.searchParams.set("rettype", "abstract");
    abstractUrl.searchParams.set("tool", "ScholarGate");
    const abstracts = new Map<string, string>();
    try {
      const xml = await rateLimited("pubmed", 400, () => fetchText(abstractUrl.toString(), { Accept: "application/xml" }));
      const records = parser.parse(xml)?.PubmedArticleSet?.PubmedArticle;
      for (const record of listify<Record<string, any>>(records)) {
        const citation = record.MedlineCitation;
        const pmid = textField(citation?.PMID);
        const abstractParts = listify<any>(citation?.Article?.Abstract?.AbstractText).map(textField).filter((part): part is string => Boolean(part));
        if (pmid && abstractParts.length) abstracts.set(pmid, abstractParts.join(" "));
      }
    } catch {
      // Keep the metadata results even if the optional abstract request fails.
    }

    const result = summary.result ?? {};
    return ids.map((pmid): ResearchPaper | null => {
      const item = result[pmid];
      const title = cleanText(item?.title);
      if (!title) return null;
      const articleIds = listify<Record<string, any>>(item.articleids);
      const doi = normalizeDoi(articleIds.find(articleId => articleId.idtype === "doi")?.value);
      const authors = listify<Record<string, any>>(item.authors).map(author => cleanText(author.name)).filter((name): name is string => Boolean(name));
      const pmUrl = safePaperUrl(`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`);
      return {
        id: doi ?? `pubmed:${pmid}`, title, authors, year: yearFrom(item.pubdate), journal: cleanText(item.fulljournalname ?? item.source),
        abstract: abstracts.get(pmid) ?? null, doi, sources: ["pubmed"], openAccess: false, pdfUrl: null,
        landingUrl: pmUrl, type: listify<string>(item.pubtype).map(cleanText).filter(Boolean).join(" · ") || "Article",
        citationCount: null, license: null,
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  });
}

async function searchSemanticScholar(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `semanticScholar:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => rateLimited("semanticScholar", 1000, async () => {
    const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(clampLimit(limit)));
    url.searchParams.set("fields", "paperId,externalIds,title,authors,year,venue,abstract,isOpenAccess,openAccessPdf,url,citationCount,publicationTypes");
    const data = await fetchJson<{ data?: Array<Record<string, any>> }>(url.toString());
    return (data.data ?? []).map((item): ResearchPaper | null => {
      const title = cleanText(item.title);
      if (!title) return null;
      const doi = normalizeDoi(item.externalIds?.DOI);
      const openAccess = item.isOpenAccess === true;
      const landingUrl = safePaperUrl(item.url) ?? (doi ? doiUrl(doi) : null);
      const directPdf = safePaperUrl(item.openAccessPdf?.url);
      const authors = listify<Record<string, any>>(item.authors).map(author => cleanText(author.name)).filter((name): name is string => Boolean(name));
      return {
        id: doi ?? `semantic:${String(item.paperId ?? title)}`, title, authors, year: yearFrom(item.year), journal: cleanText(item.venue),
        abstract: cleanText(item.abstract), doi, sources: ["semanticScholar"], openAccess,
        // Semantic Scholar's OA/PDF fields are discovery indicators, not a reuse license. Link to the paper page.
        pdfUrl: null, landingUrl, type: listify<string>(item.publicationTypes).map(cleanText).filter(Boolean).join(" · ") || null,
        citationCount: Number.isFinite(item.citationCount) ? item.citationCount : null, license: null,
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  }));
}

async function searchDoaj(query: string, limit: number): Promise<ResearchPaper[]> {
  const key = `doaj:${query.toLowerCase()}:${limit}`;
  return cached(key, cacheForTenMinutes, async () => rateLimited("doaj", 500, async () => {
    const url = new URL(`https://doaj.org/api/search/articles/${encodeURIComponent(query)}`);
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", String(clampLimit(limit)));
    const data = await fetchJson<{ results?: Array<Record<string, any>> }>(url.toString());
    return (data.results ?? []).map((record): ResearchPaper | null => {
      const bib = record.bibjson ?? {};
      const title = cleanText(bib.title);
      if (!title) return null;
      const identifiers = listify<Record<string, any>>(bib.identifier);
      const doi = normalizeDoi(identifiers.find(item => String(item.type).toLowerCase() === "doi")?.id);
      const links = listify<Record<string, any>>(bib.link);
      const pdfLink = links.find(link => /pdf/i.test(String(link.content_type ?? "")));
      const fullText = pdfLink ?? links.find(link => /full.?text/i.test(String(link.type ?? ""))) ?? links[0];
      const licenses = listify<Record<string, any>>(bib.license);
      const license = licenses.map(item => licenseText(item.url) ?? licenseText(item.type)).find(Boolean) ?? null;
      const linkType = String(fullText?.content_type ?? fullText?.type ?? "").toLowerCase();
      const directUrl = safePaperUrl(fullText?.url);
      const licensedPdf = linkType.includes("pdf") && Boolean(directUrl) && isReusableOpenLicense(license);
      const year = yearFrom(bib.year ?? bib.publication_year);
      const articlePage = typeof record.id === "string" && /^[A-Za-z0-9]+$/.test(record.id) ? safePaperUrl(`https://doaj.org/article/${record.id}`) : null;
      const landingUrl = directUrl && !licensedPdf ? directUrl : articlePage ?? (doi ? doiUrl(doi) : directUrl);
      const authors = listify<Record<string, any>>(bib.author).map(author => cleanText(author.name)).filter((name): name is string => Boolean(name));
      const journal = cleanText(bib.journal?.title ?? bib.journal?.name);
      return {
        id: doi ?? String(record.id ?? `${title}:${year ?? ""}`), title, authors, year, journal,
        abstract: cleanText(bib.abstract), doi, sources: ["doaj"], openAccess: true,
        pdfUrl: licensedPdf ? directUrl : null, landingUrl,
        type: "Open-access journal article", citationCount: null, license,
      };
    }).filter((paper): paper is ResearchPaper => Boolean(paper));
  }));
}

export const sourceAdapters: ResearchAdapter[] = [
  { id: "openalex", search: searchOpenAlex },
  { id: "crossref", search: searchCrossref },
  { id: "arxiv", search: searchArxiv },
  { id: "pubmed", search: searchPubmed },
  { id: "doaj", search: searchDoaj },
];

export type { ResearchSourceId };
