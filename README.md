# @broberg/fleet

Typed client + shared contracts for the **broberg fleet HTTP API** (buddy + cardmem).
The fourth shared lib after `@broberg/db-sdk` (data), `@broberg/ai-sdk` (LLM),
`@upmetrics/sdk` (telemetry): **fleet communication**.

| Package | What |
|---|---|
| [`@broberg/fleet-contracts`](packages/fleet-contracts) | zod schemas + types for every fleet endpoint — single source of truth (servers validate, clients get types) |
| [`@broberg/fleet-client`](packages/fleet-client) | typed client — `dispatchIntercom` / `provisionTerminal` / `notifyMobile` / `boardDigest` / `submitIdea` |

```ts
import { createFleetClient } from '@broberg/fleet-client';
const fleet = createFleetClient({ buddyBaseUrl, buddyKey, cardmemBaseUrl, cardmemKey });
await fleet.dispatchIntercom({ targetSession: 'cardmem', message: 'pick up F070.2' });
```

Origin: buddy **F072** (`webhousecode/buddy` → `docs/features/F72-fleet-client.md`),
extracted here so the whole fleet consumes it via npm.

## Dev

```bash
pnpm install
pnpm -r build      # contracts first (topological), then client
pnpm -r typecheck
pnpm -r test
```

See [PUBLISHING.md](PUBLISHING.md) for the release flow.
