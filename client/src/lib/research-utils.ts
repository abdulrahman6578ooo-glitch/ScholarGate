import { ENABLED_SOURCES_KEY, RESEARCH_SOURCES, RECENT_SEARCHES_KEY, type ResearchPaper, type ResearchSourceId } from "@shared/research";

export function encodePaperRouteId(id: string) {
  const bytes = new TextEncoder().encode(id);
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodePaperRouteId(encoded: string) {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return encoded;
  }
}

export function getEnabledSources(): ResearchSourceId[] {
  try {
    const stored = JSON.parse(localStorage.getItem(ENABLED_SOURCES_KEY) || "null") as ResearchSourceId[] | null;
    if (Array.isArray(stored)) return stored.filter(id => RESEARCH_SOURCES.some(source => source.id === id));
  } catch { /* Use defaults. */ }
  return RESEARCH_SOURCES.filter(source => source.enabledByDefault).map(source => source.id);
}

export function saveRecentSearch(query: string) {
  try {
    const current = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
    const next = [query, ...current.filter(value => value.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch { /* Recent searches are optional. */ }
}

export function getRecentSearches() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as unknown;
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string").slice(0, 6) : [];
  } catch { return []; }
}

export function getSavedPapers(): ResearchPaper[] {
  try {
    const value = JSON.parse(localStorage.getItem("scholargate:saved-papers:v1") || "[]") as unknown;
    return Array.isArray(value) ? value as ResearchPaper[] : [];
  } catch { return []; }
}
