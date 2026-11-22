import type { ResearchPaper, ResearchSearchResult, SearchInput, SourceStatus } from "../../shared/research";
import { RESEARCH_ADAPTERS } from "./sources";

const normalizeDoi = (doi: string | null) => doi?.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "") || null;
const normalizeTitle = (title: string) => title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function mergePaper(existing: ResearchPaper, incoming: ResearchPaper): ResearchPaper {
  const mergedSources = Array.from(new Set([...existing.sources, ...incoming.sources]));
  const bestAbstract = (incoming.abstract?.length ?? 0) > (existing.abstract?.length ?? 0) ? incoming.abstract : existing.abstract;
  const openAccess = existing.openAccess || incoming.openAccess;
  const pdfUrl = existing.pdfUrl ?? incoming.pdfUrl;
  const landingUrl = (incoming.openAccess && incoming.landingUrl) || existing.landingUrl || incoming.landingUrl;
  const license = existing.license ?? incoming.license;
  return {
    ...existing,
    title: existing.title.length >= incoming.title.length ? existing.title : incoming.title,
    authors: existing.authors.length >= incoming.authors.length ? existing.authors : incoming.authors,
    abstract: bestAbstract,
    doi: existing.doi ?? incoming.doi,
    journal: existing.journal ?? incoming.journal,
    year: existing.year ?? incoming.year,
    type: existing.type ?? incoming.type,
    citationCount: existing.citationCount ?? incoming.citationCount,
    sources: mergedSources,
    openAccess,
    pdfUrl: openAccess ? pdfUrl : null,
    landingUrl,
    license,
  };
}

function paperKey(paper: ResearchPaper) {
  const doi = normalizeDoi(paper.doi);
  return doi ? `doi:${doi}` : `${normalizeTitle(paper.title)}:${paper.year ?? ""}`;
}

export async function searchResearch(input: SearchInput): Promise<ResearchSearchResult> {
  const startedAt = Date.now();
  const requested = input.sourceIds === undefined ? null : new Set(input.sourceIds);
  const adapters = RESEARCH_ADAPTERS.filter(adapter => requested === null || requested.has(adapter.id));
  const perSourceLimit = Math.max(5, Math.min(20, Math.ceil((input.limit ?? 60) / Math.max(adapters.length, 1))));

  const settled = await Promise.allSettled(adapters.map(async adapter => {
    const papers = await adapter.search(input.query, perSourceLimit);
    return { adapter, papers };
  }));

  const sourceStatuses: SourceStatus[] = settled.map((result, index) => {
    const adapter = adapters[index];
    if (result.status === "fulfilled") return { id: adapter.id, status: "ok", count: result.value.papers.length };
    return { id: adapter.id, status: "error", count: 0, message: "Source temporarily unavailable" };
  });

  const combined = new Map<string, ResearchPaper>();
  settled.forEach(result => {
    if (result.status !== "fulfilled") return;
    for (const paper of result.value.papers) {
      const key = paperKey(paper);
      const prior = combined.get(key);
      combined.set(key, prior ? mergePaper(prior, paper) : paper);
    }
  });

  const papers = Array.from(combined.values())
    .filter(paper => !input.openAccessOnly || paper.openAccess)
    .filter(paper => input.fromYear === undefined || (paper.year !== null && paper.year >= input.fromYear))
    .filter(paper => input.toYear === undefined || (paper.year !== null && paper.year <= input.toYear))
    .slice(0, input.limit ?? 60);

  return { papers, sourceStatuses, elapsedMs: Date.now() - startedAt };
}
