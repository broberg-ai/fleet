import {
  BoardDigestResponseSchema,
  FLEET_ENDPOINTS,
  IntercomDispatchRequestSchema,
  IntercomDispatchResponseSchema,
  NotifyMobileRequestSchema,
  NotifyMobileResponseSchema,
  SubmitIdeaRequestSchema,
  SubmitIdeaResponseSchema,
  TerminalProvisionRequestSchema,
  TerminalProvisionResponseSchema,
  type BoardDigestResponse,
  type FleetEndpointName,
  type IntercomDispatchRequest,
  type IntercomDispatchResponse,
  type NotifyMobileRequest,
  type NotifyMobileResponse,
  type SubmitIdeaRequest,
  type SubmitIdeaResponse,
  type TerminalProvisionRequest,
  type TerminalProvisionResponse,
} from '@broberg/fleet-contracts';
import type { z } from 'zod';

export type { FleetEndpointName } from '@broberg/fleet-contracts';

/**
 * Minimal structural fetch type — keeps the package portable (no DOM/node-fetch
 * lib dependency) and trivially mockable in tests. Matches the shape we use.
 */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface FleetClientConfig {
  /** buddy daemon base URL, e.g. http://localhost:4123 or https://buddycloud.cc */
  buddyBaseUrl: string;
  /** Bearer for buddy system→system endpoints (BUDDY_SERVER_TOKEN). Omit on localhost-open edges. */
  buddyKey?: string;
  /** cardmem base URL for board endpoints, e.g. https://services.cardmem.com */
  cardmemBaseUrl?: string;
  /** Bearer for cardmem endpoints (CARDMEM_DAEMON_KEY). */
  cardmemKey?: string;
  /** Injectable fetch — for tests or runtimes without a global fetch. Defaults to globalThis.fetch. */
  fetch?: FetchLike;
}

/** Thrown on a non-2xx response or a missing base URL for the target server. */
export class FleetError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'FleetError';
  }
}

export interface FleetClient {
  dispatchIntercom(req: IntercomDispatchRequest): Promise<IntercomDispatchResponse>;
  provisionTerminal(req: TerminalProvisionRequest): Promise<TerminalProvisionResponse>;
  notifyMobile(req: NotifyMobileRequest): Promise<NotifyMobileResponse>;
  boardDigest(): Promise<BoardDigestResponse>;
  submitIdea(req: SubmitIdeaRequest): Promise<SubmitIdeaResponse>;
}

export function createFleetClient(config: FleetClientConfig): FleetClient {
  const resolvedFetch = config.fetch ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (typeof resolvedFetch !== 'function') {
    throw new FleetError('no fetch available — pass config.fetch');
  }
  const fetchFn: FetchLike = resolvedFetch; // non-optional binding so the narrow holds inside call()

  function resolve(server: 'buddy' | 'cardmem'): { base: string; key?: string } {
    if (server === 'buddy') return { base: config.buddyBaseUrl, key: config.buddyKey };
    if (!config.cardmemBaseUrl) {
      throw new FleetError('cardmemBaseUrl is required for cardmem-served endpoints');
    }
    return { base: config.cardmemBaseUrl, key: config.cardmemKey };
  }

  async function call<TOut>(
    name: FleetEndpointName,
    responseSchema: z.ZodType<TOut>,
    body?: unknown,
  ): Promise<TOut> {
    const ep = FLEET_ENDPOINTS[name];
    const { base, key } = resolve(ep.server);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (key) headers.Authorization = `Bearer ${key}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetchFn(`${base.replace(/\/$/, '')}${ep.path}`, {
      method: ep.method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = text;
    }
    if (!res.ok) {
      throw new FleetError(`${name} → HTTP ${res.status}`, res.status, json);
    }
    return responseSchema.parse(json);
  }

  return {
    // async so a request-validation throw surfaces as a rejected promise (not a sync throw).
    dispatchIntercom: async (req) =>
      call('intercomDispatch', IntercomDispatchResponseSchema, IntercomDispatchRequestSchema.parse(req)),
    provisionTerminal: async (req) =>
      call('terminalProvision', TerminalProvisionResponseSchema, TerminalProvisionRequestSchema.parse(req)),
    notifyMobile: async (req) =>
      call('notifyMobile', NotifyMobileResponseSchema, NotifyMobileRequestSchema.parse(req)),
    boardDigest: () => call('boardDigest', BoardDigestResponseSchema),
    submitIdea: async (req) =>
      call('submitIdea', SubmitIdeaResponseSchema, SubmitIdeaRequestSchema.parse(req)),
  };
}
