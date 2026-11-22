import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { searchResearch } from "./research";
import { z } from "zod";

const researchSourceIds = ["openalex", "crossref", "arxiv", "pubmed", "semanticScholar", "core", "doaj", "googleScholar"] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  research: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().trim().min(1).max(500),
        openAccessOnly: z.boolean().optional(),
        fromYear: z.number().int().min(1800).max(2200).optional(),
        toYear: z.number().int().min(1800).max(2200).optional(),
        sourceIds: z.array(z.enum(researchSourceIds)).max(researchSourceIds.length).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }))
      .mutation(({ input }) => searchResearch(input)),
  }),
});

export type AppRouter = typeof appRouter;
