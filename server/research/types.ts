import type { ResearchPaper, ResearchSourceId } from "../../shared/research";

export interface ResearchAdapter {
  id: ResearchSourceId;
  search(query: string, limit: number): Promise<ResearchPaper[]>;
}
