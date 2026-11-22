import { sourceAdapters } from "./providers";
import type { ResearchAdapter } from "./types";

// Semantic Scholar is link-only after HTTP 429 without a key in the current test.
// CORE requires an API key and suitable terms; Google Scholar has no documented public search API.
// These services are surfaced as user-initiated outbound searches in the Sources page.
export const RESEARCH_ADAPTERS: ResearchAdapter[] = sourceAdapters;
