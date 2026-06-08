import { z } from 'zod';

/**
 * Board endpoints are cardmem-SERVED (base https://services.cardmem.com),
 * called by buddy/services with the CARDMEM_DAEMON_KEY bearer. The contracts
 * live here so any fleet client targets them through the same typed surface.
 */

export const BoardCardRefSchema = z.object({
  slug: z.string(),
  title: z.string(),
  fnum: z.string().optional(),
});
export type BoardCardRef = z.infer<typeof BoardCardRefSchema>;

/** GET /api/board/digest — per-project board summary for the fleet digest. */
export const BoardDigestResponseSchema = z.object({
  projects: z.array(
    z.object({
      project_slug: z.string(),
      project_name: z.string(),
      review: z.array(BoardCardRefSchema),
      ready_count: z.number().int().nonnegative(),
      stale_in_progress: z.array(BoardCardRefSchema.extend({ since: z.string() })),
      inbox_count: z.number().int().nonnegative(),
    }),
  ),
});
export type BoardDigestResponse = z.infer<typeof BoardDigestResponseSchema>;

/** POST /api/board/idea — drop an idea into a project Inbox. One of slug|id required. */
export const SubmitIdeaRequestSchema = z
  .object({
    project_slug: z.string().min(1).optional(),
    project_id: z.string().min(1).optional(),
    text: z.string().min(1).max(10000),
  })
  .refine((b) => Boolean(b.project_slug || b.project_id), {
    message: 'one of `project_slug` or `project_id` is required',
    path: ['project_slug'],
  });
export type SubmitIdeaRequest = z.infer<typeof SubmitIdeaRequestSchema>;

export const SubmitIdeaResponseSchema = z.object({
  idea_id: z.string(),
  project_slug: z.string(),
});
export type SubmitIdeaResponse = z.infer<typeof SubmitIdeaResponseSchema>;
