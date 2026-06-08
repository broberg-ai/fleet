import { describe, expect, test } from 'bun:test';
import {
  BoardDigestResponseSchema,
  FLEET_ENDPOINTS,
  IntercomDispatchRequestSchema,
  NotifyMobileRequestSchema,
  SubmitIdeaRequestSchema,
  TerminalProvisionRequestSchema,
} from './index';

describe('intercom dispatch', () => {
  test('accepts targetSession + message', () => {
    const r = IntercomDispatchRequestSchema.safeParse({
      targetSession: 'cardmem',
      message: 'pick up F070.2',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.severity).toBe('info'); // default applied
  });
  test('accepts repo instead of targetSession', () => {
    expect(
      IntercomDispatchRequestSchema.safeParse({ repo: 'webhousecode/buddy', message: 'hi' })
        .success,
    ).toBe(true);
  });
  test('rejects when neither targetSession nor repo is given', () => {
    expect(IntercomDispatchRequestSchema.safeParse({ message: 'hi' }).success).toBe(false);
  });
  test('rejects empty message', () => {
    expect(
      IntercomDispatchRequestSchema.safeParse({ targetSession: 'x', message: '' }).success,
    ).toBe(false);
  });
});

describe('terminal provision (F069)', () => {
  test('accepts name + repoName', () => {
    expect(
      TerminalProvisionRequestSchema.safeParse({ name: 'buddy', repoName: 'buddy' }).success,
    ).toBe(true);
  });
  test('accepts name + explicit path', () => {
    expect(
      TerminalProvisionRequestSchema.safeParse({ name: 'buddy', path: '/x/y' }).success,
    ).toBe(true);
  });
  test('rejects name without path or repoName', () => {
    expect(TerminalProvisionRequestSchema.safeParse({ name: 'buddy' }).success).toBe(false);
  });
});

describe('notify mobile', () => {
  test('accepts message, defaults severity to info', () => {
    const r = NotifyMobileRequestSchema.safeParse({ message: 'done' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.severity).toBe('info');
  });
  test('rejects message over 500 chars', () => {
    expect(NotifyMobileRequestSchema.safeParse({ message: 'x'.repeat(501) }).success).toBe(
      false,
    );
  });
});

describe('submit idea', () => {
  test('accepts project_slug + text', () => {
    expect(
      SubmitIdeaRequestSchema.safeParse({ project_slug: 'buddy', text: 'idea' }).success,
    ).toBe(true);
  });
  test('rejects when neither project_slug nor project_id is given', () => {
    expect(SubmitIdeaRequestSchema.safeParse({ text: 'idea' }).success).toBe(false);
  });
});

describe('board digest response', () => {
  test('accepts a well-formed digest', () => {
    const r = BoardDigestResponseSchema.safeParse({
      projects: [
        {
          project_slug: 'buddy',
          project_name: 'Buddy',
          review: [{ slug: 'buddy-F065', title: 'Lens', fnum: 'F065' }],
          ready_count: 2,
          stale_in_progress: [{ slug: 'buddy-F42', title: 'x', since: '2026-06-01' }],
          inbox_count: 9,
        },
      ],
    });
    expect(r.success).toBe(true);
  });
});

describe('endpoint registry', () => {
  test('exposes ≥5 endpoints with method + path + server', () => {
    const names = Object.keys(FLEET_ENDPOINTS);
    expect(names.length).toBeGreaterThanOrEqual(5);
    for (const e of Object.values(FLEET_ENDPOINTS)) {
      expect(e.method).toBeTruthy();
      expect(e.path.startsWith('/api/')).toBe(true);
      expect(['buddy', 'cardmem']).toContain(e.server);
    }
  });
});
