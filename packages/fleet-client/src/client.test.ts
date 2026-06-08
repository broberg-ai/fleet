import { describe, expect, test } from 'bun:test';
import { createFleetClient, FleetError, type FetchLike } from './index';

type Init = { method?: string; headers?: Record<string, string>; body?: string };

/** Build a fake fetch that records the last request and returns a canned JSON body. */
function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: string; init: Init }> = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init: init ?? {} });
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    };
  };
  return { fn, calls };
}

describe('dispatchIntercom', () => {
  test('POSTs to buddy /api/intercom/dispatch with Bearer + JSON body', async () => {
    const { fn, calls } = fakeFetch(200, { ok: true, delivered: true, targetSession: 'cardmem' });
    const client = createFleetClient({
      buddyBaseUrl: 'http://localhost:4123/',
      buddyKey: 'secret-123',
      fetch: fn,
    });
    const res = await client.dispatchIntercom({ targetSession: 'cardmem', message: 'pick up F070.2' });

    expect(res.delivered).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://localhost:4123/api/intercom/dispatch');
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret-123');
    const sent = JSON.parse(calls[0].init.body as string);
    expect(sent.targetSession).toBe('cardmem');
    expect(sent.severity).toBe('info'); // contract default applied before send
  });

  test('throws BEFORE fetch when the request is invalid (no targetSession/repo)', async () => {
    const { fn, calls } = fakeFetch(200, { ok: true, delivered: true });
    const client = createFleetClient({ buddyBaseUrl: 'http://x', fetch: fn });
    // @ts-expect-error — intentionally invalid to prove runtime validation
    await expect(client.dispatchIntercom({ message: 'hi' })).rejects.toBeTruthy();
    expect(calls).toHaveLength(0); // never hit the network
  });

  test('throws FleetError on non-2xx', async () => {
    const { fn } = fakeFetch(401, { error: 'unauthorized' });
    const client = createFleetClient({ buddyBaseUrl: 'http://x', fetch: fn });
    await expect(
      client.dispatchIntercom({ targetSession: 'x', message: 'hi' }),
    ).rejects.toBeInstanceOf(FleetError);
  });
});

describe('routing by endpoint.server', () => {
  test('submitIdea hits the cardmem base, not buddy', async () => {
    const { fn, calls } = fakeFetch(200, { idea_id: 'i1', project_slug: 'buddy' });
    const client = createFleetClient({
      buddyBaseUrl: 'http://localhost:4123',
      cardmemBaseUrl: 'https://services.cardmem.com',
      cardmemKey: 'pa_xxx',
      fetch: fn,
    });
    const res = await client.submitIdea({ project_slug: 'buddy', text: 'an idea' });
    expect(res.idea_id).toBe('i1');
    expect(calls[0].url).toBe('https://services.cardmem.com/api/board/idea');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer pa_xxx');
  });

  test('throws when a cardmem endpoint is called without cardmemBaseUrl', async () => {
    const { fn } = fakeFetch(200, {});
    const client = createFleetClient({ buddyBaseUrl: 'http://x', fetch: fn });
    await expect(client.boardDigest()).rejects.toBeInstanceOf(FleetError);
  });
});

describe('provisionTerminal + notifyMobile', () => {
  test('provisionTerminal returns the typed session', async () => {
    const { fn } = fakeFetch(201, {
      session: { name: 'buddy', path: '/x', run: true, enabled: true },
      created: true,
    });
    const client = createFleetClient({ buddyBaseUrl: 'http://x', fetch: fn });
    const res = await client.provisionTerminal({ name: 'buddy', repoName: 'buddy' });
    expect(res.created).toBe(true);
    expect(res.session.name).toBe('buddy');
  });

  test('notifyMobile parses the dropped-by-gate (202) shape', async () => {
    const { fn } = fakeFetch(202, { ok: false, dropped: true, reason: 'rate_limit', severity: 'info' });
    const client = createFleetClient({ buddyBaseUrl: 'http://x', fetch: fn });
    const res = await client.notifyMobile({ message: 'hi' });
    expect(res.ok).toBe(false);
  });
});
