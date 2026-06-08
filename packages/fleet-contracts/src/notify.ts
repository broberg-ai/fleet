import { z } from 'zod';
import { SeveritySchema } from './intercom';

/**
 * POST /api/notify (buddy daemon).
 *
 * Cross-session mobile toast — lands as a top banner on whatever iOS view is
 * open, bypassing the per-session SSE filter. `fromPid` (channel reg) enriches
 * the toast with sessionName + repo; `fromCcSessionId` is the curl/script
 * fallback.
 */
export const NotifyMobileRequestSchema = z.object({
  message: z.string().min(1).max(500),
  title: z.string().max(120).optional(),
  severity: SeveritySchema.default('info'),
  fromPid: z.number().int().positive().optional(),
  fromCcSessionId: z.string().optional(),
});
export type NotifyMobileRequest = z.infer<typeof NotifyMobileRequestSchema>;

const NotificationSchema = z.object({
  id: z.string(),
  message: z.string(),
  title: z.string().nullable(),
  severity: SeveritySchema,
  fromSessionName: z.string().nullable(),
  fromRepoName: z.string().nullable(),
  fromCcSessionId: z.string().nullable(),
  createdAt: z.string(),
});

/** 201 delivered, or 202 dropped by the F12 notify-gate (severity/quiet-hours/rate-limit). */
export const NotifyMobileResponseSchema = z.union([
  z.object({ ok: z.literal(true), notification: NotificationSchema }),
  z.object({
    ok: z.literal(false),
    dropped: z.literal(true),
    reason: z.string(),
    severity: SeveritySchema,
  }),
]);
export type NotifyMobileResponse = z.infer<typeof NotifyMobileResponseSchema>;
