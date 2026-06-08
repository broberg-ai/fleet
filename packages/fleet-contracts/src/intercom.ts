import { z } from 'zod';

/** Shared severity tier across intercom + notify. */
export const SeveritySchema = z.enum(['info', 'warn', 'critical']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * POST /api/intercom/dispatch (buddy daemon — F072.2).
 *
 * Push a message INTO a named running cc session in real time (the PUSH half;
 * queue-drain pickup is the PULL half via hooks). Built on buddy's
 * pushToChannel / findChannelForSession primitive. One of `targetSession`
 * | `repo` is required.
 */
export const IntercomDispatchRequestSchema = z
  .object({
    /** Target by buddy session name (BUDDY_SESSION_NAME), e.g. "cardmem". */
    targetSession: z.string().min(1).max(128).optional(),
    /** …or target the live session for a repo path / owner/name. */
    repo: z.string().min(1).max(200).optional(),
    message: z.string().min(1).max(4000),
    severity: SeveritySchema.default('info'),
    /** Attribution shown to the receiving session ("from …"). */
    from: z.string().min(1).max(128).optional(),
  })
  .refine((b) => Boolean(b.targetSession || b.repo), {
    message: 'one of `targetSession` or `repo` is required',
    path: ['targetSession'],
  });
export type IntercomDispatchRequest = z.infer<typeof IntercomDispatchRequestSchema>;

export const IntercomDispatchResponseSchema = z.object({
  ok: z.boolean(),
  delivered: z.boolean(),
  targetSession: z.string().nullable().optional(),
  /** Which leg of the reachability ladder carried it (F072.4). */
  routedVia: z.enum(['local', 'cloud']).optional(),
});
export type IntercomDispatchResponse = z.infer<typeof IntercomDispatchResponseSchema>;
