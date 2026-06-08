import { z } from 'zod';

/**
 * POST /api/terminal/provision (buddy daemon — F069).
 *
 * System→system: cardmem (or any scaffolder) provisions a buddy terminal
 * entry. Idempotent upsert by `name`. One of `path` | `repoName` is required
 * (repoName derives BUDDY_HOME/repos/<repoName>).
 */
export const TerminalProvisionRequestSchema = z
  .object({
    name: z.string().min(1).max(128),
    repoName: z.string().min(1).max(200).optional(),
    path: z.string().min(1).optional(),
    githubSlug: z.string().min(1).max(200).optional(),
    model: z.string().min(1).max(64).optional(),
    color: z.string().min(1).max(32).optional(),
    run: z.boolean().optional(),
  })
  .refine((b) => Boolean(b.path || b.repoName), {
    message: 'pass `path`, or `repoName` to derive BUDDY_HOME/repos/<repoName>',
    path: ['path'],
  });
export type TerminalProvisionRequest = z.infer<typeof TerminalProvisionRequestSchema>;

/** The TerminalSession entry buddy stores in ~/.buddy/config.json. */
export const TerminalSessionSchema = z.object({
  name: z.string(),
  path: z.string(),
  resume: z.string().optional(),
  run: z.boolean(),
  enabled: z.boolean(),
  isNew: z.boolean().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});
export type TerminalSession = z.infer<typeof TerminalSessionSchema>;

export const TerminalProvisionResponseSchema = z.object({
  session: TerminalSessionSchema,
  created: z.boolean(),
});
export type TerminalProvisionResponse = z.infer<typeof TerminalProvisionResponseSchema>;
